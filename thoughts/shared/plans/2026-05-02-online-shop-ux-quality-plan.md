# Online Shop UX Quality And Plugin Uncoupling Plan

## Overview

Improve the online shop UX shown in the product-page screenshot while maximizing WordPress plugin uncoupling. The UX work should make the shop feel intentional, consistent, and trustworthy, but the implementation should also reduce dependence on the commercial `Glacier` theme, builder plugins, widget/plugin side effects, and any new visual plugin.

The preferred path is an owned `luciastuy` WooCommerce theme plus small owned `mu-plugin` behavior where business rules are needed. WooCommerce core remains the commerce baseline; everything else must either be removed from the customer-facing shop path, isolated from the shop UX, or explicitly justified.

OpenAI Images is not a UX dependency. It can only be considered later as an offline secondary-media experiment after the real product imagery and owned theme UX are stable.

## Implementation Progress

- [x] Phase 1 automated UX assertion CLI and owned-code integration.
- [x] Phase 1 product image guidelines.
- [x] Phase 1 reference UX notes.
- [x] Phase 1 plugin inventory/removal preparation notes.
- [x] Phase 1 desktop/mobile screenshot capture and baseline notes.
- [ ] Phase 1 manual desktop/mobile screenshot review and reference-pattern confirmation.
- [x] Phase 2 first responsive owned product card system.
- [x] Phase 3 first product detail without sidebar or widget coupling.
- [ ] Phase 4 real image quality with owned media rules.
- [ ] Phase 5 local theme switch and plugin deactivation readiness.
- [ ] Phase 6 optional offline OpenAI Images secondary-media spike.
- [ ] Phase 7 production rollout and staged plugin uncoupling.

## Sources And Constraints

- User screenshot from `https://www.luciastuy.com/product/fanzimad-2026-yuju/`.
- Existing production shop status in `PROJECT_STATUS.md`: production WooCommerce exposes 20 canonical managed artwork products with images and no visible unmanaged legacy/demo products.
- WooCommerce audit in `thoughts/shared/docs/woocommerce-audit.md`: production uses the commercial `Glacier` theme and has builder/plugin coupling.
- Plugin inventory in `thoughts/shared/docs/wordpress-plugin-inventory.md`: `Elementor`, `Slider Revolution`, and `All-in-One WP Migration` are initial `CANDIDATE` plugins; `Yoast SEO`, `Contact Form 7`, and `Site Kit by Google` are `UNKNOWN`; WooCommerce is `KEEP`.
- Lean simplification loop in `thoughts/shared/docs/lean-ecommerce-simplification-loop.md`: remove or reduce one addition at a time with baseline checks, rollback, and learning.
- Active roadmap in `openspec/changes/plan-catalog-commerce-roadmap/`: ecommerce visual identity starts after the platform direction is accepted.
- Project rule: avoid commercial paid or freemium WordPress plugins; prefer WooCommerce core, WordPress core, and owned code.
- Product truth constraint: primary product images must show the actual artwork or product accurately.

## Reference UX Direction

Use the three reference sites as weighted input, not as equal style targets.

### Primary Client Fit: Artlogic

Artlogic is the strongest reference for customer trust. It signals gallery professionalism through generous spacing, restrained typography, clear navigation, calm product/exhibition presentation, and business-oriented confidence. For Lucia's shop, this means the product detail page and shop grid should feel closer to a gallery website than to a dense retail catalog.

Applicable patterns:

- quiet header and navigation
- large artwork-first presentation
- clear artist/artwork metadata
- visible enquiry or purchase path without visual pressure
- responsive gallery templates as a quality bar
- optional storytelling surfaces such as exhibitions or online viewing rooms

Avoid copying:

- SaaS-style marketing sections
- heavy platform/product messaging
- any dependence on a website-builder product

### Secondary Editorial Energy: AOTM

AOTM is useful for art-world character: strong typographic identity, editorial pacing, collection-led browsing, and a feeling that artworks live inside curated cultural context. It should influence Lucia's collection/editorial pages more than checkout-critical pages.

Applicable patterns:

- confident black/white system with precise borders
- collection-first navigation
- editorial cards and article-style context
- featured artwork/collection modules
- distinctive brand presence in header and section transitions

Avoid copying:

