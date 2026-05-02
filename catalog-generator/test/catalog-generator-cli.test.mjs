import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolvePuppeteerLaunchOptions,
  runGenerateCli,
  waitForCatalogImageElements,
} from '../src/catalog-generator.mjs';

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

test('runGenerateCli renders the editorial shell with approved cover, centered artwork metadata, and centered closing mark', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  await runGenerateCli({
    argv: [
      '--input',
      '/virtual/catalog.csv',
      '--output',
      '/virtual/output/catalog.pdf',
      '--catalog-title',
      'Catálogo 2026',
      '--artist-name',
      'Lucia Astuy',
      '--limit',
      '1',
    ],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async () => {
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean,catalog_section,catalog_order,show_price,catalog_notes_public',
          'LA-2026-001,Alpha,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/abc123/view,TRUE,TRUE,300 €,available,1,TRUE,',
        ].join('\n');
      },
      renderPdf: async ({ html }) => {
        renderedJobs.push(html);
      },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.match(renderedJobs[0], /class="cover-photo"/);
  assert.match(renderedJobs[0], /Catálogo 2026/);
  assert.match(renderedJobs[0], /Marzo 2026/);
  assert.match(renderedJobs[0], /class="artwork-header"/);
  assert.match(renderedJobs[0], /class="artwork-meta-block"/);
  assert.match(renderedJobs[0], /class="closing-brand-stack"/);
});

test('runGenerateCli applies customer catalog feedback to artwork order and copy', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  await runGenerateCli({
    argv: [
      '--input',
      '/virtual/catalog.csv',
      '--output',
      '/virtual/output/catalog.pdf',
      '--catalog-title',
      'Catálogo 2026',
      '--artist-name',
      'Lucia Astuy',
    ],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async () => {
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean,catalog_order,catalog_notes_public',
          'LA-2026-001,Older Available,2026,01/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/aaa111/view,TRUE,TRUE,300 €,1,Keep this internal note out.',
          'LA-2026-002,Newest Historical,2026,03/26,Ink,paper,20 x 30 cm,sold,https://drive.google.com/file/d/bbb222/view,TRUE,TRUE,700 €,9,Do not print historical note.',
          'LA-2026-003,Excluded Newest,2026,04/26,Oil,wood,10 x 10 cm,available,https://drive.google.com/file/d/ccc333/view,FALSE,TRUE,900 €,0,',
          'LA-2026-004,Not Ready,2026,05/26,Oil,wood,10 x 10 cm,available,https://drive.google.com/file/d/ddd444/view,TRUE,FALSE,1000 €,0,',
        ].join('\n');
      },
      renderPdf: async ({ html }) => {
        renderedJobs.push(html);
      },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  const html = renderedJobs[0];
  assert.ok(html.indexOf('Newest Historical') < html.indexOf('Older Available'));
  assert.doesNotMatch(html, /Excluded Newest|Not Ready/);
  assert.match(html, /700 €/);
  assert.doesNotMatch(html, /Obra no disponible|Obra disponible|Keep this internal note out|Do not print historical note/);
  assert.match(html, /IG: @luciastuy/);
  assert.match(html, /www\.luciastuy\.com/);
});

test('runGenerateCli uses the customer-selected _cat image manifest when provided', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  const result = await runGenerateCli({
    argv: [
      '--input',
      '/virtual/catalog.csv',
      '--output',
      '/virtual/output/catalog.pdf',
      '--catalog-image-manifest',
      '/virtual/cat-images.json',
    ],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async ({ inputPath }) => {
        if (inputPath === '/virtual/cat-images.json') {
          return JSON.stringify({
            files: [
              {
                id: 'cat-file-123',
                mimeType: 'image/jpeg',
                name: 'LA-2026-001_cat.jpg',
              },
            ],
          });
        }

        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,Manifest Image,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/original-file/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => {
        renderedJobs.push(html);
      },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/cat-file-123/);
  assert.doesNotMatch(renderedJobs[0], /original-file/);
});

test('runGenerateCli embeds customer brand logo and Gotham font assets', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  await runGenerateCli({
    argv: [
      '--input',
      '/virtual/catalog.csv',
      '--output',
      '/virtual/output/catalog.pdf',
    ],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async () => [
        'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
        'LA-2026-001,Asset Check,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/asset-check/view,TRUE,TRUE,300 €',
      ].join('\n'),
      renderPdf: async ({ html }) => {
        renderedJobs.push(html);
      },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.match(renderedJobs[0], /font-family: "Gotham"/);
  assert.match(renderedJobs[0], /data:font\/otf;base64,/);
  assert.match(renderedJobs[0], /data:image\/png;base64,/);
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

test('resolvePuppeteerLaunchOptions falls back to the macOS Chrome executable when Puppeteer has no managed browser', async () => {
  const checkedPaths = [];

  const launchOptions = await resolvePuppeteerLaunchOptions({
    env: {},
    fileExists: async (candidatePath) => {
      checkedPaths.push(candidatePath);
      return candidatePath === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    },
  });

  assert.equal(launchOptions.headless, true);
  assert.equal(
    launchOptions.executablePath,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  assert.deepEqual(checkedPaths, [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]);
});

test('waitForCatalogImageElements uses a bounded page-context image wait', async () => {
  const calls = [];

  await waitForCatalogImageElements({
    evaluate: async (pageFunction, timeoutMs) => {
      calls.push({ pageFunction, timeoutMs });
    },
  }, 1234);

  assert.equal(calls.length, 1);
  assert.equal(typeof calls[0].pageFunction, 'function');
  assert.equal(calls[0].timeoutMs, 1234);
});
