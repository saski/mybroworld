# Shop Visual And Interaction Baseline

## Context

The catalog generator is customer-validated, so the shop replacement workstream now needs repeatable evidence for both visual parity and buyer interaction parity. The current production theme is `Glacier`; the target owned theme is `luciastuy`.

## Captured Baselines

Production `Glacier` visual baseline:

- Command: `scripts/woo-visual-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production --include-first-product --require-first-product --out-dir wordpress/.tmp/visual-baseline/2026-05-06-glacier-production`
- Result: 10 screenshots captured for home, shop, cart, checkout, and product detail on desktop/mobile.
- Product detail used: `https://www.luciastuy.com/product/fanzimad-2026-yuju/`

Local `luciastuy` visual baseline after interaction work:

- Command: `scripts/woo-visual-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local --include-first-product --require-first-product --out-dir wordpress/.tmp/visual-baseline/2026-05-06-luciastuy-local-after-interactions`
- Result: 10 screenshots captured for home, shop, cart, checkout, and product detail on desktop/mobile.
- Local port: `8090`, because `8080` was occupied by an unrelated Python `SimpleHTTP` process during validation.

Production `Glacier` interaction baseline:

- Command: `scripts/woo-interaction-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production --out-dir wordpress/.tmp/interaction-baseline/2026-05-06-glacier-production-final`
- Mode: non-mutating; no production cart mutation.
- Result: `failures=0`.

Local `luciastuy` interaction baseline:

- Command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local --allow-cart-mutation --out-dir wordpress/.tmp/interaction-baseline/2026-05-06-luciastuy-local-after-interactions`
- Mode: local cart mutation enabled.
- Result: `failures=0`.

Local `luciastuy` header/menu baseline after the first visual replacement slice:

- Command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-header-menu --allow-cart-mutation --out-dir wordpress/.tmp/interaction-baseline/2026-05-07-luciastuy-local-header-menu`
- Result: `failures=0`; navigation reported `logoImageCount=1`, `mobileMenu.toggleCount=1`, and `mobileMenu.opensOnToggle=true`.
- Visual command: `scripts/woo-visual-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-header-menu --paths /,/shop/,/cart/,/checkout/ --include-first-product --require-first-product --out-dir wordpress/.tmp/visual-baseline/2026-05-07-luciastuy-local-header-menu`
- Result: 10 screenshots captured for home, shop, cart, checkout, and product detail on desktop/mobile.

Production portfolio detail reference for the shop typography/grid slice:

- Reference URL: `https://www.luciastuy.com/portfolio/super-supergreat/`
- Result path: `wordpress/.tmp/visual-baseline/2026-05-07-glacier-portfolio-reference/`
- Observed pattern: large artwork image column, compact right-side metadata, uppercase tracked title and labels, restrained button treatment, generous desktop whitespace, and stacked mobile image-first rhythm.

Local `luciastuy` shop grid/product-detail baseline after the typography replacement slice:

- Interaction command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-grid-type-final --allow-cart-mutation --out-dir wordpress/.tmp/interaction-baseline/2026-05-07-luciastuy-local-grid-type-final`
- Result: `failures=0`; shop and product titles are uppercase with tracking, product title size is constrained, and the product primary image is present and visibly rendered.
- Visual command: `scripts/woo-visual-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-grid-type-final --paths /shop/ --include-first-product --require-first-product --out-dir wordpress/.tmp/visual-baseline/2026-05-07-luciastuy-local-grid-type-final`
- Result: 4 screenshots captured for shop and first product detail on desktop/mobile.
- Capture note: mobile full-page screenshots can occasionally omit the first product image even when the viewport render and DOM visibility checks show the image correctly. Treat `primaryImageVisibleCount` in the interaction report as the render evidence when this screenshot artifact appears.
- Style evidence from the interaction report:
  - shop page title: `fontSize=23.2px`, `letterSpacing=3.248px`, `textTransform=uppercase`
  - shop product title: `fontSize=13.12px`, `letterSpacing=2.3616px`, `textTransform=uppercase`
  - product title: `fontSize=26.4px`, `letterSpacing=3.168px`, `textTransform=uppercase`
  - product image: `primaryImageCount=7`, `primaryImageVisibleCount=1`

Local `luciastuy` cart/checkout baseline after the typography and spacing replacement slice:

- Interaction command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-cart-checkout-final --allow-cart-mutation --out-dir wordpress/.tmp/interaction-baseline/2026-05-07-luciastuy-local-cart-checkout-final`
- Result: `failures=0`; cart and checkout page titles, section headings, and primary checkout actions keep the uppercase tracked rhythm.
- Visual command: `scripts/woo-visual-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-cart-checkout-final --paths /cart/,/checkout/ --out-dir wordpress/.tmp/visual-baseline/2026-05-07-luciastuy-local-cart-checkout-final`
- Result: 4 screenshots captured for cart and checkout on desktop/mobile.
- Seeded mobile review path: `wordpress/.tmp/visual-baseline/2026-05-07-luciastuy-local-cart-checkout-final-seeded-mobile/`
- Style evidence from the interaction report:
  - cart page title: `fontSize=23.2px`, `letterSpacing=3.248px`, `textTransform=uppercase`
  - cart totals title: `fontSize=23.2px`, `letterSpacing=3.248px`, `textTransform=uppercase`
  - checkout page title: `fontSize=23.2px`, `letterSpacing=3.248px`, `textTransform=uppercase`
  - checkout section title: `fontSize=23.2px`, `letterSpacing=3.248px`, `textTransform=uppercase`
  - checkout payment methods: `paymentMethodCount=0`