- overly experimental navigation that could confuse older or less technical buyers
- massive typographic branding inside checkout, cart, or product purchase moments
- digital-art marketplace assumptions that do not fit physical artwork

### Tertiary Marketplace Utility: Objkt

Objkt is useful for discovery and transaction clarity: search, filters, tabs, sorting, dense artwork grids, clear price/edition/seller signals, and fast scanning. These patterns should be selectively adapted to WooCommerce discovery, not imported wholesale.

Applicable patterns:

- search and filter affordances for larger catalogs
- sort controls for `Newest`, price, availability, and year
- compact metadata in grids
- clear availability/price states
- explicit action hierarchy

Avoid copying:

- wallet/login/web3 flows
- token, auction, edition, and blockchain terminology
- high-density marketplace chrome on Lucia's current small catalog

### Direction Decision

The proposed UX direction is: Artlogic-level trust and whitespace, AOTM-level editorial identity in controlled moments, and Objkt-level utility only where it improves discovery or buying confidence.

This means the implementation should not become a generic WooCommerce store, a maximal AOTM homage, or an Objkt-style NFT marketplace. It should become an owned-code gallery shop for physical/digital artworks with calm buying paths and enough editorial character to feel like Lucia.

## Current State

- The product grid in the screenshot has uneven card rhythm: image sizes differ, the fourth product appears visually smaller because the artwork sits inside a large white area, and cart buttons do not align consistently.
- Product titles use high letter spacing and uppercase styling that makes long titles harder to read.
- Price, title, and action placement are not visually unified across related products.
- The right-side product list competes with the main related-products section and uses smaller thumbnails that feel disconnected from the primary grid.
- The footer starts after a large blank area, making the page feel unfinished.
- Production still carries a commercial/builder visual stack:
  - `Glacier` active production theme.
  - `Elementor` active.
  - `Slider Revolution` active.
  - Additional active plugins with unclear shop relevance.
- The repo-owned `wordpress/wp-content/themes/luciastuy/` theme is intentionally minimal:
  - `woocommerce.php` delegates to `woocommerce_content()`.
  - `style.css` has only baseline global styling.
  - `functions.php` only registers basic theme support and the stylesheet.
- Validation already exists through:
  - `scripts/wp-test-owned-code.sh`
  - `scripts/wp-local-validate.sh`
  - `scripts/wp-smoke-test.mjs`
  - `scripts/woo-storefront-assert.mjs`

## Desired End State

- The public shop UX is served by owned code:
  - `wordpress/wp-content/themes/luciastuy/`
  - `wordpress/wp-content/mu-plugins/`
  - WooCommerce core APIs and templates where practical.
- No shop UX behavior depends on `Glacier`, Elementor, Slider Revolution, a product-gallery plugin, a related-products plugin, or an AI image plugin.
- The visual system balances:
  - Artlogic-inspired gallery trust for shop and product pages.
  - AOTM-inspired editorial identity for collection, artist, and story surfaces.
  - Objkt-inspired marketplace utility for search, filters, sorting, and availability signals.
- Product cards use a stable image frame, consistent spacing, readable titles, clear prices, and aligned actions across shop grids and related-product sections.
- Product images remain truthful to the real artwork while being visually normalized through framing, aspect ratio, scale, and background rules.
- Product detail pages have a clear hierarchy: artwork image, title, price/status, purchase action, product information, and related products.
- Secondary/sidebar product lists are either removed from product pages or rendered by owned theme code so they do not compete with the main buying flow.
- Optional plugins such as SEO, analytics, migration, and contact-form tooling are not allowed to shape the product-card, product-detail, cart, checkout, or related-products UX.
- Any AI-generated imagery is optional, secondary, governed, and never used as the primary representation of the artwork for sale.

## Plugin Coupling Targets

