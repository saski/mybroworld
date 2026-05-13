# Shop Theme Replacement And Checkout Readiness Plan

## Context

The catalog generator is working and has been validated by the customer. The next delivery stage is the online shop: evolve the owned `luciastuy` WooCommerce theme until it can replace the current production `Glacier` theme, then prove that the shop can take payments and capture the buyer data needed to ship each artwork.

Production WooCommerce already contains the canonical managed artwork products with images. The repository-owned theme lives in `wordpress/wp-content/themes/luciastuy/`; it has a first responsive shop/product baseline, but it has not yet passed a fresh visual comparison against the current production site.

Baseline evidence from 2026-05-06 lives in `thoughts/shared/plans/2026-05-06-shop-visual-interaction-baseline.md`.

The first header/brand/navigation replacement slice was completed on 2026-05-07: the owned theme now renders the Lucia Astuy graphic logo, exposes a header cart affordance, and uses a mobile `Menu` toggle that opens the primary navigation. The interaction baseline verifies the logo and menu toggle.

The shop grid/product-detail typography slice was completed on 2026-05-07: product cards and individual product pages now reuse the portfolio-detail visual rhythm through uppercase tracked headings, restrained Helvetica typography, unframed artwork images, outline button treatment, and adjusted desktop/mobile spacing. The interaction baseline verifies the shop/product typography contract and visible primary product imagery.

The cart/checkout typography and spacing slice was completed on 2026-05-08: cart and checkout now reuse the same uppercase tracked rhythm, neutral table/form treatment, mobile-stacked buyer fields, neutral notices, and outline primary actions. The interaction baseline verifies the cart/checkout typography contract.

The local checkout readiness slice was completed on 2026-05-08: local setup now repairs WooCommerce to `EUR`/`ES`, enables the core `bacs` gateway, creates a local flat-rate shipping method, and exposes a buyer-ready interaction gate with `--require-payment-method`. A non-production BACS checkout created local order `16628` with buyer billing, shipping, phone, email, product, payment status, and order note captured.

## Goal

Replace the commercial/builder-dependent shop presentation with owned code while keeping WooCommerce as the near-term commerce engine.

The buyer-ready definition is:

- the public site, shop, product, cart, and checkout surfaces visually fit the current Lucia Astuy identity closely enough to replace `Glacier`
- product images, titles, prices, availability, and add-to-cart actions remain correct
- checkout supports payment for purchasable artworks
- checkout captures buyer billing, shipping, contact, and order notes needed for artwork fulfillment
- order confirmation, admin notification, and fulfillment review are verified
- rollback to the current production theme remains possible until replacement is accepted

## Non-Goals

- Do not rebuild WooCommerce checkout from scratch.
- Do not introduce a commercial, paid, or freemium visual plugin.
- Do not add Elementor, Slider Revolution, gallery plugins, page builders, or broad visual dependencies.
- Do not replace primary artwork images with generated or decorative media.
- Do not deactivate production plugins in bulk.
- Do not run a real production payment test without explicit approval for the test order.

## Phase 1: Visual Baseline

1. Capture current production `Glacier` screenshots on desktop and mobile for:
   - `/`
   - `/shop/`
   - one available product page
   - `/cart/`
   - `/checkout/`
   - command: `scripts/woo-visual-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production --include-first-product --require-first-product`
2. Capture matching `luciastuy` screenshots from the local production snapshot.
   - command: `scripts/woo-visual-baseline.mjs --base-url http://localhost:8080 --label luciastuy-local --include-first-product`
3. Record differences in:
   - header and navigation
   - typography and spacing
   - product grid rhythm
   - product detail hierarchy
   - cart and checkout readability
   - footer and trust/support information
4. Decide which differences are required for replacement and which are acceptable simplifications.

## Phase 1b: Interaction Baseline

1. Capture the current production interaction affordances without mutating the production cart:
   - command: `scripts/woo-interaction-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production`
2. Capture the owned-theme interaction replay locally with cart mutation enabled:
   - command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local --allow-cart-mutation`
3. Compare:
   - navigation links and cart entry point
   - shop sorting
   - product-card links and add-to-cart actions
   - product detail image/gallery affordance
   - cart line-item behavior
   - checkout link and buyer field visibility
4. Treat required interaction gaps as replacement blockers, not cosmetic polish.

## Phase 2: Theme Replacement Work

1. Keep `scripts/wp-test-owned-code.sh` green before changing owned WordPress code.
2. Add or extend one test/assertion before each behavioral theme change when the behavior can be tested.
3. Implement visual changes in `wordpress/wp-content/themes/luciastuy/` using:
   - CSS first
   - WooCommerce hooks second
   - minimal template overrides only when hooks/CSS are not enough
4. Prioritize surfaces in this order:
   - header, navigation, and footer
   - product card and shop grid
   - product detail page
   - cart
   - checkout
5. Keep the rendered shop path free from new builder/plugin coupling.

## Phase 3: Checkout, Payment, And Buyer Data

1. Audit WooCommerce settings for:
   - currency
   - tax behavior
   - shipping zones and methods
   - checkout required fields
   - email notifications
   - stock/reservation behavior
   - order notes and fulfillment metadata
2. Choose the smallest payment configuration that satisfies customer needs and avoids paid add-ons.
3. Verify checkout captures:
   - buyer name
   - email
   - phone when needed for delivery coordination
   - billing address
   - shipping address
   - order notes for delivery constraints or pickup coordination
4. Verify each physical artwork product is not accidentally marked as virtual when shipping data is required.
5. Run an approved payment test order and record:
   - payment method
   - product id/title
   - order id
   - buyer-facing confirmation result
   - admin notification result
   - captured shipping fields
   - refund/cancel path if a real payment was used

## Phase 4: Production Replacement Gate

Before switching production to `luciastuy`, all checks below must pass:

1. Current production backup and rollback path are documented.
2. Owned-code checks pass.
3. Local validation passes with `WP_EXPECTED_THEME=luciastuy`.
4. Storefront UX assertion passes for shop and at least one product page.
5. Cart and checkout smoke checks pass.
6. Visual review is accepted on desktop and mobile.
7. Payment test order is approved and recorded.
8. Buyer billing/shipping data appears in the WooCommerce order record.
9. Customer can understand the order/fulfillment workflow.

## Phase 5: Customer Handoff

1. Ask the customer to browse the shop as a buyer.
2. Ask the customer to review one order in WordPress admin.
3. Confirm the customer knows where to find:
   - buyer contact details
   - shipping address
   - purchased artwork
   - payment status
   - order notes
4. Record any remaining issues as launch blockers or post-launch improvements.

## First Next Step

The visual and interaction baselines are captured, and the header/menu, shop/product, cart/checkout visual, and local BACS checkout slices are implemented. Next, decide the production/staging payment provider and run one approved real payment test order before launch.
