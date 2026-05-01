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

## Standard Verification Command

Run this before and after each plugin deactivation or deletion:

```bash
WP_BASE_URL=https://www.luciastuy.com scripts/wp-plugin-removal-smoke.sh
```

Record the command output summary in the `Evidence` column for the affected plugin.
