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

*(No entries yet — Phase 1 created this log file.)*

## Evidence Notes

- 2026-04-30: Re-captured installed plugin list from `wp-admin/plugins.php` and WooCommerce system status. All 17 installed plugins are active. No plugin was deactivated or deleted.
- 2026-04-30: Fresh backups are still required before Phase 2 plugin cleanup. Do not deactivate/delete candidate plugins until the DB export and `wp-content` backup are recorded in `docs/wordpress-plugin-inventory.md` or a secure local handoff note.
