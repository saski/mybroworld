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

## 2026-05-03 Dependency Audit Priority

This order supersedes the UX-only order when the goal is dependency cleanup. Do not batch these changes; every item still needs backup, one change, post-change smoke checks, and a log entry.

| Order | Candidate | Decision | Required Precondition |
|---|---|---|---|
| 1 | `hello-new.php` orphan file | Delete from filesystem | Remote `wp-content` backup; direct URL returns 404 after deletion. |
| 2 | `duplicate-page-src` | Delete | Confirm product/post admin screens still work after removal. |
| 3 | `all-in-one-wp-migration-src` | Delete files; already inactive locally | Confirm repo backup/import scripts are the rollback path. |
| 4 | `hello` | Delete | Admin smoke check only. |
| 5 | `wordpress-importer` | Delete | Confirm no WXR import task is pending. |
| 6 | `one-click-demo-import` | Delete | Keep historical import log as evidence if needed. |
| 7 | `envato-market` | Delete unless active Envato update workflow is confirmed | Confirm `glacier`/commercial plugin updates are no longer managed through Envato. |
| 8 | `elementor` | Deactivate, then delete after soak | Baseline proves no live Elementor layouts. |
| 9 | `rev_slider` | Replace then delete | Rebuild any live slider/hero with owned markup. |
| 10 | `google-site-kit` | Replace then delete | GA/Search Console continuity through owned tag or external verification. |
| 11 | `contact-form-7` | Replace then delete | Replace live shortcodes/forms and verify email delivery. |
| 12 | `visual-portfolio` | Migrate then delete | Confirm/migrate live portfolio/gallery pages. |
| 13 | `js_composer` | Migrate then delete | Remove or shim legacy `[vc_*]` shortcodes. |
| 14 | `kirki` | Delete after `glacier` retirement | Production no longer uses `glacier` as runtime. |
| 15 | `acf_pro` | Delete after `glacier` retirement | Replace required field access with owned meta/templates. |
| 16 | `wordpress-seo` | Optional later replacement | SEO parity captured for key pages. |
| 17 | `akismet` | Optional later replacement/removal | Comments/reviews/form spam surface closed or replaced. |

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
- Next candidate: Slider Revolution remains first after the owned theme is healthy in production.

## Standard Verification Command

Run this before and after each plugin deactivation or deletion:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh
```

Record the command output summary in the `Evidence` column for the affected plugin.
