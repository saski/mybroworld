import fs from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'csv-parse/sync';

import { renderCatalogHtml } from './template.js';

const DEFAULT_ARTIST_NAME = 'Lucía Astuy';
const DEFAULT_CATALOG_TITLE = 'Catálogo 2026';
const DEFAULT_OUTPUT_PATH = 'output/catalogo.pdf';
const PDF_RENDER_TIMEOUT_MS = 120_000;
const PDF_IMAGE_LOAD_TIMEOUT_MS = 60_000;
const MACOS_GOOGLE_CHROME_EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

class CatalogCliError extends Error {
  constructor({ code, exitCode, message, cause }) {
    super(message);
    this.name = 'CatalogCliError';
    this.code = code;
    this.exitCode = exitCode;
    this.cause = cause;
  }
}

async function pathExists(candidatePath) {
  try {
    await fs.access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolvePuppeteerLaunchOptions({
  env = process.env,
  executablePath = '',
  fileExists = pathExists,
} = {}) {
  const configuredExecutablePath = String(
    executablePath || env.PUPPETEER_EXECUTABLE_PATH || '',
  ).trim();

  if (configuredExecutablePath) {
    return {
      executablePath: configuredExecutablePath,
      headless: true,
    };
  }

  if (await fileExists(MACOS_GOOGLE_CHROME_EXECUTABLE_PATH)) {
    return {
      executablePath: MACOS_GOOGLE_CHROME_EXECUTABLE_PATH,
      headless: true,
    };
  }

  return {
    headless: true,
  };
}

export async function waitForCatalogImageElements(page, timeoutMs = PDF_IMAGE_LOAD_TIMEOUT_MS) {
  await page.evaluate(async (maxWaitMs) => {
    const pendingImages = Array.from(document.images)
      .filter((image) => !image.complete);

    if (pendingImages.length === 0) {
      return;
    }

    await Promise.race([
      Promise.all(pendingImages.map((image) => new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      }))),
      new Promise((resolve) => {
        setTimeout(resolve, maxWaitMs);
      }),
    ]);
  }, timeoutMs);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--')) {
      continue;
    }

    args[key.slice(2)] = value && !value.startsWith('--') ? value : 'true';
    if (value && !value.startsWith('--')) {
      index += 1;
    }
  }

  return args;
}

function normalizeBoolean(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'sí', 'si'].includes(text);
}

function normalizeArtworkStatus(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

  switch (normalized) {
    case 'available':
    case 'for_sale':
    case 'disponible':
      return 'available';
    case 'gifted':
    case 'gift':
    case 'regalo':
    case 'donated':
    case 'donation':
      return 'gifted';
    case 'exchanged':
    case 'exchange':
    case 'intercambio':
    case 'traded':
      return 'exchanged';
    case 'sold':
    case 'vendido':
      return 'sold';
    case 'commissioned':
    case 'commission':
    case 'encargo':
      return 'commissioned';
    case 'reserved':
    case 'reservado':
    case 'reservada':
      return 'reserved';
    case 'not_for_sale':
    case 'nfs':
    case 'no_disponible':
      return 'not_for_sale';
    case 'personal_collection':
    case 'collection':
    case 'coleccion_personal':
      return 'personal_collection';
    case 'archived':
    case 'archive':
    case 'archivada':
      return 'archived';
    default:
      return '';
  }
}

function statusLabel(status) {
  switch (normalizeArtworkStatus(status)) {
    case 'gifted':
    case 'exchanged':
    case 'personal_collection':
    case 'archived':
      return 'Obra histórica';
    case 'reserved':
      return 'Reservada';
    case 'sold':
    case 'commissioned':
    case 'not_for_sale':
      return 'Obra no disponible';
    default:
      return '';
  }
}

function buildTechnique(row) {
  const medium = String(row.medium_clean || '').trim();
  const support = String(row.support_clean || '').trim();
  if (medium && support) {
    return `${medium} sobre ${support}`;
  }
  return medium || support || '';
}

