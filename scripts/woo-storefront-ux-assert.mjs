#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const DEFAULT_PATHS = ['/shop/'];
const ERROR_PATTERNS = [
  /Fatal error/i,
  /Parse error/i,
  /Uncaught\s+(Error|Exception)/i,
  /There has been a critical error/i,
  /Error establishing a database connection/i,
];
const DEPENDENCY_MARKERS = [
  ['elementor', /\belementor[-_\w]*/iu],
  ['revslider', /\b(revslider|rev_slider|rs-module|tp-revslider)\b/iu],
  ['js_composer', /\b(js_composer|wpb_[\w-]+|vc_[\w-]+)\b/iu],
  ['visual-portfolio', /\bvisual-portfolio\b/iu],
  ['acf_pro', /\bacf[-_ ]?pro\b/iu],
  ['glacier', /\bglacier\b/iu],
];

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
  logger.error('Usage: scripts/woo-storefront-ux-assert.mjs [--paths /shop/,/product/example/] [--forbid-dependency-markers]');
}

export function parsePaths(value) {
  if (!value) {
    return DEFAULT_PATHS;
  }

  const paths = value
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean);

  return paths.length > 0 ? paths : DEFAULT_PATHS;
}

export function buildUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function countMatches(html, pattern) {
  return Array.from(html.matchAll(pattern)).length;
}

function countProductActions(html) {
  const explicitActions = countMatches(
    html,
    /<(?:a|button)\b[^>]*(?:add_to_cart_button|ajax_add_to_cart|single_add_to_cart_button|product_type_\w+|wp-block-button__link|[?&]add-to-cart=)[^>]*>/giu,
  );

  if (explicitActions > 0) {
    return explicitActions;
  }

  return countMatches(html, />\s*(add to cart|añadir al carrito|comprar|buy|enquire|inquire|consultar)\s*</giu);
}

function detectDependencyMarkers(html) {
  return DEPENDENCY_MARKERS
    .filter(([, pattern]) => pattern.test(html))
    .map(([marker]) => marker);
}

function findErrorPattern(html) {
  return ERROR_PATTERNS.find((pattern) => pattern.test(html));
}

function buildMetrics(html) {
  return {
    actions: countProductActions(html),
    cards: countMatches(html, /<(?:li|article)\b[^>]*class=["'][^"']*\b(product|type-product|wc-block-grid__product)\b[^"']*["']/giu),
    images: countMatches(html, /<img\b[^>]*>/giu),
    prices: countMatches(html, /\b(price|woocommerce-Price-amount)\b/giu),
    titles: countMatches(html, /\b(woocommerce-loop-product__title|wc-block-grid__product-title|woo_product-title|product_title)\b|<h1\b[^>]*>|<h2\b[^>]*>/giu),
  };
}

function isProductDetail(html) {
  return /\b(single-product|product_title|woocommerce-product-gallery|single_add_to_cart_button|summary entry-summary)\b/iu.test(html);
}

function isProductGrid(html) {
  return /\b(products|wc-block-grid__products|type-product)\b/iu.test(html);
}

export function analyzeStorefrontHtml({ forbidDependencyMarkers = false, html, path }) {
  const dependencyMarkers = detectDependencyMarkers(html);
  const failures = [];
  const matchedError = findErrorPattern(html);
  const metrics = buildMetrics(html);
  const hasProductDetail = isProductDetail(html);
  const hasProductGrid = isProductGrid(html);

  if (matchedError) {
    failures.push(`critical_error ${path} ${matchedError}`);
  }

  if (!hasProductGrid && !hasProductDetail) {
    failures.push(`missing_product_grid ${path}`);
  }

  if (hasProductGrid && !hasProductDetail && metrics.cards === 0) {
    failures.push(`missing_product_cards ${path}`);
  }

  if (metrics.images === 0) {
    failures.push(`missing_product_images ${path}`);
  }

  if (metrics.titles === 0) {
    failures.push(`missing_product_titles ${path}`);
  }

  if (metrics.actions === 0) {
    failures.push(`missing_product_actions ${path}`);
  }

  if (forbidDependencyMarkers) {
    for (const marker of dependencyMarkers) {
      failures.push(`dependency_marker ${path} ${marker}`);
    }
  }

  return {
    dependencyMarkers,
    failures,
    metrics,
  };
}

async function defaultFetchPage(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'text/html',
    },
    redirect: 'follow',
  });
  const html = await response.text();

  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}`);
  }

  return html;
}

function logReport({ dependencyMarkers, metrics, path }, logger) {
  logger.log(
    `woo_storefront_ux_assert path=${path} cards=${metrics.cards} images=${metrics.images} titles=${metrics.titles} prices=${metrics.prices} actions=${metrics.actions} dependencies=${dependencyMarkers.length > 0 ? dependencyMarkers.join(',') : 'none'}`,
  );
}

export async function runWooStorefrontUxAssertCli({
  argv = process.argv.slice(2),
  env = process.env,
  fetchPage = defaultFetchPage,
  logger = console,
} = {}) {
  const args = parseArgs(argv);
  const baseUrl = args['base-url'] || env.WP_BASE_URL || env.WORDPRESS_BASE_URL;

  if (args.help === 'true') {
    printUsage(logger);
    return { exitCode: 0 };
  }

  if (!String(baseUrl || '').trim()) {
    logger.error('woo_storefront_ux_assert_refused missing_env=WP_BASE_URL');
    return { exitCode: 2 };
  }

  const paths = parsePaths(args.paths || env.WP_UX_PATHS);
  const forbidDependencyMarkers = args['forbid-dependency-markers'] === 'true';
  const reports = [];
  const failures = [];

  for (const path of paths) {
    try {
      const html = await fetchPage(buildUrl(baseUrl, path));
      const report = analyzeStorefrontHtml({
        forbidDependencyMarkers,
        html,
        path,
      });

      reports.push({
        path,
        ...report,
      });
      logReport({ path, ...report }, logger);
      failures.push(...report.failures);
    } catch (error) {
      failures.push(`request_failed ${path} ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      logger.error(failure);
    }
    return { exitCode: 1, failures, reports };
  }

  return { exitCode: 0, failures, reports };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooStorefrontUxAssertCli();
  process.exit(exitCode);
}
