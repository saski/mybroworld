#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

export const DEFAULT_PATHS = ['/', '/shop/', '/cart/', '/checkout/'];
const ERROR_PATTERNS = [
  /Fatal error/i,
  /Parse error/i,
  /Uncaught\s+(Error|Exception)/i,
  /There has been a critical error/i,
  /Error establishing a database connection/i,
];

export function parseSmokePaths(value) {
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

export function parseBooleanFlag(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

async function fetchFirstProductPermalink(baseUrl, fetchImpl) {
  const response = await fetchImpl(buildUrl(baseUrl, '/wp-json/wc/store/v1/products?per_page=1'), {
    redirect: 'follow',
  });

  if (response.status >= 400) {
    return undefined;
  }

  let products;

  try {
    products = await response.json();
  } catch {
    return fetchFirstProductPermalinkFromShop(baseUrl, fetchImpl);
  }

  const permalink = Array.isArray(products) ? products[0]?.permalink : undefined;

  return typeof permalink === 'string' && permalink.trim() ? buildUrl(baseUrl, permalink) : undefined;
}

function findFirstProductPermalinkInHtml(baseUrl, html) {
  const hrefPattern = /href=(["'])(.*?)\1/gi;
  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[2];
    const url = new URL(href, baseUrl);

    if (url.pathname.includes('/product/') || url.pathname.includes('/producto/')) {
      return url.toString();
    }
  }

  return undefined;
}

async function fetchFirstProductPermalinkFromShop(baseUrl, fetchImpl) {
  const response = await fetchImpl(buildUrl(baseUrl, '/shop/'), {
    redirect: 'follow',
  });

  if (response.status >= 400) {
    return undefined;
  }

  return findFirstProductPermalinkInHtml(baseUrl, await response.text());
}

export async function resolveSmokeUrls({
  baseUrl,
  fetchImpl = fetch,
  includeFirstProduct = false,
  requireFirstProduct = false,
  smokePathsValue,
}) {
  const urls = parseSmokePaths(smokePathsValue).map((path) => buildUrl(baseUrl, path));

  if (!includeFirstProduct && !requireFirstProduct) {
    return urls;
  }

  const productUrl = await fetchFirstProductPermalink(baseUrl, fetchImpl);

  if (productUrl) {
    return [...urls, productUrl];
  }

  if (requireFirstProduct) {
    throw new Error('No published product permalink was found through the WooCommerce Store API or shop page.');
  }

  console.warn('skip product detail smoke: no published product permalink found');
  return urls;
}

async function fetchPage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
  });
  const body = await response.text();

  return {
    body,
    status: response.status,
    url,
  };
}

export function findErrorPattern(body) {
  return ERROR_PATTERNS.find((pattern) => pattern.test(body));
}

export async function run() {
  const baseUrl = process.env.WP_BASE_URL || process.env.WORDPRESS_BASE_URL || 'http://localhost:8080';
  const includeFirstProduct = parseBooleanFlag(process.env.WP_SMOKE_INCLUDE_FIRST_PRODUCT);
  const requireFirstProduct = parseBooleanFlag(process.env.WP_REQUIRE_PRODUCT_SMOKE);
  let urls;
  const failures = [];

  try {
    urls = await resolveSmokeUrls({
      baseUrl,
      includeFirstProduct,
      requireFirstProduct,
      smokePathsValue: process.env.WP_SMOKE_PATHS,
    });
  } catch (error) {
    console.error(`failed smoke product discovery ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  for (const url of urls) {
    try {
      const result = await fetchPage(url);
      const matchedError = findErrorPattern(result.body);

      if (result.status >= 400 || matchedError) {
        failures.push({
          reason: matchedError ? `matched ${matchedError}` : `HTTP ${result.status}`,
          status: result.status,
          url,
        });
        continue;
      }

      console.log(`ok smoke ${result.status} ${url}`);
    } catch (error) {
      failures.push({
        reason: error instanceof Error ? error.message : String(error),
        status: 'request_failed',
        url,
      });
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`failed smoke ${failure.status} ${failure.url} ${failure.reason}`);
    }
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
