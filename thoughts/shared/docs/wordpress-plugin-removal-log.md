# WordPress Plugin Removal Log

## Purpose
Track each plugin you consider removing so you can prove:
- what was removed
- what was tested
- what was rolled back (if anything)

## Log Format (Template)

| Date (local) | Plugin | Action | Evidence | Result |
|---|---|---|---|---|
| YYYY-MM-DD | plugin-name | deactivated | notes/screenshots/log excerpt | pass/fail |
| YYYY-MM-DD | plugin-name | deleted | notes/screenshots/log excerpt | pass/fail |

## Rollback Notes
- If a plugin removal breaks a page or triggers fatal PHP errors:
  - restore the plugin directory from backup
  - re-activate the plugin
  - mark it `KEEP`

## Current Entries

| Date (local) | Plugin | Action | Evidence | Result |
|---|---|---|---|---|
| 2026-05-01 | `all-in-one-wp-migration-src` | local deactivated | Baseline and post-change `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` passed; WP-CLI inactive-state assertion passed after deactivation; smoke checks returned 200 for `/`, `/shop/`, `/cart/`, and `/checkout/`. | pass; keep inactive locally; production untouched; rollback with `wp plugin activate all-in-one-wp-migration-src` |
| 2026-07-10 | `acf_pro` | production deactivated | Backup: `backups/production-backup-2026-07-10/` (DB sha256 `38db7254...`, wp-content.tar.gz sha256 `99845544...`). Deployed owned MU-plugin `lucia-portfolio-post-type.php` registering CPT `portfolio` + 10 meta keys + meta box. Also fixed production 500 error by raising `WP_MEMORY_LIMIT` to 512M and disabling `WP_DEBUG`/`SAVEQUERIES`/`SCRIPT_DEBUG` in `wp-config.php`. Pre-deactivation smoke: `WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh` passed (200 for `/`, `/shop/`, `/cart/`, `/checkout/`). Deactivation: renamed `/public/wp-content/plugins/acf_pro` to `acf_pro.deactivated` via FTP. Post-deactivation verification: HTTP 200 for `/`, `/shop/`, `/cart/`, `/portfolio/supergreat/`, `/portfolio/super-supergreat/`, `/portfolio/time/`; REST API `wp/v2/portfolio` returns 2 items with all 10 owned meta keys populated; admin edit page for post 2397 shows `lucia_portfolio_details` meta box in `normal` location; no error messages in page content. | pass; keep deactivated; files not deleted pending soak period; rollback by renaming `acf_pro.deactivated` back to `acf_pro` |
| 2026-07-23 | `pinterest-for-woocommerce` | **incident — memory exhaustion** | Client-installed plugin triggered `Fatal error: Allowed memory size of 167772160 bytes exhausted` in `AdvertiserConnect.php`. Root cause: `WP_MEMORY_LIMIT=512M` in `wp-config.php` does NOT work on DonDominio shared hosting (`ini_set()` is overridden). Fix: created `/public/.user.ini` with `memory_limit = 512M`. Site returned to 200 across all pages. No deactivation needed — memory fix was sufficient. | pass; `.user.ini` fix applied; Pinterest plugin kept active; consider deactivation if Pinterest sales channel is not needed |
| 2026-07-23 | `jetpack` | **incident — memory exhaustion (second occurrence)** | Client-installed Jetpack plugin triggered `Fatal error: Allowed memory size of 167772160 bytes exhausted` in `jetpack-newsletter/class-settings.php`. The `.user.ini` fix from earlier today did NOT work (DonDominio ignores `.user.ini`). Fix: renamed `/public/wp-content/plugins/jetpack` to `jetpack.deactivated` via FTP. Post-fix verification: HTTP 200 for `/`, `/shop/`, `/portfolio/supergreat/`, `/portfolio/super-supergreat/`, `/portfolio/time/`. Jetpack is now deactivated; client-installed plugin. | pass; Jetpack deactivated; keep deactivated; rollback by renaming `jetpack.deactivated` back to `jetpack` |
| 2026-07-23 | `google-site-kit`, `pinterest-for-woocommerce`, `reddit-for-woocommerce`, `google-listings-and-ads` | **mass deactivation — memory exhaustion (third occurrence)** | Even after Jetpack deactivation, WordPress core `array_merge()` and WooCommerce `WC_Data_Store` still exhausted memory. Root cause: 17+ active plugins on DonDominio's hard 160MB PHP limit. Fix: deactivated 4 more heavy plugins via FTP (renamed to `.deactivated`). Post-fix verification: HTTP 200 across 3 stability rounds for `/`, `/shop/`, `/cart/`. Total deactivated: 6 plugins (`acf_pro`, `jetpack`, `google-site-kit`, `pinterest-for-woocommerce`, `reddit-for-woocommerce`, `google-listings-and-ads`). | pass; 4 plugins deactivated; keep deactivated; rollback by renaming `.deactivated` folders back |

