import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyWooCommerceSyncPlan,
  fetchWooProducts,
  runWooCatalogSyncCli,
} from './woo-catalog-sync.mjs';

test('runWooCatalogSyncCli defaults to dry-run and does not apply product writes', async () => {
  const logs = [];
  let applyCalls = 0;

  const result = await runWooCatalogSyncCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'local'],
    env: {
      WOO_BASE_URL: 'http://woocommerce.test',
      WOO_CONSUMER_KEY: 'ck_test',
      WOO_CONSUMER_SECRET: 'cs_test',
    },
    fetchWooProducts: async () => [],
    logger: {
      error: () => {},
      log: (message) => logs.push(message),
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized,price_eur,image_main
LA-2026-001,Dry run work,available,260,https://drive.google.com/file/d/1dryrun/view
`,
    applySyncPlan: async () => {
      applyCalls += 1;
    },
  });

  assert.equal(result.exitCode, 0);
  assert.equal(applyCalls, 0);
  assert.match(logs.join('\n'), /woo_catalog_sync dry_run target=local/);
  assert.match(logs.join('\n'), /create=1/);
});

test('fetchWooProducts reads HTTPS WooCommerce products with pagination and Basic auth', async () => {
  const requests = [];
  const products = await fetchWooProducts({
    baseUrl: 'https://woocommerce.test/',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async (url, options) => {
      requests.push({ options, url });
      const page = new URL(url).searchParams.get('page');

      return {
        json: async () => page === '1' ? [{ id: 101, name: 'First' }] : [{ id: 102, name: 'Second' }],
        ok: true,
        status: 200,
        headers: {
          get: (name) => name.toLowerCase() === 'x-wp-totalpages' ? '2' : null,
        },
      };
    },
  });

  assert.deepEqual(products.map((product) => product.id), [101, 102]);
  assert.equal(
    requests[0].url,
    'https://woocommerce.test/wp-json/wc/v3/products?per_page=100&page=1',
  );
  assert.equal(requests[0].options.headers.Authorization, `Basic ${Buffer.from('ck_test:cs_test').toString('base64')}`);
  assert.equal(requests.length, 2);
});

test('fetchWooProducts signs plain HTTP WooCommerce requests with OAuth query parameters', async () => {
  const requests = [];
  await fetchWooProducts({
    baseUrl: 'http://localhost:8080',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async (url, options) => {
      requests.push({ options, url });
      return {
        json: async () => [],
        ok: true,
        status: 200,
        headers: {
          get: () => '1',
        },
      };
    },
    nonceFactory: () => 'fixednonce',
    timestampFactory: () => 1710000000,
  });

  const url = new URL(requests[0].url);

  assert.equal(url.searchParams.get('per_page'), '100');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('oauth_consumer_key'), 'ck_test');
  assert.equal(url.searchParams.get('oauth_nonce'), 'fixednonce');
  assert.equal(url.searchParams.get('oauth_signature_method'), 'HMAC-SHA256');
  assert.equal(url.searchParams.get('oauth_timestamp'), '1710000000');
  assert.ok(url.searchParams.get('oauth_signature'));
  assert.equal(requests[0].options.headers.Authorization, undefined);
});

test('runWooCatalogSyncCli writes optional JSON plan output', async () => {
  const writes = [];
  const result = await runWooCatalogSyncCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'local', '--json-output', '/tmp/plan.json'],
    env: {
      WOO_BASE_URL: 'http://woocommerce.test',
      WOO_CONSUMER_KEY: 'ck_test',
      WOO_CONSUMER_SECRET: 'cs_test',
    },
    fetchWooProducts: async () => [],
    logger: {
      error: () => {},
      log: () => {},
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized,price_eur,image_main
LA-2026-001,JSON work,available,260,https://drive.google.com/file/d/1json/view
`,
    writeTextFile: async (filePath, contents) => {
      writes.push({ contents, filePath });
    },
  });

  assert.equal(result.exitCode, 0);
  assert.equal(writes[0].filePath, '/tmp/plan.json');
  assert.equal(JSON.parse(writes[0].contents).actions[0].action, 'create');
});

test('runWooCatalogSyncCli refuses unsafe apply argument combinations before reading data', async () => {
  let readCalls = 0;
  const errors = [];
  const commonOptions = {
    env: {
      WOO_BASE_URL: 'http://woocommerce.test',
      WOO_CONSUMER_KEY: 'ck_test',
      WOO_CONSUMER_SECRET: 'cs_test',
    },
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
    readTextFile: async () => {
      readCalls += 1;
      return '';
    },
  };

  const missingTarget = await runWooCatalogSyncCli({
    ...commonOptions,
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--apply'],
  });
  const missingBackup = await runWooCatalogSyncCli({
    ...commonOptions,
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'production', '--apply'],
  });

  assert.equal(missingTarget.exitCode, 2);
  assert.equal(missingBackup.exitCode, 2);
  assert.equal(readCalls, 0);
  assert.match(errors.join('\n'), /Usage:/);
  assert.match(errors.join('\n'), /missing_backup_id_for_production_apply/);
});