| Surface | Current Coupling | Target Decision |
|---|---|---|
| WooCommerce | Core commerce plugin | Keep as the baseline commerce engine. |
| Glacier | Commercial active production theme | Replace in the shop path with the owned `luciastuy` theme after local validation and rollback gate. |
| Elementor | Active builder plugin | Do not build new shop UX on it; candidate for staged deactivation after owned theme validation proves no critical shop dependency. |
| Slider Revolution | Active builder/visual plugin | Do not use for shop UX; candidate for staged deactivation after checking home/front-page impact. |
| All-in-One WP Migration | Infrastructure plugin | Keep out of runtime UX; candidate for production deactivation/removal after backup workflow is proven. |
| Yoast SEO | Infrastructure plugin | Do not let it influence UX scope; keep or remove only after separate evidence. |
| Contact Form 7 | Content/editorial plugin | Do not use for product purchase/inquiry behavior unless explicitly approved. |
| Site Kit by Google | Infrastructure plugin | Do not couple shop UI to it; keep or remove only after analytics decision. |
| New visual plugins | None planned | Forbidden for this plan. |
| OpenAI Images plugin | None planned | Forbidden; any AI image experiment must be offline and imported as reviewed media only. |

## Out Of Scope

- Replacing WooCommerce.
- Rebuilding checkout or payments.
- Adding commercial, freemium, or broad third-party WordPress plugins.
- Introducing a page builder, product-gallery plugin, related-products plugin, image-optimization plugin, or AI image plugin.
- Changing canonical artwork data in Google Sheets.
- Changing PDF catalog layout.
- Replacing primary product photos with AI-generated images.
- Bulk-deactivating production plugins.
- Running production writes during the local implementation phases.

## Design Options

### Option A: Owned Theme Uncoupling First

Build the storefront UX in the repo-owned `luciastuy` theme using WooCommerce core markup, theme CSS, hooks, and minimal template overrides only when CSS cannot create stable behavior. The visual direction is Artlogic-first for trust, with limited AOTM editorial accents and selective Objkt utility.

Tradeoffs:

- Pros: maximizes plugin uncoupling, aligns with the lean-commerce rule, removes dependence on the commercial visual layer, keeps deployment reviewable, and lets tests cover owned code.
- Cons: requires more local visual QA and a carefully gated production theme switch.

Decision: preferred.

### Option B: Cosmetic Fixes Inside Glacier Or Builder Plugins

Patch the current production look through Glacier, Elementor, Slider Revolution, theme options, or plugin-provided UI controls.

Tradeoffs:

- Pros: may be faster for one visual issue.
- Cons: deepens dependence on commercial/builder code, keeps outdated WooCommerce overrides in the critical path, and makes future removal harder.

Decision: reject for this plan.

### Option C: External Image Or Gallery Product

Adopt OpenAI Images, an image-enhancement plugin, a gallery plugin, or a visual merchandising plugin to improve perceived quality.

Tradeoffs:

- Pros: can create polished secondary assets or richer visual presentation.
- Cons: does not fix the layout hierarchy, risks misrepresenting artwork, and adds another runtime dependency before the owned shop UX is stable.

Decision: defer and keep offline only if later accepted.

## Approach

Implement Option A in small test-first phases. Treat plugin uncoupling as a success criterion for every UX change, not a separate cleanup project.

Implementation principles:

- Use owned theme CSS first.
- Use WooCommerce hooks before template overrides when hooks keep the code smaller and clearer.
- Use minimal WooCommerce template overrides only after a failing check or visual QA proves CSS/hooks cannot produce stable behavior.
- Keep business rules in `mu-plugins`; keep visual presentation in the theme.
- Do not add plugins.
- Do not copy Glacier, Elementor, Slider Revolution, or builder-generated markup into the owned theme.
- Deactivate or remove existing plugins only through the one-candidate simplification loop, with backup and rollback notes.

## Phase 1: Dependency And UX Baseline

Goal: establish what currently affects shop UX, then create automated checks before changing presentation.

Expected file changes:

- `scripts/woo-storefront-ux-assert.mjs`
- `scripts/woo-storefront-ux-assert.test.mjs`
- `scripts/wp-test-owned-code.sh`
- `thoughts/shared/docs/ecommerce-product-image-guidelines.md`
- `thoughts/shared/docs/wordpress-plugin-inventory.md`
- `thoughts/shared/docs/wordpress-plugin-removal-log.md`

Implementation steps:

1. Add one failing Node test for a storefront UX assertion CLI.
2. Implement read-only checks for shop and product pages:
   - product grid exists
   - product images exist
   - product titles exist
   - prices exist when provided by WooCommerce
   - add-to-cart links or buttons exist for purchasable products
   - no obvious critical-error text appears
