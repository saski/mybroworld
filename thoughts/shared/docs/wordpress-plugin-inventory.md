# WordPress Plugin Inventory

## Objective
Capture a stable inventory of the installed plugins so that “remove no longer needed plugins” can be done safely in staged batches.

## Source Of Truth (Captured Evidence)
- Plugin list captured in `thoughts/shared/docs/woocommerce-audit.md` on `2026-04-02`.
- Production plugin versions and active status were re-captured from `wp-admin/plugins.php` and WooCommerce system status on `2026-04-30`; all 17 installed plugins were active in that snapshot.
- Local imported production runtime captured with WP-CLI on `2026-05-03` from the Docker WordPress instance at `http://localhost:8080`.
- Production front-end asset inspection on `2026-07-10` confirmed the owned `luciastuy` theme is active and Elementor, RevSlider, WPBakery, and Kirki no longer load assets on the front page. ACF PRO is deactivated (folder renamed to `acf_pro.deactivated`). A fresh `wp-admin/plugins.php` admin confirmation is still needed before file deletion cycles.

Primary reference page:
- `https://www.luciastuy.com/wp-admin/plugins.php`

## Inventory (Installed Plugins)

Captured on `2026-05-03` with:
- `docker compose --env-file wordpress/.env -f wordpress/docker-compose.yml run --rm wpcli plugin list --fields=name,title,status,version,update,update_version,auto_update --format=json`

| Plugin | Local Status | Production Status | Type | Classification | Version | Notes |
|---|---|---|---|---|---|---|
| WooCommerce | active | active | required commerce | KEEP | 10.9.4 | Product, cart, checkout, order, REST, and Store API dependency. Do not replace with owned code while the site sells online. |
| Advanced Custom Fields PRO (`acf_pro`) | active | **DEACTIVATED** (2026-07-10) | legacy theme fields | DEACTIVATED | 6.2.0 | Owned MU-plugin `lucia-portfolio-post-type.php` now registers the `portfolio` CPT, its meta keys, and a meta-box UI for the 10 fields the owned theme reads. Existing `wp_postmeta` data survives deactivation because the owned theme reads via `get_post_meta()`. Folder renamed to `acf_pro.deactivated` via FTP; files not deleted pending soak period. |
| Akismet | active | active (no front-end assets) | spam protection | CONDITIONAL | 5.7 | Keep while comments/reviews/forms remain open; remove only after closing or replacing that surface. No front-end asset markers found on 2026-07-10 inspection. |
| All-in-One WP Migration (`all-in-one-wp-migration-src`) | inactive | active | migration utility | DELETE FILES | 7.81 | Locally deactivated successfully on 2026-05-01. Files should be removed after backup; do not keep as runtime backup path. |
| Contact Form 7 | active | active | forms | CONDITIONAL CANDIDATE | 6.1.6 | DB has `wpcf7_contact_form` posts and live shortcodes. CSS+JS assets load on front page. Replace with owned shortcode/form before removal. |
| Duplicate Page (`duplicate-page-src`) | active | active | admin utility | DELETE | 4.5.7 | No durable use found; local snapshot contains obfuscated behavior. Remove after backup and admin smoke tests. |
| Elementor | active | active (no front-end assets) | builder | CANDIDATE | 4.0.5 | **No front-end asset markers found on 2026-07-10 inspection.** The owned `luciastuy` theme is active and does not use Elementor. Safe to deactivate after backup and smoke checks. |
| Envato Market | active | active | commercial update utility | CANDIDATE | 2.0.13 | Only useful for Envato update workflow. Remove with commercial theme/plugin retirement. |
| Google Site Kit | active | active | analytics/search console | CANDIDATE | 1.182.0 | gtag.js (GT-M6B9CMXM) loads on front page. Replace with a small owned tag/verification path if GA/Search Console are required. |
| Hello Dolly (`hello`) | active | active | sample/admin novelty | DELETE | 1.7.2 | No business value. Delete along with adjacent orphan `hello-new.php` after backup. |
| Kirki | active | active (no front-end assets) | legacy theme customizer | BLOCKED CANDIDATE | 5.2.2 | **No front-end asset markers found on 2026-07-10 inspection.** The owned `luciastuy` theme does not use Kirki. Removable now that `glacier` is no longer the production runtime. |
| One Click Demo Import | active | active | demo importer | DELETE | 3.4.1 | Historical Glacier import evidence only. Runtime no longer needs it. |
| Slider Revolution (`rev_slider`) | active | active (no front-end assets) | visual builder | CANDIDATE | 6.6.15 | **No front-end asset markers found on 2026-07-10 inspection.** The owned `luciastuy` home hero replaces slider behavior. Safe to deactivate after backup and smoke checks. |
| Visual Portfolio | active | active | portfolio/gallery | CONDITIONAL CANDIDATE | 3.6.2 | Full asset stack loads on front page; portfolio grid (`vp-id-864`) still renders on home. Migrate live portfolio/gallery pages first before removal. |
| WordPress Importer | active | active | WXR importer | DELETE | 0.9.5 | Admin import utility only; use repo snapshot/import scripts instead. |
| WPBakery Page Builder (`js_composer`) | active | active (no front-end assets) | builder | CANDIDATE | 7.0 | **No front-end asset markers found on 2026-07-10 inspection.** The owned `luciastuy` theme does not use WPBakery. Stale `[vc_*]` shortcodes remain in the `catalogo` page DB row (ID 1122) but the front-end renders correctly via the owned `page-catalogo.php` template. Safe to deactivate after sanitizing stale DB content. |
| Yoast SEO (`wordpress-seo`) | active | active | SEO infrastructure | CONDITIONAL CANDIDATE | 28.0 | Large DB footprint. Meta + JSON-LD schema graph loads on front page. Replace only after capturing HTML/SEO parity for key pages. |

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

