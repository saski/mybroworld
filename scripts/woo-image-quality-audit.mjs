#!/usr/bin/env node

import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { parseSheetInventoryCsv } from '../catalog-generator/src/commerce-inventory-parity.mjs';
import { fetchStoreProducts } from './woo-storefront-assert.mjs';

const MANAGED_SKU_PATTERN = /^LA-\d{4}-\d+$/u;
const DEFAULT_MIN_IMAGES = 1;
const DEFAULT_MIN_WIDTH = 1200;
const DEFAULT_MIN_HEIGHT = 1200;
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const DRIVE_IMAGE_HOSTS = new Set(['drive.google.com', 'docs.google.com', 'lh3.googleusercontent.com']);

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

function printUsage(logger) {
  logger.error(
    'Usage: scripts/woo-image-quality-audit.mjs --sheet-csv PATH [--min-images 1] [--min-width 1200] [--min-height 1200]',
  );
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function imageDimension(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function productSku(product) {
  return String(product?.sku || '').trim();
}

function productName(product) {
  return String(product?.name || product?.title || '').trim() || '-';
}

function imageSource(image) {
  return String(image?.src || image?.thumbnail || '').trim();
}

function imageAlt(image) {
  return String(image?.alt || image?.name || '').trim();
}

function imageMimeType(image) {
  return String(image?.mime_type || image?.mimeType || image?.type || '').trim().toLowerCase();
}

function imageExtension(src) {
  try {
    const pathname = new URL(src).pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/iu);
    return match ? match[1].toLowerCase() : '';
  } catch {
    const match = src.match(/\.([a-z0-9]+)(?:[?#].*)?$/iu);
    return match ? match[1].toLowerCase() : '';
  }
}

function isExternalLiveImageSource(src, baseUrl) {
  if (!src) {
    return false;
  }

  try {
    const imageUrl = new URL(src, baseUrl);

    if (DRIVE_IMAGE_HOSTS.has(imageUrl.hostname)) {
      return true;
    }

    if (imageUrl.pathname.includes('/wp-content/plugins/')) {
      return true;
    }

    return imageUrl.origin !== new URL(baseUrl).origin && !imageUrl.pathname.includes('/wp-content/uploads/');
  } catch {
    return false;
  }
}

function addRisk(risks, code, artworkId, title, detail = '') {
  risks.push({
    artworkId,
    code,
    detail,
    title,
  });
}

export function buildImageQualityAuditReport({
  baseUrl,
  expectedArtworks,
  minHeight = DEFAULT_MIN_HEIGHT,
  minImages = DEFAULT_MIN_IMAGES,
  minWidth = DEFAULT_MIN_WIDTH,
  products,
}) {
  const risks = [];
  const productsBySku = new Map(products.map((product) => [productSku(product), product]));
  const expectedSkus = new Set(expectedArtworks.map((artwork) => artwork.artworkId));

  for (const product of products) {
    const sku = productSku(product);
    if (!MANAGED_SKU_PATTERN.test(sku) || !expectedSkus.has(sku)) {
      addRisk(risks, 'missing_managed_artwork_identity', sku || '-', productName(product));
    }
  }

  for (const artwork of expectedArtworks) {
    const product = productsBySku.get(artwork.artworkId);

    if (!product) {
      addRisk(risks, 'missing_managed_product', artwork.artworkId, artwork.title);
      continue;
    }

    const images = Array.isArray(product.images) ? product.images : [];

    if (images.length === 0) {
      addRisk(risks, 'missing_image', artwork.artworkId, artwork.title);
    }

    if (images.length < minImages) {
      addRisk(
        risks,
        'image_count_below_minimum',
        artwork.artworkId,
        artwork.title,
        `count=${images.length} minimum=${minImages}`,
      );
    }

    images.forEach((image, index) => {
      const imageNumber = index + 1;
      const src = imageSource(image);
      const width = imageDimension(image?.width);
      const height = imageDimension(image?.height);
      const mimeType = imageMimeType(image);
      const extension = imageExtension(src);

      if (width !== null && height !== null && (width < minWidth || height < minHeight)) {
        addRisk(
          risks,
          'image_too_small',
          artwork.artworkId,
          artwork.title,
          `image=${imageNumber} width=${width} height=${height} minimum=${minWidth}x${minHeight}`,
        );
      }

      if (mimeType && !SUPPORTED_MIME_TYPES.has(mimeType)) {
        addRisk(risks, 'unsupported_image_type', artwork.artworkId, artwork.title, `image=${imageNumber} ${mimeType}`);
      } else if (!mimeType && extension && !SUPPORTED_EXTENSIONS.has(extension)) {
        addRisk(risks, 'unsupported_image_type', artwork.artworkId, artwork.title, `image=${imageNumber} .${extension}`);
      }

      if (isExternalLiveImageSource(src, baseUrl)) {
        addRisk(risks, 'external_live_image_source', artwork.artworkId, artwork.title, `image=${imageNumber} ${src}`);
      }

      if (!imageAlt(image)) {
        addRisk(risks, 'missing_image_alt', artwork.artworkId, artwork.title, `image=${imageNumber}`);
      }
    });
  }

  return {
    expectedCount: expectedArtworks.length,
    productCount: products.length,
    risks,
  };
}

function logReport(report, logger) {
  logger.log(
    `woo_image_quality_audit products=${report.productCount} expected=${report.expectedCount} risks=${report.risks.length}`,
  );
}

function logRisks(report, logger) {
  for (const risk of report.risks) {
    logger.error([risk.code, risk.artworkId, risk.title, risk.detail].filter(Boolean).join(' '));
  }
}

export async function runWooImageQualityAuditCli({
  argv = process.argv.slice(2),
  env = process.env,
  fetchStoreProducts: fetchProducts = fetchStoreProducts,
  logger = console,
  readTextFile = (filePath) => fs.readFile(filePath, 'utf8'),
} = {}) {
  const args = parseArgs(argv);

  if (args.help === 'true') {
    printUsage(logger);
    return { exitCode: 0 };
  }

  if (!args['sheet-csv']) {
    printUsage(logger);
    return { exitCode: 2 };
  }

  if (!String(env.WOO_BASE_URL || '').trim()) {
    logger.error('woo_image_quality_audit_refused missing_env=WOO_BASE_URL');
    return { exitCode: 2 };
  }

  try {
    const sheetCsvText = await readTextFile(args['sheet-csv']);
    const expectedArtworks = parseSheetInventoryCsv(sheetCsvText);
    const products = await fetchProducts({ baseUrl: env.WOO_BASE_URL });
    const report = buildImageQualityAuditReport({
      baseUrl: env.WOO_BASE_URL,
      expectedArtworks,
      minHeight: parsePositiveInteger(args['min-height'], DEFAULT_MIN_HEIGHT),
      minImages: parsePositiveInteger(args['min-images'], DEFAULT_MIN_IMAGES),
      minWidth: parsePositiveInteger(args['min-width'], DEFAULT_MIN_WIDTH),
      products,
    });

    logReport(report, logger);

    if (report.risks.length > 0) {
      logRisks(report, logger);
      return { exitCode: 1, report };
    }

    return { exitCode: 0, report };
  } catch (error) {
    logger.error(`woo_image_quality_audit_failed ${error instanceof Error ? error.message : String(error)}`);
    return { exitCode: 2 };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooImageQualityAuditCli();
  process.exit(exitCode);
}
