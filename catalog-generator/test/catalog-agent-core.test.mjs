import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { writeCatalogImageManifest } from '../catalog-agent/src/agent.mjs';
import {
  formatAgentErrorForLog,
  normalizeAgentError,
} from '../catalog-agent/src/errors.mjs';
import { summarizeCatalogJobHealth } from '../catalog-agent/src/job-monitor.mjs';
import {
  findOldestQueuedJob,
  mergeCatalogSheetsToCsv,
} from '../catalog-agent/src/job-queue.mjs';

test('mergeCatalogSheetsToCsv combines compatible yearly tabs into one CSV', () => {
  const csvText = mergeCatalogSheetsToCsv([
    {
      rows: [
        {
          artwork_id: 'LA-2025-001',
          title_clean: 'Alpha',
          year: '2025',
          medium_clean: 'Acrylic',
          support_clean: 'canvas',
          dimensions_clean: '30 x 40 cm',
          status_normalized: 'available',
          image_main: 'https://drive.google.com/file/d/aaa111/view',
          include_in_catalog: 'TRUE',
          catalog_ready: 'TRUE',
          catalog_order: '1',
        },
      ],
      sheetId: 44,
      title: '2025',
    },
    {
      rows: [
        {
          artwork_id: 'LA-2026-001',
          title_clean: 'Beta',
          year: '2026',
          medium_clean: 'Ink',
          support_clean: 'paper',
          dimensions_clean: '20 x 30 cm',
          status_normalized: 'available',
          image_main: 'https://drive.google.com/file/d/bbb222/view',
          include_in_catalog: 'TRUE',
          catalog_ready: 'TRUE',
          catalog_order: '2',
          catalog_notes_public: 'Fresh work',
        },
      ],
      sheetId: 55,
      title: '2026',
    },
  ]);

  assert.match(csvText, /^artwork_id,title_clean,year,/);
  assert.match(csvText, /LA-2025-001,Alpha,2025/);
  assert.match(csvText, /LA-2026-001,Beta,2026/);
  assert.match(csvText, /catalog_notes_public/);
});

test('findOldestQueuedJob only returns queued jobs for the configured profile', () => {
  const job = findOldestQueuedJob({
    executionProfile: 'nacho-saski',
    jobs: [
      { created_at: '2026-04-19T15:32:00.000Z', execution_profile: 'lucia-mybrocorp', job_id: 'catalog_2', status: 'queued' },
      { created_at: '2026-04-19T15:31:00.000Z', execution_profile: 'nacho-saski', job_id: 'catalog_1', status: 'queued' },
      { created_at: '2026-04-19T15:33:00.000Z', execution_profile: 'nacho-saski', job_id: 'catalog_3', status: 'claimed' },
    ],
  });

  assert.equal(job.job_id, 'catalog_1');
});

test('formatAgentErrorForLog includes nested render failure causes', () => {
  const renderError = new Error('Running as root without --no-sandbox is not supported.');
  const wrappedError = new Error('Unable to render PDF output: /tmp/catalog.pdf', {
    cause: renderError,
  });
  wrappedError.code = 'pdf_render_failed';

  const logExcerpt = formatAgentErrorForLog(
    normalizeAgentError(wrappedError, 'job_processing_failed'),
  );

  assert.match(logExcerpt, /Unable to render PDF output/);
  assert.match(logExcerpt, /Caused by: Error: Running as root without --no-sandbox/);
});

test('summarizeCatalogJobHealth flags failed, stale, and incomplete catalog jobs', () => {
  const summary = summarizeCatalogJobHealth({
    jobs: [
      {
        completed_at: '2026-05-02T16:55:00.000Z',
        error_code: 'pdf_render_failed',
        error_message: 'Unable to render PDF output.',
        job_id: 'catalog_failed',
        status: 'failed',
      },
      {
        created_at: '2026-05-02T16:00:00.000Z',
        job_id: 'catalog_queued',
        status: 'queued',
      },
      {
        heartbeat_at: '2026-05-02T16:20:00.000Z',
        job_id: 'catalog_rendering',
        status: 'rendering',
      },
      {
        completed_at: '2026-05-02T16:58:00.000Z',
        job_id: 'catalog_completed_no_url',
        result_file_url: '',
        status: 'completed',
      },
    ],
    now: new Date('2026-05-02T17:00:00.000Z'),
  });

  assert.equal(summary.status, 'alert');
  assert.deepEqual(summary.alerts.map((alert) => alert.code), [
    'catalog_job_failed',
    'catalog_job_queued_stale',
    'catalog_job_heartbeat_stale',
    'catalog_job_completed_without_url',
  ]);
});

test('summarizeCatalogJobHealth ignores jobs for other execution profiles', () => {
  const summary = summarizeCatalogJobHealth({
    executionProfile: 'lucia-mybrocorp',
    jobs: [
      {
        completed_at: '2026-05-02T16:55:00.000Z',
        execution_profile: 'nacho-saski',
        job_id: 'catalog_failed_other_profile',
        status: 'failed',
      },
    ],
    now: new Date('2026-05-02T17:00:00.000Z'),
  });

  assert.equal(summary.status, 'ok');
  assert.equal(summary.checkedJobCount, 0);
});

test('summarizeCatalogJobHealth ignores acknowledged failed jobs before the monitor start time', () => {
  const summary = summarizeCatalogJobHealth({
    ignoreBefore: '2026-05-02T17:00:00.000Z',
    jobs: [
      {
        completed_at: '2026-05-02T16:55:00.000Z',
        error_code: 'pdf_render_failed',
        job_id: 'catalog_known_failure',
        status: 'failed',
      },
    ],
    now: new Date('2026-05-02T17:05:00.000Z'),
  });

  assert.equal(summary.status, 'ok');
});

test('writeCatalogImageManifest materializes configured Drive image candidates for the generator', async () => {
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-image-manifest-'));
  const listedFolderIds = [];

  const manifestPath = await writeCatalogImageManifest({
    config: {
      catalogImageFolderId: 'folder-id',
    },
    googleClient: {
      listDriveFolderFiles: async (folderId) => {
        listedFolderIds.push(folderId);
        return [
          {
            id: 'cat-image-1',
            mimeType: 'image/jpeg',
            name: 'LA-2026-001_cat.jpg',
          },
        ];
      },
    },
    workDirectory,
  });

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  assert.deepEqual(listedFolderIds, ['folder-id']);
  assert.equal(path.basename(manifestPath), 'catalog-images.json');
  assert.equal(manifest.files[0].id, 'cat-image-1');
});

test('mergeCatalogSheetsToCsv rejects incompatible tabs with a precise error', () => {
  assert.throws(
    () =>
      mergeCatalogSheetsToCsv([
        {
          rows: [
            {
              title_clean: 'Broken tab',
            },
          ],
          sheetId: 66,
          title: 'Draft',
        },
    ]),
    /Draft.*artwork_id/i,
  );
});

test('mergeCatalogSheetsToCsv accepts a compatible tab with headers and zero rows', () => {
  const csvText = mergeCatalogSheetsToCsv([
    {
      headers: [
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
      ],
      rows: [],
      sheetId: 77,
      title: '2027',
    },
  ]);

  assert.match(csvText, /^artwork_id,title_clean,year,/);
  assert.equal(csvText.trim().split('\n').length, 1);
});
