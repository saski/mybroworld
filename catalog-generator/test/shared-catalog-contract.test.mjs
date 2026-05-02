import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CATALOG_HELPER_SHEET_TITLES,
  CATALOG_JOB_HEADERS,
  CATALOG_PROFILE_HEADERS,
  CATALOG_REQUIRED_HEADERS,
  CATALOG_REVIEW_STATUS_VALUES,
  CATALOG_STATUS_ALIASES,
  CATALOG_STATUS_LABELS,
} from '../src/shared-catalog-contract.mjs';

const generatorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(generatorRoot, '..');

function extractJavaScriptStringArray(source, constantName) {
  const match = source.match(new RegExp(`const ${constantName} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `Expected Apps Script constant ${constantName} to exist.`);

  return [...match[1].matchAll(/'([^']*)'/g)].map(([, value]) => value);
}

function extractPhpReviewStatuses(source) {
  const match = source.match(/in_array\(\$reviewStatus,\s*\[([\s\S]*?)\],\s*true\)/);
  assert.ok(match, 'Expected WordPress review status allowlist to exist.');

  return [...match[1].matchAll(/'([^']*)'/g)].map(([, value]) => value);
}

function extractPhpStatusAliases(source) {
  const match = source.match(/function lucia_normalize_artwork_status[\s\S]*?return match \(\$normalized\) \{([\s\S]*?)default => ''/);
  assert.ok(match, 'Expected WordPress status normalization match expression to exist.');

  return [...match[1].matchAll(/([^\n]+?)=>\s*'([^']+)',/g)]
    .reduce((aliasesByStatus, [, rawAliases, status]) => {
      aliasesByStatus[status] = [...rawAliases.matchAll(/'([^']+)'/g)].map(([, alias]) => alias);
      return aliasesByStatus;
    }, {});
}

function extractPhpStatusLabels(source) {
  const match = source.match(/function lucia_artwork_status_label[\s\S]*?return match \(lucia_normalize_artwork_status\(\$status\)\) \{([\s\S]*?)default => ''/);
  assert.ok(match, 'Expected WordPress status label match expression to exist.');

  return [...match[1].matchAll(/([^\n]+?)=>\s*'([^']+)',/g)]
    .reduce((labelsByStatus, [, rawStatuses, label]) => {
      for (const [, status] of rawStatuses.matchAll(/'([^']+)'/g)) {
        labelsByStatus[status] = label;
      }
      return labelsByStatus;
    }, {});
}

test('shared catalog contract matches the Apps Script queue schema copy', async () => {
  const appsScriptSource = await fs.readFile(path.join(generatorRoot, 'apps-script', 'Code.gs'), 'utf8');

  assert.deepEqual(extractJavaScriptStringArray(appsScriptSource, 'CATALOG_REQUIRED_HEADERS'), CATALOG_REQUIRED_HEADERS);
  assert.deepEqual(extractJavaScriptStringArray(appsScriptSource, 'CATALOG_HELPER_TITLES'), CATALOG_HELPER_SHEET_TITLES);
  assert.deepEqual(extractJavaScriptStringArray(appsScriptSource, 'CATALOG_PROFILE_HEADERS'), CATALOG_PROFILE_HEADERS);
  assert.deepEqual(extractJavaScriptStringArray(appsScriptSource, 'CATALOG_JOB_HEADERS'), CATALOG_JOB_HEADERS);
  assert.deepEqual(extractJavaScriptStringArray(appsScriptSource, 'CATALOG_REVIEW_STATUSES'), CATALOG_REVIEW_STATUS_VALUES);
});

test('shared catalog contract matches the WordPress status and review copies', async () => {
  const [catalogConsoleSource, artworkRulesSource] = await Promise.all([
    fs.readFile(path.join(repoRoot, 'wordpress', 'wp-content', 'mu-plugins', 'lucia-catalog-console.php'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'wordpress', 'wp-content', 'mu-plugins', 'lucia-artwork-rules.php'), 'utf8'),
  ]);

  assert.deepEqual(extractPhpReviewStatuses(catalogConsoleSource), CATALOG_REVIEW_STATUS_VALUES);
  assert.deepEqual(extractPhpStatusAliases(artworkRulesSource), CATALOG_STATUS_ALIASES);
  assert.deepEqual(extractPhpStatusLabels(artworkRulesSource), CATALOG_STATUS_LABELS);
});