## Evidence Notes

- 2026-04-30: Re-captured installed plugin list from production `wp-admin/plugins.php` and WooCommerce system status. All 17 installed plugins were active. No plugin was deactivated or deleted.
- 2026-04-30: Fresh backups were still required before Phase 2 plugin cleanup. Do not deactivate/delete candidate plugins until the DB export and `wp-content` backup are recorded in `thoughts/shared/docs/wordpress-plugin-inventory.md` or a secure local handoff note.

## 2026-05-15 Post-Glacier Identity Migration Candidate Snapshot

Captured for OpenSpec change `align-luciastuy-live-identity` after baseline evidence review of:

- `thoughts/shared/docs/woocommerce-audit.md`
- `thoughts/shared/docs/wordpress-plugin-inventory.md`
- this removal log
- `wordpress/.tmp/identity-baseline/2026-05-15/glacier-home.html`

**Status as of 2026-07-10**: The `luciastuy` theme is now active in production. The candidates below have been updated with current production evidence.

| Candidate | Why It Is A Candidate | Evidence | Status (2026-07-10) | Rollback Note |
|---|---|---|---|---|
| `elementor` | Builder coupling for legacy runtime | Active in inventory; production assets loaded on home page (pre-2026-07-10) | **No front-end assets on 2026-07-10 inspection.** Unblocked for deactivation. | Reactivate plugin and clear caches if shop/content layout regresses |
| `rev_slider` | Visual builder dependency for hero/slider path | Active in inventory; `rs6.css` loaded on home page (pre-2026-07-10) | **No front-end assets on 2026-07-10 inspection.** Owned home hero replaces slider. Unblocked for deactivation. | Reactivate plugin and restore old hero route if needed |
| `js_composer` (WPBakery) | Legacy shortcode/builder dependency | Classified as blocked candidate in inventory and audit | **No front-end assets on 2026-07-10 inspection.** Stale `[vc_*]` shortcodes remain in `catalogo` page DB row (ID 1122) but front-end renders correctly via owned template. Unblocked for deactivation after sanitizing stale DB content. | Reactivate and restore shortcode-bearing content if failures appear |
| `visual-portfolio` | Legacy portfolio/gallery runtime dependency | Visual Portfolio CSS assets loaded on production home | **Still active and rendering** the home portfolio grid (`vp-id-864`). NOT unblocked. Migrate portfolio grid to owned code first. | Reactivate plugin if portfolio/gallery pages break |
| `acf_pro` | Glacier field dependency; owned CPT + meta-box now covers portfolio rendering and editing | Owned MU-plugin `lucia-portfolio-post-type.php` registers CPT + 10 meta keys + meta box (2026-07-10) | **DEACTIVATED 2026-07-10.** Folder renamed to `acf_pro.deactivated`. Files not deleted pending soak period. | Restore plugin by renaming `acf_pro.deactivated` back to `acf_pro` |
| `kirki` | Glacier customizer dependency | Classified as blocked candidate in inventory and audit | **No front-end assets on 2026-07-10 inspection.** `glacier` is no longer the production runtime. Unblocked for deactivation. | Reactivate plugin if customizer-driven settings are still required |
| `glacier` theme helpers/assets | Legacy theme coupling | Production home previously loaded `wp-content/themes/glacier/*` CSS/JS | **No longer active.** `luciastuy` is the production theme. `glacier` theme files remain on disk but are not loaded. Candidate for file deletion after soak period. | Re-enable previous theme as rollback if replacement fails |

### Safety Rule (Reconfirmed 2026-05-15)

Visual parity evidence does not make any plugin or extension safe to delete. Every candidate still requires:

1. production backup capture,
2. one-plugin-at-a-time deactivation,
3. pre/post smoke validation,
4. admin review of affected surfaces,
5. explicit rollback path.

## Planned UX Uncoupling Candidate Order

Captured on 2026-05-02 for `thoughts/shared/plans/2026-05-02-online-shop-ux-quality-plan.md`.

Do not deactivate these in a batch. Each candidate requires its own baseline, rollback, action, post-change checks, and log entry.

| Order | Candidate | Reason | Required Precondition |
|---|---|---|---|
| 1 | Slider Revolution | Visual/builder dependency that should not shape shop UX. | Owned `luciastuy` shop path validated and front-page impact understood. |
| 2 | Elementor | Builder dependency that should not carry product-card or product-detail UX. | Owned theme validated for shop, product, cart, and checkout. |
| 3 | All-in-One WP Migration | Infrastructure utility, not runtime UX. | Production backup and restore workflow proven without relying on the plugin. |
| 4 | Contact Form 7 | Possible content utility, not product purchase path. | Confirm no live forms are needed for customer enquiries. |
| 5 | Site Kit by Google | Analytics infrastructure. | Confirm analytics requirement and acceptable alternative if removed. |
| 6 | Yoast SEO | SEO infrastructure. | Confirm SEO requirement and metadata coverage before removal. |

