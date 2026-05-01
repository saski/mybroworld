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
- activates the owned `luciastuy` theme
- flushes permalinks

Open:
- WordPress: `http://localhost:8080`
- phpMyAdmin: `http://localhost:8081`

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
- keep the local catalog agent running so it can claim the queued job, render the PDF, and upload it to Drive
- use the `Open PDF`, `Approve`, and `Needs changes` controls from the recent jobs table

The Apps Script Web App redirects successful responses through `script.googleusercontent.com`. The MU plugin handles that redirect server-side with an allowlisted Google GET follow-up, because WordPress automatic POST redirect handling can otherwise return a Google HTTP 400 response.

On the current operator Mac, the local worker is installed as the user LaunchAgent `com.mybroworld.catalog-agent`. Check it with:

```bash
launchctl print "gui/$(id -u)/com.mybroworld.catalog-agent"
tail -n 50 ~/Library/Logs/MyBroworld/catalog-agent.log
```

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

## Inventory Parity Audit

Use the read-only parity audit before WooCommerce product import/update work. It compares canonical artwork rows from a sheet CSV export with the current WooCommerce product list:

```bash
docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli --skip-themes --skip-plugins post list --post_type=product --fields=ID,post_title,post_status,post_name --format=csv --posts_per_page=500 > /tmp/mybroworld-woo-products.csv
scripts/wp-inventory-parity.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --woo-csv /tmp/mybroworld-woo-products.csv
```

The command exits non-zero when inventory is out of sync and prints `missing_in_woo` and `unexpected_in_woo` rows. It does not mutate WordPress, WooCommerce, the Google Sheet, or catalog files.
