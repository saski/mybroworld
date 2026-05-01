# Progress

## 2026-05-01
- Started planning-with-files workflow for the next safest WooCommerce simplification support step.
- Selected product-detail smoke coverage as the single validation gap for this increment.
- No production action planned or performed.
- Added failing test for product-detail smoke URL resolution.
- Expected failure: `resolveSmokeUrls` is not exported from `scripts/wp-smoke-test.mjs`.
- Implemented product URL resolution in `scripts/wp-smoke-test.mjs`.
- `node --test scripts/wp-smoke-test.test.mjs` now passes with 4 tests.
- Added dry-run assertions that local validation wires product-detail smoke coverage into the validation loop.
- Expected failure: `wp-local-validate.sh` does not yet pass product smoke environment variables.
- Updated `wp-local-validate.sh` to pass `WP_SMOKE_INCLUDE_FIRST_PRODUCT=1`.
- `WP_REQUIRE_PRODUCT_SMOKE` defaults to `1` when `WP_EXPECTED_THEME=glacier`, otherwise `0`.
- `scripts/wp-local-runtime.test.sh` now passes.
- Full local validation exposed environment leakage into nested dry-run tests; next step is to make the dry-run test explicitly unset `WP_REQUIRE_PRODUCT_SMOKE` for the clean-local branch.
- Fixed dry-run test isolation.
- Full local validation now reaches product discovery, but the WooCommerce Store API response is polluted by a PHP notice before JSON.
- Diagnosed product discovery: Store API body starts with WordPress notices, while `/shop/` contains product links.
- Added failing test for `/shop/` product-link fallback when Store API JSON parsing fails.
- Implemented `/shop/` product-link fallback.
- `node --test scripts/wp-smoke-test.test.mjs` now passes with 5 tests.
- `scripts/wp-test-owned-code.sh` passed.
- `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` passed and smoke-tested `http://localhost:8080/product/armchair/`.
- Updated `wordpress/README.md` and `PROJECT_STATUS.md` with the new validation behavior.
- Final rerun after all script edits: `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` passed and smoke-tested `http://localhost:8080/product/armchair/`.
