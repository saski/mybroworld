import test from 'node:test';
import assert from 'node:assert/strict';

import { runWooStorefrontUxAssertCli } from './woo-storefront-ux-assert.mjs';

test('runWooStorefrontUxAssertCli passes for a healthy WooCommerce shop grid and records dependency markers', async () => {
  const logs = [];
  const result = await runWooStorefrontUxAssertCli({
    argv: ['--paths', '/shop/'],
    env: {
      WP_BASE_URL: 'https://example.test',
    },
    fetchPage: async () => `
      <main>
        <ul class="products columns-4">
          <li class="product type-product">
            <a class="woocommerce-LoopProduct-link" href="/product/first/">
              <img src="/first.jpg" alt="First artwork">
              <h2 class="woocommerce-loop-product__title">First Artwork</h2>
              <span class="price">320.00€</span>
            </a>
            <a class="button add_to_cart_button" href="?add-to-cart=1">Add to cart</a>
          </li>
        </ul>
        <section class="elementor-section">legacy marker</section>
      </main>
    `,
    logger: {
      error: () => {},
      log: (message) => logs.push(message),
    },
  });

  assert.equal(result.exitCode, 0);
  assert.match(logs.join('\n'), /woo_storefront_ux_assert path=\/shop\/ cards=1 images=1 titles=1 prices=1 actions=1 dependencies=elementor/);
});

test('runWooStorefrontUxAssertCli fails when a product grid has no product actions', async () => {
  const errors = [];
  const result = await runWooStorefrontUxAssertCli({
    argv: ['--paths', '/shop/'],
    env: {
      WP_BASE_URL: 'https://example.test',
    },
    fetchPage: async () => `
      <main>
        <ul class="products">
          <li class="product type-product">
            <img src="/first.jpg" alt="First artwork">
            <h2 class="woocommerce-loop-product__title">First Artwork</h2>
            <span class="price">320.00€</span>
          </li>
        </ul>
      </main>
    `,
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
  });

  assert.equal(result.exitCode, 1);
  assert.match(errors.join('\n'), /missing_product_actions \/shop\//);
});

test('runWooStorefrontUxAssertCli fails forbidden dependency markers when requested', async () => {
  const errors = [];
  const result = await runWooStorefrontUxAssertCli({
    argv: ['--paths', '/product/first/', '--forbid-dependency-markers'],
    env: {
      WP_BASE_URL: 'https://example.test',
    },
    fetchPage: async () => `
      <main class="single-product">
        <div class="woocommerce-product-gallery"><img src="/first.jpg" alt="First artwork"></div>
        <h1 class="product_title">First Artwork</h1>
        <p class="price">320.00€</p>
        <button class="single_add_to_cart_button">Add to cart</button>
        <section class="related products"><h2>Related products</h2></section>
        <div class="revslider">legacy marker</div>
      </main>
    `,
    logger: {
      error: (message) => errors.push(message),
      log: () => {},
    },
  });

  assert.equal(result.exitCode, 1);
  assert.match(errors.join('\n'), /dependency_marker \/product\/first\/ revslider/);
});
