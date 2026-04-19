import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CatalogAgentError } from './errors.mjs';
import { expandHomePath } from './utils.mjs';

export function resolveDefaultConfigPath(homeDirectory = os.homedir()) {
  return path.join(
    homeDirectory,
    'Library',
    'Application Support',
    'MyBroworld',
    'catalog-agent',
    'config.json',
  );
}

function assertString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CatalogAgentError({
      code: 'invalid_config',
      message: `Config field "${fieldName}" must be a non-empty string.`,
    });
  }

  return value.trim();
}

function normalizeSpreadsheetIds(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return [value.trim()];
  }

  throw new CatalogAgentError({
    code: 'invalid_config',
    message: 'Config field "watchSpreadsheetIds" must contain at least one spreadsheet id.',
  });
}

export async function loadAgentConfig(configPath = resolveDefaultConfigPath()) {
  let configText;
  try {
    configText = await fs.readFile(configPath, 'utf8');
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'config_read_failed',
      message: `Unable to read agent config: ${configPath}`,
    });
  }

  let rawConfig;
  try {
    rawConfig = JSON.parse(configText);
  } catch (error) {
    throw new CatalogAgentError({
      cause: error,
      code: 'config_parse_failed',
      message: `Unable to parse agent config JSON: ${configPath}`,
    });
  }

  const homeDirectory = os.homedir();
  const applicationSupportRoot = path.join(
    homeDirectory,
    'Library',
    'Application Support',
    'MyBroworld',
    'catalog-agent',
  );
  const pollIntervalSeconds = Number(rawConfig.pollIntervalSeconds || 30);

  if (!Number.isFinite(pollIntervalSeconds) || pollIntervalSeconds < 5) {
    throw new CatalogAgentError({
      code: 'invalid_config',
      message: 'Config field "pollIntervalSeconds" must be a number greater than or equal to 5.',
    });
  }

  return {
    applicationSupportRoot,
    configPath,
    generatorDir: expandHomePath(assertString(rawConfig.generatorDir, 'generatorDir'), homeDirectory),
    googleAccountEmail: assertString(rawConfig.googleAccountEmail, 'googleAccountEmail').toLowerCase(),
    jobWorkingRoot: path.join(applicationSupportRoot, 'jobs'),
    oauthClientPath: expandHomePath(assertString(rawConfig.oauthClientPath, 'oauthClientPath'), homeDirectory),
    oauthTokenPath: expandHomePath(assertString(rawConfig.oauthTokenPath, 'oauthTokenPath'), homeDirectory),
    pollIntervalSeconds,
    profileKey: assertString(rawConfig.profileKey, 'profileKey'),
    watchSpreadsheetIds: normalizeSpreadsheetIds(rawConfig.watchSpreadsheetIds),
    workspaceRoot: expandHomePath(assertString(rawConfig.workspaceRoot, 'workspaceRoot'), homeDirectory),
  };
}
