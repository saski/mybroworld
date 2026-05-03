import test from 'node:test';
import assert from 'node:assert/strict';

import { runWooImageQualityAuditCli } from './woo-image-quality-audit.mjs';

test('runWooImageQualityAuditCli reports managed image quality risks without mutating WooCommerce', async () => {
  const errors = [];
  const logs = [];
  const result = await runWooImageQualityAuditCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--min-images', '2', '--min-width', '1200', '--min-height', '1200'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
    },
    fetchStoreProducts: async () => [
      {
        images: [
          {
            alt: 'First artwork',
            mime_type: 'image/jpeg',
            src: 'https://woocommerce.test/wp-content/uploads/2026/05/first.jpg',
            width: 1600,
            height: 1500,
          },
          {
            alt: 'First detail',
            src: 'https://woocommerce.test/wp-content/uploads/2026/05/first-detail.webp',
            width: 1400,
            height: 1400,
          },
        ],
        name: 'First',
        sku: 'LA-2026-001',
      },
      {
        images: [
          {
            alt: '',
            mime_type: 'image/gif',
            src: 'https://drive.google.com/file/d/abc/view',
            width: 600,
            height: 900,
          },
        ],
        name: 'Second',
        sku: 'LA-2026-002',
      },
      {
        images: [],
        name: 'Legacy product',
        sku: '',
      },
    ],
    logger: {
      error: (message) => errors.push(message),
      log: (message) => logs.push(message),
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized
LA-2026-001,First,available
LA-2026-002,Second,sold
LA-2026-003,Third,available
`,
  });

  assert.equal(result.exitCode, 1);
  assert.match(logs.join('\n'), /woo_image_quality_audit products=3 expected=3 risks=7/);
  assert.match(errors.join('\n'), /image_count_below_minimum LA-2026-002 Second count=1 minimum=2/);
  assert.match(errors.join('\n'), /image_too_small LA-2026-002 Second image=1 width=600 height=900 minimum=1200x1200/);
  assert.match(errors.join('\n'), /unsupported_image_type LA-2026-002 Second image=1 image\/gif/);
  assert.match(errors.join('\n'), /external_live_image_source LA-2026-002 Second image=1 https:\/\/drive\.google\.com\/file\/d\/abc\/view/);
  assert.match(errors.join('\n'), /missing_image_alt LA-2026-002 Second image=1/);
  assert.match(errors.join('\n'), /missing_managed_product LA-2026-003 Third/);
  assert.match(errors.join('\n'), /missing_managed_artwork_identity - Legacy product/);
});

test('runWooImageQualityAuditCli passes when managed products have enough WordPress-hosted images', async () => {
  const logs = [];
  const result = await runWooImageQualityAuditCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
    },
    fetchStoreProducts: async () => [
      {
        images: [
          {
            alt: 'First artwork',
            src: 'https://woocommerce.test/wp-content/uploads/2026/05/first.jpg',
          },
        ],
        name: 'First',
        sku: 'LA-2026-001',
      },
    ],
    logger: {
      error: () => {},
      log: (message) => logs.push(message),
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized
LA-2026-001,First,available
`,
  });

  assert.equal(result.exitCode, 0);
  assert.match(logs.join('\n'), /woo_image_quality_audit products=1 expected=1 risks=0/);
});
