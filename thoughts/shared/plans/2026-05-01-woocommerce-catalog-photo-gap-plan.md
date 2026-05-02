# WooCommerce Catalog Photo Gap Implementation Plan

## Overview

The remote shop photo gap is an inventory/media sync gap, not a catalog PDF generation gap. The current Sheet -> PDF -> Drive path can render artwork photos, but WooCommerce still exposes legacy/demo products with broken or missing product images.

Implement a test-first Sheet/CSV -> WooCommerce product and image sync path that starts locally, proves Store API image visibility, and only then allows a separate production rollout behind backup and explicit approval.

## Implementation Progress

- [x] Phase 1: Sync contract and pure planner.
  - Added `catalog-generator/src/woocommerce-sync-plan.mjs`.
  - Added planner tests for managed identity matching, action classification, and invalid source rows.
  - Documented managed WooCommerce identity and invalid-source rules in `thoughts/shared/docs/artwork-data-contract.md`.
  - Verified with `npm --prefix catalog-generator test -- --test-name-pattern WooCommerceSyncPlan`.
  - Verified with `npm --prefix catalog-generator test`.
- [x] Phase 2: Shared Drive image URL helper.
  - Added `catalog-generator/src/drive-image-url.mjs`.
  - Reused the helper from `catalog-generator/src/catalog-generator.mjs`.
  - Added sync-plan image payload metadata with normalized Drive image URLs and `_lucia_image_file_id`.
  - Added invalid-source handling for image URLs without a stable Drive file ID.
  - Verified with `npm --prefix catalog-generator test -- --test-name-pattern DriveImageUrl`.
  - Verified with `npm --prefix catalog-generator test`.
