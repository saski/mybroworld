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

