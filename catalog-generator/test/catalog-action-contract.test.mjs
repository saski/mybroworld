import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQueuedJobRecord,
  REQUIRED_COMPATIBILITY_HEADERS,
  getCompatibleTabs,
  resolveJobSheetSelection,
  sanitizeOutputFilename,
} from '../src/catalog-action-contract.mjs';

function buildHeaders(overrides = []) {
  return [...REQUIRED_COMPATIBILITY_HEADERS, ...overrides];
}

test('getCompatibleTabs prioritizes the active compatible year tab and excludes helper sheets', () => {
  const tabs = [
    { sheetId: 10, title: 'catalog_jobs', hidden: true, headers: buildHeaders() },
    { sheetId: 22, title: 'Archive', hidden: false, headers: buildHeaders() },
    { sheetId: 44, title: '2025', hidden: false, headers: buildHeaders() },
    { sheetId: 55, title: '2026', hidden: false, headers: buildHeaders() },
    { sheetId: 66, title: 'validation_lists', hidden: true, headers: buildHeaders() },
    { sheetId: 77, title: 'Draft', hidden: false, headers: ['title_clean'] },
  ];

  const compatibleTabs = getCompatibleTabs({
    activeSheetId: 44,
    tabs,
  });

  assert.deepEqual(
    compatibleTabs.map(({ sheetId, title }) => ({ sheetId, title })),
    [
      { sheetId: 44, title: '2025' },
      { sheetId: 55, title: '2026' },
      { sheetId: 22, title: 'Archive' },
    ],
  );
});

test('resolveJobSheetSelection validates explicit sheet selections and all-compatible mode', () => {
  const compatibleTabs = getCompatibleTabs({
    activeSheetId: 44,
    tabs: [
      { sheetId: 22, title: 'Archive', hidden: false, headers: buildHeaders() },
      { sheetId: 44, title: '2025', hidden: false, headers: buildHeaders() },
      { sheetId: 55, title: '2026', hidden: false, headers: buildHeaders() },
    ],
  });

  const selectedTabs = resolveJobSheetSelection({
    activeSheetId: 44,
    compatibleTabs,
    scopeMode: 'selected_tabs',
    selectedSheetIds: [55, 22],
  });
  assert.deepEqual(
    selectedTabs.map(({ sheetId }) => sheetId),
    [55, 22],
  );

  const allTabs = resolveJobSheetSelection({
    activeSheetId: 44,
    compatibleTabs,
    scopeMode: 'all_compatible_tabs',
    selectedSheetIds: [],
  });
  assert.deepEqual(
    allTabs.map(({ sheetId }) => sheetId),
    [44, 55, 22],
  );

  assert.throws(
    () =>
      resolveJobSheetSelection({
        activeSheetId: 44,
        compatibleTabs,
        scopeMode: 'selected_tabs',
        selectedSheetIds: [999],
      }),
    /Selected tabs must be compatible/i,
  );
});

test('sanitizeOutputFilename builds a stable pdf filename from the catalog title', () => {
  assert.equal(
    sanitizeOutputFilename({
      catalogTitle: 'Catálogo 2026 / selección final',
      timestampIso: '2026-04-19T15:45:00.000Z',
    }),
    'catalogo-2026-seleccion-final-20260419_154500.pdf',
  );
});

test('buildQueuedJobRecord applies defaults and blocks missing folder configuration', () => {
  const compatibleTabs = getCompatibleTabs({
    activeSheetId: 55,
    tabs: [
      { sheetId: 44, title: '2025', hidden: false, headers: buildHeaders() },
      { sheetId: 55, title: '2026', hidden: false, headers: buildHeaders() },
    ],
  });

  const queuedJob = buildQueuedJobRecord({
    activeSheetId: 55,
    catalogTitle: 'Catalog 2026',
    compatibleTabs,
    createdAtIso: '2026-04-19T15:30:12.000Z',
    executionProfile: {
      defaultDriveFolderId: 'drive-folder-1',
      profileKey: 'nacho-saski',
    },
    randomSuffix: 'ab12',
    scopeMode: 'current_tab',
  });

  assert.equal(queuedJob.job_id, 'catalog_20260419_153012_ab12');
  assert.equal(queuedJob.artist_name, 'Lucía Astuy');
  assert.equal(queuedJob.output_folder_id, 'drive-folder-1');
  assert.equal(queuedJob.output_filename, 'catalog-2026-20260419_153012.pdf');
  assert.equal(queuedJob.sheet_ids_json, '[55]');
  assert.equal(queuedJob.sheet_titles_json, '["2026"]');
  assert.equal(queuedJob.status, 'queued');

  assert.throws(
    () =>
      buildQueuedJobRecord({
        activeSheetId: 55,
        catalogTitle: 'Catalog 2026',
        compatibleTabs,
        createdAtIso: '2026-04-19T15:30:12.000Z',
        executionProfile: {
          defaultDriveFolderId: '',
          profileKey: 'nacho-saski',
        },
        randomSuffix: 'ab12',
        scopeMode: 'current_tab',
      }),
    /output folder/i,
  );
});
