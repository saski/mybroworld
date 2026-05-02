import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { materializeCloudRunAgentRuntime } from '../catalog-agent/src/cloud-run-runtime.mjs';

test('materializeCloudRunAgentRuntime copies secrets into a writable agent config', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'catalog-agent-cloud-run-'));
  const runtimeRoot = path.join(tempRoot, 'runtime');

  const result = await materializeCloudRunAgentRuntime({
    env: {
      CATALOG_AGENT_CONFIG_JSON: JSON.stringify({
        generatorDir: '/app',
        googleAccountEmail: 'mybrocorp@gmail.com',
        oauthClientPath: '/secrets/oauth-client.json',
        oauthTokenPath: '/secrets/oauth-token.json',
        pollIntervalSeconds: 30,
        profileKey: 'lucia-mybrocorp',
        watchSpreadsheetIds: ['spreadsheet-1'],
        workspaceRoot: '/workspace',
      }),
      CATALOG_AGENT_OAUTH_CLIENT_JSON: JSON.stringify({
        installed: {
          client_id: 'client-id',
          client_secret: 'client-secret',
          redirect_uris: ['http://127.0.0.1/oauth2callback'],
        },
      }),
      CATALOG_AGENT_OAUTH_TOKEN_JSON: JSON.stringify({
        refresh_token: 'refresh-token',
      }),
      CATALOG_AGENT_RUNTIME_ROOT: runtimeRoot,
    },
  });

  const [runtimeConfig, oauthClient, oauthToken] = await Promise.all([
    fs.readFile(result.configPath, 'utf8').then(JSON.parse),
    fs.readFile(result.oauthClientPath, 'utf8').then(JSON.parse),
    fs.readFile(result.oauthTokenPath, 'utf8').then(JSON.parse),
  ]);

  assert.equal(result.runtimeRoot, runtimeRoot);
  assert.equal(runtimeConfig.profileKey, 'lucia-mybrocorp');
  assert.equal(runtimeConfig.googleAccountEmail, 'mybrocorp@gmail.com');
  assert.equal(runtimeConfig.jobWorkingRoot, path.join(runtimeRoot, 'jobs'));
  assert.equal(runtimeConfig.oauthClientPath, path.join(runtimeRoot, 'oauth-client.json'));
  assert.equal(runtimeConfig.oauthTokenPath, path.join(runtimeRoot, 'oauth-token.json'));
  assert.equal(oauthClient.installed.client_id, 'client-id');
  assert.equal(oauthToken.refresh_token, 'refresh-token');

  await fs.writeFile(result.oauthTokenPath, JSON.stringify({ refresh_token: 'updated-refresh-token' }));
  const refreshedToken = JSON.parse(await fs.readFile(result.oauthTokenPath, 'utf8'));
  assert.equal(refreshedToken.refresh_token, 'updated-refresh-token');
});
