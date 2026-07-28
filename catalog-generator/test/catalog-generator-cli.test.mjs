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

test('runGenerateCli renders the editorial shell without a derived cover period label', async () => {
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
  assert.doesNotMatch(renderedJobs[0], /Marzo 2026/);
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
          'LA-2026-004,Included Without Legacy Gate,2026,05/26,Oil,wood,10 x 10 cm,available,https://drive.google.com/file/d/ddd444/view,TRUE,FALSE,1000 €,0,',
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
  assert.doesNotMatch(html, /Excluded Newest/);
  assert.match(html, /Included Without Legacy Gate/);
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

test('resolvePuppeteerLaunchOptions disables the Chromium sandbox when running as root', async () => {
  const launchOptions = await resolvePuppeteerLaunchOptions({
    env: {
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
    },
    getUid: () => 0,
  });

  assert.equal(launchOptions.executablePath, '/usr/bin/chromium');
  assert.deepEqual(launchOptions.args, ['--no-sandbox', '--disable-setuid-sandbox']);
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

test('runGenerateCli selects _CAT01 image when multiple _cat variants exist', async () => {
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
              { id: 'file-cat01', mimeType: 'image/jpeg', name: 'LA-2026-001_CAT01.jpg' },
              { id: 'file-cat02', mimeType: 'image/jpeg', name: 'LA-2026-001_CAT02.jpg' },
              { id: 'file-base', mimeType: 'image/jpeg', name: 'LA-2026-001.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,Priority Test,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/original/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/file-cat01/);
  assert.doesNotMatch(renderedJobs[0], /file-cat02/);
  assert.doesNotMatch(renderedJobs[0], /file-base/);
});

test('runGenerateCli resolves the selected catalog image from the client source image filename', async () => {
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
              { id: 'client-source', name: '21_Por donde se sale de esta_20x20_0.jpg' },
              { id: 'catalog-cat01', name: '21_Por donde se sale de esta_20x20_CAT01_.jpg' },
            ],
          });
        }
        return [
          'title_raw,date_label,dimensions_raw,medium_raw,price_raw,status_normalized,image_main,include_in_catalog',
          '¿Por dónde se salía de esta?,05/26,20x20,Acrílico sobre lienzo,300 €,available,https://drive.google.com/file/d/client-source/view,TRUE',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/catalog-cat01/);
  assert.match(renderedJobs[0], /20x20/);
  assert.match(renderedJobs[0], /Acrílico sobre lienzo/);
});

test('runGenerateCli fails only when every selected artwork lacks a renderable title and image', async () => {
  const { logger, errors } = createLogger();

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
      readCsvText: async ({ inputPath }) => inputPath === '/virtual/cat-images.json'
        ? JSON.stringify({ files: [] })
        : [
          'title_raw,image_main,include_in_catalog,catalog_source_sheet,catalog_source_row',
          'Selected but missing image,,TRUE,2026,12',
          ',https://drive.google.com/file/d/unmatched/view,TRUE,2025,9',
        ].join('\n'),
      renderPdf: async () => {},
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 4);
  assert.match(errors.join('\n'), /catalog_no_renderable_artworks/);
  assert.match(errors.join('\n'), /image_main is missing and the artwork was omitted: 2026 rows 12/);
  assert.match(errors.join('\n'), /title_raw is missing and the artwork was omitted: 2025 rows 9/);
});

test('runGenerateCli does not choose an ambiguous title-only catalog image match', async () => {
  const { logger, errors } = createLogger();

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
      readCsvText: async ({ inputPath }) => inputPath === '/virtual/cat-images.json'
        ? JSON.stringify({
          files: [
            { id: 'cat-a', name: '01_Blue dog_small_CAT01.jpg' },
            { id: 'cat-b', name: '02_Blue dog_large_CAT01.jpg' },
          ],
        })
        : [
          'title_raw,include_in_catalog',
          'Blue dog,TRUE',
        ].join('\n'),
      renderPdf: async () => {},
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 4);
  assert.match(errors.join('\n'), /catalog_no_renderable_artworks/);
  assert.match(errors.join('\n'), /image_main is missing and the artwork was omitted/);
});