Local `luciastuy` checkout readiness baseline after the local payment/shipping repair:

- Setup command: `scripts/wp-local-setup.sh`
- Repair result: local WooCommerce now uses `currency=EUR`, `default_country=ES`, enabled core payment gateway `bacs`, and shipping zone `Local checkout validation` with a zero-cost flat-rate method.
- Buyer-ready interaction command: `scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-payment-final --allow-cart-mutation --require-payment-method --out-dir wordpress/.tmp/interaction-baseline/2026-05-08-luciastuy-local-payment-final`
- Result: `failures=0`; checkout exposes an available payment method and the interaction report includes required billing/shipping/contact fields, including `billing_phone`.
- Local non-production BACS order test: WooCommerce order `16628`, status `on-hold`, payment method `bacs`, total `230.00 EUR`, product `Corriendo en bici`, billing/shipping address in Spain, buyer phone/email, and order note captured.
- Evidence path: `wordpress/.tmp/checkout-order-test/2026-05-08-local-bacs/`
- Scope note: this proves the owned theme and local WooCommerce checkout can create an order with core bank transfer. It does not replace the required production payment-provider decision or approved production/staging payment test.

## Interaction Results

Production `Glacier` supports:

- header cart affordance through `.cart-container` / `.icon-cart`
- navigation links
- shop sorting
- product links
- add-to-cart controls
- product gallery zoom trigger

Local `luciastuy` now supports:

- graphic Lucia Astuy header logo
- mobile `Menu` toggle that opens the primary navigation
- header cart link with count
- WooCommerce cart fragment refresh for AJAX add-to-cart
- portfolio-inspired shop typography, uppercase rhythm, image framing, outline button treatment, and desktop/mobile spacing
- portfolio-inspired product-detail layout with the image column leading and compact uppercase metadata/details
- portfolio-inspired cart and checkout typography, table/form spacing, neutral notices, outline primary actions, and mobile readability
- shop sorting
- product links
- add-to-cart controls
- product gallery zoom/lightbox/slider support with a visibly rendered primary image
- cart line item after local add-to-cart
- checkout link
- checkout buyer fields: name, address, phone, email, shipping data, and order notes
- local BACS checkout order creation through WooCommerce

## Code Changes Supporting The Baseline

- Added `scripts/woo-visual-baseline.mjs` for repeatable static screenshot capture.
- Added `scripts/woo-interaction-baseline.mjs` for repeatable buyer interaction replay.
- Extended the interaction baseline to assert a header logo image and mobile menu toggle.
- Extended the interaction baseline to assert shop/product uppercase tracking, product title scale, and visibly rendered primary product imagery.
- Extended the interaction baseline to assert cart and checkout uppercase tracking for page titles, section headings, and primary checkout actions.
- Updated `scripts/wp-local-setup.sh` to:
  - keep `home` and `siteurl` aligned with `WORDPRESS_INSTALL_URL`
  - ensure WooCommerce `shop`, `cart`, `checkout`, and `my-account` pages exist and are assigned
  - ensure local checkout readiness with core BACS, Spain/EUR defaults, and a flat-rate shipping method
- Added `scripts/wp-local-ensure-commerce-pages.php` for the WooCommerce page repair step.
- Added `scripts/wp-local-ensure-checkout-readiness.php` for the local payment/shipping repair step.
- Updated `luciastuy` theme to render the graphic logo, mobile menu toggle, header cart link/count, and WooCommerce gallery interaction support.
- Updated `luciastuy` theme CSS so shop cards and product detail pages inherit the portfolio-detail rhythm: Helvetica stack, uppercase tracked headings, reduced product title scale, wider desktop image/detail grid, unframed artwork images, outline commerce buttons, and one-column mobile spacing.
- Updated `luciastuy` theme CSS so cart and checkout inherit the same rhythm: uppercase tracked headings, neutral table/form treatment, mobile-stacked checkout fields, neutral notices, and non-purple outline WooCommerce actions.

## Remaining Gaps

- Visual identity still differs from production:
  - production has a shop sidebar with filters/categories/top-rated products; local intentionally uses a simpler full-width owned grid until filters are proven necessary
  - footer content remains minimal in local
- Production/staging payment configuration remains a launch blocker. The local BACS proof is not evidence that real buyer payments can be collected in production.
- A real approved payment test order is still required before buyer launch.

## Next Step

The header/brand/navigation, shop/product, cart/checkout visual, and local BACS order slices are interaction-tested. The next highest-leverage slice is the production/staging payment-provider decision and one approved end-to-end payment test order.
