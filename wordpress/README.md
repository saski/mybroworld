# WordPress Workspace

This directory contains the repo-managed WordPress custom layer for the Lucía Astuy WooCommerce site.

## Scope

Tracked in git:
- `wp-content/themes/luciastuy/`
- `wp-content/mu-plugins/`
- `wp-content/plugins/` only for custom plugins we own
- local runtime files and scripts

Not tracked in git:
- WordPress core
- third-party plugins
- third-party themes, including `Glacier`
- uploads
- database dumps with production data

## Strategy

This workspace is owned-code-only. The imported production `Glacier` theme is audit evidence and migration source material, not part of the long-term runtime surface. Local development and deployment should only manage code we intend to maintain:
- `wp-content/themes/luciastuy/`
- `wp-content/mu-plugins/`
- custom plugins we explicitly add later

WordPress development follows a lean dependency policy:
- avoid commercial paid plugins, including freemium plugins
- prefer WordPress core, WooCommerce core, and owned code in this repository
- consider open-source plugins or add-ons only when the need is proven, quality is sufficient, the implementation remains lean, and the rollback path is documented
- reject third-party dependencies that create vendor lock-in, broad feature surface, opaque behavior, or maintenance burden disproportionate to the problem
- keep customer-facing workflows small enough to understand, test, and maintain without vendor lock-in

Use [woocommerce-audit.md](../thoughts/shared/docs/woocommerce-audit.md) to keep the production findings and architecture decision current.

## Local Tooling

Expected local tools:
- PHP CLI and Composer from Homebrew
- Docker CLI and Docker Compose from Homebrew
- Colima as the local Docker daemon

If Homebrew tools are not on `PATH`, run:

```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
```

Before starting Docker services, make sure Colima is running:

```bash
colima start
```

## Local Boot

Start or repair the local WordPress/WooCommerce runtime from the repository root:

```bash
scripts/wp-local-setup.sh
```

The setup script:
- creates `wordpress/.env` from `wordpress/.env.example` when missing
- starts Docker Compose
- installs WordPress when the local database is empty
- installs and activates WooCommerce
- creates WooCommerce pages
- repairs local checkout readiness with `EUR`, `ES`, core BACS, and a zero-cost flat-rate shipping method
- activates the owned `luciastuy` theme
- flushes permalinks

Open:
- WordPress: `http://localhost:8080`
- phpMyAdmin: `http://localhost:8081`

If another local process already owns port `8080`, edit the ignored `wordpress/.env` file and change `WORDPRESS_PORT`, `PHPMYADMIN_PORT`, and `WORDPRESS_INSTALL_URL` together. The setup script updates the WordPress `home` and `siteurl` options to match `WORDPRESS_INSTALL_URL`.

To preview the commands without changing containers, run:

```bash
scripts/wp-local-setup.sh --dry-run
```

The local runtime is meant to boot cleanly without production content. Import the production database only when you are doing targeted migration or debugging work, not as part of the default bootstrap path.

## Local Runtime Validation

Run the local validation loop after WordPress/WooCommerce changes:

```bash
scripts/wp-local-validate.sh
```

This command checks owned WordPress code, confirms the local WordPress install, confirms WooCommerce is active, confirms the expected theme is active, and smoke-tests `/`, `/shop/`, `/cart/`, `/checkout/`, plus one product-detail page when a published product can be discovered.

For the imported production snapshot, validate against the production theme:

```bash
WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh
```

When validating the imported `glacier` snapshot, product-detail smoke coverage is required because the production snapshot is expected to contain published WooCommerce products.

## Importing Production Data

Production snapshots are imported locally only. The import helper reads the latest
snapshot path from `/tmp/mybroworld-last-prod-snapshot-dir` by default, or from an
explicit `--snapshot-dir` argument:

```bash
scripts/wp-local-import-snapshot.sh --dry-run
scripts/wp-local-import-snapshot.sh
```

The import helper:
- starts the local Docker Compose runtime
- copies snapshot `wp-content/plugins/`, `themes/`, `uploads/`, `languages/`, and
  `fonts/` into the local Docker WordPress runtime
- imports `wordpress-db.sql` or `wordpress.sql` from the snapshot when the dump is
  present and non-empty
- uses the snapshot `wp-config.php` table prefix only when importing a real dump
- rewrites `https://www.luciastuy.com` to the configured local WordPress URL

To import content without touching the database intentionally, run:

```bash
scripts/wp-local-import-snapshot.sh --skip-db
```

After you export a production DB dump separately, you can either place it in the
snapshot as `wordpress-db.sql` or pass it explicitly:

```bash
scripts/wp-local-import-snapshot.sh --db-dump /absolute/path/to/export.sql
```

The current production snapshot was captured into an ignored `backups/` folder.
It includes production `wp-content`, `wp-config.php`, and a production DB export.
After import, the local shop uses the production `glacier` theme and production
plugin set. A local-only administrator is available for testing:
- URL: `http://localhost:8080/wp-admin/`
- User: `localadmin`
- Password: `change-me-now`

