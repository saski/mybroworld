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
