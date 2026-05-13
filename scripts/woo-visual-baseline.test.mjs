import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildScreenshotPlan,
  parseVisualPaths,
  parseViewportSpecs,
  resolveBrowserExecutablePath,
  screenshotWarmupScrollPositions,
  screenshotSlug,
} from './woo-visual-baseline.mjs';

test('parseVisualPaths uses launch-critical storefront paths and trims overrides', () => {
  assert.deepEqual(parseVisualPaths(''), ['/', '/shop/', '/cart/', '/checkout/']);
  assert.deepEqual(parseVisualPaths(' /, /shop/ ,, /checkout/ '), ['/', '/shop/', '/checkout/']);
});

test('parseViewportSpecs provides desktop and mobile defaults', () => {
  assert.deepEqual(parseViewportSpecs('').map((viewport) => viewport.name), ['desktop', 'mobile']);
  assert.deepEqual(parseViewportSpecs('tablet:768x1024@2'), [
    {
      deviceScaleFactor: 2,
      hasTouch: true,
      height: 1024,
      isMobile: true,
      name: 'tablet',
      width: 768,
    },
  ]);
});

test('buildScreenshotPlan creates stable filenames for each viewport and path', () => {
  const plan = buildScreenshotPlan({
    baseUrl: 'https://example.test/base/',
    label: 'glacier-production',
    outDir: '/tmp/visual',
    paths: ['/', '/shop/', 'checkout/'],
    viewports: [{ height: 900, name: 'desktop', width: 1200 }],
  });

  assert.deepEqual(plan.map((target) => target.url), [
    'https://example.test/',
    'https://example.test/shop/',
    'https://example.test/base/checkout/',
  ]);
  assert.deepEqual(plan.map((target) => target.filePath), [
    '/tmp/visual/glacier-production-desktop-home.png',
    '/tmp/visual/glacier-production-desktop-shop.png',
    '/tmp/visual/glacier-production-desktop-checkout.png',
  ]);
});

test('screenshotSlug keeps product URLs readable', () => {
  assert.equal(screenshotSlug('https://example.test/product/fanzimad-2026-yuju/'), 'product-fanzimad-2026-yuju');
  assert.equal(screenshotSlug('/'), 'home');
});

test('resolveBrowserExecutablePath prefers explicit configuration', () => {
  assert.equal(
    resolveBrowserExecutablePath({ PUPPETEER_EXECUTABLE_PATH: '/Applications/Test.app/Contents/MacOS/Test' }),
    '/Applications/Test.app/Contents/MacOS/Test',
  );
});

test('screenshotWarmupScrollPositions visits a long page and returns to the top', () => {
  assert.deepEqual(screenshotWarmupScrollPositions({ pageHeight: 3000, viewportHeight: 1000 }), [
    0,
    750,
    1500,
    2000,
    0,
  ]);
  assert.deepEqual(screenshotWarmupScrollPositions({ pageHeight: 800, viewportHeight: 1000 }), [0]);
});
