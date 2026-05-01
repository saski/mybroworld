# WordPress Smoke Validation Gap Plan

## Goal
Add one small local validation gap before any further plugin deactivation: product-detail smoke coverage for the production-like WooCommerce runtime.

## Scope
- Local validation only.
- No production deployment or production admin changes.
- Keep the current `glacier` runtime as the validation target.
- Add one gap only: product-detail smoke coverage.

## Progress
1. [complete] Read current smoke helper and tests.
2. [complete] Add a failing test for product-detail smoke path support.
3. [complete] Implement the smallest script change.
4. [complete] Run owned-code checks and `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh`.
5. [complete] Record findings and status.

## Decision
Choose product-detail smoke coverage before admin plugins-page coverage.

Reason: product pages are customer-visible commerce behavior and do not require authenticated browser/admin handling. Admin plugin-page coverage is still valuable, but it introduces login/session mechanics and should be a separate increment.

## Rollback
Revert the smoke-helper/local-validation changes and rerun `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh`.

## Errors
- `node --test scripts/wp-smoke-test.test.mjs` failed as expected after adding the test because `resolveSmokeUrls` is not implemented/exported yet.
- `scripts/wp-local-runtime.test.sh` failed as expected because `wp-local-validate.sh` does not yet pass `WP_SMOKE_INCLUDE_FIRST_PRODUCT=1` into the smoke command.
- Full `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` failed because `WP_REQUIRE_PRODUCT_SMOKE=1` leaked into the nested `scripts/wp-local-runtime.test.sh` clean-local dry-run assertion.
- Full `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` then failed because the WooCommerce Store API response for product discovery included a PHP notice before JSON, causing JSON parsing to fail.
- `node --test scripts/wp-smoke-test.test.mjs` failed as expected after adding the fallback test because Store API JSON parse errors are not handled yet.
