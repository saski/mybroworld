#!/usr/bin/env node
import { runAgentLoop } from './agent.mjs';
import { materializeCloudRunAgentRuntime } from './cloud-run-runtime.mjs';
import { normalizeAgentError } from './errors.mjs';

try {
  const runtime = await materializeCloudRunAgentRuntime();
  const result = await runAgentLoop({
    configPath: runtime.configPath,
    logger: console,
    once: true,
  });

  if (!result) {
    console.log('[catalog-agent] no queued jobs matched the configured profile');
  } else {
    console.log(`[catalog-agent] ${result.status} ${result.jobId}`);
  }
} catch (error) {
  const normalizedError = normalizeAgentError(error, 'catalog_agent_failed');
  console.error(`[catalog-agent] failed code=${normalizedError.code} message=${normalizedError.message}`);
  process.exit(1);
}