A fresh remote production recapture remains pending because the cleanup-priority inventory is from the local imported runtime, not the current live `wp-admin/plugins.php` screen. Do not delete production files until the live admin list is refreshed and the remote backup record is complete.

## 2026-04-30 Production Admin Update Notices

These notices were visible on `wp-admin/plugins.php` or `wp-admin/themes.php` during the direct production admin recapture:

| Component | Installed Version | Available Version | Notes |
|---|---|---|---|
| Advanced Custom Fields PRO | 6.2.0 | 6.8.0.1 | Automatic update unavailable until license key is entered |
| Duplicate Page | 4.5.7 | 4.5.8 | Update link visible |
| Kirki Customizer Framework | 5.2.2 | 6.0.2 | Update link and TGM notice visible |
| WPBakery Page Builder | 7.0 | 8.7.2 | Automatic update unavailable until license activation |

## 2026-05-03 Owned Theme Readiness Note

- Local `luciastuy` validation passed with `WP_EXPECTED_THEME=luciastuy scripts/wp-local-validate.sh`.
- The owned theme and `mu-plugins` code scan found no references to `elementor`, `revslider`, `js_composer`, `visual-portfolio`, `acf_pro`, or `glacier`.
- The public production site was still serving `glacier` at this point, so production plugin deactivation remained blocked until the owned theme was active.

## 2026-07-10 Production Theme And Plugin Status Confirmation

Production front-end inspection on 2026-07-10 confirmed:
- The owned `luciastuy` theme is active (body class `wp-theme-luciastuy theme-luciastuy`, assets from `/wp-content/themes/luciastuy/`).
- Home hero video renders (YouTube `E4_s9_Ky91E`).
- Portfolio grid (Visual Portfolio `vp-id-864`) still renders on the front page.
- WooCommerce shop grid renders on `/shop/` (20 products, 3 columns).
- `/catalogo/` renders the clean owned contact template (no WPBakery shortcode leakage on the front-end).

Front-end plugin asset markers **FOUND** (still loading on production):
- WooCommerce 10.9.4, Visual Portfolio 3.6.2, Contact Form 7 6.1.6, Yoast SEO 28.0, Site Kit by Google 1.182.0, owned MU-plugins (lucia-consent-banner, lucia-ga4-ecommerce).

Front-end plugin asset markers **NOT FOUND** (no longer loading on production front-end):
- Elementor, RevSlider (`revslider`), WPBakery (`js_composer`), Kirki, Akismet.

Plugin status changes since the 2026-05-03 local snapshot:
- ACF PRO: **DEACTIVATED** in production on 2026-07-10 (folder renamed to `acf_pro.deactivated`).
- All other plugins: status unchanged in the DB (still active), but Elementor, RevSlider, WPBakery, and Kirki no longer produce front-end output because the owned `luciastuy` theme does not use them.

Next deactivation candidates (low-risk, no front-end asset markers):
1. `kirki` — not used by `luciastuy`; `glacier` is no longer the production runtime.
2. `envato-market` — commercial update utility for retired commercial theme/plugins.
3. `hello` — admin novelty with no business value.
4. `duplicate-page-src` — admin utility with no durable use found.

A fresh `wp-admin/plugins.php` admin confirmation is still needed before file deletion cycles to verify the exact active/inactive/deleted state in the database.

## 2026-05-15 Identity Parity Candidate Note

OpenSpec change `align-luciastuy-live-identity` revalidated that production home still loaded legacy `glacier`, `elementor`, `rev_slider`, and `visual-portfolio` assets. These were **deletion candidates only after** production `luciastuy` migration. As of 2026-07-10, the `luciastuy` theme is active in production and Elementor, RevSlider, and Kirki no longer load front-end assets, so these candidates are now unblocked for one-at-a-time deactivation. Visual Portfolio remains active because the home portfolio grid still depends on it.

## 2026-07-10 Portfolio CPT Ownership Note

- New MU-plugin `lucia-portfolio-post-type.php` registers the `portfolio` CPT on `init` with slug `/portfolio/{slug}`, `show_in_rest`, and supports `title`, `editor`, `thumbnail`, `page-attributes`, `custom-fields`.
- The MU-plugin also registers 10 meta keys via `register_post_meta()`: `visible_details`, `author_title`, `author`, `client_name_title`, `client_name`, `project_date_title`, `project_date`, `project_location_title`, `project_location`, `gallery_projects`.
- A lean meta box replaces the ACF field group admin UI for these 10 fields. The `gallery_projects` field accepts comma-separated attachment IDs.
- This makes ACF PRO's CPT registration (if any) and field group `group_581b98b1a9361` redundant for the owned `luciastuy` runtime. Existing `wp_postmeta` data is read by the owned theme via `get_post_meta()` and survives ACF deactivation.
- ACF PRO deactivation is now safe for rendering, but verify `/portfolio/*` still resolves and the meta box loads before deleting ACF files.

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

Before any plugin deactivation or production file deletion:

1. Create a fresh production DB export through phpMyAdmin or `scripts/wp-backup.sh`.
2. Create a fresh `wp-content` archive, at minimum covering `plugins`, `mu-plugins`, and `themes`.
3. Record backup filenames, timestamps, and storage location in a local handoff note, not in git if the path exposes private machine details.