- [x] Phase 3: Dry-run WooCommerce sync CLI.
  - Added `scripts/woo-catalog-sync.mjs`.
  - Added `scripts/woo-catalog-sync.test.mjs`.
  - Added paginated WooCommerce REST product reads with Basic auth.
  - Added default dry-run behavior, JSON plan output, credential checks, explicit target checks, and production backup guardrails.
  - Documented dry-run credentials and usage in `wordpress/README.md`.
  - Verified with `node --test scripts/woo-catalog-sync.test.mjs`.
  - Verified with `scripts/wp-test-owned-code.sh`.
  - Verified live local dry-run with generated local read-only WooCommerce credentials: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`.
- [x] Phase 4: Local apply with product images.
  - Added default WooCommerce REST apply behavior for `create`, `update`, and `needs_image` actions.
  - Preserved existing image attachment IDs when `_lucia_image_file_id` has not changed.
  - Added `scripts/woo-storefront-assert.mjs` and tests for managed Store API product/image assertions.
  - Added an owned MU helper so WooCommerce can sideload extensionless Drive image URLs by assigning an extension from actual image MIME.
  - Verified local apply with generated local read/write WooCommerce credentials.
  - Verified Store API result: `products=35 expected=20 missing=0 missing_images=0`.
  - Verified `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh`.
  - Verified post-apply dry-run idempotency: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
- [x] Phase 5: Local legacy product visibility cleanup.
  - Added explicit `--hide-unmanaged` cleanup behavior.
  - Added production guardrail requiring both `--backup-id` and `--allow-unmanaged-cleanup` before production unmanaged cleanup can run.
  - Changed local unmanaged cleanup to set legacy/demo products to `draft` plus hidden catalog visibility because Store API still exposed products with only hidden catalog visibility.
  - Added `--forbid-unmanaged-products` to `scripts/woo-storefront-assert.mjs`.
  - Verified cleanup apply locally: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
  - Verified Store API result: `products=20 expected=20 missing=0 missing_images=0 unexpected=0`.
  - Verified `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh`.
- [x] Phase 6: Production rollout plan and guardrails.
  - Added production backup ID to sync command operator output when `--backup-id` is provided.
  - Documented production dry-run, managed-product apply, unmanaged cleanup, and post-sync assertions in `thoughts/shared/docs/deploy-wordpress.md`.
  - Updated `thoughts/shared/docs/woocommerce-audit.md` with the production baseline and local sync validation status.
  - Verified guardrail tests with `node --test scripts/woo-catalog-sync.test.mjs scripts/woo-storefront-assert.test.mjs`.
  - Captured current public production Store API baseline: `products=15 expected=20 missing=20 missing_images=0 unexpected=15`.
  - Captured production database backup identifier `production-db-export-20260501-195148`; SQL export is stored at `backups/production-db-export-20260501-195148/wordpress-db.sql` with sha256 `cfb23ca6901da64c784ad63fdc779649a345a3464e252b0d2dd1e198a7864ebb`.
  - Generated an ephemeral read-only WooCommerce REST key through a temporary token-protected production helper, ran the production dry-run, then revoked the key and removed the helper.
  - Verified production dry-run: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`.
  - Saved production dry-run JSON at `backups/production-db-export-20260501-195148/production-woo-sync-dry-run.json` with sha256 `22379040f8185ab19f79bd3f75849341ecb6ecff0f6263368bce0522de308275`.
  - Verified the dry-run plan has zero validation errors and writes only canonical `LA-2026-*` products.
  - Deployed the owned `lucia-rest-image-upload.php` MU helper and updated `lucia-bootstrap.php` in production so WooCommerce can sideload extensionless Drive image URLs.
  - Applied the production managed-product sync with an ephemeral read/write WooCommerce REST key, then revoked the key and removed the temporary helper.
  - Verified production managed-product apply: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`.
  - Saved production apply JSON at `backups/production-db-export-20260501-195148/production-woo-sync-apply.json` with sha256 `22379040f8185ab19f79bd3f75849341ecb6ecff0f6263368bce0522de308275`.
  - Verified public Store API after apply: `products=35 expected=20 missing=0 missing_images=0 unexpected=15`.
  - Verified production smoke after apply for `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/fanzimad-2026-yuju/`.
  - Verified post-apply idempotency dry-run: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
  - Saved post-apply dry-run JSON at `backups/production-db-export-20260501-195148/production-woo-sync-post-apply-dry-run.json` with sha256 `cd135a00b27bbe9327b635141c05fe2c3c0f6548b6dc86be052407ab010864b3`.
  - Captured fresh production database backup identifier `production-db-export-20260501-203207` before unmanaged cleanup; SQL export is stored at `backups/production-db-export-20260501-203207/wordpress-db.sql` with sha256 `8f7755d7ed7af56b0b85ef33006396054f77267e96118227738bfe31f0e3d2bf`.
  - Applied the approved production unmanaged legacy/demo cleanup with `--hide-unmanaged --allow-unmanaged-cleanup`, using an ephemeral read/write WooCommerce REST key that was revoked after the run.
  - Verified cleanup command scope: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
  - Saved production cleanup JSON at `backups/production-db-export-20260501-203207/production-woo-sync-cleanup.json` with sha256 `cd135a00b27bbe9327b635141c05fe2c3c0f6548b6dc86be052407ab010864b3`.
  - Verified public Store API after cleanup: `products=20 expected=20 missing=0 missing_images=0 unexpected=0`.
  - Verified production smoke after cleanup for `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/fanzimad-2026-yuju/`.
  - Verified post-cleanup idempotency dry-run: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
  - Saved post-cleanup dry-run JSON at `backups/production-db-export-20260501-203207/production-woo-sync-post-cleanup-dry-run.json` with sha256 `f7520dc60edfbeea398b0226931d62bacb76989d40cce1d7e3aba149b8d2759e`.

## Current State

- The remote shop at `https://www.luciastuy.com/shop/` exposes 20 managed canonical artwork products.
- The public WooCommerce Store API reports images for all 20 managed canonical artwork products and no visible unmanaged legacy/demo products.
- The canonical catalog source is the Google Sheet `Lucia Astuy - CATALOGO_BASE` and the local snapshot at `catalog-generator/data/CATALOGO_BASE.csv`.
- The canonical snapshot contains 20 `LA-2026-*` artwork rows with populated `image_main` and `image_id_manual`.
- PDF catalog generation already consumes those rows and converts Drive image links for rendering.
- The repository has a read-only parity audit and a pure WooCommerce product draft mapper in `catalog-generator/src/commerce-inventory-parity.mjs`.
- The 2026-05-01 production managed-product apply created 20 canonical `LA-2026-*` products with images, and the approved unmanaged cleanup hid the 15 legacy/demo products without deleting them.
- The repository now has product create/update code, product image import support, and recorded production DB backup identifiers for managed-product apply and unmanaged cleanup.
- Project criteria already decide that WooCommerce inventory scope is all canonical sheet artworks, with `status_normalized` controlling visibility and purchasability.

## Desired End State