test('runWooCatalogSyncCli requires WooCommerce target credentials before reading data', async () => {
  let readCalls = 0;
  const errors = [];

  const result = await runWooCatalogSyncCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'local'],
    env: {},
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
    readTextFile: async () => {
      readCalls += 1;
      return '';
    },
  });

  assert.equal(result.exitCode, 2);
  assert.equal(readCalls, 0);
  assert.match(errors.join('\n'), /missing_env=WOO_BASE_URL,WOO_CONSUMER_KEY,WOO_CONSUMER_SECRET/);
});

test('applyWooCommerceSyncPlan sends create, update, and image update payloads to WooCommerce', async () => {
  const requests = [];

  const results = await applyWooCommerceSyncPlan({
    baseUrl: 'https://woocommerce.test',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async (url, options) => {
      requests.push({
        body: JSON.parse(options.body),
        method: options.method,
        url,
      });
      return {
        json: async () => ({ id: requests.length }),
        ok: true,
        status: 200,
      };
    },
    plan: {
      actions: [
        {
          action: 'create',
          artworkId: 'LA-2026-001',
          payload: { name: 'Create me' },
        },
        {
          action: 'update',
          artworkId: 'LA-2026-002',
          payload: { name: 'Update me' },
          productId: 202,
        },
        {
          action: 'needs_image',
          artworkId: 'LA-2026-003',
          payload: { images: [{ src: 'https://example.test/image.jpg' }] },
          productId: 203,
        },
        {
          action: 'unchanged',
          artworkId: 'LA-2026-004',
          productId: 204,
        },
      ],
    },
  });

  assert.deepEqual(
    requests.map(({ method, url }) => ({ method, url })),
    [
      {
        method: 'POST',
        url: 'https://woocommerce.test/wp-json/wc/v3/products',
      },
      {
        method: 'PUT',
        url: 'https://woocommerce.test/wp-json/wc/v3/products/202',
      },
      {
        method: 'PUT',
        url: 'https://woocommerce.test/wp-json/wc/v3/products/203',
      },
    ],
  );
  assert.deepEqual(requests.map(({ body }) => body.name || body.images?.[0]?.src), [
    'Create me',
    'Update me',
    'https://example.test/image.jpg',
  ]);
  assert.deepEqual(results.map((result) => result.action), ['create', 'update', 'needs_image']);
});

test('applyWooCommerceSyncPlan hides unmanaged products only when explicitly requested', async () => {
  const requests = [];
  const plan = {
    actions: [
      {
        action: 'unexpected_unmanaged',
        product: { name: 'Bottle' },
        productId: 301,
      },
    ],
  };

  await applyWooCommerceSyncPlan({
    baseUrl: 'https://woocommerce.test',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async (url, options) => {
      requests.push({ body: JSON.parse(options.body), method: options.method, url });
      return {
        json: async () => ({ id: 301 }),
        ok: true,
        status: 200,
      };
    },
    hideUnmanaged: false,
    plan,
  });

  assert.equal(requests.length, 0);

  await applyWooCommerceSyncPlan({
    baseUrl: 'https://woocommerce.test',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async (url, options) => {
      requests.push({ body: JSON.parse(options.body), method: options.method, url });
      return {
        json: async () => ({ id: 301 }),
        ok: true,
        status: 200,
      };
    },
    hideUnmanaged: true,
    plan,
  });

  assert.deepEqual(requests, [
    {
      body: {
        catalog_visibility: 'hidden',
        status: 'draft',
      },
      method: 'PUT',
      url: 'https://woocommerce.test/wp-json/wc/v3/products/301',
    },
  ]);
});

test('runWooCatalogSyncCli refuses production unmanaged cleanup without explicit approval flag and backup', async () => {
  const errors = [];
  const result = await runWooCatalogSyncCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'production', '--apply', '--hide-unmanaged', '--backup-id', 'backup-1'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
      WOO_CONSUMER_KEY: 'ck_test',
      WOO_CONSUMER_SECRET: 'cs_test',
    },
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
    readTextFile: async () => '',
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /missing_allow_unmanaged_cleanup/);
});

test('runWooCatalogSyncCli includes production backup id in operator output when provided', async () => {
  const logs = [];

  const result = await runWooCatalogSyncCli({
    argv: ['--sheet-csv', '/tmp/catalog.csv', '--target', 'production', '--backup-id', 'backup-20260501'],
    env: {
      WOO_BASE_URL: 'https://woocommerce.test',
      WOO_CONSUMER_KEY: 'ck_test',
      WOO_CONSUMER_SECRET: 'cs_test',
    },
    fetchWooProducts: async () => [],
    logger: {
      error: () => {},
      log: (message) => logs.push(message),
    },
    readTextFile: async () => `artwork_id,title_clean,status_normalized,price_eur,image_main
LA-2026-001,Production dry run,available,260,https://drive.google.com/file/d/1proddryrun/view
`,
  });

  assert.equal(result.exitCode, 0);
  assert.match(logs.join('\n'), /target=production/);
  assert.match(logs.join('\n'), /backup_id=backup-20260501/);
});
