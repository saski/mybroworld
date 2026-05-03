import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('Apps Script manifest publishes the Web App for server-side WordPress calls', () => {
  const manifestPath = path.join(repoRoot, 'catalog-generator', 'apps-script', 'appsscript.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.deepEqual(manifest.webapp, {
    access: 'ANYONE_ANONYMOUS',
    executeAs: 'USER_DEPLOYING',
  });
  assert.deepEqual(manifest.executionApi, {
    access: 'MYSELF',
  });
});
