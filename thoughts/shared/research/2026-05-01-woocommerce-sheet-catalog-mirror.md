# WooCommerce Sheet Catalog Mirror Research

## Summary

The repository currently has a working Google-Sheet-to-PDF catalog pipeline and a small repo-owned WordPress/WooCommerce custom-code surface. It does not yet have an implemented Google-Sheet-to-WooCommerce mirror that creates, updates, prices, stocks, or publishes products from the catalog source data.

The current data contract already names the shared artwork fields that will matter for a WooCommerce mirror, including `artwork_id`, `status_normalized`, `price_display_clean`, `image_main`, `include_in_catalog`, and `catalog_ready`. The contract explicitly describes this as shared by the WooCommerce custom layer and the catalog generator before sync logic exists.

The repo-owned WordPress theme is intentionally lightweight today: a minimal WooCommerce-enabled theme, generic `woocommerce_content()`, and a 48-line stylesheet. The production snapshot, however, is still based on the third-party `Glacier` theme with Elementor/Slider Revolution coupling and outdated WooCommerce overrides documented as high maintenance risk.

Fast checks passed during this research pass:

- `npm --prefix catalog-generator test`: 12 passing tests.
- `scripts/wp-test-owned-code.sh`: PHP lint, owned PHP tests, smoke-helper tests, deploy script dry-run tests, and local-runtime script tests passed.

## Detailed Findings

### Catalog Source Contract

The canonical artwork contract lives in `thoughts/shared/docs/artwork-data-contract.md`. It defines the shared fields for catalog and WooCommerce work before sync logic is introduced, including stable identity, public title, dimensions, status, price display, image, catalog gates, and public notes.

Evidence:

- `thoughts/shared/docs/artwork-data-contract.md:3-6` defines the objective as the canonical fields shared by WooCommerce and the catalog generator before sync logic.
- `thoughts/shared/docs/artwork-data-contract.md:11-29` lists canonical fields including `artwork_id`, `title_clean`, `status_normalized`, `price_display_clean`, `image_main`, `include_in_catalog`, `catalog_ready`, `catalog_order`, `show_price`, and `catalog_notes_public`.
- `thoughts/shared/docs/artwork-data-contract.md:46-57` defines the status enum.
- `thoughts/shared/docs/artwork-data-contract.md:77-84` defines public display rules and price visibility rules.
- `catalog-generator/data/CATALOGO_BASE.csv:1-5` shows the current CSV source shape with both raw and normalized fields, including `availability_flag_raw`, `status_normalized`, `location_clean`, `include_in_catalog`, `catalog_ready`, image fields, price fields, and `artwork_id`.

Observed risk:

- The current contract is catalog-oriented and shared-field-oriented, but product identity and commerce state are not yet modeled in WordPress code. There is no current owned implementation that maps `artwork_id` to a WooCommerce SKU/product ID, product status, stock state, or purchasability.

Observed improvement area:

- The main unimplemented area is the commerce-specific interpretation of the existing canonical fields: which rows become products, which products are purchasable, how price and stock are enforced, and how status transitions such as `reserved` or `sold` affect a live product.

### Google Sheets Catalog Action

The Google Sheets action currently queues PDF catalog jobs. It discovers compatible tabs by canonical headers, writes jobs into `catalog_jobs`, and lets a local agent claim jobs by execution profile.

Evidence:

- `catalog-generator/apps-script/Code.gs:1-15` defines the Apps Script menu and required catalog headers.
- `catalog-generator/apps-script/Code.gs:110-181` queues catalog jobs with profile, tab scope, title, output folder, output filename, and `queued` status.
- `catalog-generator/apps-script/Code.gs:292-333` discovers compatible visible tabs by required headers and excludes helper sheets.
- `catalog-generator/apps-script/CatalogSidebar.html:158-216` presents a "Catalog Queue" sidebar with execution profile, scope mode, catalog title, artist name, output folder, filename, and queue/open-jobs actions.
- `thoughts/shared/docs/google-sheets-catalog-action.md:5-13` documents the split between bound Apps Script and local `catalog-agent`.
- `thoughts/shared/docs/google-sheets-catalog-action.md:66-82` documents scope modes and job states.

Observed risk:

- The Sheet action is a PDF-generation queue, not a product-sync queue. Its job contract has output PDF fields, Drive upload fields, and catalog generation states, but no WooCommerce endpoint, product update mode, dry-run product diff, or commerce result fields.

Observed improvement area:

- The existing queue/profile/tab-selection mechanics are reusable infrastructure for operator-triggered work, but the current job contract is scoped to PDFs only.

