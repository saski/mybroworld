# WordPress Plugin Inventory

## Objective
Capture a stable inventory of the installed plugins so that "remove no longer needed plugins" can be done safely in staged batches.

## Source Of Truth (Captured Evidence)
- Plugin list captured in `thoughts/shared/docs/woocommerce-audit.md` on `2026-04-02`.
- Production plugin versions and active status were re-captured from `wp-admin/plugins.php` and WooCommerce system status on `2026-04-30`; all 17 installed plugins were active in that snapshot.
- Local imported production runtime captured with WP-CLI on `2026-05-03` from the Docker WordPress instance at `http://localhost:8080`.
- Production front-end asset inspection on `2026-07-10` confirmed the owned `luciastuy` theme is active and Elementor, RevSlider, WPBakery, and Kirki no longer load assets on the front page. ACF PRO is deactivated (folder renamed to `acf_pro.deactivated`).
- **Production plugin list re-captured on `2026-07-23` via FTP.** Client installed 7 new plugins since May. After memory exhaustion incidents, 5 plugins deactivated: `acf_pro`, `jetpack`, `google-site-kit`, `pinterest-for-woocommerce`, `reddit-for-woocommerce`, `google-listings-and-ads`. Total: 17 plugins (6 deactivated, 11 active).

Primary reference page:
- `https://www.luciastuy.com/wp-admin/plugins.php`

## Inventory (Installed Plugins)

Captured on `2026-07-23` via FTP directory listing. Client-installed plugins marked with ⚠️.

| Plugin | Status | Type | Classification | Notes |
|---|---|---|---|---|
| WooCommerce | active | required commerce | KEEP | Core shop functionality. |
| Advanced Custom Fields PRO (`acf_pro`) | **DEACTIVATED** (2026-07-10) | legacy theme fields | DEACTIVATED | Folder renamed to `acf_pro.deactivated`. Owned MU-plugin replaces it. Do not delete until soak period passes. |
| akismet | active | spam protection | KEEP | WordPress.com spam filter for comments. |
| all-in-one-wp-migration-src | active | backup/restore | CANDIDATE | Local deactivated. Production still active. Consider deactivation if backup scripts suffice. |
| cloudflare | active | CDN/optimization | KEEP | CDN and security via Cloudflare. |
| contact-form-7 | active | forms | KEEP | Contact form functionality. |
| duplicate-page-src | active | content utility | CANDIDATE | One-click page duplication utility. Low risk to deactivate. |
| envato-market | active | updates | CANDIDATE | Envato marketplace connection. Low risk to deactivate. |
| ⚠️ google-site-kit | **DEACTIVATED** (2026-07-23) | analytics | DEACTIVATED | Folder renamed to `google-site-kit.deactivated`. Triggers REST API preloading chain that exhausts memory. Keep deactivated. |
| ⚠️ google-listings-and-ads | **DEACTIVATED** (2026-07-23) | google shopping | DEACTIVATED | Folder renamed to `google-listings-and-ads.deactivated`. Deactivated to reduce memory. Keep deactivated. |
| ⚠️ jetpack | **DEACTIVATED** (2026-07-23) | wordpress.com connection | DEACTIVATED | Folder renamed to `jetpack.deactivated`. Client-installed. Caused fatal memory error on 2026-07-23. Keep deactivated. |
| ⚠️ klaviyo | active | email marketing | CANDIDATE | Email marketing automation. Client-installed. Evaluate data sync overhead. |
| ⚠️ packlink-pro-shipping | active | shipping | CANDIDATE | Shipping provider integration. Client-installed. |
| ⚠️ pinterest-for-woocommerce | **DEACTIVATED** (2026-07-23) | social commerce | DEACTIVATED | Folder renamed to `pinterest-for-woocommerce.deactivated`. Caused fatal memory error. Keep deactivated. |
| ⚠️ reddit-for-woocommerce | **DEACTIVATED** (2026-07-23) | social commerce | DEACTIVATED | Folder renamed to `reddit-for-woocommerce.deactivated`. Deactivated to reduce memory. Keep deactivated. |
| rev_slider | active | visual slider | CANDIDATE | Legacy slider. Deprecated PHP 8.x case statements. |
| visual-portfolio | active | portfolio display | CANDIDATE | Portfolio gallery plugin. Owned theme may render natively. |
| ⚠️ woocommerce-payments | active | payment gateway | KEEP | Primary payment gateway. Client-installed. Required for checkout. |
| ⚠️ woocommerce-paypal-payments | active | payment gateway | KEEP | PayPal payment gateway. Client-installed. |
| wordpress-importer | active | content import | CANDIDATE | WordPress content importer. |
| wordpress-seo | active | SEO | KEEP | Yoast SEO. Required for meta tags and sitemaps. |
| wp-debugging | active | debug | KEEP | WP Debugging helper. |

