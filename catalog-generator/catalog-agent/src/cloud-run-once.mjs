#!/usr/bin/env node
import { runAgentLoop } from './agent.mjs';
import { materializeCloudRunAgentRuntime } from './cloud-run-runtime.mjs';
import { summarizeCloudRunOnceResult } from './cloud-run-once-status.mjs';
import { normalizeAgentError } from './errors.mjs';

try {
  const runtime = await materializeCloudRunAgentRuntime();
  const result = await runAgentLoop({
    configPath: runtime.configPath,
    logger: console,
    once: true,
  });

  const summary = summarizeCloudRunOnceResult(result);
  console[summary.logLevel](summary.message);
  if (summary.exitCode !== 0) {
    process.exit(summary.exitCode);
  }
} catch (error) {
  const normalizedError = normalizeAgentError(error, 'catalog_agent_failed');
  console.error(`[catalog-agent] failed code=${normalizedError.code} message=${normalizedError.message}`);
  process.exit(1);
}
