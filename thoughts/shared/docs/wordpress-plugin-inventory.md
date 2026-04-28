# WordPress Plugin Inventory

## Objective
Capture a stable inventory of the installed plugins so that “remove no longer needed plugins” can be done safely in staged batches.

## Source Of Truth (Captured Evidence)
- Plugin list captured in `thoughts/shared/docs/woocommerce-audit.md` on `2026-04-02`.
- Plugin versions were not captured in that audit snapshot; versions must be re-captured from `wp-admin/plugins.php` if needed.

Primary reference page:
- `https://www.luciastuy.com/wp-admin/plugins.php`

## Inventory (Installed Plugins)

| Plugin | Active | Type | Initial Classification | Version | Evidence |
|---|---|---|---|---|---|
| WooCommerce | yes | required | KEEP | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| Elementor | yes | builder | CANDIDATE | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| Slider Revolution | yes | builder | CANDIDATE | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| Yoast SEO | yes | infrastructure | UNKNOWN | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| Contact Form 7 | yes | content/editorial | UNKNOWN | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| Site Kit by Google | yes | infrastructure | UNKNOWN | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |
| All-in-One WP Migration | yes | infrastructure | CANDIDATE | unknown (pending capture) | `thoughts/shared/docs/woocommerce-audit.md` |

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
| Database export | phpMyAdmin or backup tool | `____________` | `YYYY-MM-DD HH:MM` | `____________` | At minimum: exports schema + options |
| `wp-content/` backup | FTP/SFTP/hosting file manager | `____________` | `YYYY-MM-DD HH:MM` | `____________` | Must include `wp-content/plugins/` and `wp-content/mu-plugins/` |

## Next Action Needed (Before Phase 2 Execution)
Re-capture missing plugin versions (and confirm active/inactive status) directly from:
- `https://www.luciastuy.com/wp-admin/plugins.php`