test('runGenerateCli falls back to image_main and records a warning when no catalog image matches', async () => {
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
              { id: 'file-other', mimeType: 'image/jpeg', name: 'OTHER-ART_CAT01.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,Fallback Test,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/original/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/original/);
  assert.match(result.result.warningMessage, /fell back to image_main because no unique _CAT01 image was found/);
});

test('runGenerateCli selects _CAT01 over spreadsheet image_main when both exist', async () => {
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
              { id: 'file-base', mimeType: 'image/jpeg', name: 'LA-2026-001.jpg' },
              { id: 'file-cat01', mimeType: 'image/jpeg', name: 'LA-2026-001_CAT01.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,Priority Over Base,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/original/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/file-cat01/);
  assert.doesNotMatch(renderedJobs[0], /file-base/);
});

test('runGenerateCli falls back to non-CAT01 _cat when no _CAT01 exists', async () => {
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
              { id: 'file-cat02', mimeType: 'image/jpeg', name: 'LA-2026-001_CAT02.jpg' },
              { id: 'file-base', mimeType: 'image/jpeg', name: 'LA-2026-001.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,Fallback Cat,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/original/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/file-cat02/);
  assert.doesNotMatch(renderedJobs[0], /file-base/);
});

test('runGenerateCli falls back to image_main when the selected folder manifest is empty', async () => {
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
          return JSON.stringify({ files: [] });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-001,No Manifest Image,2026,03/26,Acrylic,canvas,30 x 40 cm,available,https://drive.google.com/file/d/manifest-fallback/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/manifest-fallback/);
  assert.match(result.result.warningMessage, /fell back to image_main because no unique _CAT01 image was found/);
});

test('runGenerateCli resolves a unique similar _CAT01 filename and warns about the inference', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  const result = await runGenerateCli({
    argv: [
      '--input', '/virtual/catalog.csv', '--output', '/virtual/output/catalog.pdf',
      '--catalog-image-manifest', '/virtual/cat-images.json',
    ],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async ({ inputPath }) => inputPath === '/virtual/cat-images.json'
        ? JSON.stringify({ files: [{ id: 'similar-cat01', name: '2026_Luna roja grande_CAT01.jpg' }] })
        : [
          'title_raw,image_main,include_in_catalog',
          'Luna roja 2026,https://drive.google.com/file/d/original/view,TRUE',
        ].join('\n'),
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/similar-cat01/);
  assert.match(result.result.warningMessage, /was resolved to a similar _CAT01 filename/);
});

test('runGenerateCli renders image URLs supplied by the authenticated worker resolver', async () => {
  const { logger } = createLogger();
  const renderedJobs = [];

  const result = await runGenerateCli({
    argv: ['--input', '/virtual/catalog.csv', '--output', '/virtual/output/catalog.pdf'],
    dependencies: {
      ensureDir: async () => {},
      readCsvText: async () => [
        'title_raw,image_main,include_in_catalog',
        'Embedded image,https://drive.google.com/file/d/source-file/view,TRUE',
      ].join('\n'),
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      resolveArtworkImages: async (artworks) => artworks.map((artwork) => ({
        ...artwork,
        imageUrl: 'data:image/jpeg;base64,aW1hZ2U=',
      })),
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /data:image\/jpeg;base64,aW1hZ2U=/);
});

test('runGenerateCli matches production Drive naming {num}_{title}_{dims}_CAT01 by substring', async () => {
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
              { id: 'prod-cat01', mimeType: 'image/jpeg', name: '40_Esnupi Pocho_23 x 19_CAT01.jpg' },
              { id: 'prod-cat02', mimeType: 'image/jpeg', name: '40_Esnupi Pocho_23 x 19_CAT02.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-040,Esnupi Pocho,2026,03/26,Acrylic,canvas,23 x 19 cm,available,https://drive.google.com/file/d/sheet-image/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/prod-cat01/);
  assert.doesNotMatch(renderedJobs[0], /prod-cat02/);
  assert.doesNotMatch(renderedJobs[0], /sheet-image/);
});

test('runGenerateCli matches production Drive naming without number prefix', async () => {
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
              { id: 'mid-cat01', mimeType: 'image/jpeg', name: 'Mid-Century Gachas_90 x 90_CAT01.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-099,Mid-Century Gachas,2026,03/26,Acrylic,canvas,90 x 90 cm,available,https://drive.google.com/file/d/sheet-image/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/mid-cat01/);
});

test('runGenerateCli matches production Drive naming with dimensions substring in matchKey', async () => {
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
              { id: 'tried-cat01', mimeType: 'image/jpeg', name: '51_Trying to convince a friend to join my plan_80 x 95_CAT01.jpg' },
            ],
          });
        }
        return [
          'artwork_id,title_clean,year,date_label,medium_clean,support_clean,dimensions_clean,status_normalized,image_main,include_in_catalog,catalog_ready,price_display_clean',
          'LA-2026-051,Trying to convince a friend to join my plan,2026,03/26,Acrylic,canvas,80 x 95 cm,available,https://drive.google.com/file/d/sheet-image/view,TRUE,TRUE,300 €',
        ].join('\n');
      },
      renderPdf: async ({ html }) => { renderedJobs.push(html); },
      writeTextFile: async () => {},
    },
    env: {},
    logger,
  });

  assert.equal(result.exitCode, 0);
  assert.match(renderedJobs[0], /https:\/\/lh3\.googleusercontent\.com\/d\/tried-cat01/);
});