function toSortableNumber(value, fallback = 999999) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function parseCatalogDateLabel(value) {
  const normalizedValue = String(value || '').trim();
  const match = normalizedValue.match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const rawYear = Number(match[2]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    month,
    sortKey: year * 100 + month,
    year,
  };
}

function buildCatalogPeriodLabel(artworks) {
  const latestPeriod = artworks
    .map((artwork) => parseCatalogDateLabel(artwork.dateLabel))
    .filter(Boolean)
    .sort((left, right) => right.sortKey - left.sortKey)[0];

  if (!latestPeriod) {
    return '';
  }

  return `${SPANISH_MONTHS[latestPeriod.month - 1]} ${latestPeriod.year}`;
}

function normalizeDriveImage(url) {
  if (!url) {
    return '';
  }

  const trimmed = String(url).trim();
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) {
    return `https://lh3.googleusercontent.com/d/${pathMatch[1]}`;
  }

  const queryMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) {
    return `https://lh3.googleusercontent.com/d/${queryMatch[1]}`;
  }

  return trimmed;
}

function parseLimit(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new CatalogCliError({
      code: 'invalid_limit',
      exitCode: 2,
      message: 'The --limit flag must be a positive number.',
    });
  }

  return parsedValue;
}

function resolveOptions({ argv, env }) {
  const args = parseArgs(argv);
  const inputPath = args.input || env.CATALOG_INPUT || '';
  const inputUrl = args['input-url'] || env.GOOGLE_SHEET_CSV_URL || '';
  const outputPath = args.output || env.CATALOG_OUTPUT || DEFAULT_OUTPUT_PATH;
  const catalogTitle = args['catalog-title'] || env.CATALOG_TITLE || DEFAULT_CATALOG_TITLE;
  const artistName = args['artist-name'] || env.CATALOG_ARTIST_NAME || DEFAULT_ARTIST_NAME;
  const puppeteerExecutablePath = args['puppeteer-executable-path'] || env.PUPPETEER_EXECUTABLE_PATH || '';
  const limit = parseLimit(args.limit);

  if (!inputPath && !inputUrl) {
    throw new CatalogCliError({
      code: 'input_missing',
      exitCode: 2,
      message: 'Provide --input <path> or --input-url <url>.',
    });
  }

  return {
    artistName,
    catalogTitle,
    inputPath,
    inputUrl,
    limit,
    outputPath,
    puppeteerExecutablePath,
  };
}

async function defaultReadCsvText({ inputPath, inputUrl }) {
  if (inputUrl) {
    const response = await fetch(inputUrl);
    if (!response.ok) {
      throw new CatalogCliError({
        code: 'input_download_failed',
        exitCode: 3,
        message: `Unable to download CSV input: ${response.status} ${response.statusText}`,
      });
    }

    return response.text();
  }

  try {
    return await fs.readFile(inputPath, 'utf8');
  } catch (error) {
    throw new CatalogCliError({
      code: 'input_read_failed',
      exitCode: 3,
      message: `Unable to read CSV input: ${inputPath}`,
      cause: error,
    });
  }
}

