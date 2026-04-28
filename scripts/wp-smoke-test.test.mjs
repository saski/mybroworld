import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUrl,
  findErrorPattern,
  parseSmokePaths,
} from './wp-smoke-test.mjs';

test('parseSmokePaths uses default commerce paths and trims overrides', () => {
  assert.deepEqual(parseSmokePaths(''), ['/', '/shop/', '/cart/', '/checkout/']);
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