### Catalog Generator

The generator reads a CSV file or public Sheets CSV export, filters rows by `include_in_catalog` and `catalog_ready`, normalizes artwork status, builds public display fields, renders HTML, and uses Puppeteer to produce a PDF.

Evidence:

- `catalog-generator/src/catalog-generator.mjs:217-241` resolves CLI options from flags and environment.
- `catalog-generator/src/catalog-generator.mjs:244-268` reads either a URL or local CSV path.
- `catalog-generator/src/catalog-generator.mjs:270-310` filters included/ready rows, normalizes status, controls price display, derives catalog section, requires title and image URL, and sorts output.
- `catalog-generator/src/template.js:76-121` renders an artwork page with image, title, year, dimensions, technique, price/status, and note.
- `catalog-generator/src/template.js:124-164` renders the PDF cover, artwork pages, and closing page.
- `catalog-generator/src/styles.css:1-264` is the PDF-specific A4 layout and editorial styling surface.
- `catalog-generator/test/catalog-generator-cli.test.mjs:23-117` covers CLI output, catalog title/artist handling, status-led cover behavior, centered metadata, and closing mark.

Observed risks:

- The generator filters out missing title/image after row inclusion, but it does not currently reject all commerce-critical gaps for available works. For example, an `available` row with `show_price` true but blank `price_display_clean` would be included if it has title and image; the template would render neither a price nor a status label because `available` has no status label.
- Unknown `status_normalized` values normalize to an empty string. In the generator, non-available statuses default to the `historical` section, but unknown statuses do not produce an explicit public label.
- Multi-tab merging concatenates rows from selected sheets. `catalog-generator/catalog-agent/src/job-queue.mjs:51-80` validates required headers and merges rows, but it does not deduplicate by `artwork_id` or detect conflicting duplicates across year tabs.

Observed improvement area:

- The PDF generator already has the first version of availability and price-display rules. A WooCommerce mirror would need stricter selling-readiness behavior than the current presentation pipeline.

### Local Catalog Agent

The local agent watches configured spreadsheets, claims the oldest queued job for its profile, resolves queued tabs, merges sheet data into CSV, renders the PDF, uploads it to Drive, and writes job results back to `catalog_jobs`.

Evidence:

- `catalog-generator/catalog-agent/src/agent.mjs:58-183` processes a claimed job through `exporting`, `merging`, `rendering`, `uploading`, and `completed` states.
- `catalog-generator/catalog-agent/src/agent.mjs:98-113` resolves queued sheets and reads their rows.
- `catalog-generator/catalog-agent/src/agent.mjs:126-147` writes merged CSV and calls `generateCatalog`.
- `catalog-generator/catalog-agent/src/agent.mjs:160-183` uploads the PDF to Drive and stores result fields.
- `catalog-generator/catalog-agent/src/agent.mjs:221-264` claims jobs using a token and re-reads the row to avoid contested claims.
- `catalog-generator/catalog-agent/src/agent.mjs:266-280` checks that the authenticated Google identity matches the configured account.
- `catalog-generator/catalog-agent/config.example.json:1-12` shows the current local-agent config shape.

Observed risk:

- The agent has no WooCommerce client, no WordPress authentication path, no product write operation, and no product result reporting. Its security and identity checks are Google-account-oriented only.

Observed improvement area:

- The agent is already the only component that can bridge local credentials, Google Sheets, generated artifacts, and long-running jobs. That makes it the current operational boundary where any future product mirror behavior would likely be detected or separated from the PDF path.

### WordPress/WooCommerce Owned Code

The owned WordPress layer consists of a minimal theme and two small `mu-plugin` modules for artwork metadata and status labels.

Evidence:

- `wordpress/README.md:20-27` states that the workspace is owned-code-only and that imported `Glacier` is audit evidence and migration source material.
- `wordpress/wp-content/themes/luciastuy/functions.php:9-28` enables title tag, thumbnails, WooCommerce, HTML5, and a primary nav menu.
- `wordpress/wp-content/themes/luciastuy/functions.php:30-41` enqueues only the theme stylesheet.
- `wordpress/wp-content/themes/luciastuy/woocommerce.php:9-19` delegates WooCommerce rendering to `woocommerce_content()`.
- `wordpress/wp-content/themes/luciastuy/style.css:1-48` is the entire current owned storefront stylesheet.
- `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php:9-35` normalizes artwork statuses and maps labels such as `Reservada`, `Obra no disponible`, and `Obra histórica`.
- `wordpress/wp-content/mu-plugins/lucia-artwork-meta.php:9-80` stores current location, location history, and submission history metadata.
- `wordpress/wp-content/mu-plugins/tests/lucia-artwork-rules-test.php:21-24` covers `reserved` normalization and label behavior.
- `wordpress/wp-content/mu-plugins/tests/lucia-artwork-meta-test.php:34-72` covers stable meta keys, history normalization, current-location derivation, and post-meta writes.

