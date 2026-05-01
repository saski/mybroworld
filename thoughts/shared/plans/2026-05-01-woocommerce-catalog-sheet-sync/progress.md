# Progress

## 2026-05-01
- Started file-based planning for WooCommerce, PDF catalog, and Google Sheet inventory/look-and-feel sync.
- Loaded the MyBroworld sheet reviewer rule, skill, and project criteria.
- Captured the user's sync requirement as a durable project goal for this investigation.
- No production action taken.
- Inspected the artwork data contract and catalog generator entrypoints.
- Inspected owned WordPress artwork metadata rules and the local production snapshot import script.
- Retrieved metadata and text export for the linked Google Sheet through the Google Drive connector.
- Compared local WooCommerce product titles/count against the linked sheet export.
- Checked test layout and validation entrypoints for a small parity-audit implementation.
- Inspected the local canonical CSV snapshot and confirmed parser availability in the catalog generator package.
- Added failing tests for a read-only WooCommerce/sheet inventory parity comparator.
- Implemented the pure CSV comparator and got the inventory-focused catalog tests passing.
- Added failing tests for an operator-facing `scripts/wp-inventory-parity.mjs` CLI wrapper.
- Implemented the read-only CLI wrapper and added its test to `scripts/wp-test-owned-code.sh`.
- Ran the parity audit against the current local WooCommerce product list and local canonical CSV snapshot; it failed as expected with complete inventory mismatch.
- Updated the sheet reviewer skill/reference criteria, artwork data contract, WordPress README, and project status with the inventory parity rule and current baseline.
- `scripts/wp-test-owned-code.sh` passed.
- `npm --prefix catalog-generator test` passed.
- `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` passed after adding the read-only inventory parity tooling.
- Captured the source-of-truth decision: all canonical sheet artworks belong in WooCommerce; status controls visibility and purchasability.
- Added a failing test for WooCommerce product draft mapping from canonical sheet rows.
- Implemented `buildWooProductDrafts` and persisted the inventory scope/status policy in the artwork contract and sheet-review criteria.
- `npm --prefix catalog-generator test -- --test-name-pattern WooProductDrafts` passed.
- `npm --prefix catalog-generator test` passed.
- `scripts/wp-test-owned-code.sh` passed.
