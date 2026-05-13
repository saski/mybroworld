#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { parseBooleanFlag, resolveSmokeUrls } from './wp-smoke-test.mjs';
import { resolveBrowserExecutablePath, screenshotSlug } from './woo-visual-baseline.mjs';

const DEFAULT_REQUIRED_CHECKOUT_FIELDS = [
  'billing_first_name',
  'billing_last_name',
  'billing_address_1',
  'billing_city',
  'billing_postcode',
  'billing_phone',
  'billing_email',
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
    'Usage: scripts/woo-interaction-baseline.mjs --base-url URL --label LABEL [--allow-cart-mutation] [--require-payment-method] [--out-dir PATH]',
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

function loadPuppeteer() {
  const require = createRequire(import.meta.url);
  const packagePath = require.resolve('puppeteer', {
    paths: [path.resolve('catalog-generator')],
  });

  return require(packagePath);
}

function styleNumber(value) {
  const parsed = Number.parseFloat(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function requireUppercaseTracking(failures, style, uppercaseFailure, trackingFailure) {
  if (style?.textTransform !== 'uppercase') {
    failures.push(uppercaseFailure);
  }

  if (styleNumber(style?.letterSpacingPx ?? style?.letterSpacing) < 1) {
    failures.push(trackingFailure);
  }
}

export function requiredCheckoutFieldIds() {
  return [...DEFAULT_REQUIRED_CHECKOUT_FIELDS];
}

export function evaluateInteractionReport(report, { expectCartMutation = false, requirePaymentMethod = false } = {}) {
  const failures = [];
  const presentFieldIds = new Set(report.checkout?.presentFieldIds || []);

  if ((report.navigation?.linkCount || 0) < 1) {
    failures.push('missing_navigation_links');
  }

  if ((report.navigation?.cartLinkCount || 0) < 1) {
    failures.push('missing_header_cart_link');
  }

  if ((report.navigation?.logoImageCount || 0) < 1) {
    failures.push('missing_header_logo_image');
  }

  if ((report.navigation?.mobileMenu?.toggleCount || 0) < 1) {
    failures.push('missing_mobile_menu_toggle');
  }

  if ((report.navigation?.mobileMenu?.toggleCount || 0) > 0 && report.navigation.mobileMenu.opensOnToggle !== true) {
    failures.push('mobile_menu_toggle_did_not_open');
  }

  if ((report.shop?.productLinkCount || 0) < 1) {
    failures.push('missing_shop_product_links');
  }

  if ((report.shop?.sortControlCount || 0) < 1) {
    failures.push('missing_shop_sort_control');
  }

  if ((report.shop?.addToCartActionCount || 0) < 1) {
    failures.push('missing_shop_add_to_cart_actions');
  }

  if (report.shop?.productTitleStyle?.textTransform !== 'uppercase') {
    failures.push('shop_titles_not_uppercase');
  }

  if (styleNumber(report.shop?.productTitleStyle?.letterSpacingPx ?? report.shop?.productTitleStyle?.letterSpacing) < 1) {
    failures.push('shop_titles_missing_tracking');
  }

  if (report.shop?.pageTitleStyle?.textTransform !== 'uppercase') {
    failures.push('shop_page_title_not_uppercase');
  }

  if (styleNumber(report.shop?.pageTitleStyle?.letterSpacingPx ?? report.shop?.pageTitleStyle?.letterSpacing) < 1) {
    failures.push('shop_page_title_missing_tracking');
  }

  if ((report.product?.primaryImageCount || 0) < 1) {
    failures.push('missing_product_primary_image');
  }

  if ((report.product?.primaryImageVisibleCount || 0) < 1) {
    failures.push('missing_visible_product_primary_image');
  }

  if ((report.product?.zoomTriggerCount || 0) < 1) {
    failures.push('missing_product_zoom_trigger');
  }

  if (report.product?.titleStyle?.textTransform !== 'uppercase') {
    failures.push('product_title_not_uppercase');
  }

  const productTitleFontSize = styleNumber(report.product?.titleStyle?.fontSizePx ?? report.product?.titleStyle?.fontSize);
  if (productTitleFontSize > 40 || productTitleFontSize === 0) {
    failures.push('product_title_too_large');
  }

  if (report.cart) {
    requireUppercaseTracking(
      failures,
      report.cart.pageTitleStyle,
      'cart_page_title_not_uppercase',
      'cart_page_title_missing_tracking',
    );
  }

  if (expectCartMutation || (report.cart?.lineItemCount || 0) > 0) {
    requireUppercaseTracking(
      failures,
      report.cart?.totalsTitleStyle,
      'cart_totals_title_not_uppercase',
      'cart_totals_title_missing_tracking',
    );
    requireUppercaseTracking(
      failures,
      report.cart?.checkoutButtonStyle,
      'cart_checkout_button_not_uppercase',
      'cart_checkout_button_missing_tracking',
    );
  }

  if (report.checkout) {
    requireUppercaseTracking(
      failures,
      report.checkout.pageTitleStyle,
      'checkout_page_title_not_uppercase',
      'checkout_page_title_missing_tracking',
    );
  }

  if (expectCartMutation || presentFieldIds.size > 0) {
    requireUppercaseTracking(
      failures,
      report.checkout?.sectionTitleStyle,
      'checkout_section_title_not_uppercase',
      'checkout_section_title_missing_tracking',
    );
    requireUppercaseTracking(
      failures,
      report.checkout?.placeOrderButtonStyle,
      'checkout_place_order_button_not_uppercase',
      'checkout_place_order_button_missing_tracking',
    );
  }

  if (expectCartMutation) {
    if ((report.cart?.lineItemCount || 0) < 1) {
      failures.push('cart_did_not_receive_item');
    }

    if ((report.cart?.checkoutLinkCount || 0) < 1) {
      failures.push('missing_checkout_link');
    }

    for (const fieldId of DEFAULT_REQUIRED_CHECKOUT_FIELDS) {
      if (!presentFieldIds.has(fieldId)) {
        failures.push(`missing_checkout_field:${fieldId}`);
      }
    }
  }

  if (requirePaymentMethod && (report.checkout?.paymentMethodCount || 0) < 1) {
    failures.push('missing_checkout_payment_method');
  }

  return failures;
}

async function screenshot(page, outDir, label, stepName) {
  const filePath = path.join(outDir, `${safeLabel(label)}-interaction-${safeLabel(stepName)}.png`);
  await page.screenshot({ fullPage: true, path: filePath });
  return filePath;
}

async function count(page, selector) {
  return page.$$eval(selector, (elements) => elements.length).catch(() => 0);
}

async function visibleText(page, selector) {
  return page.$$eval(selector, (elements) => elements
    .map((element) => element.textContent?.trim() || '')
    .filter(Boolean)).catch(() => []);
}

async function computedStyle(page, selector, properties) {
  return page.$eval(selector, (element, requestedProperties) => {
    const styles = window.getComputedStyle(element);
    return Object.fromEntries(requestedProperties.map((property) => [property, styles[property]]));
  }, properties).catch(() => ({}));
}

async function visibleImageCount(page, selector) {
  return page.$$eval(selector, (images) => images.filter((image) => {
    const rect = image.getBoundingClientRect();
    const style = window.getComputedStyle(image);

    return image.naturalWidth > 0
      && image.naturalHeight > 0
      && rect.width > 0
      && rect.height > 0
      && style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number.parseFloat(style.opacity || '1') > 0;
  }).length).catch(() => 0);
}

async function collectNavigation(page, baseUrl) {
  const desktopViewport = page.viewport();
  await page.goto(new URL('/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  const links = await page.$$eval('nav a, header a', (anchors) => anchors.map((anchor) => ({
    href: anchor.href,
    text: anchor.textContent?.trim() || '',
  })).filter((link) => link.href || link.text));

  const navigation = {
    cartLinkCount: await count(page, 'header a[href*="/cart"], header a[href*="cart"], .site-cart-link, .cart-contents, .cart-container, .icon-cart, .cart-count'),
    linkCount: links.length,
    links,
    logoImageCount: await count(page, '.site-logo img, .custom-logo-link img, header img[alt*="Lucia"], header img[alt*="Astuy"]'),
  };

  navigation.mobileMenu = await collectMobileNavigation(page, baseUrl, desktopViewport);

  if (desktopViewport) {
    await page.setViewport(desktopViewport);
  }
  await page.goto(new URL('/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  return navigation;
}

async function collectMobileNavigation(page, baseUrl, desktopViewport) {
  await page.setViewport({
    deviceScaleFactor: 2,
    height: 900,
    isMobile: true,
    width: 390,
  });
  await page.goto(new URL('/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  const toggleCount = await page.$$eval('button, a, [role="button"]', (controls) => controls.filter((control) => {
    const className = typeof control.className === 'string'
      ? control.className
      : control.getAttribute('class') || '';
    const label = control.getAttribute('aria-label') || '';
    const text = control.textContent?.trim() || '';

    return /menu/i.test(className) || /menu/i.test(label) || /^menu$/i.test(text);
  }).length).catch(() => 0);

  let opensOnToggle = false;

  if (toggleCount > 0) {
    await page.$$eval('button, a, [role="button"]', (controls) => {
      const control = controls.find((candidate) => {
        const className = typeof candidate.className === 'string'
          ? candidate.className
          : candidate.getAttribute('class') || '';
        const label = candidate.getAttribute('aria-label') || '';
        const text = candidate.textContent?.trim() || '';

        return /menu/i.test(className) || /menu/i.test(label) || /^menu$/i.test(text);
      });
      control?.click();
    }).catch(() => {});
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
    opensOnToggle = await page.$$eval('nav a, .primary-navigation a', (anchors) => anchors.some((anchor) => {
      const rect = anchor.getBoundingClientRect();
      const style = window.getComputedStyle(anchor);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    })).catch(() => false);
  }

  if (desktopViewport) {
    await page.setViewport(desktopViewport);
  }

  return {
    opensOnToggle,
    toggleCount,
  };
}

async function collectShop(page, baseUrl) {
  await page.goto(new URL('/shop/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  const sortOptions = await page.$$eval('select[name="orderby"] option', (options) => options.map((option) => ({
    text: option.textContent?.trim() || '',
    value: option.value,
  }))).catch(() => []);

  return {
    addToCartActionCount: await count(page, 'a.add_to_cart_button, a[href*="add-to-cart"], button.add_to_cart_button, button[name="add-to-cart"]'),
    pageTitleStyle: await computedStyle(page, '.woocommerce-products-header__title, .woocommerce .page-title, .page-title', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    productLinkCount: await count(page, 'a.woocommerce-LoopProduct-link, li.product a[href*="/product/"], article.product a[href*="/product/"]'),
    productTitleStyle: await computedStyle(page, '.woocommerce-loop-product__title, .wc-block-grid__product-title', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    productTitles: await visibleText(page, '.woocommerce-loop-product__title, .wc-block-grid__product-title'),
    sortControlCount: await count(page, 'select[name="orderby"]'),
    sortOptions,
  };
}

async function collectProduct(page, productUrl) {
  await page.goto(productUrl, {
    waitUntil: 'networkidle2',
  });

  const zoomTriggerCount = await count(page, '.woocommerce-product-gallery__trigger');
  let zoomOpened = false;

  if (zoomTriggerCount > 0) {
    await page.click('.woocommerce-product-gallery__trigger').catch(() => {});
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    zoomOpened = await page.$('.pswp[aria-hidden="false"], .pswp--open, .woocommerce-product-gallery__trigger') !== null;
    await page.keyboard.press('Escape').catch(() => {});
  }

  return {
    addToCartActionCount: await count(page, 'button.single_add_to_cart_button, .single_add_to_cart_button, a[href*="add-to-cart"]'),
    primaryImageCount: await count(page, '.woocommerce-product-gallery img, div.product img, main img'),
    primaryImageVisibleCount: await visibleImageCount(page, '.woocommerce-product-gallery__image img.wp-post-image, div.product img.wp-post-image'),
    tabCount: await count(page, '.woocommerce-tabs .tabs li, .woocommerce-tabs button, .wc-tabs li'),
    title: (await visibleText(page, '.product_title, h1'))[0] || '',
    titleStyle: await computedStyle(page, '.product_title, h1', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    url: productUrl,
    zoomOpened,
    zoomTriggerCount,
  };
}

async function clickFirstShopAddToCart(page, baseUrl) {
  await page.goto(new URL('/shop/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  const selector = 'a.add_to_cart_button, a[href*="add-to-cart"], button.add_to_cart_button, button[name="add-to-cart"]';
  const action = await page.$(selector);

  if (!action) {
    return false;
  }

  await Promise.all([
    page.waitForNavigation({ timeout: 8000, waitUntil: 'networkidle2' }).catch(() => undefined),
    action.click(),
  ]);
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  return true;
}

async function collectCart(page, baseUrl, allowCartMutation) {
  if (allowCartMutation) {
    await clickFirstShopAddToCart(page, baseUrl);
  }

  await page.goto(new URL('/cart/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  return {
    checkoutButtonStyle: await computedStyle(page, 'a.checkout-button, a[href*="/checkout"]', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    checkoutLinkCount: await count(page, 'a.checkout-button, a[href*="/checkout"]'),
    lineItemCount: await count(page, '.woocommerce-cart-form__cart-item, tr.cart_item, .wc-block-cart-items__row'),
    mutationAllowed: allowCartMutation,
    notices: await visibleText(page, '.woocommerce-info, .woocommerce-message, .woocommerce-error'),
    pageTitleStyle: await computedStyle(page, '.entry-title, .woocommerce-cart h1, h1', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    totalsTitleStyle: await computedStyle(page, '.cart_totals h2, .cart-collaterals h2, .wc-block-cart__totals-title', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
  };
}

async function collectCheckout(page, baseUrl) {
  await page.goto(new URL('/checkout/', baseUrl).toString(), {
    waitUntil: 'networkidle2',
  });

  const presentFieldIds = await page.$$eval('input, select, textarea', (fields) => fields
    .map((field) => field.id || field.getAttribute('name') || '')
    .filter(Boolean));

  return {
    pageTitleStyle: await computedStyle(page, '.entry-title, .woocommerce-checkout h1, h1', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    paymentMethodCount: await count(page, 'input[name="payment_method"], .wc_payment_method'),
    placeOrderButtonStyle: await computedStyle(page, '#place_order, button[name="woocommerce_checkout_place_order"], .wc-block-components-checkout-place-order-button', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    presentFieldIds,
    requiredFieldIds: await page.$$eval('input[required], select[required], textarea[required], .validate-required input, .validate-required select, .validate-required textarea', (fields) => fields
      .map((field) => field.id || field.getAttribute('name') || '')
      .filter(Boolean)).catch(() => []),
    sectionTitleStyle: await computedStyle(page, '#customer_details h3, .woocommerce-billing-fields h3, .woocommerce-additional-fields h3, #order_review_heading', [
      'fontSize',
      'letterSpacing',
      'textTransform',
    ]),
    shipToDifferentAddressControlCount: await count(page, '#ship-to-different-address, input[name="ship_to_different_address"]'),
  };
}

async function discoverFirstProductUrl(baseUrl) {
  const urls = await resolveSmokeUrls({
    baseUrl,
    includeFirstProduct: true,
    requireFirstProduct: true,
    smokePathsValue: '/',
  });

  return urls.find((url) => new URL(url).pathname.includes('/product/'));
}

export async function runWooInteractionBaselineCli({
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
    logger.error('woo_interaction_baseline_refused missing_env=WP_BASE_URL');
    return { exitCode: 2 };
  }

  const label = safeLabel(args.label || env.WP_INTERACTION_LABEL || new URL(baseUrl).hostname);
  const outDir = args['out-dir'] || env.WP_INTERACTION_OUT_DIR || `wordpress/.tmp/interaction-baseline/${todayStamp(now)}-${label}`;
  const allowCartMutation = parseBooleanFlag(args['allow-cart-mutation'] || env.WP_INTERACTION_ALLOW_CART_MUTATION);
  const requirePaymentMethod = parseBooleanFlag(args['require-payment-method'] || env.WP_INTERACTION_REQUIRE_PAYMENT_METHOD);
  const browserExecutablePath = args['browser-executable-path'] || resolveBrowserExecutablePath(env);
  const reportPath = path.join(outDir, 'interaction-report.json');

  await fs.mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
    executablePath: browserExecutablePath,
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({
    deviceScaleFactor: 1,
    height: 1100,
    width: 1440,
  });

  try {
    const productUrl = await discoverFirstProductUrl(baseUrl);
    const report = {
      allowCartMutation,
      baseUrl,
      label,
      navigation: await collectNavigation(page, baseUrl),
      requirePaymentMethod,
      screenshots: [],
    };
    report.screenshots.push({
      filePath: await screenshot(page, outDir, label, 'home-navigation'),
      step: 'home-navigation',
    });

    report.shop = await collectShop(page, baseUrl);
    report.screenshots.push({
      filePath: await screenshot(page, outDir, label, 'shop-controls'),
      step: 'shop-controls',
    });

    report.product = await collectProduct(page, productUrl);
    report.product.slug = screenshotSlug(productUrl);
    report.screenshots.push({
      filePath: await screenshot(page, outDir, label, 'product-detail'),
      step: 'product-detail',
    });

    report.cart = await collectCart(page, baseUrl, allowCartMutation);
    report.screenshots.push({
      filePath: await screenshot(page, outDir, label, 'cart'),
      step: 'cart',
    });

    report.checkout = await collectCheckout(page, baseUrl);
    report.screenshots.push({
      filePath: await screenshot(page, outDir, label, 'checkout'),
      step: 'checkout',
    });

    const failures = evaluateInteractionReport(report, {
      expectCartMutation: allowCartMutation,
      requirePaymentMethod,
    });
    report.failures = failures;

    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    logger.log(`woo_interaction_baseline report=${reportPath} failures=${failures.length}`);

    for (const failure of failures) {
      logger.error(failure);
    }

    return {
      exitCode: failures.length > 0 ? 1 : 0,
      report,
      reportPath,
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exitCode } = await runWooInteractionBaselineCli();
  process.exit(exitCode);
}
