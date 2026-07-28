import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parse } from 'csv-parse/sync';

import {
  CATALOG_DEFAULT_ARTIST_NAME,
  catalogStatusLabel,
  normalizeCatalogStatus,
} from './shared-catalog-contract.mjs';
import { extractDriveImageFileId, normalizeDriveImageUrl } from './drive-image-url.mjs';
import { renderCatalogHtml } from './template.js';

const DEFAULT_ARTIST_NAME = CATALOG_DEFAULT_ARTIST_NAME;
const DEFAULT_CATALOG_TITLE = 'Catálogo 2026';
const DEFAULT_OUTPUT_PATH = 'output/catalogo.pdf';
const PDF_RENDER_TIMEOUT_MS = 120_000;
const PDF_IMAGE_LOAD_TIMEOUT_MS = 60_000;
const MACOS_GOOGLE_CHROME_EXECUTABLE_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT_CHROMIUM_SANDBOX_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'];

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
  getUid = () => process.getuid?.(),
} = {}) {
  const configuredExecutablePath = String(
    executablePath || env.PUPPETEER_EXECUTABLE_PATH || '',
  ).trim();
  const rootSandboxOptions = getUid() === 0
    ? { args: ROOT_CHROMIUM_SANDBOX_ARGS }
    : {};

  if (configuredExecutablePath) {
    return {
      ...rootSandboxOptions,
      executablePath: configuredExecutablePath,
      headless: true,
    };
  }

  if (await fileExists(MACOS_GOOGLE_CHROME_EXECUTABLE_PATH)) {
    return {
      ...rootSandboxOptions,
      executablePath: MACOS_GOOGLE_CHROME_EXECUTABLE_PATH,
      headless: true,
    };
  }

  return {
    ...rootSandboxOptions,
    headless: true,
  };
}

