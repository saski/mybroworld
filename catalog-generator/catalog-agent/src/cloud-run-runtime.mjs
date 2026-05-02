import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogAgentError } from './errors.mjs';

const DEFAULT_RUNTIME_ROOT = '/tmp/mybroworld/catalog-agent';

function readEnvValue(env, name) {
  const value = env ? env[name] : '';
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : '';
}

function parseJsonSecret(secretText, label) {
  try {
    const parsed = JSON.parse(secretText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Expected a JSON object.');
    }
    return parsed;
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'cloud_run_secret_parse_failed',
      message: `Cloud Run ${label} secret is not valid JSON.`,
    });
  }
}

async function readJsonSecret({ env, jsonEnvName, label, pathEnvName }) {
  const inlineJson = readEnvValue(env, jsonEnvName);
  if (inlineJson) {
    return parseJsonSecret(inlineJson, label);
  }

  const secretPath = readEnvValue(env, pathEnvName);
  if (!secretPath) {
    throw new CatalogAgentError({
      code: 'cloud_run_secret_missing',
      message: `Set ${jsonEnvName} or ${pathEnvName} before starting the Cloud Run catalog agent.`,
    });
  }

  let fileContents;
  try {
    fileContents = await fs.readFile(secretPath, 'utf8');
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'cloud_run_secret_read_failed',
      message: `Unable to read Cloud Run ${label} secret from ${secretPath}.`,
    });
  }

  return parseJsonSecret(fileContents, label);
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

export async function materializeCloudRunAgentRuntime({ env = process.env } = {}) {
  const runtimeRoot = path.resolve(readEnvValue(env, 'CATALOG_AGENT_RUNTIME_ROOT') || DEFAULT_RUNTIME_ROOT);
  const [rawConfig, oauthClient, oauthToken] = await Promise.all([
    readJsonSecret({
      env,
      jsonEnvName: 'CATALOG_AGENT_CONFIG_JSON',
      label: 'agent config',
      pathEnvName: 'CATALOG_AGENT_CONFIG_PATH',
    }),
    readJsonSecret({
      env,
      jsonEnvName: 'CATALOG_AGENT_OAUTH_CLIENT_JSON',
      label: 'OAuth client',
      pathEnvName: 'CATALOG_AGENT_OAUTH_CLIENT_PATH',
    }),
    readJsonSecret({
      env,
      jsonEnvName: 'CATALOG_AGENT_OAUTH_TOKEN_JSON',
      label: 'OAuth token',
      pathEnvName: 'CATALOG_AGENT_OAUTH_TOKEN_PATH',
    }),
  ]);

  const configPath = path.join(runtimeRoot, 'config.json');
  const oauthClientPath = path.join(runtimeRoot, 'oauth-client.json');
  const oauthTokenPath = path.join(runtimeRoot, 'oauth-token.json');
  const jobWorkingRoot = path.join(runtimeRoot, 'jobs');
  const runtimeConfig = {
    ...rawConfig,
    jobWorkingRoot,
    oauthClientPath,
    oauthTokenPath,
  };

  await fs.mkdir(jobWorkingRoot, { recursive: true });
  await Promise.all([
    writeJsonFile(configPath, runtimeConfig),
    writeJsonFile(oauthClientPath, oauthClient),
    writeJsonFile(oauthTokenPath, oauthToken),
  ]);

  return {
    config: runtimeConfig,
    configPath,
    jobWorkingRoot,
    oauthClientPath,
    oauthTokenPath,
    runtimeRoot,
  };
}
