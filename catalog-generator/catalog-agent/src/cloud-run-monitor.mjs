#!/usr/bin/env node
import { materializeCloudRunAgentRuntime } from './cloud-run-runtime.mjs';
import { normalizeAgentError } from './errors.mjs';
import { runCatalogJobMonitor } from './job-monitor.mjs';

try {
  const runtime = await materializeCloudRunAgentRuntime();
  const result = await runCatalogJobMonitor({
    configPath: runtime.configPath,
    logger: console,
  });

  if (result.status === 'alert') {
    process.exit(1);
  }
} catch (error) {
  const normalizedError = normalizeAgentError(error, 'catalog_monitor_failed');
  console.error(`[catalog-monitor] failed code=${normalizedError.code} message=${normalizedError.message}`);
  process.exit(1);
}