export async function waitForCatalogImageElements(page, timeoutMs = PDF_IMAGE_LOAD_TIMEOUT_MS) {
  const failedImages = await page.evaluate(async (maxWaitMs) => {
    const catalogImages = Array.from(document.images)
      .filter((image) => image.dataset.catalogArtworkImage === 'true');
    const pendingImages = catalogImages
      .filter((image) => !image.complete);

    if (pendingImages.length === 0) {
      return catalogImages
        .filter((image) => image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src);
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

    return catalogImages
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
  }, timeoutMs);

  if (Array.isArray(failedImages) && failedImages.length > 0) {
    throw new CatalogCliError({
      code: 'catalog_image_load_failed',
      exitCode: 5,
      message: `Catalog image loading failed: ${failedImages.join(', ')}`,
    });
  }
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

function normalizeMatchKey(value) {
  return String(value || '')
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/u, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeArtworkStatus(status) {
  return normalizeCatalogStatus(status);
}

function statusLabel(status) {
  return catalogStatusLabel(status);
}

function buildTechnique(row) {
  const medium = String(row.medium_clean || row.medium_raw || '').trim();
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

function formatEuroPrice(value) {
  const numericValue = Number(String(value || '').replace(',', '.'));
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return `${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericValue)} €`;
}

function resolvePvpPrice(row) {
  return String(row.price_display_clean || row.price_raw || '').trim() || formatEuroPrice(row.price_eur);
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

function buildArtworkRecencyKey(row) {
  const datePeriod = parseCatalogDateLabel(row.date_label);
  if (datePeriod) {
    return datePeriod.sortKey;
  }

  const year = Number(row.year || row.source_year);
  return Number.isFinite(year) ? year * 100 : 0;
}

function stripFileExtension(fileName) {
  return String(fileName || '').replace(/\.[^.]+$/u, '');
}

function normalizeSourceImageKey(fileName) {
  return normalizeMatchKey(
    stripFileExtension(fileName).replace(/[_\s-]+(?:cat)?\d+[_\s-]*$/iu, ''),
  );
}

function parseCatalogImageManifest(manifestText) {
  let payload;
  try {
    payload = JSON.parse(manifestText);
  } catch (error) {
    throw new CatalogCliError({
      code: 'catalog_image_manifest_invalid',
      exitCode: 2,
      message: 'The catalog image manifest must be valid JSON.',
      cause: error,
    });
  }

  const files = Array.isArray(payload) ? payload : payload.files;
  if (!Array.isArray(files)) {
    throw new CatalogCliError({
      code: 'catalog_image_manifest_invalid',
      exitCode: 2,
      message: 'The catalog image manifest must be an array or contain a files array.',
    });
  }

  const catalogFiles = [];
  const filesById = new Map();
  for (const file of files) {
    const fileName = String(file?.name || '').trim();
    if (!file?.id) {
      continue;
    }

    const id = String(file.id).trim();
    filesById.set(id, {
      id,
      name: fileName,
      normalizedSourceKey: normalizeSourceImageKey(fileName),
    });

    const catMatch = fileName.match(/^(.*)_cat(\d*)(?:[_\s-]*)?(?:\.[^.]+)?$/i);
    if (!catMatch) {
      continue;
    }

    const baseName = catMatch[1];
    const normalizedKey = normalizeMatchKey(baseName);
    if (!normalizedKey) {
      continue;
    }

    const catNumber = catMatch[2];
    const priority = catNumber === '01' ? 1 : 2;

    catalogFiles.push({
      id,
      name: fileName,
      normalizedKey,
      priority,
    });
  }

  return { catalogFiles, filesById };
}

function catalogImageUrl(fileId) {
  return normalizeDriveImageUrl(`https://drive.google.com/file/d/${fileId}/view`);
}

function imageMatchKeys(row) {
  return [
    normalizeMatchKey(row.artwork_id),
    normalizeMatchKey(row.title_clean),
    normalizeMatchKey(row.title_raw),
  ].filter(Boolean);
}

function findSingleCatalogMatch(files, matchKeys) {
  const matchedFiles = files.filter((file) => matchKeys.some(
    (matchKey) => file.normalizedKey.includes(matchKey) || matchKey.includes(file.normalizedKey),
  ));
  const uniqueMatchingFiles = [
    ...new Map(matchedFiles.map((file) => [file.id, file])).values(),
  ];
  const matchingCatalogKeys = new Set(uniqueMatchingFiles.map((file) => file.normalizedKey));

  if (matchingCatalogKeys.size !== 1) {
    return null;
  }

  uniqueMatchingFiles.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  return uniqueMatchingFiles[0] || null;
}

function normalizeFilenameTokens(value) {
  return stripFileExtension(value)
    .replace(/[_\s-]+cat\d*(?:[_\s-]*)?$/iu, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .match(/[a-z0-9]+/gu) || [];
}

function findUniqueSimilarCatalogMatch(files, queryValues) {
  const queryTokenSets = queryValues
    .map(normalizeFilenameTokens)
    .filter((tokens) => tokens.length >= 2);
  const candidates = new Map();

  for (const file of files) {
    const fileTokens = new Set(normalizeFilenameTokens(file.name));
    for (const queryTokens of queryTokenSets) {
      const overlap = queryTokens.filter((token) => fileTokens.has(token)).length;
      const score = overlap / queryTokens.length;
      if (overlap < 2 || score < 0.75) {
        continue;
      }
      const existing = candidates.get(file.id);
      if (!existing || score > existing.score) {
        candidates.set(file.id, { file, score });
      }
    }
  }

  const ranked = [...candidates.values()]
    .sort((left, right) => right.score - left.score || left.file.name.localeCompare(right.file.name));
  const best = ranked[0];
  const runnerUpScore = ranked[1]?.score || 0;
  return best && best.score - runnerUpScore >= 0.15 ? best.file : null;
}

function resolveCatalogImage(row, catalogImageManifest) {
  const sourceUrl = normalizeDriveImageUrl(row.image_main);
  if (!catalogImageManifest) {
    return { driveFileId: extractDriveImageFileId(row.image_main), imageUrl: sourceUrl, warning: '' };
  }

  const sourceImageId = extractDriveImageFileId(row.image_main);
  const sourceImage = catalogImageManifest.filesById.get(sourceImageId);
  if (sourceImage?.normalizedSourceKey) {
    const sourceMatches = catalogImageManifest.catalogFiles.filter(
      (file) => file.normalizedKey === sourceImage.normalizedSourceKey,
    );
    if (sourceMatches.length > 0) {
      sourceMatches.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
      return { driveFileId: sourceMatches[0].id, imageUrl: catalogImageUrl(sourceMatches[0].id), warning: '' };
    }
  }

  const matchKeys = imageMatchKeys(row);
  const directMatch = findSingleCatalogMatch(catalogImageManifest.catalogFiles, matchKeys);
  if (directMatch) {
    return { driveFileId: directMatch.id, imageUrl: catalogImageUrl(directMatch.id), warning: '' };
  }

  const similarMatch = findUniqueSimilarCatalogMatch(catalogImageManifest.catalogFiles, [
    sourceImage?.name,
    row.title_clean,
    row.title_raw,
  ].filter(Boolean));
  if (similarMatch) {
    return {
      driveFileId: similarMatch.id,
      imageUrl: catalogImageUrl(similarMatch.id),
      warning: 'was resolved to a similar _CAT01 filename',
    };
  }

  if (sourceUrl) {
    return {
      driveFileId: sourceImageId,
      imageUrl: sourceUrl,
      warning: 'fell back to image_main because no unique _CAT01 image was found',
    };
  }

  return {
    driveFileId: '',
    imageUrl: '',
    warning: 'is missing and the artwork was omitted',
  };
}

function catalogSourceLocation(row, fallbackRowNumber) {
  const sheet = String(row.catalog_source_sheet || row.source_year || 'sheet').trim();
  const rowNumber = Number(row.catalog_source_row);

  return {
    rowNumber: Number.isInteger(rowNumber) && rowNumber > 0 ? rowNumber : fallbackRowNumber,
    sheet,
  };
}

function formatCatalogDataIssues(issues) {
  const grouped = new Map();

  issues.forEach((issue) => {
    const key = `${issue.header}\u0000${issue.reason}`;
    const locations = grouped.get(key) || [];
    locations.push(issue.location);
    grouped.set(key, locations);
  });

  return [...grouped.entries()]
    .map(([key, locations]) => {
      const [header, reason] = key.split('\u0000');
      const bySheet = new Map();
      locations.forEach((location) => {
        const rows = bySheet.get(location.sheet) || [];
        rows.push(location.rowNumber);
        bySheet.set(location.sheet, rows);
      });
      const references = [...bySheet.entries()]
        .map(([sheet, rows]) => `${sheet} rows ${[...new Set(rows)].sort((a, b) => a - b).join(', ')}`)
        .join('; ');

      return `${header} ${reason}: ${references}`;
    })
    .join(' | ');
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
  const catalogImageManifestPath = args['catalog-image-manifest'] || env.CATALOG_IMAGE_MANIFEST || '';
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
    catalogImageManifestPath,
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

function buildCatalogArtworkResult(records, { catalogImageManifest = null, limit }) {
  const warnings = [];
  const artworks = records
    .filter((row) => normalizeBoolean(row.include_in_catalog))
    .map((row, index) => {
      const status = normalizeArtworkStatus(row.status_normalized);
      const price = resolvePvpPrice(row);
      const title = String(row.title_clean || row.title_raw || '').trim();
      const image = resolveCatalogImage(row, catalogImageManifest);

      const sourceLocation = catalogSourceLocation(row, index + 2);
      if (!title) {
        warnings.push({
          header: 'title_raw',
          location: sourceLocation,
          reason: 'is missing and the artwork was omitted',
        });
      }
      if (image.warning && title) {
        warnings.push({
          header: 'image_main',
          location: sourceLocation,
          reason: image.warning,
        });
      }

      return {
        artworkId: String(row.artwork_id || '').trim(),
        dateLabel: String(row.date_label || '').trim(),
        dimensions: String(row.dimensions_clean || row.dimensions_raw || '').trim(),
        driveFileId: image.driveFileId,
        imageUrl: image.imageUrl,
        order: toSortableNumber(row.catalog_order, 999999),
        price,
        recencyKey: buildArtworkRecencyKey(row),
        section: String(row.catalog_section || '').trim().toLowerCase() || (status === 'available' ? 'available' : 'historical'),
        showPrice: price !== '',
        status,
        statusLabel: statusLabel(status),
        technique: buildTechnique(row),
        title,
        year: String(row.year || row.source_year || parseCatalogDateLabel(row.date_label)?.year || '').trim(),
      };
    })
    .filter((row) => row.title && row.imageUrl)
    .sort((left, right) => {
      const recencyOrder = right.recencyKey - left.recencyKey;
      if (recencyOrder !== 0) {
        return recencyOrder;
      }

      const rowOrder = left.order - right.order;
      if (rowOrder !== 0) {
        return rowOrder;
      }

      return left.title.localeCompare(right.title);
    });

  const limitedArtworks = Number.isFinite(limit) ? artworks.slice(0, limit) : artworks;
  const warningMessage = formatCatalogDataIssues(warnings);
  if (limitedArtworks.length === 0) {
    throw new CatalogCliError({
      code: 'catalog_no_renderable_artworks',
      exitCode: 4,
      message: `No selected artworks can be rendered. Catalog data issues: ${warningMessage || 'No usable title and image_main values were found.'}`,
    });
  }

  return { artworks: limitedArtworks, warningMessage };
}

export function buildCatalogArtworks(records, options) {
  return buildCatalogArtworkResult(records, options).artworks;
}

async function defaultRenderPdf({ html, htmlPath, outputPath, puppeteerExecutablePath }) {
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
    await page.goto(pathToFileURL(htmlPath).href, {
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
    catalogImageManifestPath,
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
  const resolveArtworkImages = dependencies.resolveArtworkImages || (async (artworks) => artworks);
  const writeTextFile = dependencies.writeTextFile || ((filePath, contents) => fs.writeFile(filePath, contents, 'utf8'));

  const csvText = await readCsvText({ inputPath, inputUrl });
  const catalogImageManifest = catalogImageManifestPath
    ? parseCatalogImageManifest(await readCsvText({
        inputPath: catalogImageManifestPath,
        inputUrl: '',
      }))
    : null;
  const records = parse(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  });

  const { artworks, warningMessage } = buildCatalogArtworkResult(records, { catalogImageManifest, limit });
  const renderedArtworks = await resolveArtworkImages(artworks);
  const html = renderCatalogHtml(renderedArtworks, {
    artistName,
    catalogTitle,
  });

  const outputDirectory = path.dirname(outputPath);
  const htmlPath = path.join(outputDirectory, 'catalogo-preview.html');
  await ensureDir(outputDirectory);
  await writeTextFile(htmlPath, html);

  try {
    await renderPdf({ html, htmlPath, outputPath, puppeteerExecutablePath });
  } catch (error) {
    if (error instanceof CatalogCliError) {
      throw error;
    }
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
    warningMessage,
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
      `completed code=catalog_generation_completed output=${result.outputPath} preview=${result.htmlPath} artworks=${result.artworkCount}${result.warningMessage ? ` warnings=${result.warningMessage}` : ''}`,
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
