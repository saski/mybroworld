# WooCommerce Catalog Sheet Sync Plan

## Goal
Make local WooCommerce a production-like development mirror for inventory and storefront look and feel, while defining the path for WooCommerce inventory to stay in sync with the PDF catalogs and the canonical Google Sheet.

## User Requirements
- Local WooCommerce should have the same inventory as the remote shop.
- Local WooCommerce should have the same look and feel as the remote shop when validating remote parity.
- Changes should stay in sync rather than diverge between local and remote.
- WooCommerce inventory should stay in sync with the PDF catalogs and the Google Sheet at `15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw`, `gid=102593401`.
- Do not deploy to production unless explicitly requested.

## Scope For This Increment
- Planning and evidence gathering first.
- Local-only implementation steps are allowed when reversible and test-first.
- No production writes.
- No bulk inventory mutation until source-of-truth and field mapping are explicit.

## Progress
1. [complete] Load sheet-review rules and project criteria.
2. [complete] Record file-based plan, findings, and progress.
3. [complete] Inspect current catalog, WooCommerce, local import, and sheet integration points.
4. [complete] Inspect the linked Google Sheet metadata/content if connector access is available.
5. [complete] Define and implement the smallest reversible sync step with validation.
6. [complete] Persist reusable criteria into the reviewer artifacts.

## Current Working Assumptions
- Remote look and feel parity means local validation should use the imported production `glacier` theme and production plugin/theme assets as a parity target.
- Long-term maintainability still means `glacier` remains migration source material, not the desired owned runtime.
- Inventory sync needs a canonical source-of-truth decision before automated writes.
- The first implementation step should be a read-only parity audit, not an importer, because the current local WooCommerce products do not match the sheet.

## Risks
- Updating inventory from multiple sources can overwrite real production edits or catalog-specific editorial choices.
- Matching remote look and feel locally can conflict with the lean goal if third-party theme/builder code leaks back into the repo-owned surface.
- The Google Sheet may contain editorial catalog rows, not a complete WooCommerce product contract.
- Current local WooCommerce products do not carry `artwork_id`, so title-based comparison is a temporary audit fallback rather than the desired long-term sync identity.

## Rollback
- Local runtime inventory/look-and-feel changes should be restorable by re-importing the latest production snapshot.
- Code changes should be reversible through normal git diff/revert workflow.

## Errors
- `npm --prefix catalog-generator test -- --test-name-pattern inventory` failed as expected after adding the parity test because `catalog-generator/src/commerce-inventory-parity.mjs` does not exist yet.
- `node --test scripts/wp-inventory-parity.test.mjs` failed as expected after adding the CLI test because `scripts/wp-inventory-parity.mjs` does not exist yet.
- `npm --prefix catalog-generator test -- --test-name-pattern WooProductDrafts` failed as expected after adding the product-draft mapping test because `buildWooProductDrafts` does not exist yet.
