# WordPress Plugin Inventory

## Objective
Capture a stable inventory of the installed plugins so that “remove no longer needed plugins” can be done safely in staged batches.

## Source Of Truth (Captured Evidence)
- Plugin list captured in `docs/woocommerce-audit.md` on `2026-04-02`.
- Plugin versions and active status were re-captured from `wp-admin/plugins.php` and WooCommerce system status on `2026-04-30`.

Primary reference page:
- `https://www.luciastuy.com/wp-admin/plugins.php`

## Inventory (Installed Plugins)

| Plugin | Active | Type | Initial Classification | Version | Evidence |
|---|---|---|---|---|---|
| Advanced Custom Fields PRO | yes | builder/data modeling | UNKNOWN | 6.2.0 | `wp-admin/plugins.php`, `wc-status` |
| Akismet Anti-spam: Spam Protection | yes | infrastructure | UNKNOWN | 5.7 | `wp-admin/plugins.php`, `wc-status` |
| All-in-One WP Migration | yes | infrastructure | CANDIDATE | 7.81 | `wp-admin/plugins.php`, `wc-status` |
| Contact Form 7 | yes | content/editorial | UNKNOWN | 6.1.5 | `wp-admin/plugins.php`, `wc-status` |
| Duplicate Page | yes | editorial utility | CANDIDATE | 4.5.7 | `wp-admin/plugins.php`, `wc-status` |
| Elementor | yes | builder | CANDIDATE | 4.0.5 | `wp-admin/plugins.php`, `wc-status` |
| Envato Market | yes | theme/plugin updater | UNKNOWN | 2.0.13 | `wp-admin/plugins.php`, `wc-status` |
| Hello Dolly | yes | nonessential | CANDIDATE | 1.7.2 | `wp-admin/plugins.php`, `wc-status` |
| Kirki Customizer Framework | yes | theme dependency | UNKNOWN | 5.2.2 | `wp-admin/plugins.php`, `wc-status` |
| One Click Demo Import | yes | demo/import utility | CANDIDATE | 3.4.1 | `wp-admin/plugins.php`, `wc-status` |
| Site Kit by Google | yes | infrastructure | UNKNOWN | 1.177.0 | `wp-admin/plugins.php`, `wc-status` |
| Slider Revolution | yes | builder | CANDIDATE | 6.6.15 | `wp-admin/plugins.php`, `wc-status` |
| Visual Portfolio, Posts & Image Gallery | yes | portfolio/gallery | UNKNOWN | 3.6.0 | `wp-admin/plugins.php`, `wc-status` |
| WooCommerce | yes | required | KEEP | 10.7.0 | `wp-admin/plugins.php`, `wc-status` |
| WordPress Importer | yes | import utility | CANDIDATE | 0.9.5 | `wp-admin/plugins.php`, `wc-status` |
| WPBakery Page Builder | yes | builder | CANDIDATE | 7.0 | `wp-admin/plugins.php`, `wc-status` |
| Yoast SEO | yes | infrastructure | UNKNOWN | 27.5 | `wp-admin/plugins.php`, `wc-status` |

## Update Notices Captured

These notices were visible on `wp-admin/plugins.php` or `wp-admin/themes.php` on 2026-04-30:

| Component | Installed Version | Available Version | Notes |
|---|---|---|---|
| Advanced Custom Fields PRO | 6.2.0 | 6.8.0.1 | Automatic update unavailable until license key is entered |
| Duplicate Page | 4.5.7 | 4.5.8 | Update link visible |
| Kirki Customizer Framework | 5.2.2 | 6.0.2 | Update link and TGM notice visible |
| WPBakery Page Builder | 7.0 | 8.7.2 | Automatic update unavailable until license activation |

## Local Backup Evidence (For Staged Rollback in Development)

If you are using the local WordPress runtime, the repository currently contains:
- DB snapshot: `wordpress/wordpress.sql`
- DB snapshot SHA-256:
  - `e2db5d034b9eab700cecef28a0ea31802c4d5be72649e154fbb213a7c3f2d36b`

Notes:
- This is not a remote backup of `wp-content/` and it does not replace the remote backup requirement before deleting plugins on production.
- It is intended to support local rollback/testing if you replicate the deactivation steps locally first.

## Remote Backup Record (Required Before Phase 2)

Fill this in after you complete the backup on production.

How to create a repeatable backup locally:
- Run `scripts/wp-backup.sh`
- This produces `backups/<timestamp>/wordpress-db.sql` (if DB is configured or staged) and `backups/<timestamp>/wp-content.tar.gz`

| Item | Method | Filename/Location | Date/Time | Size (optional) | Notes |
|---|---|---|---|---|---|
| Database export | phpMyAdmin or backup tool | pending | 2026-04-30 | pending | Current session has no MySQL/phpMyAdmin credentials available in repo-safe form |
| `wp-content/` backup | FTP/SFTP/hosting file manager | pending | 2026-04-30 | pending | Current session has no FTP password available in repo-safe form |

## Next Action Needed (Before Phase 2 Execution)
Before any plugin deactivation or production deploy:

1. Create a fresh production DB export through phpMyAdmin or `scripts/wp-backup.sh`.
2. Create a fresh `wp-content` archive, at minimum covering `plugins`, `mu-plugins`, and `themes`.
3. Record backup filenames, timestamps, and storage location in a local handoff note, not in git if the path exposes private machine details.
