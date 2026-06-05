#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { parseBooleanFlag, resolveSmokeUrls } from './wp-smoke-test.mjs';

const DEFAULT_PATHS = ['/', '/shop/', '/cart/', '/checkout/'];
const DEFAULT_VIEWPORTS = [
  {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1100,
    isMobile: false,
    name: 'desktop',
    width: 1440,
  },
  {
    deviceScaleFactor: 2,
    hasTouch: true,
    height: 844,
    isMobile: true,
    name: 'mobile',
    width: 390,
  },
];
const MAC_BROWSER_EXECUTABLES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

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
  logger.error(
    'Usage: scripts/woo-visual-baseline.mjs --base-url URL --label LABEL [--paths /,/shop/] [--include-first-product] [--require-first-product] [--ignore-https-errors] [--out-dir PATH]',
  );
}

function todayStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function safeLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '') || 'baseline';
}

export function resolveBrowserExecutablePath(env = process.env) {
  const configuredPath = String(env.PUPPETEER_EXECUTABLE_PATH || env.CHROME_EXECUTABLE_PATH || '').trim();

  if (configuredPath) {
    return configuredPath;
  }

  return MAC_BROWSER_EXECUTABLES.find((browserPath) => existsSync(browserPath));
}

export function parseVisualPaths(value) {
  if (!value) {
    return DEFAULT_PATHS;
  }

  const paths = value
    .split(',')
    .map((pathValue) => pathValue.trim())
    .filter(Boolean);

  return paths.length > 0 ? paths : DEFAULT_PATHS;
}

export function parseViewportSpecs(value) {
  if (!value) {
    return DEFAULT_VIEWPORTS;
  }

  const viewports = value
    .split(',')
    .map((spec) => spec.trim())
    .filter(Boolean)
    .map((spec) => {
      const match = spec.match(/^([a-z0-9-]+):(\d+)x(\d+)(?:@(\d+(?:\.\d+)?))?$/iu);

      if (!match) {
        throw new Error(`Invalid viewport spec: ${spec}`);
      }

      const width = Number.parseInt(match[2], 10);
      const height = Number.parseInt(match[3], 10);
      const deviceScaleFactor = Number.parseFloat(match[4] || '1');
      const isMobile = width <= 900;

      return {
        deviceScaleFactor,
        hasTouch: isMobile,
        height,
        isMobile,
        name: safeLabel(match[1]),
        width,
      };
    });

  return viewports.length > 0 ? viewports : DEFAULT_VIEWPORTS;
}

export function screenshotSlug(urlOrPath) {
  const url = new URL(urlOrPath, 'https://example.invalid');
  const pathname = url.pathname.replace(/^\/+|\/+$/gu, '');

  if (!pathname) {
    return 'home';
  }

  return pathname
    .split('/')
    .filter(Boolean)
    .map(safeLabel)
    .filter(Boolean)
    .join('-') || 'home';
}

export function buildScreenshotPlan({
  baseUrl,
  label,
  outDir,
  paths,
  viewports,
}) {
  const normalizedLabel = safeLabel(label);
  const targets = [];

  for (const pathValue of paths) {
    const url = new URL(pathValue, baseUrl).toString();
    const slug = screenshotSlug(pathValue);

    for (const viewport of viewports) {
      targets.push({
        filePath: path.join(outDir, `${normalizedLabel}-${viewport.name}-${slug}.png`),
        path: pathValue,
        slug,
        url,
        viewport,
      });
    }
  }

  return targets;
}

export function screenshotWarmupScrollPositions({ pageHeight, viewportHeight }) {
  if (pageHeight <= viewportHeight) {
    return [0];
  }

  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  const step = Math.max(1, Math.floor(viewportHeight * 0.75));
  const positions = [];

  for (let position = 0; position < maxScroll; position += step) {
    positions.push(position);
  }

  if (positions[positions.length - 1] !== maxScroll) {
    positions.push(maxScroll);
  }
  positions.push(0);
  return positions;
}

function loadPuppeteer() {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('puppeteer', {
    paths: [path.resolve('catalog-generator')],
  });

  return require(packagePath);
}