export function buildCatalogArtworks(records, { limit }) {
  const artworks = records
    .filter((row) => normalizeBoolean(row.include_in_catalog) && normalizeBoolean(row.catalog_ready))
    .map((row) => {
      const status = normalizeArtworkStatus(row.status_normalized);
      const showPrice = normalizeBoolean(row.show_price) && status === 'available';
      const note = String(row.catalog_notes_public || '').trim();

      return {
        artworkId: String(row.artwork_id || '').trim(),
        dateLabel: String(row.date_label || '').trim(),
        dimensions: String(row.dimensions_clean || '').trim(),
        imageUrl: normalizeDriveImage(row.image_main),
        note,
        order: toSortableNumber(row.catalog_order, 999999),
        price: showPrice ? String(row.price_display_clean || '').trim() : '',
        section: String(row.catalog_section || '').trim().toLowerCase() || (status === 'available' ? 'available' : 'historical'),
        showPrice,
        status,
        statusLabel: statusLabel(status),
        technique: buildTechnique(row),
        title: String(row.title_clean || row.title_raw || '').trim(),
        year: String(row.year || '').trim(),
      };
    })
    .filter((row) => row.title && row.imageUrl)
    .sort((left, right) => {
      const sectionOrder = left.section.localeCompare(right.section);
      if (sectionOrder !== 0) {
        return sectionOrder;
      }

      const rowOrder = left.order - right.order;
      if (rowOrder !== 0) {
        return rowOrder;
      }

      return left.title.localeCompare(right.title);
    });

  return Number.isFinite(limit) ? artworks.slice(0, limit) : artworks;
}

async function defaultRenderPdf({ html, outputPath, puppeteerExecutablePath }) {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch(
    await resolvePuppeteerLaunchOptions({
      executablePath: puppeteerExecutablePath,
    }),
  );

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PDF_RENDER_TIMEOUT_MS);
    await page.setContent(html, {
      timeout: PDF_RENDER_TIMEOUT_MS,
      waitUntil: 'load',
    });
    await waitForCatalogImageElements(page);
    await page.pdf({
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      path: outputPath,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

export async function generateCatalog(options, dependencies = {}) {
  const {
    artistName,
    catalogTitle,
    inputPath,
    inputUrl,
    limit,
    outputPath,
    puppeteerExecutablePath,
  } = options;

  const readCsvText = dependencies.readCsvText || defaultReadCsvText;
  const ensureDir = dependencies.ensureDir || ((directoryPath) => fs.mkdir(directoryPath, { recursive: true }));
  const renderPdf = dependencies.renderPdf || defaultRenderPdf;
  const writeTextFile = dependencies.writeTextFile || ((filePath, contents) => fs.writeFile(filePath, contents, 'utf8'));

  const csvText = await readCsvText({ inputPath, inputUrl });
  const records = parse(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  });

  const artworks = buildCatalogArtworks(records, { limit });
  const catalogPeriodLabel = buildCatalogPeriodLabel(artworks);
  const html = renderCatalogHtml(artworks, {
    artistName,
    catalogPeriodLabel,
    catalogTitle,
  });

  const outputDirectory = path.dirname(outputPath);
  const htmlPath = path.join(outputDirectory, 'catalogo-preview.html');
  await ensureDir(outputDirectory);
  await writeTextFile(htmlPath, html);

  try {
    await renderPdf({ html, outputPath, puppeteerExecutablePath });
  } catch (error) {
    throw new CatalogCliError({
      code: 'pdf_render_failed',
      exitCode: 5,
      message: `Unable to render PDF output: ${outputPath}`,
      cause: error,
    });
  }

  return {
    artistName,
    artworkCount: artworks.length,
    catalogTitle,
    htmlPath,
    outputPath,
  };
}

export async function runGenerateCli({
  argv = process.argv.slice(2),
  dependencies = {},
  env = process.env,
  logger = console,
} = {}) {
  try {
    const options = resolveOptions({ argv, env });
    const result = await generateCatalog(options, dependencies);

    logger.log(
      `completed code=catalog_generation_completed output=${result.outputPath} preview=${result.htmlPath} artworks=${result.artworkCount}`,
    );

    return {
      exitCode: 0,
      result,
    };
  } catch (error) {
    const normalizedError = error instanceof CatalogCliError
      ? error
      : new CatalogCliError({
          code: 'catalog_generation_failed',
          exitCode: 1,
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        });

    logger.error(`failed code=${normalizedError.code} message=${normalizedError.message}`);

    return {
      error: normalizedError,
      exitCode: normalizedError.exitCode,
    };
  }
}
