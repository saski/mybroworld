import test from 'node:test';
import assert from 'node:assert/strict';

import { runInventoryParityCli } from './wp-inventory-parity.mjs';

test('runInventoryParityCli returns a mismatch report without mutating inventory', async () => {
  const logs = [];
  const errors = [];
  const files = new Map([
    [
      '/tmp/sheet.csv',
      `artwork_id,title_clean,status_normalized,include_in_catalog,catalog_ready
LA-2026-001,Perrete en tablillas 01,available,TRUE,TRUE
`,
    ],
    [
      '/tmp/woo.csv',
      `ID,post_title,post_status,post_name
1,Armchair,publish,armchair
`,
    ],
  ]);

  const result = await runInventoryParityCli({
    argv: ['--sheet-csv', '/tmp/sheet.csv', '--woo-csv', '/tmp/woo.csv'],
    logger: {
      error: (message) => errors.push(message),
      log: (message) => logs.push(message),
    },
    readTextFile: async (filePath) => files.get(filePath),
  });

  assert.equal(result.exitCode, 1);
  assert.match(logs.join('\n'), /sheet=1 woo=1 missing=1 unexpected=1/);
  assert.match(logs.join('\n'), /missing_in_woo LA-2026-001 Perrete en tablillas 01/);
  assert.match(logs.join('\n'), /unexpected_in_woo 1 Armchair/);
  assert.deepEqual(errors, []);
});

test('runInventoryParityCli requires both CSV inputs', async () => {
  const errors = [];
  const result = await runInventoryParityCli({
    argv: ['--sheet-csv', '/tmp/sheet.csv'],
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
  });

  assert.equal(result.exitCode, 2);
  assert.match(errors.join('\n'), /Usage:/);
});
