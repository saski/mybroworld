import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveQueuedSheetsForProcessing } from '../catalog-agent/src/queued-sheets.mjs';

test('resolveQueuedSheetsForProcessing prefers queued sheet ids when tabs are renamed', () => {
  const resolvedSheets = resolveQueuedSheetsForProcessing({
    job: {
      job_id: 'catalog_20260419_153012_ab12',
      sheet_ids_json: '[55]',
      sheet_titles_json: '["2026"]',
    },
    spreadsheetMetadata: {
      sheets: [
        {
          properties: {
            sheetId: 55,
            title: '2026 Renamed',
          },
        },
      ],
    },
  });

  assert.deepEqual(resolvedSheets, [
    {
      currentTitle: '2026 Renamed',
      queuedTitle: '2026',
      sheetId: 55,
    },
  ]);
});