## 2026-07-10 Updated Deactivation Priority

This order supersedes the 2026-05-03 priority now that the `luciastuy` theme is active in production and ACF PRO is deactivated. Elementor, RevSlider, WPBakery, and Kirki no longer load front-end assets. Do not batch these changes; every item still needs backup, one change, post-change smoke checks, and a log entry.

| Order | Candidate | Decision | Status / Required Precondition |
|---|---|---|---|
| 1 | `acf_pro` | Delete deactivated folder after soak | **Deactivated 2026-07-10.** Delete `acf_pro.deactivated` after 1-2 weeks without incidents. |
| 2 | `kirki` | Deactivate then delete | No front-end assets; `glacier` is no longer the production runtime. |
| 3 | `hello` + `hello-new.php` | Delete | Admin smoke check only. Delete orphan `hello-new.php` alongside. |
| 4 | `duplicate-page-src` | Delete | Confirm product/post admin screens still work after removal. |
| 5 | `all-in-one-wp-migration-src` | Delete files; already inactive locally | Confirm repo backup/import scripts are the rollback path. |
| 6 | `wordpress-importer` | Delete | Confirm no WXR import task is pending. |
| 7 | `one-click-demo-import` | Delete | Keep historical import log as evidence if needed. |
| 8 | `envato-market` | Delete unless active Envato update workflow is confirmed | Confirm `glacier`/commercial plugin updates are no longer managed through Envato. |
| 9 | `elementor` | Deactivate then delete | No front-end assets; owned theme does not use Elementor. |
| 10 | `rev_slider` | Deactivate then delete | No front-end assets; owned home hero replaces slider. |
| 11 | `js_composer` (WPBakery) | Deactivate then delete | No front-end assets; sanitize stale `[vc_*]` DB content first (catalogo page ID 1122). |
| 12 | `google-site-kit` | Replace then delete | GA/Search Console continuity through owned tag or external verification. |
| 13 | `contact-form-7` | Replace then delete | Replace live shortcodes/forms and verify email delivery. |
| 14 | `visual-portfolio` | Migrate then delete | Migrate home portfolio grid to owned code; still actively rendering on production. |
| 15 | `wordpress-seo` | Optional later replacement | SEO parity captured for key pages. |
| 16 | `akismet` | Optional later replacement/removal | Comments/reviews/form spam surface closed or replaced. |
| 17 | `glacier` theme | Delete after soak | No longer the production runtime; files remain on disk. |

## Prepared Cycle Records

### Cycle 1: Slider Revolution

- Date: 2026-05-03
- Candidate: Slider Revolution
- Type: plugin
- Lean hypothesis: removing a commercial visual-builder dependency should reduce shop-path coupling and make the owned WooCommerce theme the only storefront presentation layer.
- Expected improvement: fewer production assets and builder markers on customer-facing pages after the owned theme is active, with a smaller surface for layout regressions.
- Risk: the current production front page and legacy `glacier` theme may still depend on Slider Revolution; production HTML still contains `revslider` markers while `glacier` remains active.
- Rollback: reactivate Slider Revolution from `wp-admin/plugins.php`; if files were deleted in a later cycle, restore the plugin directory from the remote `wp-content` backup before reactivation.
- Baseline checks:
  - `scripts/wp-test-owned-code.sh` passed on 2026-05-03.
  - `WP_EXPECTED_THEME=luciastuy scripts/wp-local-validate.sh` passed on 2026-05-03.
  - `WP_BASE_URL=http://localhost:8080 scripts/woo-storefront-ux-assert.mjs --paths /shop/,/product/fanzimad-2026-yuju/` passed on 2026-05-03; local rendered markers included `elementor`, `revslider`, `js_composer`, and `visual-portfolio`, but not `glacier`.
  - `WP_BASE_URL=https://www.luciastuy.com node scripts/woo-storefront-ux-assert.mjs --paths /shop/,/product/fanzimad-2026-yuju/` passed on 2026-05-03; production rendered markers still included `glacier`, `elementor`, `revslider`, `js_composer`, and `visual-portfolio`.
- Change made: none; this is a readiness record only.
- Post-change checks: pending.
- Decision: revise; do not deactivate Slider Revolution while production still serves `glacier` and front-page impact is not approved.
- Learning: plugin uncoupling is blocked by the production active theme, not by owned-code readiness. Activate or route the public shop to `luciastuy` first, then repeat the same baseline before one-plugin-at-a-time deactivation.
- **Update 2026-07-10**: The `luciastuy` theme is now active in production. Slider Revolution no longer loads front-end assets. The blocker is resolved; Slider Revolution is now order #10 in the updated deactivation priority.

## Standard Verification Command

Run this before and after each plugin deactivation or deletion:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh
```

Record the command output summary in the `Evidence` column for the affected plugin.