Observed risks:

- The owned WordPress code does not currently include a product importer, product updater, WooCommerce product-field mapper, stock-state mapper, SKU mapper, or product image attachment pipeline.
- Status normalization exists as label logic only. It does not currently control WooCommerce product visibility, product purchasability, `_stock_status`, catalog visibility, or checkout availability.
- Location and submission metadata are persisted, but status, price, dimensions, image, and `artwork_id` are not currently persisted by the owned `mu-plugin` layer.

Observed improvement area:

- The owned theme is currently very lightweight, which matches the next UI-revamp constraint. The missing surface is product-specific rendering and commerce state, not excess styling in the owned theme.

### Production Snapshot And Theme Risk

The current production site uses WooCommerce, but the documented production theme is still the commercial `Glacier` theme with builder and plugin coupling.

Evidence:

- `thoughts/shared/docs/woocommerce-audit.md:16-22` captures runtime facts, including WordPress, WooCommerce, PHP, and MariaDB versions from the audit snapshot.
- `thoughts/shared/docs/woocommerce-audit.md:24-30` records `Glacier` as the active standalone theme, notes builder dependency, and marks maintainability risk as high.
- `thoughts/shared/docs/woocommerce-audit.md:52-64` says custom product/artwork fields are pending deeper DB inspection.
- `thoughts/shared/docs/woocommerce-audit.md:88-92` records evidence that WooCommerce admin warns about outdated theme template overrides.
- `thoughts/shared/docs/woocommerce-audit.md:103-105` records the architecture decision that `Glacier` is migration source material, not repo-owned runtime code.
- `wordpress/README.md:126-136` documents that the local production snapshot uses the production `glacier` theme and has host-dependent code that affects normal WP-CLI bootstrap.

Observed risks:

- If the main selling tool stays on production `Glacier` while the repo-owned mirror is built, the selling UI remains coupled to a non-owned, builder-heavy theme with documented outdated WooCommerce overrides.
- Critical product/artwork custom fields in the production database are not yet discovered in the audit doc. That leaves current production product metadata as an open evidence gap.

Observed improvement area:

- The repo already separates production snapshot evidence from repo-owned runtime code. That separation is useful for keeping future UI styling logic lightweight, but the actual production switch/migration state is not implemented in the repo.

### Deployment And Operational Scope

WordPress deployment scripts are scoped to owned code and explicitly exclude database content, uploads, WordPress core, and third-party code.

Evidence:

- `thoughts/shared/docs/deploy-wordpress.md:3-14` limits deployment to owned theme files, custom plugins, and `mu-plugins`; it excludes core, vendor plugins, database content, and uploads.
- `thoughts/shared/docs/deploy-wordpress.md:15-20` states code and content changes are handled separately and production DB changes should go through admin or a reviewed migration.
- `thoughts/shared/docs/deploy-wordpress.md:62-67` lists post-deploy checks for front page, shop, representative artwork page, and admin.
- `scripts/wp-plugin-removal-smoke.sh:5-10` runs owned-code checks and Node smoke checks against the configured base URL.
- `scripts/wp-smoke-test.mjs:5-12` defines default smoke paths and WordPress critical-error detection patterns.
- `scripts/wp-smoke-test.mjs:35-75` contains current product-detail URL discovery via the WooCommerce Store API.

Observed risks:

- A WooCommerce product mirror is content/data behavior, not just code deployment. Current deployment docs intentionally do not deploy database content or uploads.
- Product-detail smoke coverage is in progress in the current workspace. `thoughts/shared/plans/2026-05-01-wordpress-smoke-validation-gap/progress.md:16-18` records that full local validation reached product discovery but the WooCommerce Store API response was polluted by a PHP notice before JSON.

Observed improvement area:

- Smoke coverage has moved beyond static shop/cart/checkout reachability toward representative product-page coverage, but the current plan still records an unresolved full-validation issue for product discovery.

### Roadmap And Planning State

The active OpenSpec change is planning-only and already names the same coordination risks: customer feedback, source-sheet completion, platform decision, plugin safety, smoke coverage, and ecommerce identity.

