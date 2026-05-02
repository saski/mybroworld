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

## Standard Verification Command

Run this before and after each plugin deactivation or deletion:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh
```

Record the command output summary in the `Evidence` column for the affected plugin.
