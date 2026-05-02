import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWooCommerceSyncPlan } from '../src/woocommerce-sync-plan.mjs';

test('WooCommerceSyncPlan matches an existing managed product by SKU and Lucia artwork meta', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,price_eur,dimensions_clean,medium_clean,support_clean,image_main
LA-2026-001,Canonical title,available,260,23 x 16 cm,Acrílico,cartón,https://drive.google.com/file/d/1canonical/view
`,
    wooProducts: [
      {
        catalog_visibility: 'visible',
        id: 101,
        images: [{ id: 501, src: 'https://example.test/existing.jpg' }],
        manage_stock: false,
        meta_data: [{ key: '_lucia_artwork_id', value: 'LA-2026-001' }],
        name: 'Old title',
        regular_price: '260',
        sku: 'LA-2026-001',
        status: 'publish',
        stock_status: 'instock',
        type: 'simple',
      },
    ],
  });

  assert.deepEqual(plan.actions.map(({ action, artworkId, productId }) => ({ action, artworkId, productId })), [
    {
      action: 'update',
      artworkId: 'LA-2026-001',
      productId: 101,
    },
  ]);
});

test('WooCommerceSyncPlan classifies create, unchanged, needs_image, and unexpected unmanaged products', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,price_eur,dimensions_clean,medium_clean,support_clean,image_main
LA-2026-001,Exact work,available,260,23 x 16 cm,Acrílico,cartón,https://drive.google.com/file/d/1exact/view
LA-2026-002,Sold work,sold,320,20 x 20 cm,Collage,lienzo,https://drive.google.com/file/d/1sold/view
LA-2026-003,Archived work,archived,480,33 x 24 cm,Tinta,papel,https://drive.google.com/file/d/1archived/view
`,
    wooProducts: [
      {
        catalog_visibility: 'visible',
        id: 101,
        images: [{ id: 501, src: 'https://example.test/exact.jpg' }],
        manage_stock: false,
        meta_data: [
          { key: '_lucia_artwork_id', value: 'LA-2026-001' },
          { key: '_lucia_artwork_status', value: 'available' },
          { key: '_lucia_image_file_id', value: '1exact' },
        ],
        name: 'Exact work',
        regular_price: '260',
        sku: 'LA-2026-001',
        status: 'publish',
        stock_status: 'instock',
        type: 'simple',
      },
      {
        catalog_visibility: 'visible',
        id: 102,
        images: [],
        manage_stock: false,
        meta_data: [{ key: '_lucia_artwork_id', value: 'LA-2026-002' }],
        name: 'Sold work',
        regular_price: '',
        sku: 'LA-2026-002',
        status: 'publish',
        stock_status: 'outofstock',
        type: 'simple',
      },
      {
        id: 201,
        images: [],
        name: 'Bottle',
        sku: '',
        status: 'publish',
      },
    ],
  });

  assert.deepEqual(plan.actions.map(({ action, artworkId, productId }) => ({ action, artworkId, productId })), [
    {
      action: 'unchanged',
      artworkId: 'LA-2026-001',
      productId: 101,
    },
    {
      action: 'needs_image',
      artworkId: 'LA-2026-002',
      productId: 102,
    },
    {
      action: 'create',
      artworkId: 'LA-2026-003',
      productId: undefined,
    },
    {
      action: 'unexpected_unmanaged',
      artworkId: undefined,
      productId: 201,
    },
  ]);
});

test('WooCommerceSyncPlan reports invalid source rows before planning product writes', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,image_main
,Missing id,available,https://drive.google.com/file/d/1missingid/view
LA-2026-002,,available,https://drive.google.com/file/d/1missingtitle/view
LA-2026-003,Unknown status,mystery,https://drive.google.com/file/d/1unknownstatus/view
LA-2026-004,Missing image,available,
`,
    wooProducts: [],
  });

  assert.deepEqual(plan.actions.map(({ action, artworkId, errors }) => ({ action, artworkId, errors })), [
    {
      action: 'invalid_source',
      artworkId: '',
      errors: ['missing_artwork_id'],
    },
    {
      action: 'invalid_source',
      artworkId: 'LA-2026-002',
      errors: ['missing_title_clean'],
    },
    {
      action: 'invalid_source',
      artworkId: 'LA-2026-003',
      errors: ['unknown_status_normalized'],
    },
    {
      action: 'invalid_source',
      artworkId: 'LA-2026-004',
      errors: ['missing_image_main'],
    },
  ]);
  assert.equal(plan.validationErrors.length, 4);
});

test('WooCommerceSyncPlan includes normalized Drive image source and file metadata in product payloads', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,price_eur,image_main
LA-2026-001,Image work,available,260,https://drive.google.com/file/d/1abc_DEF-234/view?usp=drive_link
`,
    wooProducts: [],
  });

  assert.deepEqual(plan.actions[0].payload.images, [
    {
      alt: 'Image work',
      name: 'Image work',
      src: 'https://lh3.googleusercontent.com/d/1abc_DEF-234',
    },
  ]);
  assert.deepEqual(
    plan.actions[0].payload.meta_data.find((item) => item.key === '_lucia_image_file_id'),
    {
      key: '_lucia_image_file_id',
      value: '1abc_DEF-234',
    },
  );
});

test('WooCommerceSyncPlan rejects image URLs without a stable Drive file id', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,image_main
LA-2026-009,External image,available,https://example.test/not-drive.jpg
`,
    wooProducts: [],
  });

  assert.deepEqual(plan.actions.map(({ action, artworkId, errors }) => ({ action, artworkId, errors })), [
    {
      action: 'invalid_source',
      artworkId: 'LA-2026-009',
      errors: ['invalid_image_main'],
    },
  ]);
});

test('WooCommerceSyncPlan preserves existing image ids when the source image file id has not changed', () => {
  const plan = buildWooCommerceSyncPlan({
    sheetCsvText: `artwork_id,title_clean,status_normalized,price_eur,image_main
LA-2026-001,Updated image work,available,260,https://drive.google.com/file/d/1sameimage/view
`,
    wooProducts: [
      {
        catalog_visibility: 'visible',
        id: 101,
        images: [{ id: 501, src: 'https://example.test/existing.jpg' }],
        manage_stock: false,
        meta_data: [
          { key: '_lucia_artwork_id', value: 'LA-2026-001' },
          { key: '_lucia_image_file_id', value: '1sameimage' },
        ],
        name: 'Old image work',
        regular_price: '260',
        sku: 'LA-2026-001',
        status: 'publish',
        stock_status: 'instock',
        type: 'simple',
      },
    ],
  });

  assert.equal(plan.actions[0].action, 'update');
  assert.deepEqual(plan.actions[0].payload.images, [{ id: 501 }]);
});