3. Add a dependency scan that records whether rendered shop/product HTML contains builder/plugin markers such as `elementor`, `revslider`, `js_composer`, or `glacier`.
4. Wire the new test into `scripts/wp-test-owned-code.sh`.
5. Re-capture plugin active/inactive status and versions in `thoughts/shared/docs/wordpress-plugin-inventory.md`.
6. Create product-image guidelines covering truthful primary imagery, square framing, minimum useful resolution, neutral background treatment, and secondary-image rules.
7. Capture desktop and mobile screenshots of `/shop/` and one product page for manual comparison.
8. Capture reference notes for Artlogic, AOTM, and Objkt in the implementation issue or progress notes so visual decisions do not drift into plugin-driven copying.

Automated success criteria:

```bash
node --test scripts/woo-storefront-ux-assert.test.mjs
scripts/wp-test-owned-code.sh
WP_BASE_URL=http://localhost:8080 WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 scripts/wp-plugin-removal-smoke.sh
rg -n "elementor|revslider|js_composer|visual-portfolio|acf_pro|glacier" wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins
```

Manual success criteria:

- Desktop and mobile screenshots show the current baseline for `/shop/` and one canonical product page.
- The baseline records which plugin/theme markers appear in the current rendered shop path.
- The screenshot notes identify the exact first visual issues to fix: image frame, card spacing, title readability, price/action alignment, and secondary product-list priority.
- The reference notes explicitly classify each proposed visual pattern as `Artlogic trust`, `AOTM editorial`, `Objkt utility`, or `reject`.

Phase 1 baseline notes captured on 2026-05-02:

- Local `/shop/` still renders the legacy `Glacier` shop hero and large vertical whitespace before products. On mobile, the first viewport reaches the sort control but not the product grid.
- Local product detail for `/product/fanzimad-2026-yuju/` renders a large truthful artwork image, but keeps the legacy right sidebar with categories, cart, and top-rated products competing with the artwork.
- The UX assertion recorded local rendered dependency markers: `elementor`, `revslider`, `js_composer`, `visual-portfolio`, and `glacier`.
- The owned code scan found no such markers in `wordpress/wp-content/themes/luciastuy` or `wordpress/wp-content/mu-plugins`.
- First visual issues for Phase 2/3: remove the Glacier hero rhythm, bring product grids into view earlier, normalize card frames, align action placement, reduce uppercase/tracking pressure, and remove product-detail sidebar competition.
- Reference classification: product-card and product-detail calmness should be `Artlogic trust`; collection/story accents can be `AOTM editorial`; search/sort/filter should use `Objkt utility`; builder/plugin-driven visual fixes are `reject`.

## Phase 2: Owned Product Card System

Goal: make shop grids and related-product cards consistent in the owned theme without adding or relying on visual plugins.

Expected file changes:

- `wordpress/wp-content/themes/luciastuy/functions.php`
- `wordpress/wp-content/themes/luciastuy/style.css`
- `wordpress/wp-content/themes/luciastuy/woocommerce/content-product.php` only if default WooCommerce markup cannot support stable card actions.
- `scripts/woo-storefront-ux-assert.mjs`
- `scripts/woo-storefront-ux-assert.test.mjs`

Implementation steps:

1. Add one failing assertion that checks product cards expose image, title, price, and action in a stable card structure.
2. Configure WooCommerce thumbnail intent in `functions.php` if needed.
3. Style product cards in `style.css`:
   - stable grid tracks
   - square image frame
   - `object-fit: contain` for artwork truth
   - neutral image background
   - readable Artlogic-leaning title typography with no excessive tracking
   - price close to the title
   - aligned add-to-cart action
   - compact Objkt-style availability and status signals only when they improve scanability
4. Use WooCommerce hooks to adjust card order before adding an override.
5. Add a minimal `content-product.php` override only if hooks and CSS cannot keep image/title/price/action stable.
6. Verify long Spanish titles wrap cleanly without overlapping buttons or prices.
7. Verify no builder/plugin selectors or markup are introduced into the owned theme.

Automated success criteria:

```bash
node --test scripts/woo-storefront-ux-assert.test.mjs
scripts/wp-test-owned-code.sh
WP_BASE_URL=http://localhost:8080 scripts/woo-storefront-ux-assert.mjs --paths /shop/
rg -n "elementor|revslider|js_composer|visual-portfolio|acf_pro|glacier" wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins
```

