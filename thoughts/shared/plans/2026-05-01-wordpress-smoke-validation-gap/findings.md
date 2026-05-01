# Findings

## 2026-05-01
- `scripts/wp-smoke-test.mjs` currently defaults to `/`, `/shop/`, `/cart/`, and `/checkout/`.
- `scripts/wp-smoke-test.test.mjs` currently tests path parsing, URL resolution, and WordPress critical-error detection only.
- Product-detail coverage is absent from the default local validation loop.
- The workspace was already dirty before this increment; keep edits narrow and avoid reverting unrelated changes.
- `resolveSmokeUrls` now has unit coverage for appending the first product permalink from the WooCommerce Store API.
- `wp-local-validate.sh` now requests product-detail smoke coverage and requires it when validating the imported `glacier` production snapshot.
- The imported `glacier` runtime emits PHP debug notices before the WooCommerce Store API JSON response. The response still contains product data, but strict JSON parsing fails.
- The rendered `/shop/` page exposes product permalinks such as `/product/armchair/`, so it can be used as a fallback discovery source.
- Product discovery now prefers the WooCommerce Store API and falls back to the first product link rendered on `/shop/` if the API response cannot be parsed as JSON.
- Final local validation passed with product-detail coverage and smoke-tested `http://localhost:8080/product/armchair/`.
