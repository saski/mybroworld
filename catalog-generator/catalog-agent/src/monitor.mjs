#!/usr/bin/env node
import { normalizeAgentError } from './errors.mjs';
import { runCatalogJobMonitor } from './job-monitor.mjs';

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

try {
  const result = await runCatalogJobMonitor({
    configPath: args.config,
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
