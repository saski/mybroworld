import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { writeCatalogImageManifest } from '../catalog-agent/src/agent.mjs';
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