Manual success criteria:

- `/shop/` desktop and mobile screenshots show consistent image frames and aligned actions.
- Long product names remain readable and do not resize the card unpredictably.
- Artwork is not cropped in a way that changes the product being sold.
- The grid feels like a calm gallery shop, not a dense NFT marketplace.

Phase 2 implementation notes captured on 2026-05-02:

- Added responsive owned-theme product grid CSS in `wordpress/wp-content/themes/luciastuy/style.css`.
- Added stable square image frames using `object-fit: contain` and neutral surfaces.
- Aligned product buttons independently from image and title height.
- Switched stylesheet versioning to `filemtime()` so visible CSS changes are not hidden by stale browser cache.
- Local mobile `/shop/` now shows the header, sort control, and product cards in the first viewport instead of the large legacy `Glacier` hero.

## Phase 3: Product Detail Without Sidebar Or Widget Coupling

Goal: improve the specific product-page UX shown in the screenshot while removing dependence on theme/plugin sidebars, widgets, and visual-builder sections.

Expected file changes:

- `wordpress/wp-content/themes/luciastuy/functions.php`
- `wordpress/wp-content/themes/luciastuy/style.css`
- `wordpress/wp-content/themes/luciastuy/woocommerce.php`
- `wordpress/wp-content/themes/luciastuy/woocommerce/single-product/related.php` only if default related-product output needs structural control.
- `wordpress/wp-content/themes/luciastuy/woocommerce/single-product/product-image.php` only if default image markup cannot support the desired frame.
- `scripts/woo-storefront-ux-assert.mjs`
- `scripts/woo-storefront-ux-assert.test.mjs`

Implementation steps:

1. Add one failing assertion for product detail pages that checks a product image, title, price/status, add-to-cart area, and related-products section.
2. Style the product detail layout with clear hierarchy and constrained line lengths.
3. Reuse the Phase 2 card system for related products.
4. Remove product-page sidebar/widget dependency from the owned theme path.
5. Do not recreate the screenshot's competing right-side product list unless it is implemented as an intentional, quiet owned component.
6. Tighten the page/footer vertical rhythm so the page does not end with a large empty area.
7. Add an Artlogic-inspired information rhythm: artwork, title, price/status, action, essential metadata, then related works.
8. Reserve AOTM-inspired typographic personality for section labels or collection/story modules, not purchase controls.
9. Add targeted WooCommerce template overrides only if CSS/hooks cannot control related-product structure safely.

Automated success criteria:

```bash
node --test scripts/woo-storefront-ux-assert.test.mjs
scripts/wp-test-owned-code.sh
WP_BASE_URL=http://localhost:8080 WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 scripts/wp-plugin-removal-smoke.sh
rg -n "dynamic_sidebar|is_active_sidebar|elementor|revslider|js_composer|glacier" wordpress/wp-content/themes/luciastuy
```

Manual success criteria:

- Product-page screenshots at desktop and mobile show a clear primary product hierarchy.
- Related products feel like a deliberate section, not loose unaligned items.
- No page-builder or widget-provided product list competes visually with the main section.
- Product detail feels closer to a gallery artwork page than to a generic WooCommerce product page.

Phase 3 implementation notes captured on 2026-05-02:

- Added responsive product detail layout in the owned theme.
- Desktop product detail now uses a two-column artwork-first layout with summary beside the image.
- Mobile product detail now uses a single column with artwork first, then title, price/status, and metadata.
- The owned `luciastuy` product page has no right sidebar, category widget, cart widget, or top-rated-products widget competing with the artwork.
- Local WP-CLI was able to activate `luciastuy` using `--skip-themes --skip-plugins`; the original `Glacier` path crashed under WP-CLI, confirming the coupling risk.

## Phase 4: Real Image Quality With Owned Media Rules

Goal: improve perceived image quality through source-image rules, WordPress media ownership, and audit tooling before considering AI-generated assets.

Expected file changes:

- `scripts/woo-image-quality-audit.mjs`
- `scripts/woo-image-quality-audit.test.mjs`
- `scripts/wp-test-owned-code.sh`
- `thoughts/shared/docs/ecommerce-product-image-guidelines.md`
- `thoughts/shared/docs/customer-testing-and-handoff.md`

Implementation steps:

1. Add one failing test for classifying product media quality risks.
2. Implement a read-only audit that reports:
   - missing image
   - too-small image when dimensions are available
   - unsupported image MIME or extension when metadata is available
   - missing managed artwork identity
   - product image count lower than the agreed minimum
3. Document operator guidance for preparing product images:
   - one truthful primary image per product
   - consistent square framing for thumbnails
   - full artwork visible unless the image is explicitly a detail shot
   - secondary context images allowed only after primary image is correct
4. Confirm storefront images are served from WordPress/WooCommerce media entries, not from a live dependency on Drive URLs or a gallery plugin.
5. Add the image review checklist to the customer shop validation guide.
6. Triage the screenshot's visible image issues into source-image fixes versus CSS frame fixes.

Automated success criteria:

```bash
node --test scripts/woo-image-quality-audit.test.mjs
scripts/wp-test-owned-code.sh
WOO_BASE_URL=http://localhost:8080 scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images --forbid-unmanaged-products
```

Manual success criteria:

- The products visible in the screenshot have normalized thumbnail presentation.
- Any product that still looks weak has a recorded source-image issue, not an unexplained template issue.
- No image-quality improvement requires adding a WordPress image/gallery/AI plugin.

## Phase 5: Local Theme Switch And Plugin Deactivation Readiness

Goal: prove the owned shop path can run without Glacier/builder UX dependencies before any production plugin deactivation.

Expected file changes:

- `scripts/wp-local-validate.sh` only if validation needs a new local switch flag.
- `thoughts/shared/docs/wordpress-plugin-inventory.md`
- `thoughts/shared/docs/wordpress-plugin-removal-log.md`
- `thoughts/shared/docs/customer-testing-and-handoff.md`
- `thoughts/shared/docs/deploy-wordpress.md`

Implementation steps:

1. Validate `luciastuy` locally as the expected theme.
2. Run the storefront UX assertions against local shop and product pages.
3. Confirm no owned theme file references `Glacier`, Elementor, Slider Revolution, WPBakery, or bundled builder APIs.
4. For each candidate plugin, write a one-candidate simplification record before changing anything:
   - candidate
   - Lean hypothesis
   - risk
   - rollback
   - baseline checks
   - post-change checks
5. Prioritize candidates in this order unless fresh evidence changes it:
   - `Slider Revolution`
   - `Elementor`
   - `All-in-One WP Migration`
   - `Contact Form 7` only if no live forms are needed
   - `Site Kit by Google` only after analytics decision
   - `Yoast SEO` only after SEO decision
6. Do not deactivate more than one plugin per cycle.

Automated success criteria:

```bash
scripts/wp-test-owned-code.sh
WP_EXPECTED_THEME=luciastuy scripts/wp-local-validate.sh
rg -n "elementor|revslider|js_composer|visual-portfolio|acf_pro|glacier" wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins
```

Manual success criteria:

- Local shop and product pages remain usable under `luciastuy`.
- The first production plugin-deactivation candidate has a written rollback path and exact checks.
- No plugin is marked safe to remove only because the UX looks better; every removal follows the simplification loop.
- The owned theme shows the accepted Artlogic/AOTM/Objkt blend without relying on Elementor, Slider Revolution, or Glacier.

## Phase 6: Optional Offline OpenAI Images Secondary-Media Spike

Goal: decide whether AI-generated secondary imagery is worth adding after the real-product UX and plugin-uncoupled shop path are stable.

Expected file changes:

- `thoughts/shared/docs/ecommerce-ai-image-policy.md`
- `thoughts/shared/docs/ecommerce-product-image-guidelines.md`
- `thoughts/shared/docs/artwork-data-contract.md` only if secondary image roles become part of the catalog/source contract.

Implementation steps:

1. Write a policy before generating or publishing any AI-assisted image:
   - primary product images must be real product/artwork images
   - AI-generated images cannot alter the artwork being sold
   - AI-generated images can only be secondary context/mockup images
   - every generated image must be reviewed before upload
   - no WordPress AI image plugin is allowed
2. Produce a tiny offline sample for one or two products only after Phase 5 is accepted.
3. Compare the sample against real-image improvements:
   - customer clarity
   - perceived quality
   - risk of misrepresentation
   - operator effort
   - dependency cost