- WooCommerce contains one managed product for every canonical `LA-2026-*` artwork row.
- Managed products are keyed by `artwork_id` through both SKU and `_lucia_artwork_id` metadata.
- Product fields are updated from the canonical sheet contract, including title, description, price policy, status policy, location/history metadata, series metadata, and primary image source.
- Product images are real WooCommerce/WordPress media entries visible through the public Store API, not stale `featured_media` references.
- Available artworks are visible and purchasable; sold, gifted, exchanged, commissioned, reserved, not-for-sale, and personal-collection artworks are visible but not purchasable; archived artworks are hidden and not purchasable.
- Legacy/demo products are not deleted by default. They are reported separately and can be hidden only through an explicit cleanup mode after managed products validate.
- The sync script defaults to dry-run, writes only when `--apply` is passed, and refuses production writes unless backup and target flags are explicit.

## Out Of Scope

- Redesigning the shop UI or changing the active production theme.
- Changing the PDF catalog layout or editorial image-selection policy.
- Adopting paid, freemium, or broad third-party WordPress plugins.
- Deleting legacy/demo products in the first implementation pass.
- Changing Google Sheet data in this plan.
- Replacing WooCommerce or deciding the long-term commerce platform.
- Running production writes during the local implementation phases.

## Design Options

### Option A: WooCommerce REST API importer (preferred)

Use a Node CLI to read the canonical CSV or sheet export, build a tested sync plan, then create/update products through WooCommerce REST API `wc/v3`. WooCommerce product image payloads support existing media IDs or remote image `src` values, and the Store API exposes published product image data for storefront rendering.

Tradeoffs:

- Pros: uses WooCommerce core APIs, avoids a new WordPress admin surface, works for local/staging/production with scoped credentials, and keeps sync orchestration in the existing Node tooling.
- Cons: requires managing WooCommerce REST credentials outside git and proving the production server can fetch the derived Drive image URLs.

### Option B: WordPress MU plugin import action (fallback)

Add a small authenticated WordPress admin/MU plugin action that accepts a signed sync payload and performs product/media writes server-side.

Tradeoffs:

- Pros: can use WordPress media functions directly and may help if REST credential setup or remote image ingestion fails.
- Cons: adds more WordPress code, a larger security surface, and a second admin workflow. Keep this as a fallback, not the first implementation.

## Approach

Proceed with Option A first. Keep every risky behavior behind a pure planning layer and a dry-run command before any mutation.

Implementation principles:

- Reuse `csv-parse` and the existing catalog generator data contract.
- Extract Drive image URL normalization so PDF generation and Woo sync use one tested helper.
- Compare managed products by SKU/meta identity, not by title, once imported.
- Treat title matching as a pre-import audit fallback only.
- Use WooCommerce REST API for product writes and product image creation/update.
- Record source image identity in product meta, for example `_lucia_image_file_id`, so repeated sync runs can avoid unnecessary media churn.
- Keep secrets in environment variables or ignored local config files only.
- Run local production-snapshot validation before any production plan is considered complete.

## Phase 1: Sync Contract And Pure Planner

Goal: turn the current product draft mapper into an explicit sync plan without touching WordPress.

Expected file changes:

- `catalog-generator/src/commerce-inventory-parity.mjs`
- `catalog-generator/src/woocommerce-sync-plan.mjs`
- `catalog-generator/test/commerce-inventory-parity.test.mjs`
- `catalog-generator/test/woocommerce-sync-plan.test.mjs`
- `thoughts/shared/docs/artwork-data-contract.md`

Implementation steps:

1. Add a failing test for matching existing managed Woo products by `sku` and `_lucia_artwork_id`.
2. Add a pure planner that classifies actions as `create`, `update`, `unchanged`, `needs_image`, `invalid_source`, and `unexpected_unmanaged`.
3. Include validation errors for missing `artwork_id`, missing `title_clean`, missing/unknown `status_normalized`, and missing `image_main`.
4. Carry the current status policy from `buildWooProductDrafts` into the planner.
5. Document the managed product identity rules in `thoughts/shared/docs/artwork-data-contract.md`.

Automated success criteria:

```bash
npm --prefix catalog-generator test -- --test-name-pattern WooCommerceSyncPlan
npm --prefix catalog-generator test
```

## Phase 2: Shared Drive Image URL Helper

Goal: make product image source generation testable and shared with the PDF generator.

Expected file changes:

- `catalog-generator/src/drive-image-url.mjs`
- `catalog-generator/src/catalog-generator.mjs`
- `catalog-generator/src/woocommerce-sync-plan.mjs`
- `catalog-generator/test/drive-image-url.test.mjs`
- `catalog-generator/test/catalog-generator.test.mjs`
- `catalog-generator/test/woocommerce-sync-plan.test.mjs`

Implementation steps:

1. Add a failing test for converting a Drive file URL to the `lh3.googleusercontent.com/d/<id>` image URL currently used by the catalog generator.
2. Extract the conversion logic from `catalog-generator/src/catalog-generator.mjs`.
3. Reuse the helper in both catalog rendering and WooCommerce sync planning.
4. Include the original Drive file ID in the sync payload as `_lucia_image_file_id`.
5. Fail the sync plan when an image URL cannot produce a stable image source.

Automated success criteria:

```bash
npm --prefix catalog-generator test -- --test-name-pattern DriveImageUrl
npm --prefix catalog-generator test
```

## Phase 3: Dry-Run WooCommerce Sync CLI

Goal: provide an operator-safe command that can inspect a target WooCommerce site and produce a sync plan without mutating it.

Expected file changes:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `scripts/wp-test-owned-code.sh`
- `wordpress/README.md`
- `thoughts/shared/docs/artwork-data-contract.md`

Implementation steps:

1. Add a failing CLI test that verifies dry-run is the default and no write method is called.
2. Implement REST reads for existing WooCommerce products, including pagination and product image data.
3. Require `WOO_BASE_URL`, `WOO_CONSUMER_KEY`, and `WOO_CONSUMER_SECRET` for target reads.
4. Print a concise plan summary and optionally write JSON output with `--json-output`.
5. Refuse `--apply` unless `--target local` or `--target production` is explicit.
6. Refuse `--target production --apply` unless `--backup-id` is provided.
7. Add documentation for credential setup without committing secrets.

Automated success criteria:

```bash
node --test scripts/woo-catalog-sync.test.mjs
scripts/wp-test-owned-code.sh
WOO_BASE_URL=http://localhost:8080 WOO_CONSUMER_KEY=<local-key> WOO_CONSUMER_SECRET=<local-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --json-output /tmp/mybroworld-woo-sync-plan.json
```

## Phase 4: Local Apply With Product Images

Goal: create/update local WooCommerce managed products and prove the Store API returns artwork images.

Expected file changes:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `scripts/woo-storefront-assert.mjs`
- `scripts/woo-storefront-assert.test.mjs`
- `scripts/wp-test-owned-code.sh`
- `wordpress/README.md`
- `PROJECT_STATUS.md`

Implementation steps:

1. Add failing tests for create and update payloads sent by `--apply`.
2. Implement product create/update through WooCommerce REST API.
3. Send image data using a remote `src` when the product has no current matching `_lucia_image_file_id`.
4. Preserve existing image IDs when the source image ID has not changed.
5. Add a storefront assertion helper that checks Store API products by SKU and verifies each managed product has at least one image.
6. Run the importer only against the local Docker WordPress runtime first.
7. Keep unexpected legacy/demo products unchanged in this phase; report them in the plan output.

Automated success criteria:

```bash
node --test scripts/woo-catalog-sync.test.mjs scripts/woo-storefront-assert.test.mjs
scripts/wp-test-owned-code.sh
npm --prefix catalog-generator test
WOO_BASE_URL=http://localhost:8080 WOO_CONSUMER_KEY=<local-key> WOO_CONSUMER_SECRET=<local-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --apply --json-output /tmp/mybroworld-woo-sync-apply.json
WOO_BASE_URL=http://localhost:8080 scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images
WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh
```

## Phase 5: Local Legacy Product Visibility Cleanup

Goal: remove demo products from the local storefront without deleting production evidence or unrelated records.

Expected file changes:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `scripts/woo-storefront-assert.mjs`
- `scripts/woo-storefront-assert.test.mjs`
- `wordpress/README.md`
- `PROJECT_STATUS.md`

Implementation steps:

1. Add tests for classifying unmanaged products separately from managed canonical artworks.
2. Add an explicit `--hide-unmanaged` option that sets unmanaged products to non-storefront visibility or draft status.
3. Keep `--hide-unmanaged` unavailable for production unless `--allow-unmanaged-cleanup` is also passed with `--backup-id`.
4. Apply the cleanup locally after managed product import and image validation pass.
5. Update the storefront assertion helper to verify canonical products are visible and demo products are absent from the public Store API.

