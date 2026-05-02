#!/usr/bin/env node

import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { buildWooCommerceSyncPlan } from '../catalog-generator/src/woocommerce-sync-plan.mjs';

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
  logger.error('Usage: scripts/woo-catalog-sync.mjs --sheet-csv PATH --target local|production [--apply] [--backup-id ID] [--json-output PATH]');
}

function summarizeActions(actions) {
  return actions.reduce((summary, action) => {
    summary[action.action] = (summary[action.action] || 0) + 1;
    return summary;
  }, {
    create: 0,
    invalid_source: 0,
    needs_image: 0,
    unchanged: 0,
    unexpected_unmanaged: 0,
    update: 0,
  });
}

function requireTarget(target) {
  return ['local', 'production'].includes(target);
}

function requireWooEnv(env) {
  const missing = ['WOO_BASE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
    .filter((key) => !String(env[key] || '').trim());

  return missing;
}

function logPlan({ apply, backupId = '', plan, target }, logger) {
  const summary = summarizeActions(plan.actions);
  const mode = apply ? 'apply' : 'dry_run';
  const backupSuffix = backupId ? ` backup_id=${backupId}` : '';

  logger.log(
    `woo_catalog_sync ${mode} target=${target}${backupSuffix} create=${summary.create} update=${summary.update} needs_image=${summary.needs_image} unchanged=${summary.unchanged} invalid_source=${summary.invalid_source} unexpected_unmanaged=${summary.unexpected_unmanaged}`,
  );
}

export async function fetchWooProducts({
  baseUrl,
  consumerKey,
  consumerSecret,
  fetchImpl = fetch,
  nonceFactory = () => crypto.randomBytes(16).toString('hex'),
  perPage = 100,
  timestampFactory = () => Math.floor(Date.now() / 1000),
}) {
  const products = [];
  const authToken = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  let page = 1;
  let totalPages = 1;

  do {
    const url = new URL('/wp-json/wc/v3/products', String(baseUrl).replace(/\/+$/u, ''));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    const requestUrl = url.protocol === 'https:'
      ? url.toString()
      : signWooCommerceHttpUrl({
        consumerKey,
        consumerSecret,
        nonce: nonceFactory(),
        timestamp: timestampFactory(),
        url,
      });

    const response = await fetchImpl(requestUrl, {
      headers: url.protocol === 'https:' ? {
        Authorization: `Basic ${authToken}`,
        Accept: 'application/json',
      } : {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce products request failed: HTTP ${response.status}`);
    }

    const pageProducts = await response.json();
    if (!Array.isArray(pageProducts)) {
      throw new Error('WooCommerce products response was not an array.');
    }

    products.push(...pageProducts);
    totalPages = Number(response.headers?.get?.('x-wp-totalpages') || totalPages);
    page += 1;
  } while (page <= totalPages);

  return products;
}

async function fetchWooJson({
  baseUrl,
  body,
  consumerKey,
  consumerSecret,
  fetchImpl = fetch,
  method = 'GET',
  nonceFactory = () => crypto.randomBytes(16).toString('hex'),
  path,
  timestampFactory = () => Math.floor(Date.now() / 1000),
}) {
  const base = String(baseUrl).replace(/\/+$/u, '');
  const url = new URL(path, base);
  const authToken = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const requestUrl = url.protocol === 'https:'
    ? url.toString()
    : signWooCommerceHttpUrl({
      consumerKey,
      consumerSecret,
      method,
      nonce: nonceFactory(),
      timestamp: timestampFactory(),
      url,
    });
  const response = await fetchImpl(requestUrl, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(url.protocol === 'https:' ? { Authorization: `Basic ${authToken}` } : {}),
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    method,
  });

  if (!response.ok) {
    const responseBody = typeof response.text === 'function' ? await response.text() : '';
    const bodyMessage = responseBody ? ` body=${responseBody}` : '';
    throw new Error(`WooCommerce request failed: ${method} ${path} HTTP ${response.status}${bodyMessage}`);
  }

  return response.json();
}

export async function applyWooCommerceSyncPlan({
  baseUrl,
  consumerKey,
  consumerSecret,
  fetchImpl = fetch,
  hideUnmanaged = false,
  plan,
}) {
  const results = [];

  for (const action of plan.actions) {
    if (action.action === 'unexpected_unmanaged' && hideUnmanaged) {
      const product = await fetchWooJson({
        baseUrl,
        body: {
          catalog_visibility: 'hidden',
          status: 'draft',
        },
        consumerKey,
        consumerSecret,
        fetchImpl,
        method: 'PUT',
        path: `/wp-json/wc/v3/products/${action.productId}`,
      });

      results.push({
        action: action.action,
        product,
        productId: product.id ?? action.productId,
      });
      continue;
    }

    if (!['create', 'update', 'needs_image'].includes(action.action)) {
      continue;
    }

    const method = action.action === 'create' ? 'POST' : 'PUT';
    const path = action.action === 'create'
      ? '/wp-json/wc/v3/products'
      : `/wp-json/wc/v3/products/${action.productId}`;
    const product = await fetchWooJson({
      baseUrl,
      body: action.payload,
      consumerKey,
      consumerSecret,
      fetchImpl,
      method,
      path,
    });

    results.push({
      action: action.action,
      artworkId: action.artworkId,
      product,
      productId: product.id ?? action.productId,
    });
  }

  return results;
}

function oauthEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/[!'()*]/gu, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function signWooCommerceHttpUrl({
  consumerKey,
  consumerSecret,
  method = 'GET',
  nonce,
  timestamp,
  url,
}) {
  const signedUrl = new URL(url.toString());
  const params = Object.fromEntries(signedUrl.searchParams.entries());

  params.oauth_consumer_key = consumerKey;
  params.oauth_nonce = nonce;
  params.oauth_signature_method = 'HMAC-SHA256';
  params.oauth_timestamp = String(timestamp);

  const baseUrl = `${signedUrl.origin}${signedUrl.pathname}`;
  const parameterString = Object.keys(params)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${oauthEncode(key)}=${oauthEncode(params[key])}`)
    .join('&');
  const signatureBase = [
    method.toUpperCase(),
    oauthEncode(baseUrl),
    oauthEncode(parameterString),
  ].join('&');
  const signingKey = `${consumerSecret}&`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBase)
    .digest('base64');

  signedUrl.searchParams.set('oauth_consumer_key', params.oauth_consumer_key);
  signedUrl.searchParams.set('oauth_nonce', params.oauth_nonce);
  signedUrl.searchParams.set('oauth_signature_method', params.oauth_signature_method);
  signedUrl.searchParams.set('oauth_timestamp', params.oauth_timestamp);
  signedUrl.searchParams.set('oauth_signature', signature);

  return signedUrl.toString();
}

export async function runWooCatalogSyncCli({
  argv = process.argv.slice(2),
  env = process.env,
  logger = console,
  readTextFile = (filePath) => fs.readFile(filePath, 'utf8'),
  writeTextFile = (filePath, contents) => fs.writeFile(filePath, contents, 'utf8'),
  fetchWooProducts: fetchProducts = fetchWooProducts,
  applySyncPlan = applyWooCommerceSyncPlan,
} = {}) {
  const args = parseArgs(argv);
  const target = args.target;
  const apply = args.apply === 'true';
  const hideUnmanaged = args['hide-unmanaged'] === 'true';

  if (!args['sheet-csv'] || !requireTarget(target)) {
    printUsage(logger);
    return { exitCode: 2 };
  }

  if (apply && target === 'production' && !args['backup-id']) {
    logger.error('woo_catalog_sync_refused missing_backup_id_for_production_apply');
    return { exitCode: 2 };
  }

  if (target === 'production' && hideUnmanaged && (!args['backup-id'] || args['allow-unmanaged-cleanup'] !== 'true')) {
    logger.error('woo_catalog_sync_refused missing_allow_unmanaged_cleanup');
    return { exitCode: 2 };
  }

  const missingEnv = requireWooEnv(env);
  if (missingEnv.length > 0) {
    logger.error(`woo_catalog_sync_refused missing_env=${missingEnv.join(',')}`);
    return { exitCode: 2 };
  }

  try {
    const sheetCsvText = await readTextFile(args['sheet-csv']);
    const wooProducts = await fetchProducts({
      baseUrl: env.WOO_BASE_URL,
      consumerKey: env.WOO_CONSUMER_KEY,
      consumerSecret: env.WOO_CONSUMER_SECRET,
    });
    const plan = buildWooCommerceSyncPlan({ sheetCsvText, wooProducts });

    if (args['json-output']) {
      await writeTextFile(args['json-output'], `${JSON.stringify(plan, null, 2)}\n`);
    }

    logPlan({
      apply,
      backupId: args['backup-id'] || '',
      plan,
      target,
    }, logger);

    if (apply) {
      await applySyncPlan({
        backupId: args['backup-id'] || '',
        baseUrl: env.WOO_BASE_URL,
        consumerKey: env.WOO_CONSUMER_KEY,
        consumerSecret: env.WOO_CONSUMER_SECRET,
        hideUnmanaged,
        plan,
        target,
      });
    }

    return {
      exitCode: plan.validationErrors.length > 0 ? 1 : 0,
      plan,
    };
  } catch (error) {
    logger.error(`woo_catalog_sync_failed ${error instanceof Error ? error.message : String(error)}`);
    return { exitCode: 2 };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooCatalogSyncCli();
  process.exit(exitCode);
}