The production `Glacier` theme has host-dependent code that breaks normal WP-CLI
bootstrap on `localhost`; local validation uses `--skip-themes --skip-plugins`
for status checks and validates runtime health through HTTP smoke checks.

## Exporting Production DB For Local Import

Use the remote DB exporter only for local snapshot creation, never for deploys:

```bash
scripts/wp-remote-db-export.sh --dry-run
WP_BACKUP_OUT_DIR=/absolute/ignored/snapshot scripts/wp-remote-db-export.sh
```

The exporter creates a random-name, token-protected PHP file on production,
downloads `wordpress-db.sql`, and removes the temporary exporter through a cleanup
trap. Keep the resulting SQL dump out of git.

## Verification

```bash
docker compose --env-file wordpress/.env.example -f wordpress/docker-compose.yml config
scripts/wp-local-setup.sh
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml ps
scripts/wp-local-validate.sh
```

## Owned-Code Tests

Run the fast PHP checks before changing the owned theme or `mu-plugins`:

```bash
scripts/wp-test-owned-code.sh
```

This command lints the owned PHP files, runs the lightweight PHP tests under `wordpress/wp-content/mu-plugins/tests/`, runs the WordPress smoke helper unit tests, and runs script-level dry-run tests for deployment and local-runtime wrappers.

## Catalog PDF Console

The catalog PDF console lives in owned MU plugin code and calls the deployed Apps Script Web App from server-side WordPress AJAX handlers. Configure it outside git, preferably in `wp-config.php` or host environment variables:

- `LUCIA_CATALOG_API_URL`
- `LUCIA_CATALOG_API_TOKEN`
- `LUCIA_CATALOG_DEFAULT_PROFILE`
- `LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID`
- `LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID`
- `LUCIA_CATALOG_DEFAULT_SCOPE_MODE`, optional, defaults to `current_tab`
- `LUCIA_CATALOG_CONSOLE_CAPABILITY`, optional, defaults to `manage_woocommerce`

Do not expose `LUCIA_CATALOG_API_TOKEN` in browser JavaScript. Browser requests go to WordPress AJAX endpoints with a WordPress nonce; WordPress sends the shared token only from the server.

After login, shop operators can open `wp-admin/admin.php?page=lucia-catalog-console` or the `Catalog PDFs` admin menu item. The workflow is:
- enter or accept the catalog title
- keep the default scope unless a multi-year catalog is needed
- click `Generate PDF`
- keep the configured catalog worker running so it can claim the queued job, render the PDF, and upload it to Drive
- use the `Open PDF`, `Approve`, and `Needs changes` controls from the recent jobs table

Current production deployment now defaults new catalog jobs to the scheduled Cloud Run `lucia-mybrocorp` worker in `mybroworld-catalog-260501`, authorized as `mybrocorp@gmail.com`. Customer-operated production is not complete until a job queued from the customer's mybro WordPress account completes and the customer can open/review the resulting Drive PDF without depending on the current operator Mac or Nacho's OAuth token.

The Apps Script Web App redirects successful responses through `script.googleusercontent.com`. The MU plugin handles that redirect server-side with an allowlisted Google GET follow-up, because WordPress automatic POST redirect handling can otherwise return a Google HTTP 400 response.

If the console shows `Catalog API Web App is not reachable from WordPress`, the Apps Script Web App returned Google's access-denied page before the catalog token check ran. Redeploy the Web App with access set to `Anyone`, confirm `LUCIA_CATALOG_API_URL` still points at the active `/exec` deployment, then probe it with a dummy token; a reachable deployment should return the JSON error `Unauthorized catalog API request` instead of HTTP 403.

On the current operator Mac, the interim local worker is installed as the user LaunchAgent `com.mybroworld.catalog-agent`. Check it with:

```bash
launchctl print "gui/$(id -u)/com.mybroworld.catalog-agent"
tail -n 50 ~/Library/Logs/MyBroworld/catalog-agent.log
```

Production Cloud Run worker packaging and deployment notes live in [catalog-generator/cloud-run/README.md](../catalog-generator/cloud-run/README.md).

## Full Local Validation

Run the project-level validation loop before committing WordPress simplification or plugin-removal changes:

```bash
scripts/auto-validate.sh
```

This command validates active OpenSpec changes, runs the WordPress owned-code checks, runs catalog-generator tests, and checks the current diff for whitespace or conflict-marker issues.

## Plugin Removal Smoke Checks

Before and after deactivating a plugin, run:

```bash
WP_BASE_URL=http://localhost:8080 WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 scripts/wp-plugin-removal-smoke.sh
```

For production or staging, point `WP_BASE_URL` at the target site. The default smoke paths are `/`, `/shop/`, `/cart/`, and `/checkout/`. Set `WP_SMOKE_INCLUDE_FIRST_PRODUCT=1` to add one discovered product-detail page, and set `WP_REQUIRE_PRODUCT_SMOKE=1` when products are expected and missing product coverage should fail validation. Override paths when needed:

```bash
WP_BASE_URL=https://www.luciastuy.com WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 WP_SMOKE_PATHS="/,/shop/,/cart/,/checkout/" scripts/wp-plugin-removal-smoke.sh
```

## Shop Visual Baseline

Use the visual baseline helper when comparing production `Glacier` against the owned `luciastuy` theme. Screenshots are written under `wordpress/.tmp/visual-baseline/`, which is ignored by git.

Capture production:

```bash
scripts/woo-visual-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production --include-first-product --require-first-product
```

Capture the local owned theme:

```bash
scripts/wp-local-setup.sh
scripts/woo-visual-baseline.mjs --base-url http://localhost:8080 --label luciastuy-local --include-first-product
```

The default surfaces are `/`, `/shop/`, and the commerce pages `/cart/` and `/checkout/`, plus one product detail page when `--include-first-product` is set. The default viewports are desktop `1440x1100` and mobile `390x844@2`. The helper decodes images and scroll-warms long pages before full-page screenshots so lazy-loaded artwork is more likely to be captured consistently.

## Shop Interaction Baseline

Use the interaction baseline helper to replay the critical buyer affordances before replacing `Glacier`: header logo, desktop navigation links, mobile menu toggle, shop sorting, product links, add-to-cart controls, shop/product typography rhythm, product image/detail behavior, cart/checkout typography rhythm, cart, and checkout buyer fields.

Production runs should stay non-mutating unless a deliberate cart-session test is approved:

```bash
scripts/woo-interaction-baseline.mjs --base-url https://www.luciastuy.com --label glacier-production
```

Local owned-theme runs should exercise cart and checkout mutation:

```bash
scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local --allow-cart-mutation
```

For buyer-ready local checks, require an available payment method:

```bash
scripts/woo-interaction-baseline.mjs --base-url http://localhost:8090 --label luciastuy-local-payment --allow-cart-mutation --require-payment-method
```

Reports and interaction screenshots are written under `wordpress/.tmp/interaction-baseline/`, which is ignored by git. The report fails when shop/product headings lose uppercase tracking, cart/checkout headings or primary actions lose uppercase tracking, the product title scale regresses, the product primary image exists in markup but is not visibly rendered, or `--require-payment-method` is set and checkout exposes no available payment method.

## Inventory Parity Audit

Use the read-only parity audit before WooCommerce product import/update work. It compares canonical artwork rows from a sheet CSV export with the current WooCommerce product list:

```bash
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli --skip-themes --skip-plugins post list --post_type=product --fields=ID,post_title,post_status,post_name --format=csv --posts_per_page=500 > /tmp/mybroworld-woo-products.csv
scripts/wp-inventory-parity.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --woo-csv /tmp/mybroworld-woo-products.csv
```

The command exits non-zero when inventory is out of sync and prints `missing_in_woo` and `unexpected_in_woo` rows. It does not mutate WordPress, WooCommerce, the Google Sheet, or catalog files.

## WooCommerce Catalog Sync Dry Run

Use the catalog sync dry run after the parity audit and before any product writes. The command reads canonical sheet CSV rows, reads WooCommerce products through the WooCommerce REST API, and prints the planned create/update/image/unmanaged actions. Dry run is the default; it does not mutate WooCommerce.

Store WooCommerce REST credentials outside git, for example in your shell or an ignored local env file:

```bash
export WOO_BASE_URL=http://localhost:8080
export WOO_CONSUMER_KEY=<local-consumer-key>
export WOO_CONSUMER_SECRET=<local-consumer-secret>
```

Run a local dry run:

```bash
scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --json-output /tmp/mybroworld-woo-sync-plan.json
```

The command requires `--target local` or `--target production`. Production apply mode additionally requires `--backup-id`; do not use production apply until the production rollout phase is explicitly approved and backed up.

## WooCommerce Catalog Sync Local Apply

After the dry run shows only expected actions, apply the managed product sync to the local Docker runtime:

```bash
scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --apply --json-output /tmp/mybroworld-woo-sync-apply.json
```

Then verify that the public Store API exposes the managed artwork products and their images:

```bash
WOO_BASE_URL=http://localhost:8080 scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images
```

This apply phase creates or updates only managed `LA-YYYY-NNN` artwork products. It reports unmanaged legacy/demo products but leaves them unchanged until the explicit unmanaged cleanup phase.

## WooCommerce Catalog Sync Local Cleanup

After managed products and images validate locally, hide unmanaged legacy/demo products from the storefront:

```bash
scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target local --apply --hide-unmanaged --json-output /tmp/mybroworld-woo-sync-cleanup.json
```

Then verify that the Store API exposes only canonical managed artworks:

```bash
WOO_BASE_URL=http://localhost:8080 scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images --forbid-unmanaged-products
```

For local cleanup, unmanaged products are set to `draft` and hidden from catalog visibility. Production unmanaged cleanup is blocked unless `--backup-id` and `--allow-unmanaged-cleanup` are both passed with `--target production`.