Automated success criteria:

```bash
node --test scripts/woo-catalog-sync.test.mjs scripts/woo-storefront-assert.test.mjs
scripts/wp-test-owned-code.sh
WOO_BASE_URL=http://localhost:8080 WOO_CONSUMER_KEY=<local-key> WOO_CONSUMER_SECRET=<local-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --apply --hide-unmanaged --json-output /tmp/mybroworld-woo-sync-cleanup.json
WOO_BASE_URL=http://localhost:8080 scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images --forbid-unmanaged-products
WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh
```

## Phase 6: Production Rollout Plan And Guardrails

Goal: make production execution repeatable, backed up, and reversible before any live write occurs.

Expected file changes:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `scripts/woo-storefront-assert.mjs`
- `wordpress/README.md`
- `thoughts/shared/docs/deploy-wordpress.md`
- `thoughts/shared/docs/woocommerce-audit.md`
- `PROJECT_STATUS.md`

Implementation steps:

1. Add production target tests for required flags and refusal paths.
2. Capture the required production backup identifier in the command output.
3. Run production dry-run against `https://www.luciastuy.com` and store the JSON plan in an ignored backup/output location.
4. Verify the dry-run plan creates or updates only canonical `LA-2026-*` managed products.
5. Apply production managed product sync only after explicit approval and backup confirmation.
6. Run Store API assertions against production immediately after apply.
7. Apply unmanaged product hiding only as a separate production command after managed products and images validate.
8. Document rollback as restoring the production database backup or reapplying the saved pre-change product payload.

Automated success criteria:

```bash
node --test scripts/woo-catalog-sync.test.mjs scripts/woo-storefront-assert.test.mjs
scripts/wp-test-owned-code.sh
WOO_BASE_URL=https://www.luciastuy.com WOO_CONSUMER_KEY=<production-key> WOO_CONSUMER_SECRET=<production-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target production --backup-id <backup-id> --json-output /tmp/mybroworld-production-woo-sync-dry-run.json
WOO_BASE_URL=https://www.luciastuy.com WOO_CONSUMER_KEY=<production-key> WOO_CONSUMER_SECRET=<production-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target production --backup-id <backup-id> --apply --json-output /tmp/mybroworld-production-woo-sync-apply.json
WOO_BASE_URL=https://www.luciastuy.com scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images
WP_BASE_URL=https://www.luciastuy.com WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 WP_SMOKE_PATHS="/,/shop/,/cart/,/checkout/" scripts/wp-plugin-removal-smoke.sh
```

## Rollback Strategy

- Before local apply, restore the local production snapshot if needed.
- Before production apply, capture and record a production database backup identifier.
- Keep every sync apply JSON output so product IDs, image IDs, and changed fields can be audited.
- For managed product mistakes, rerun the sync from the corrected CSV or restore the database backup.
- For image import mistakes, rerun with corrected image URLs after verifying Store API image output.
- Do not hard-delete products or media in this implementation plan.

## Documentation Updates

Update these artifacts as phases land:

- `thoughts/shared/docs/artwork-data-contract.md`: managed Woo identity, image source behavior, product visibility policy.
- `wordpress/README.md`: local and production dry-run/apply commands, required env vars, safety flags.
- `thoughts/shared/docs/deploy-wordpress.md`: production backup and rollback steps for inventory sync.
- `thoughts/shared/docs/woocommerce-audit.md`: production inventory/media baseline before and after rollout.
- `PROJECT_STATUS.md`: current blocker status and latest validated command outputs.

## Sources

- Research input: `thoughts/shared/research/2026-05-01-remote-shop-catalog-photo-gap.md`
- Existing sync findings: `thoughts/shared/plans/2026-05-01-woocommerce-catalog-sheet-sync/findings.md`
- Canonical contract: `thoughts/shared/docs/artwork-data-contract.md`
- WooCommerce product REST API: https://woocommerce.github.io/woocommerce-rest-api-docs/#products
- WooCommerce Store API products: https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/products/

## Phase List

1. Sync contract and pure planner.
2. Shared Drive image URL helper.
3. Dry-run WooCommerce sync CLI.
4. Local apply with product images.
5. Local legacy product visibility cleanup.
6. Production rollout plan and guardrails.

## Next Step

Run:

```bash
fic-implement-plan thoughts/shared/plans/2026-05-01-woocommerce-catalog-photo-gap-plan.md
```
