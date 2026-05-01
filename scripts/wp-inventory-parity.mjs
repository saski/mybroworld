#!/usr/bin/env node

import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { buildInventoryParityReport } from '../catalog-generator/src/commerce-inventory-parity.mjs';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (!key?.startsWith('--')) {
      continue;
    }

    args[key.slice(2)] = value && !value.startsWith('--') ? value : 'true';
    if (value && !value.startsWith('--')) {
      index += 1;
    }
  }

  return args;
}

function printUsage(logger) {
  logger.error('Usage: scripts/wp-inventory-parity.mjs --sheet-csv PATH --woo-csv PATH [--scope all|catalog_ready|available]');
}

function logReport(report, logger) {
  logger.log(
    `inventory_parity scope=${report.scope} sheet=${report.sheetCount} woo=${report.wooCount} missing=${report.missingInWoo.length} unexpected=${report.unexpectedInWoo.length}`,
  );

  for (const artwork of report.missingInWoo) {
    logger.log(`missing_in_woo ${artwork.artworkId} ${artwork.title}`);
  }

  for (const product of report.unexpectedInWoo) {
    logger.log(`unexpected_in_woo ${product.id || '-'} ${product.title}`);
  }
}

export async function runInventoryParityCli({
  argv = process.argv.slice(2),
  logger = console,
  readTextFile = (filePath) => fs.readFile(filePath, 'utf8'),
} = {}) {
  const args = parseArgs(argv);
  const scope = args.scope || 'all';

  if (!args['sheet-csv'] || !args['woo-csv']) {
    printUsage(logger);
    return { exitCode: 2 };
  }

  try {
    const [sheetCsvText, wooCsvText] = await Promise.all([
      readTextFile(args['sheet-csv']),
      readTextFile(args['woo-csv']),
    ]);
    const report = buildInventoryParityReport({ scope, sheetCsvText, wooCsvText });

    logReport(report, logger);

    return {
      exitCode: report.inSync ? 0 : 1,
      report,
    };
  } catch (error) {
    logger.error(`inventory_parity_failed ${error instanceof Error ? error.message : String(error)}`);
    return { exitCode: 2 };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runInventoryParityCli();
  process.exit(exitCode);
}