4. If accepted, import generated images as reviewed WordPress media and extend the data contract with explicit image roles before adding them to WooCommerce galleries.
5. If rejected, keep OpenAI Images out of the storefront workflow.

Automated success criteria:

```bash
scripts/wp-test-owned-code.sh
scripts/secret-scan.sh
rg -n "openai|image plugin|gallery plugin" wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins
```

Manual success criteria:

- The decision is recorded in `thoughts/shared/docs/ecommerce-ai-image-policy.md`.
- No AI-generated image is used as a primary product image.
- No AI workflow adds a WordPress runtime plugin.
- At least one before/after comparison proves the AI image adds value beyond the improved real-image frame.

## Phase 7: Production Rollout And Staged Plugin Uncoupling

Goal: deploy the accepted owned UX safely, then reduce plugin coupling one production candidate at a time.

Expected file changes:

- `wordpress/README.md`
- `thoughts/shared/docs/customer-testing-and-handoff.md`
- `thoughts/shared/docs/deploy-wordpress.md`
- `thoughts/shared/docs/wordpress-plugin-removal-log.md`
- `PROJECT_STATUS.md`

Implementation steps:

1. Run the local owned-code and storefront checks.
2. Validate the owned theme locally against the production snapshot.
3. Prepare a WordPress owned-code deployment manifest.
4. Deploy only after the existing WordPress rollback automation gate is satisfied.
5. Run production smoke checks for `/`, `/shop/`, `/cart/`, `/checkout/`, and at least one product page.
6. Ask the customer to validate the online shop checklist with screenshots for any issue.
7. Update `PROJECT_STATUS.md` with the rollout result and any remaining UX gaps.
8. Start plugin uncoupling only after the owned UX is healthy in production.
9. Deactivate or remove one production plugin candidate at a time, following `thoughts/shared/docs/lean-ecommerce-simplification-loop.md`.
10. Log each candidate result immediately in `thoughts/shared/docs/wordpress-plugin-removal-log.md`.

Automated success criteria:

```bash
scripts/wp-test-owned-code.sh
WP_EXPECTED_THEME=luciastuy scripts/wp-local-validate.sh
WOO_BASE_URL=https://www.luciastuy.com scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images --forbid-unmanaged-products
WP_BASE_URL=https://www.luciastuy.com WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 WP_SMOKE_PATHS="/,/shop/,/cart/,/checkout/" scripts/wp-plugin-removal-smoke.sh
```

Manual success criteria:

- Customer can open the shop and three product pages without broken layout sections.
- Product image, title, price/status, cart, and checkout checks from `thoughts/shared/docs/customer-testing-and-handoff.md` pass.
- Every production plugin deactivation has a backup, baseline, post-change check, and rollback note.
- Remaining UX issues are recorded as new small follow-up tasks, not mixed into plugin removal.

## Phase Boundaries

- Phase 1 must pass before theme styling changes begin.
- Phase 2 must pass before product detail styling begins.
- Phase 3 must pass before source-image normalization is judged, because bad framing can look like bad images.
- Phase 4 must pass before the owned theme is considered ready for a local switch.
- Phase 5 must pass before any OpenAI Images experiment or production plugin deactivation.
- Phase 6 is optional and can be skipped without blocking production UX rollout.
- Phase 7 starts only after local validation is green and the WordPress deployment safety gate is satisfied.

## Implementation Notes

- Prefer CSS in `wordpress/wp-content/themes/luciastuy/style.css` before adding WooCommerce template overrides.
- Keep any template overrides small and specific.
- Do not add a page builder, product gallery plugin, AI image plugin, image optimizer plugin, or paid visual plugin.
- Do not copy or depend on Glacier, Elementor, Slider Revolution, WPBakery, bundled ACF Pro, or builder-generated markup.
- Treat Artlogic as the approval anchor for customer confidence; use AOTM and Objkt as selective pattern libraries, not as the final aesthetic.
- Reject any reference-inspired pattern that requires a new runtime plugin.
- Use the one-candidate simplification loop for plugin changes.
- Keep all code, docs, test names, and commit messages in English.
- Follow TDD during implementation: add one failing test before each behavior change.
- Do not change user or unrelated work currently present in the git tree.

## Proposed Next Step

Run:

```bash
fic-implement-plan thoughts/shared/plans/2026-05-02-online-shop-ux-quality-plan.md
```