async function warmupPageForFullPageScreenshot(page) {
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.images, (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return undefined;
      }

      if (typeof image.decode === 'function') {
        return image.decode().catch(() => undefined);
      }

      return undefined;
    }));
  });

  const dimensions = await page.evaluate(() => ({
    pageHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    viewportHeight: window.innerHeight,
  }));
  const scrollPositions = screenshotWarmupScrollPositions(dimensions);

  for (const scrollPosition of scrollPositions) {
    await page.evaluate((position) => {
      window.scrollTo(0, position);
    }, scrollPosition);
    await new Promise((resolve) => {
      setTimeout(resolve, 80);
    });
  }

  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  }));
}

async function captureScreenshots({
  browserExecutablePath,
  ignoreHttpsErrors = false,
  logger,
  plan,
  puppeteer,
  timeoutMs,
}) {
  const browser = await puppeteer.launch({
    args: [
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      ...(ignoreHttpsErrors ? ['--ignore-certificate-errors'] : []),
    ],
    executablePath: browserExecutablePath,
    headless: true,
    ignoreHTTPSErrors: ignoreHttpsErrors,
  });

  try {
    for (const target of plan) {
      const page = await browser.newPage();
      await page.setViewport(target.viewport);
      await page.goto(target.url, {
        timeout: timeoutMs,
        waitUntil: 'networkidle2',
      });
      await warmupPageForFullPageScreenshot(page);
      await page.screenshot({
        fullPage: true,
        path: target.filePath,
      });
      await page.close();
      logger.log(`woo_visual_baseline screenshot=${target.filePath} url=${target.url}`);
    }
  } finally {
    await browser.close();
  }
}

export async function runWooVisualBaselineCli({
  argv = process.argv.slice(2),
  env = process.env,
  logger = console,
  now = new Date(),
  puppeteer = loadPuppeteer(),
} = {}) {
  const args = parseArgs(argv);

  if (args.help === 'true') {
    printUsage(logger);
    return { exitCode: 0 };
  }

  const baseUrl = args['base-url'] || env.WP_BASE_URL || env.WORDPRESS_BASE_URL;
  if (!String(baseUrl || '').trim()) {
    logger.error('woo_visual_baseline_refused missing_env=WP_BASE_URL');
    return { exitCode: 2 };
  }

  const label = safeLabel(args.label || env.WP_VISUAL_LABEL || new URL(baseUrl).hostname);
  const outDir = args['out-dir'] || env.WP_VISUAL_OUT_DIR || `wordpress/.tmp/visual-baseline/${todayStamp(now)}-${label}`;
  const includeFirstProduct = parseBooleanFlag(args['include-first-product'] || env.WP_VISUAL_INCLUDE_FIRST_PRODUCT);
  const ignoreHttpsErrors = parseBooleanFlag(args['ignore-https-errors'] || env.WP_IGNORE_HTTPS_ERRORS);
  const requireFirstProduct = parseBooleanFlag(args['require-first-product'] || env.WP_VISUAL_REQUIRE_FIRST_PRODUCT);
  const timeoutMs = Number.parseInt(args['timeout-ms'] || env.WP_VISUAL_TIMEOUT_MS || '45000', 10);
  const viewports = parseViewportSpecs(args.viewports || env.WP_VISUAL_VIEWPORTS);
  const paths = parseVisualPaths(args.paths || env.WP_VISUAL_PATHS);
  const browserExecutablePath = args['browser-executable-path'] || resolveBrowserExecutablePath(env);
  const targetPaths = includeFirstProduct || requireFirstProduct
    ? await resolveSmokeUrls({
      baseUrl,
      includeFirstProduct,
      requireFirstProduct,
      smokePathsValue: paths.join(','),
    })
    : paths;

  const plan = buildScreenshotPlan({
    baseUrl,
    label,
    outDir,
    paths: targetPaths,
    viewports,
  });
  const manifestPath = path.join(outDir, 'manifest.json');

  await fs.mkdir(outDir, { recursive: true });
  await captureScreenshots({
    browserExecutablePath,
    ignoreHttpsErrors,
    logger,
    plan,
    puppeteer,
    timeoutMs,
  });
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify({
      baseUrl,
      createdAt: now.toISOString(),
      label,
      screenshots: plan.map((target) => ({
        filePath: target.filePath,
        slug: target.slug,
        url: target.url,
        viewport: target.viewport.name,
      })),
    }, null, 2)}\n`,
  );
  logger.log(`woo_visual_baseline manifest=${manifestPath} screenshots=${plan.length}`);

  return {
    exitCode: 0,
    manifestPath,
    plan,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooVisualBaselineCli();
  process.exit(exitCode);
}