## Key Changes Since2026-05-03

1. **7 new plugins installed by client** (WooCommerce Payments, PayPal Payments, Klaviyo, Pinterest, Reddit, Packlink Pro, Google Listings & Ads, Jetpack)
2. **ACF PRO deactivated** by owned MU-plugin (2026-07-10)
3. **5 plugins deactivated** after memory exhaustion incidents (2026-07-23): `jetpack`, `google-site-kit`, `pinterest-for-woocommerce`, `reddit-for-woocommerce`, `google-listings-and-ads`
4. **Memory limit**: DonDominio shared hosting has a hard 160MB PHP memory limit. `ini_set()`, `.user.ini`, and `WP_MEMORY_LIMIT` are all ignored. Plugin deactivation is the only reliable memory relief.
5. **`.user.ini` created** with `memory_limit = 512M` (likely ignored by hosting, but kept as fallback)

## Backup State

Fill this in after you complete the backup on production.

How to create a repeatable backup locally:
- Run `scripts/wp-backup.sh`
- This produces `backups/<timestamp>/wordpress-db.sql` (if DB is configured or staged) and `backups/<timestamp>/wp-content.tar.gz`

| Item | Method | Filename/Location | Date | Notes |
|---|---|---|---|---|
| Database | Remote export via `wp-remote-db-export.sh` | `backups/production-backup-2026-07-10/wordpress-db.sql` (122 MB, sha256 `38db72543ed26b168f3f0d86fbab54ce392f958f5341be42975fb33e130122c0`) | 2026-07-10 | Pre-ACF-deactivation snapshot. |
| wp-content | Remote FTP archive via `wp-backup-wp-content.sh` | `backups/production-backup-2026-07-10/wp-content.tar.gz` (118 MB, sha256 `99845544689e479ec82422811a499247603de39779ea43b508ad6bf8d39cb03c`) | 2026-07-10 | Contains plugins/, mu-plugins/, themes/ (glacier + luciastuy). |
| debug.log | FTP download | `backups/prod-debug-2026-07-10/debug.log` (1.2 MB) | 2026-07-10 | Last pre-fix snapshot. |

## Production Environment Notes

- DonDominio shared hosting with FTP access.
- `WP_MEMORY_LIMIT` via `ini_set()` does NOT work on this hosting. Must use `.user.ini`.
- PHP version: Check `https://www.luciastuy.com/wp-admin/site-health.php`.
- `WP_DEBUG` and `WP_DEBUG_LOG` are set to `false` in production (disabled 2026-07-10 to reduce memory/disk usage).

## Repeatable Production Validation

After each production plugin change, validate with:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh
```

For more thorough validation:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-local-validate.sh
```

## Production Rollback

For a full WordPress rollback, run the following from the repo:

```bash
WP_BASE_URL=https://www.luciastuy.com WP_DEPLOY_TRANSPORT=ftp scripts/wp-plugin-removal-rollback.sh
```

This requires `scripts/wp-remote.env` with valid FTP credentials.
