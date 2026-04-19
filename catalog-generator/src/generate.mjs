#!/usr/bin/env node
import { runGenerateCli } from './catalog-generator.mjs';

const { exitCode } = await runGenerateCli();
process.exit(exitCode);
