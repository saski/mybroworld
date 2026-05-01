import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUrl,
  findErrorPattern,
  parseSmokePaths,
  resolveSmokeUrls,
} from './wp-smoke-test.mjs';

test('parseSmokePaths uses default commerce paths and trims overrides', () => {
  assert.deepEqual(parseSmokePaths(''), ['/', '/shop/', '/cart/', '/checkout/']);
  assert.deepEqual(parseSmokePaths(' , , '), ['/', '/shop/', '/cart/', '/checkout/']);
  assert.deepEqual(parseSmokePaths(' /, /shop/ ,, /checkout/ '), ['/', '/shop/', '/checkout/']);
});

test('buildUrl resolves smoke paths relative to the configured base URL', () => {
  assert.equal(buildUrl('https://example.test/store', '/cart/'), 'https://example.test/cart/');
  assert.equal(buildUrl('https://example.test/store/', 'checkout/'), 'https://example.test/store/checkout/');
});

test('findErrorPattern detects WordPress critical page failures', () => {
  assert.match(String(findErrorPattern('There has been a critical error on this website.')), /critical error/i);
  assert.equal(findErrorPattern('<main>Healthy storefront</main>'), undefined);
});

test('resolveSmokeUrls appends the first published product permalink when requested', async () => {
  const urls = await resolveSmokeUrls({
    baseUrl: 'https://example.test',
    fetchImpl: async () => ({
      json: async () => [{ permalink: 'https://example.test/product/available-print/' }],
      status: 200,
    }),
    includeFirstProduct: true,
    smokePathsValue: '/',
  });

  assert.deepEqual(urls, [
    'https://example.test/',
    'https://example.test/product/available-print/',
  ]);
});

test('resolveSmokeUrls falls back to the first shop product link when Store API JSON is polluted', async () => {
  const urls = await resolveSmokeUrls({
    baseUrl: 'https://example.test',
    fetchImpl: async (url) => {
      if (url.includes('/wp-json/wc/store/v1/products')) {
        return {
          json: async () => {
            throw new SyntaxError('Unexpected token Notice');
          },
          status: 200,
        };
      }

      return {
        status: 200,
        text: async () => '<a href="https://example.test/product/shop-print/">Shop print</a>',
      };
    },
    includeFirstProduct: true,
    smokePathsValue: '/',
  });

  assert.deepEqual(urls, [
    'https://example.test/',
    'https://example.test/product/shop-print/',
  ]);
});
