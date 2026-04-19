import test from 'node:test';
import assert from 'node:assert/strict';

import { runGenerateCli } from '../src/catalog-generator.mjs';

function createLogger() {
  const logs = [];
  const errors = [];
  return {
    errors,
    logs,
    logger: {
      error(message) {
        errors.push(String(message));
      },
      log(message) {
        logs.push(String(message));
      },
    },
  };
}

test('runGenerateCli honors catalog title and artist flags with stable completion output', async () => {
  const { logger, logs, errors } = createLogger();
  const renderedJobs = [];
  const writtenFiles = [];
  const createdDirectories = [];

  const result = await runGenerateCli({
    argv: [
      '--input',
      '/virtual/catalog.csv',
      '--output',
      '/virtual/output/catalog.pdf',
      '--catalog-title',
      'Selected Works 2026',
      '--artist-name',
      'Lucia Astuy',
      '--limit',
      '1',
    ],
    dependencies: {
      ensureDir: async (directoryPath) => {
        createdDirectories.push(directoryPath);
      },
      readCsvText: async ({ inputPath }) => {
        assert.equal(inputPath, '/virtual/catalog.csv');
        return [
          'artwork_id,title_clean,year,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean,catalog_section,catalog_order,show_price,catalog_notes_public',
          'LA-2026-001,Alpha,2026,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/abc123/view,TRUE,TRUE,300 €,available,1,TRUE,',
        ].join('\n');
      },
      renderPdf: async ({ html, outputPath }) => {
        renderedJobs.push({ html, outputPath });
      },
      writeTextFile: async (filePath, contents) => {
        writtenFiles.push({ contents, filePath });
      },
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.equal(errors.length, 0);
  assert.equal(createdDirectories[0], '/virtual/output');
  assert.equal(renderedJobs[0].outputPath, '/virtual/output/catalog.pdf');
  assert.match(renderedJobs[0].html, /Selected Works 2026/);
  assert.match(renderedJobs[0].html, /Lucia Astuy/);
  assert.equal(writtenFiles[0].filePath, '/virtual/output/catalogo-preview.html');
  assert.match(logs.join('\n'), /completed code=catalog_generation_completed/);
  assert.match(logs.join('\n'), /artworks=1/);
});

test('runGenerateCli fails fast with a stable error code when no input source is provided', async () => {
  const { logger, logs, errors } = createLogger();

  const result = await runGenerateCli({
    argv: [],
    dependencies: {},
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 2);
  assert.equal(logs.length, 0);
  assert.match(errors.join('\n'), /input_missing/);
});
