#!/usr/bin/env node
import { runAgentLoop } from './agent.mjs';
import { normalizeAgentError } from './errors.mjs';

function parseArgs(argv) {
  return argv.reduce((args, token, index) => {
    if (!token.startsWith('--')) {
      return args;
    }

    const nextToken = argv[index + 1];
    args[token.slice(2)] = nextToken && !nextToken.startsWith('--') ? nextToken : 'true';
    return args;
  }, {});
}

const args = parseArgs(process.argv.slice(2));
const once = args.once === 'true';

try {
  const result = await runAgentLoop({
    configPath: args.config,
    logger: console,
    once,
  });

  if (once && !result) {
    console.log('[catalog-agent] no queued jobs matched the configured profile');
  } else if (result) {
    console.log(`[catalog-agent] ${result.status} ${result.jobId}`);
  }
} catch (error) {
  const normalizedError = normalizeAgentError(error, 'catalog_agent_failed');
  console.error(`[catalog-agent] failed code=${normalizedError.code} message=${normalizedError.message}`);
  process.exit(1);
}
