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
- `WP_REMOTE_PATH=/public`
- `WP_REMOTE_THEME_DIR=/public/wp-content/themes/luciastuy`
- `WP_REMOTE_MU_PLUGIN_DIR=/public/wp-content/mu-plugins`

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

## Deployment Commands
- Audit pull of the current production theme: `scripts/wp-pull-theme.sh`
- Dry-run preview: `scripts/wp-push-theme.sh --dry-run`
- Owned theme and `mu-plugin` upload: `scripts/wp-push-theme.sh`
- DB dump staging: `scripts/wp-pull-db.sh /path/to/export.sql`
- Upload sync placeholder: `scripts/wp-pull-uploads.sh`

## Pre-Deploy Checklist
- confirm the owned theme source exists at `wordpress/wp-content/themes/luciastuy`
- confirm the `mu-plugin` source exists at `wordpress/wp-content/mu-plugins`
- confirm `scripts/wp-remote.env` points at `ftp.luciastuy.com` and `/public`
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