Evidence:

- `openspec/changes/plan-catalog-commerce-roadmap/proposal.md:7-12` establishes a staged roadmap and explicitly says no production ecommerce behavior changes are included.
- `openspec/changes/plan-catalog-commerce-roadmap/proposal.md:18-24` lists new capabilities covering catalog feedback, source completion, platform decision, plugin safety, test coverage, and visual identity.
- `openspec/changes/plan-catalog-commerce-roadmap/design.md:31-45` sequences catalog decisions, WooCommerce as baseline, plugin removal gating, and ecommerce visual identity after platform decision.
- `openspec/changes/plan-catalog-commerce-roadmap/design.md:72-80` lists risks around catalog field changes, sheet growth before validation, hidden plugin behavior, and operational ecommerce needs.
- `openspec/changes/plan-catalog-commerce-roadmap/tasks.md:17-23` requires defining launch-critical commerce flow, documenting WooCommerce baseline, defining a leaner alternative, and recording the platform decision before visual identity implementation.
- `openspec/changes/plan-catalog-commerce-roadmap/tasks.md:45-51` starts ecommerce visual identity only after platform decision and maps identity decisions to actual surfaces.
- `openspec/changes/plan-catalog-commerce-roadmap/specs/ecommerce-visual-identity/spec.md:3-17` requires platform-aware identity and customer-approved identity decisions.

Observed risks:

- The active roadmap has not yet moved into implementation. Its tasks are unchecked, so current repo behavior still matches the pre-implementation state.
- The UI revamp depends on the selected frontend surface. The repo-owned theme is lightweight, but production evidence still points to `Glacier`.

Observed improvement area:

- The roadmap already captures the right sequencing constraint for lightweight UI work: visual identity starts after the platform decision and maps to the actual implementation surface.

## Architecture Notes

- Current source of truth for artwork rows is the Google Sheet / CSV contract, not WordPress products.
- Current automated generation path is Sheet -> job queue -> local agent -> merged CSV -> HTML/PDF -> Drive upload.
- Current WordPress owned path is minimal theme + small `mu-plugin` helpers.
- There is no current path for Sheet -> WooCommerce product create/update.
- There is no current path for WooCommerce product/order data -> Sheet.
- There is no current shared package for status normalization between Node and PHP; equivalent mappings exist in both `catalog-generator/src/catalog-generator.mjs` and `wordpress/wp-content/mu-plugins/lucia-artwork-rules.php`.
- The repo-owned UI styling surface is light today; the heavier styling/runtime risk is in the imported production `Glacier` theme and builder/plugin dependencies.

## Key Risks For Main Selling Tool Readiness

1. WooCommerce mirror gap: no code currently mirrors available catalog works into WooCommerce products.
2. Selling-readiness gap: current catalog gates are enough to include rows in a PDF, but not enough evidence for purchasability, stock state, product identity, or checkout behavior.
3. Production theme gap: production still depends on `Glacier` and builder plugins, while the repo-owned theme is a minimal baseline.
4. Product metadata gap: production product/artwork custom fields are still pending deeper database inspection.
5. Validation gap: product-detail smoke coverage exists in current scripts, but the active plan records unresolved full-validation failure caused by polluted Store API JSON.
6. Image/media gap: catalog output uses Google Drive image URLs; the repo has no current WooCommerce media attachment/import pipeline.
7. Duplicate/conflict gap: multi-tab catalog merging does not deduplicate or detect conflicting `artwork_id` rows.

## Open Questions

- Is the launch-critical commerce flow direct checkout, reservation, inquiry, local pickup, shipping, or another model?
- Does `include_in_catalog` also mean "show in shop", or will the shop need a separate inclusion/readiness gate?
- Should `catalog_ready` be sufficient for selling, or is a distinct selling-readiness state needed?
- Which sheet statuses should make a product purchasable, visible-but-not-purchasable, hidden, or archived?
- Should `artwork_id` become the WooCommerce SKU, a custom meta field, or both?
- Should product images remain Google-hosted for the shop, or be imported as WordPress/WooCommerce media attachments?
- How should WooCommerce handle a work that changes from `available` to `reserved` or `sold` while a buyer is viewing or checking out?
- Are existing production WooCommerce products authoritative for any fields, or should the Sheet become the only source of truth?
- Which production product/artwork custom fields already exist in the current database?
- Which storefront surface is the actual UI revamp target: the existing `Glacier` shop, the repo-owned `luciastuy` theme, or another isolated commerce experiment?
