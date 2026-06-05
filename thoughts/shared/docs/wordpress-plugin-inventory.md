# WordPress Plugin Inventory

## Objective
Capture a stable inventory of the installed plugins so that “remove no longer needed plugins” can be done safely in staged batches.

## Source Of Truth (Captured Evidence)
- Plugin list captured in `thoughts/shared/docs/woocommerce-audit.md` on `2026-04-02`.
- Local imported production runtime captured with WP-CLI on `2026-05-03` from the Docker WordPress instance at `http://localhost:8080`.
- Remote production admin state still needs direct confirmation before production deletion.

Primary reference page:
- `https://www.luciastuy.com/wp-admin/plugins.php`

## Inventory (Installed Plugins)

Captured on `2026-05-03` with:
- `docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli plugin list --fields=name,title,status,version,update,update_version,auto_update --format=json`

| Plugin | Local Status | Type | Classification | Version | Notes |
|---|---|---|---|---|---|
| WooCommerce | active | required commerce | KEEP | 10.7.0 | Product, cart, checkout, order, REST, and Store API dependency. Do not replace with owned code while the site sells online. |
| Advanced Custom Fields PRO (`acf_pro`) | active | legacy theme fields | BLOCKED CANDIDATE | 6.2.0 | Required by `glacier`; replace with registered meta/`get_post_meta()` after `luciastuy` migration. Verify plugin integrity before keeping any temporary copy. |
| Akismet | active | spam protection | CONDITIONAL | 5.7 | Keep while comments/reviews/forms remain open; remove only after closing or replacing that surface. |
| All-in-One WP Migration (`all-in-one-wp-migration-src`) | inactive | migration utility | DELETE FILES | 7.81 | Locally deactivated successfully on 2026-05-01. Files should be removed after backup; do not keep as runtime backup path. |
| Contact Form 7 | active | forms | CONDITIONAL CANDIDATE | 6.1.5 | DB has `wpcf7_contact_form` posts and live shortcodes. Replace with owned shortcode/form before removal. |
| Duplicate Page (`duplicate-page-src`) | active | admin utility | DELETE | 4.5.7 | No durable use found; local snapshot contains obfuscated behavior. Remove after backup and admin smoke tests. |
| Elementor | active | builder | CANDIDATE | 4.0.5 | Weak evidence of actual layout use; no owned theme dependency. Good deactivation candidate after baseline. |
| Envato Market | active | commercial update utility | CANDIDATE | 2.0.13 | Only useful for Envato update workflow. Remove with commercial theme/plugin retirement. |
| Google Site Kit | active | analytics/search console | CANDIDATE | 1.177.0 | Replace with a small owned tag/verification path if GA/Search Console are required. |
| Hello Dolly (`hello`) | active | sample/admin novelty | DELETE | 1.7.2 | No business value. Delete along with adjacent orphan `hello-new.php` after backup. |
| Kirki | active | legacy theme customizer | BLOCKED CANDIDATE | 5.2.2 | Required for `glacier` customizer settings; removable once `glacier` is not runtime. |
| One Click Demo Import | active | demo importer | DELETE | 3.4.1 | Historical Glacier import evidence only. Runtime no longer needs it. |
| Slider Revolution (`rev_slider`) | active | visual builder | CANDIDATE | 6.6.15 | Used by legacy shortcodes/tables. Replace hero/sliders with owned static template before deletion. |
| Visual Portfolio | active | portfolio/gallery | CONDITIONAL CANDIDATE | 3.6.0 | Legacy portfolio content exists. Migrate live portfolio/gallery pages first. |
| WordPress Importer | active | WXR importer | DELETE | 0.9.5 | Admin import utility only; use repo snapshot/import scripts instead. |
| WPBakery Page Builder (`js_composer`) | active | builder | BLOCKED CANDIDATE | 7.0 | Heavy legacy shortcode use. Remove only after migrating `[vc_*]` content or replacing it with owned templates/shims. |
| Yoast SEO (`wordpress-seo`) | active | SEO infrastructure | CONDITIONAL CANDIDATE | 27.5 | Large DB footprint. Replace only after capturing HTML/SEO parity for key pages. |

Additional orphan file found in the production snapshot:
- `wp-content/plugins/hello-new.php`: not a registered plugin, but exposes file-management behavior. Treat as a high-priority filesystem cleanup target after backup.

## UX Uncoupling Review

Captured on 2026-05-02 while implementing `thoughts/shared/plans/2026-05-02-online-shop-ux-quality-plan.md`.

| Plugin | Shop UX Role | Current Decision |
|---|---|---|
| WooCommerce | Commerce engine, product model, cart, checkout | Keep as the baseline dependency. |
| Elementor | Builder coupling risk | Do not build new shop UX on it; candidate for staged deactivation after owned theme validation. |
| Slider Revolution | Visual/builder coupling risk | Do not use for shop UX; first staged deactivation candidate after front-page impact is checked. |
| All-in-One WP Migration | Backup/migration utility | Keep out of runtime UX; candidate after backup and rollback workflow is proven. |
| Yoast SEO | SEO infrastructure | Do not allow it to shape UX scope; decide separately after SEO evidence. |
| Contact Form 7 | Content/form utility | Do not use for product purchase flow unless explicitly approved. |
| Site Kit by Google | Analytics infrastructure | Do not couple shop UI to it; decide separately after analytics evidence. |

Remote production recapture remains pending because this inventory is from the local imported runtime, not the live `wp-admin/plugins.php` screen. Do not delete production files until the remote backup record is complete.

## 2026-05-03 Owned Theme Readiness Note

- Local `luciastuy` validation passed with `WP_EXPECTED_THEME=luciastuy scripts/wp-local-validate.sh`.
- The owned theme and `mu-plugins` code scan found no references to `elementor`, `revslider`, `js_composer`, `visual-portfolio`, `acf_pro`, or `glacier`.
- The public production site still serves `glacier`, so production plugin deactivation remains blocked until the owned theme is active or the front-page impact is explicitly approved.

## 2026-05-15 Identity Parity Candidate Note

OpenSpec change `align-luciastuy-live-identity` revalidated that production home still loads legacy `glacier`, `elementor`, `rev_slider`, and `visual-portfolio` assets. These are **deletion candidates only after** production `luciastuy` migration is accepted and one-plugin-at-a-time validation is complete. Detailed candidate evidence and rollback constraints are logged in `thoughts/shared/docs/wordpress-plugin-removal-log.md`.

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
Confirm the local imported inventory against the live production admin list directly from:
- `https://www.luciastuy.com/wp-admin/plugins.php`
