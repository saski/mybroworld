import test from 'node:test';
import assert from 'node:assert/strict';

import { runWooStorefrontAssertCli } from './woo-storefront-assert.mjs';

test('runWooStorefrontAssertCli passes when managed Store API products have images', async () => {
  const logs = [];
  const result = await runWooStorefrontAssertCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--require-managed-products', '--require-images'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
    },
    fetchStoreProducts: async () => [
      {
        images: [{ src: 'https://example.test/image-1.jpg' }],
        name: 'First',
        sku: 'LA-2026-001',
      },
      {
        images: [{ src: 'https://example.test/image-2.jpg' }],
        name: 'Second',
        sku: 'LA-2026-002',
      },
    ],
    logger: {
      error: () => {},
      log: (message) => logs.push(message),
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized
LA-2026-001,First,available
LA-2026-002,Second,sold
`,
  });

  assert.equal(result.exitCode, 0);
  assert.match(logs.join('\n'), /woo_storefront_assert products=2 expected=2 missing=0 missing_images=0/);
});

test('runWooStorefrontAssertCli fails when managed Store API products or images are missing', async () => {
  const errors = [];
  const result = await runWooStorefrontAssertCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--require-managed-products', '--require-images'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
    },
    fetchStoreProducts: async () => [
      {
        images: [],
        name: 'First',
        sku: 'LA-2026-001',
      },
    ],
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized
LA-2026-001,First,available
LA-2026-002,Second,sold
`,
  });

  assert.equal(result.exitCode, 1);
  assert.match(errors.join('\n'), /missing_managed_product LA-2026-002 Second/);
  assert.match(errors.join('\n'), /missing_product_image LA-2026-001 First/);
});

test('runWooStorefrontAssertCli fails when unmanaged products are forbidden and still visible', async () => {
  const errors = [];
  const result = await runWooStorefrontAssertCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--require-managed-products', '--forbid-unmanaged-products'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
    },
    fetchStoreProducts: async () => [
      {
        images: [{ src: 'https://example.test/image-1.jpg' }],
        name: 'First',
        sku: 'LA-2026-001',
      },
      {
        images: [],
        name: 'Bottle',
        sku: '',
      },
    ],
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized
LA-2026-001,First,available
`,
  });

  assert.equal(result.exitCode, 1);
  assert.match(errors.join('\n'), /unexpected_store_product - Bottle/);
});
