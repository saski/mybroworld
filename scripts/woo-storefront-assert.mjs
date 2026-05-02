#!/usr/bin/env node

import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { parseSheetInventoryCsv } from '../catalog-generator/src/commerce-inventory-parity.mjs';

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
  logger.error('Usage: scripts/woo-storefront-assert.mjs --sheet-csv PATH [--require-managed-products] [--require-images]');
}

export async function fetchStoreProducts({
  baseUrl,
  fetchImpl = fetch,
  perPage = 100,
}) {
  const products = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = new URL('/wp-json/wc/store/v1/products', String(baseUrl).replace(/\/+$/u, ''));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));

    const response = await fetchImpl(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce Store API products request failed: HTTP ${response.status}`);
    }

    const pageProducts = await response.json();
    if (!Array.isArray(pageProducts)) {
      throw new Error('WooCommerce Store API products response was not an array.');
    }

    products.push(...pageProducts);
    totalPages = Number(response.headers?.get?.('x-wp-totalpages') || totalPages);
    page += 1;
  } while (page <= totalPages);

  return products;
}

function buildStorefrontReport({ expectedArtworks, products, requireImages, requireManagedProducts }) {
  const productsBySku = new Map(products.map((product) => [String(product.sku || '').trim(), product]));
  const expectedSkus = new Set(expectedArtworks.map((artwork) => artwork.artworkId));
  const missingProducts = [];
  const missingImages = [];
  const unexpectedProducts = [];

  for (const artwork of expectedArtworks) {
    const product = productsBySku.get(artwork.artworkId);

    if (!product) {
      if (requireManagedProducts) {
        missingProducts.push(artwork);
      }
      continue;
    }

    if (requireImages && (!Array.isArray(product.images) || product.images.length === 0)) {
      missingImages.push(artwork);
    }
  }

  for (const product of products) {
    const sku = String(product.sku || '').trim();
    if (!expectedSkus.has(sku)) {
      unexpectedProducts.push(product);
    }
  }

  return {
    expectedCount: expectedArtworks.length,
    missingImages,
    missingProducts,
    productCount: products.length,
    unexpectedProducts,
  };
}

function logReport(report, logger) {
  logger.log(
    `woo_storefront_assert products=${report.productCount} expected=${report.expectedCount} missing=${report.missingProducts.length} missing_images=${report.missingImages.length} unexpected=${report.unexpectedProducts.length}`,
  );
}

function logFailures(report, logger) {
  for (const artwork of report.missingProducts) {
    logger.error(`missing_managed_product ${artwork.artworkId} ${artwork.title}`);
  }

  for (const artwork of report.missingImages) {
    logger.error(`missing_product_image ${artwork.artworkId} ${artwork.title}`);
  }

  for (const product of report.unexpectedProducts) {
    const sku = String(product.sku || '').trim() || '-';
    const name = String(product.name || '').trim() || '-';
    logger.error(`unexpected_store_product ${sku} ${name}`);
  }
}

export async function runWooStorefrontAssertCli({
  argv = process.argv.slice(2),
  env = process.env,
  fetchStoreProducts: fetchProducts = fetchStoreProducts,
  logger = console,
  readTextFile = (filePath) => fs.readFile(filePath, 'utf8'),
} = {}) {
  const args = parseArgs(argv);

  if (!args['sheet-csv']) {
    printUsage(logger);
    return { exitCode: 2 };
  }

  if (!String(env.WOO_BASE_URL || '').trim()) {
    logger.error('woo_storefront_assert_refused missing_env=WOO_BASE_URL');
    return { exitCode: 2 };
  }

  try {
    const sheetCsvText = await readTextFile(args['sheet-csv']);
    const expectedArtworks = parseSheetInventoryCsv(sheetCsvText);
    const products = await fetchProducts({ baseUrl: env.WOO_BASE_URL });
    const report = buildStorefrontReport({
      expectedArtworks,
      products,
      requireImages: args['require-images'] === 'true',
      requireManagedProducts: args['require-managed-products'] === 'true',
    });
    const forbidUnmanagedProducts = args['forbid-unmanaged-products'] === 'true';

    logReport(report, logger);

    if (
      report.missingProducts.length > 0 ||
      report.missingImages.length > 0 ||
      (forbidUnmanagedProducts && report.unexpectedProducts.length > 0)
    ) {
      logFailures(report, logger);
      return { exitCode: 1, report };
    }

    return { exitCode: 0, report };
  } catch (error) {
    logger.error(`woo_storefront_assert_failed ${error instanceof Error ? error.message : String(error)}`);
    return { exitCode: 2 };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooStorefrontAssertCli();
  process.exit(exitCode);
}
