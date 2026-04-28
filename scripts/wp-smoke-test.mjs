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

  return value
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean);
}

export function buildUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
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
  const paths = parseSmokePaths(process.env.WP_SMOKE_PATHS);
  const failures = [];

  for (const path of paths) {
    const url = buildUrl(baseUrl, path);

    try {
      const result = await fetchPage(url);
      const matchedError = findErrorPattern(result.body);

      if (result.status >= 400 || matchedError) {
        failures.push({
          path,
          reason: matchedError ? `matched ${matchedError}` : `HTTP ${result.status}`,
          status: result.status,
          url,
        });
        continue;
      }

      console.log(`ok smoke ${result.status} ${url}`);
    } catch (error) {
      failures.push({
        path,
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
