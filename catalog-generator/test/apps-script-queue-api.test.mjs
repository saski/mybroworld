import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOG_JOB_HEADERS,
  CATALOG_PROFILE_HEADERS,
} from '../src/shared-catalog-contract.mjs';
import { loadAppsScriptCatalogApi } from './helpers/apps-script-harness.mjs';

function compatibleHeaders() {
  return [
    'artwork_id',
    'title_clean',
    'year',
    'medium_clean',
    'support_clean',
    'dimensions_clean',
    'status_normalized',
    'image_main',
    'include_in_catalog',
    'catalog_ready',
  ];
}

async function buildHarness(overrides = {}) {
  return loadAppsScriptCatalogApi({
    activeSheetId: 102593401,
    apiToken: 'test-token',
    ...overrides,
    sheets: [
      {
        headers: compatibleHeaders(),
        rows: [],
        sheetId: 102593401,
        title: '2026',
      },
      {
        headers: CATALOG_PROFILE_HEADERS,
        rows: [
          ['lucia-mybrocorp', 'Lucia / mybrocorp', true, 'mybrocorp@gmail.com', 'lucia', 'drive-folder-prod', 'Production'],
          ['nacho-saski', 'Nacho / saski', true, 'nacho.saski@gmail.com', 'nacho', 'drive-folder-1', 'Development and testing'],
          ['no-folder', 'No folder', true, 'operator@example.com', 'operator', '', 'Missing default folder'],
        ],
        sheetId: 9001,
        title: 'catalog_profiles',
      },
      {
        headers: CATALOG_JOB_HEADERS,
        rows: [],
        sheetId: 9002,
        title: 'catalog_jobs',
      },
      {
        headers: ['title_clean'],
        rows: [],
        sheetId: 33,
        title: 'Draft',
      },
    ],
  });
}

function request(action, data = {}, token = 'test-token') {
  return {
    postData: {
      contents: JSON.stringify({
        action,
        data,
        token,
      }),
    },
  };
}

test('Apps Script API rejects requests with a bad token', async () => {
  const { callApi } = await buildHarness();

  const response = callApi(request('list_recent_catalog_jobs', {}, 'wrong-token'));

  assert.equal(response.ok, false);
  assert.match(response.error.message, /Unauthorized catalog API request/);
});

test('Apps Script queue triggers the production Cloud Run job on demand', async () => {
  const { callApi, fetchCalls } = await buildHarness({
    scriptProperties: {
      CATALOG_CLOUD_RUN_JOB_NAME: 'lucia-mybrocorp-catalog-agent',
      CATALOG_CLOUD_RUN_PROJECT_ID: 'mybroworld-catalog-260501',
      CATALOG_CLOUD_RUN_REGION: 'europe-west1',
      CATALOG_CLOUD_RUN_TRIGGER_ENABLED: 'true',
      CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS: 'lucia-mybrocorp',
    },
  });

  const queued = callApi(request('queue_catalog_job', {
    activeSheetId: 102593401,
    catalogTitle: 'Catalog 2026',
    executionProfileKey: 'lucia-mybrocorp',
    scopeMode: 'current_tab',
  }));

  assert.equal(queued.ok, true);
  assert.equal(fetchCalls.length, 1);
  assert.equal(
    fetchCalls[0].url,
    'https://run.googleapis.com/v2/projects/mybroworld-catalog-260501/locations/europe-west1/jobs/lucia-mybrocorp-catalog-agent:run',
  );
  assert.equal(fetchCalls[0].options.method, 'post');
  assert.equal(fetchCalls[0].options.headers.Authorization, 'Bearer test-oauth-token');
  assert.equal(fetchCalls[0].options.payload, '{}');
});

test('Apps Script queue marks the job failed when the Cloud Run trigger is rejected', async () => {
  const { callApi } = await buildHarness({
    fetchResponse: {
      responseCode: 403,
      text: 'Permission denied',
    },
    scriptProperties: {
      CATALOG_CLOUD_RUN_JOB_NAME: 'lucia-mybrocorp-catalog-agent',
      CATALOG_CLOUD_RUN_PROJECT_ID: 'mybroworld-catalog-260501',
      CATALOG_CLOUD_RUN_REGION: 'europe-west1',
      CATALOG_CLOUD_RUN_TRIGGER_ENABLED: 'true',
      CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS: 'lucia-mybrocorp',
    },
  });

  const queued = callApi(request('queue_catalog_job', {
    activeSheetId: 102593401,
    catalogTitle: 'Catalog 2026',
    executionProfileKey: 'lucia-mybrocorp',
    scopeMode: 'current_tab',
  }));

  assert.equal(queued.ok, false);
  assert.match(queued.error.message, /Cloud Run catalog worker trigger failed/);

  const recent = callApi(request('list_recent_catalog_jobs', { limit: 1 }));
  assert.equal(recent.ok, true);
  assert.equal(recent.result[0].status, 'failed');
  assert.equal(recent.result[0].error_code, 'worker_trigger_failed');
  assert.match(recent.result[0].error_message, /Permission denied/);
});

test('Apps Script queue blocks profiles without an output folder', async () => {
  const { callApi } = await buildHarness();

  const response = callApi(request('queue_catalog_job', {
    activeSheetId: 102593401,
    catalogTitle: 'Catalog 2026',
    executionProfileKey: 'no-folder',
    scopeMode: 'current_tab',
  }));

  assert.equal(response.ok, false);
  assert.match(response.error.message, /output folder/i);
});

test('Apps Script queue blocks incompatible current tabs', async () => {
  const { callApi } = await buildHarness();

  const response = callApi(request('queue_catalog_job', {
    activeSheetId: 33,
    catalogTitle: 'Catalog 2026',
    executionProfileKey: 'nacho-saski',
    scopeMode: 'current_tab',
  }));

  assert.equal(response.ok, false);
  assert.match(response.error.message, /active tab is not compatible/i);
});

test('Apps Script review API validates review status and serializes recent jobs', async () => {
  const { callApi } = await buildHarness();

  const queued = callApi(request('queue_catalog_job', {
    activeSheetId: 102593401,
    catalogTitle: 'Catalog 2026',
    executionProfileKey: 'nacho-saski',
    scopeMode: 'current_tab',
  }));

  assert.equal(queued.ok, true);
  assert.equal(queued.result.catalog_title, 'Catalog 2026');
  assert.equal(queued.result.output_folder_id, 'drive-folder-1');

  const invalidReview = callApi(request('record_catalog_review', {
    jobId: queued.result.job_id,
    reviewStatus: 'pending',
  }));
  assert.equal(invalidReview.ok, false);
  assert.match(invalidReview.error.message, /Review status must be approved or needs_changes/);

  const validReview = callApi(request('record_catalog_review', {
    jobId: queued.result.job_id,
    reviewNotes: 'Looks good.',
    reviewStatus: 'needs changes',
    reviewedBy: 'Lucia',
  }));
  assert.equal(validReview.ok, true);
  assert.equal(validReview.result.review_status, 'needs_changes');
  assert.equal(validReview.result.review_notes, 'Looks good.');
  assert.equal(validReview.result.reviewed_by, 'Lucia');

  const recent = callApi(request('list_recent_catalog_jobs', { limit: 1 }));
  assert.equal(recent.ok, true);
  assert.equal(recent.result.length, 1);
  assert.equal(recent.result[0].job_id, queued.result.job_id);
  assert.equal(recent.result[0].review_status, 'needs_changes');
});
