# Deploying WordPress Custom Code To DonDominio

## Scope
This workflow deploys only custom code owned in this repository:
- theme files
- custom plugins
- `mu-plugins`

It does not deploy:
- WordPress core
- vendor plugins
- database content
- uploads

## Lean Deployment Policy
- Code changes and content changes are handled separately.
- Production DB changes should be performed through WordPress admin or a reviewed migration procedure.
- Never overwrite unknown remote files blindly.
- FTP deployment uploads owned files in place and does not delete remote files by default.

## Deployment Inputs
Known production defaults:
- `WP_REMOTE_HOST=ftp.luciastuy.com`
- `WP_FTP_HOST=ftp.dondominio.com`
- `WP_REMOTE_PATH=/public`
- `WP_REMOTE_THEME_DIR=/public/wp-content/themes/luciastuy`
- `WP_REMOTE_MU_PLUGIN_DIR=/public/wp-content/mu-plugins`

Catalog PDF console runtime config belongs outside git, in `wp-config.php` or host environment variables:
- `LUCIA_CATALOG_API_URL`
- `LUCIA_CATALOG_API_TOKEN`
- `LUCIA_CATALOG_DEFAULT_PROFILE`
- `LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID`
- `LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID`
- optional `LUCIA_CATALOG_DEFAULT_SCOPE_MODE`
- optional `LUCIA_CATALOG_CONSOLE_CAPABILITY`

Remote script config:
- copy `scripts/wp-remote.env.example` to `scripts/wp-remote.env`
- fill in credential variables locally
- scripts auto-load `scripts/wp-remote.env` by default
- use `WP_REMOTE_CONFIG_FILE=/absolute/path/to/other.env` to point a script at another config file

Populate these environment variables before running the scripts if they are not already present in the remote config file:
- `WP_REMOTE_HOST`
- `WP_REMOTE_PATH`
- `WP_REMOTE_THEME_DIR` optional
- `WP_REMOTE_MU_PLUGIN_DIR` optional
- `WP_DEPLOY_TRANSPORT=ftp`
- `WP_FTP_HOST`
- `WP_FTP_USER`
- `WP_FTP_PASSWORD`

Use `WP_REMOTE_USER` only when `WP_DEPLOY_TRANSPORT=rsync`.
For FTP deployments, use `ftp.dondominio.com` as `WP_FTP_HOST`. The DonDominio FTP TLS certificate is issued for `*.dondominio.com`, not `ftp.luciastuy.com`.

## Deployment Commands
- Audit pull of the current production theme: `scripts/wp-pull-theme.sh`
- Dry-run preview: `scripts/wp-push-theme.sh --dry-run`
- Owned theme and `mu-plugin` upload: `scripts/wp-push-theme.sh`
- DB dump staging: `scripts/wp-pull-db.sh /path/to/export.sql`
- Upload sync placeholder: `scripts/wp-pull-uploads.sh`

## Pre-Deploy Checklist
- confirm the owned theme source exists at `wordpress/wp-content/themes/luciastuy`
- confirm the `mu-plugin` source exists at `wordpress/wp-content/mu-plugins`
- confirm catalog console secrets are configured on the target host, not in tracked files
- confirm `scripts/wp-remote.env` points at `ftp.dondominio.com` for FTP and `/public`
- run `scripts/wp-push-theme.sh --dry-run` and verify the remote target paths
- verify `WP_DEPLOY_TRANSPORT`, `WP_FTP_HOST`, `WP_FTP_USER`, and `WP_REMOTE_PATH` point to production before any upload
- confirm `lftp` is installed when using FTP deployment
- keep database changes and uploads changes out of this deployment step

## Post-Deploy Verification
- `curl -I https://www.luciastuy.com`
- open `https://www.luciastuy.com/` and verify the front page responds
- open `https://www.luciastuy.com/shop/` and verify WooCommerce catalog pages load
- open a representative artwork page and verify images, title, and availability messaging still render
- open `https://www.luciastuy.com/wp-admin/` and verify WordPress admin still loads
- open `https://www.luciastuy.com/wp-admin/admin.php?page=lucia-catalog-console` as a shop operator and verify the `Catalog PDFs` page loads
- queue one catalog only when the local catalog agent is ready to process it, then confirm the completed Drive link and review state appear in the recent jobs table
- for customer handoff, repeat the catalog check from the customer's mybro WordPress account with the `lucia-mybrocorp` worker authorized as `mybrocorp@gmail.com`; do not count a `nacho-saski` worker run as portable customer validation

## Production WooCommerce Catalog Sync Guardrails

Production inventory sync is separate from owned-code FTP deployment. Before any production WooCommerce write:

- capture and record a production database backup identifier
- create WooCommerce REST API credentials outside git
- use read-only WooCommerce credentials for dry-run planning
- run production dry-run first and save its JSON output outside tracked files
- inspect the dry-run plan before any `--apply`
- deploy the owned `lucia-rest-image-upload.php` MU helper before managed-product apply, because the sync uses extensionless Drive image URLs
- use read/write WooCommerce credentials only for an approved production apply
- run the public Store API assertion immediately after apply
- run storefront smoke checks immediately after apply

Production dry-run shape:

```bash
WOO_BASE_URL=https://www.luciastuy.com WOO_CONSUMER_KEY=<production-read-key> WOO_CONSUMER_SECRET=<production-read-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target production --backup-id <backup-id> --json-output /tmp/mybroworld-production-woo-sync-dry-run.json
```

Latest Phase 6 dry-run captured on 2026-05-01:

- Backup identifier: `production-db-export-20260501-195148`
- DB export: `backups/production-db-export-20260501-195148/wordpress-db.sql`
- DB export sha256: `cfb23ca6901da64c784ad63fdc779649a345a3464e252b0d2dd1e198a7864ebb`
- Dry-run plan JSON: `backups/production-db-export-20260501-195148/production-woo-sync-dry-run.json`
- Dry-run plan sha256: `22379040f8185ab19f79bd3f75849341ecb6ecff0f6263368bce0522de308275`
- Dry-run result: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`
- Plan review: zero validation errors, zero non-canonical writes, and unmanaged demo products only reported.
- Credential handling: an ephemeral read-only WooCommerce key was generated through a temporary token-protected helper, used for the dry-run, revoked, and the helper was removed.
- Production catalog writes at this point: not applied.

Managed-product production apply captured on 2026-05-01:

- Backup identifier: `production-db-export-20260501-195148`
- Pre-apply deployment: uploaded `wordpress/wp-content/mu-plugins/lucia-rest-image-upload.php` and updated `wordpress/wp-content/mu-plugins/lucia-bootstrap.php` in production.
- Credential handling: an ephemeral read/write WooCommerce key was generated through a temporary token-protected helper, used for the managed-product apply, revoked, and the helper was removed.
- Apply plan JSON: `backups/production-db-export-20260501-195148/production-woo-sync-apply.json`
- Apply plan sha256: `22379040f8185ab19f79bd3f75849341ecb6ecff0f6263368bce0522de308275`
- Apply result: `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15`
- Public Store API assertion: `products=35 expected=20 missing=0 missing_images=0 unexpected=15`
- Storefront smoke: `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/fanzimad-2026-yuju/` returned 200.
- Post-apply dry-run JSON: `backups/production-db-export-20260501-195148/production-woo-sync-post-apply-dry-run.json`
- Post-apply dry-run sha256: `cd135a00b27bbe9327b635141c05fe2c3c0f6548b6dc86be052407ab010864b3`
- Post-apply dry-run result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`
- Unmanaged legacy/demo cleanup at this point: not applied; requires a separate approval and `--allow-unmanaged-cleanup`.

Unmanaged legacy/demo cleanup captured on 2026-05-01:

- Backup identifier: `production-db-export-20260501-203207`
- DB export: `backups/production-db-export-20260501-203207/wordpress-db.sql`
- DB export sha256: `8f7755d7ed7af56b0b85ef33006396054f77267e96118227738bfe31f0e3d2bf`
- Credential handling: an ephemeral read/write WooCommerce key was generated through a temporary token-protected helper, used for cleanup, revoked, and the helper was removed.
- Cleanup plan JSON: `backups/production-db-export-20260501-203207/production-woo-sync-cleanup.json`
- Cleanup plan sha256: `cd135a00b27bbe9327b635141c05fe2c3c0f6548b6dc86be052407ab010864b3`
- Cleanup result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`
- Public Store API assertion: `products=20 expected=20 missing=0 missing_images=0 unexpected=0`
- Storefront smoke: `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/fanzimad-2026-yuju/` returned 200.
- Post-cleanup dry-run JSON: `backups/production-db-export-20260501-203207/production-woo-sync-post-cleanup-dry-run.json`
- Post-cleanup dry-run sha256: `f7520dc60edfbeea398b0226931d62bacb76989d40cce1d7e3aba149b8d2759e`
- Post-cleanup dry-run result: `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`

Production managed-product apply shape:

```bash
WOO_BASE_URL=https://www.luciastuy.com WOO_CONSUMER_KEY=<production-write-key> WOO_CONSUMER_SECRET=<production-write-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target production --backup-id <backup-id> --apply --json-output /tmp/mybroworld-production-woo-sync-apply.json
```

Production unmanaged cleanup is a separate command and is blocked unless `--allow-unmanaged-cleanup` is also present:

```bash
WOO_BASE_URL=https://www.luciastuy.com WOO_CONSUMER_KEY=<production-write-key> WOO_CONSUMER_SECRET=<production-write-secret> scripts/woo-catalog-sync.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --target production --backup-id <backup-id> --apply --hide-unmanaged --allow-unmanaged-cleanup --json-output /tmp/mybroworld-production-woo-sync-cleanup.json
```

Post-sync assertions:

```bash
WOO_BASE_URL=https://www.luciastuy.com scripts/woo-storefront-assert.mjs --sheet-csv catalog-generator/data/CATALOGO_BASE.csv --require-managed-products --require-images
WP_BASE_URL=https://www.luciastuy.com WP_SMOKE_INCLUDE_FIRST_PRODUCT=1 WP_REQUIRE_PRODUCT_SMOKE=1 WP_SMOKE_PATHS="/,/shop/,/cart/,/checkout/" scripts/wp-plugin-removal-smoke.sh
```
