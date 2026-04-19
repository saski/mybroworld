---
date: 2026-04-02
researcher: assistant
topic: "WordPress plugin cleanup"
tags: [wordpress, plugins, maintenance]
status: in-progress
---

# WordPress Plugin Cleanup Plan

## Overview
Reduce WordPress maintenance risk by removing plugins that are no longer required, while preserving site functionality through backups, staged deactivation, and verification.

Primary reference page: `https://www.luciastuy.com/wp-admin/plugins.php`
([login/Plugins page](https://www.luciastuy.com/wp-admin/plugins.php)).

## Current State
You want to review the WordPress `Plugins` admin page and remove plugins that are “no longer needed”.
At this stage, the exact set of plugins and their dependencies is not known; the plugin list must be captured as an inventory first.

## Desired End State
1. Only required/actively-used plugins remain installed and (where needed) active.
2. Removed plugins do not break:
   - Front-end page rendering
   - Key business flows (e.g., WooCommerce/cart/checkout if applicable)
   - WordPress admin functionality (no missing-class warnings / fatal errors)
3. A complete removal log exists, including what was removed, when, and verification evidence.
4. A rollback path exists (backup + ability to restore plugins).

## What We Are NOT Doing
- Changing WordPress core version.
- Refactoring theme code or WooCommerce logic as part of this cleanup.
- Blindly deleting anything marked as “unknown dependency” during inventory.
- Removing security/backup/performance critical plugins without staged verification.

## Implementation Approach
Use a conservative “inventory → classify → deactivate → verify → delete → verify again” workflow:
- Deactivate first (safe rollback: re-activate without file deletion).
- Only after a plugin stays inactive through smoke tests do we delete its files.
- Any plugin that causes errors or breaks flows is immediately rolled back and returned to “Keep”.

### Safety Policy (assumptions encoded to avoid open questions)
- Backups are available before changes (DB + `wp-content/` at minimum).
- Plugin removal is file-based: remove plugin directory from `wp-content/plugins/` (or use WP admin “Delete” only after deactivation verification).
- “No longer needed” means: no evidence of active use after smoke tests and no errors attributable to the plugin.

## Phase Plan

## Implementation Progress

### Phase 1: Preflight Backup + Plugin Inventory (Capture Facts First)
- [x] Add repeatable backup automation scripts (`scripts/wp-backup*.sh`)
- [ ] Create backup artifacts (remote) (DB + `wp-content/` backup records)
- [x] Export plugin inventory (remote) - using existing captured evidence from `docs/woocommerce-audit.md` (deviation)
- [x] Create inventory file (`docs/wordpress-plugin-inventory.md`)
- [x] Create removal log (`docs/wordpress-plugin-removal-log.md`) (earlier than planned)

### Phase 2: Classify Candidates + Deactivate One Batch at a Time
- [ ] Classify plugins into `KEEP` / `CANDIDATE` / `UNKNOWN`
- [ ] Deactivate `CANDIDATE` plugins one batch at a time and log results
- [ ] Run smoke tests + log checks after each batch, rollback if needed

### Phase 3: Delete Confirmed Unused Plugins (After They Stay Inactive)
- [ ] Delete confirmed unused plugins only after Phase 2 verification

### Phase 4: Monitoring Window + Documentation Finalization
- [ ] Monitor for stability, update `docs/wordpress-plugin-removal-log.md` with final statuses

### Phase 1: Preflight Backup + Plugin Inventory (Capture Facts First)

#### Overview
Create a reliable record of what plugins exist now and ensure rollback is possible.

#### Changes Required
1. **Create backup artifacts (remote)**
   - `wp-content/` backup (includes `wp-content/plugins/`, `wp-content/mu-plugins/`, and themes)
   - Database backup (at minimum, DB schema + options)
2. **Export plugin inventory (remote)**
   - On `https://www.luciastuy.com/wp-admin/plugins.php`, export/copy the plugin list:
     - name
     - active/inactive status
     - version
     - author (optional but useful)
3. **Create inventory file (local documentation)**
   - `docs/wordpress-plugin-inventory.md` (or `docs/wordpress-plugin-inventory.csv`)

#### Expected File Modifications (Documentation)
- `docs/wordpress-plugin-inventory.md` (created/updated by you)
- `docs/wordpress-plugin-removal-log.md` (created/updated by you in later phases)

#### Success Criteria (Automated / Objective)
- Backup exists and is restorable (e.g., backup filenames are recorded and checksums can be verified if available).
- `docs/wordpress-plugin-inventory.md` exists and lists all currently installed plugins shown in the admin plugins page.
- If WP-CLI is available on the host, capture plugin status as evidence (examples):
  - `wp plugin list --status=active`
  - `wp plugin list --status=inactive`

---

### Phase 2: Classify Candidates + Deactivate One Batch at a Time

#### Overview
Determine which plugins are truly unused by deactivating candidates and running smoke tests after each batch.

#### Changes Required
1. **Classify plugins**
   - Mark plugins as:
     - `KEEP` (required for core features, known critical infrastructure, or uncertain but likely dependency)
     - `CANDIDATE` (likely unused based on admin settings + observed evidence)
     - `UNKNOWN` (insufficient evidence)
2. **Deactivate candidates (batch size = 1 is safest)**
   - For each `CANDIDATE` plugin:
     - Deactivate in WordPress admin
     - Record timestamp + plugin name in `docs/wordpress-plugin-removal-log.md`
3. **Smoke tests**
   - Run quick checks immediately after deactivation:
     - Home page loads (no fatal errors)
     - Any key pages affected by plugin categories (forms/SEO/caching/widgets)
     - If WooCommerce is part of your site: product pages + cart + checkout
   - Check `wp-content/debug.log` (or whatever logging mechanism your host provides) for PHP fatal errors/warnings after deactivation.
4. **Rollback rules**
   - If errors appear or any required flow breaks:
     - Reactivate the plugin
     - Move it back to `KEEP`
     - Do not attempt deletion for that plugin.

#### Changes Required (Documentation)
- `docs/wordpress-plugin-removal-log.md` updated after each deactivation + result.

#### Success Criteria (Automated / Objective)
- For every plugin that remains in `CANDIDATE` after deactivation:
  - Smoke tests return expected outcomes (at minimum: no fatal errors on the front-end pages you checked).
  - No new fatal PHP errors are present in the captured logs during/after the change window.
- If WP-CLI is available, optionally capture the state evidence:
  - `wp plugin is-active <plugin-slug>` returns `0/false` after deactivation.

---

### Phase 3: Delete Confirmed Unused Plugins (After They Stay Inactive)

#### Overview
Only after a plugin passes deactivation smoke tests do we delete its files to reduce maintenance surface.

#### Changes Required
1. **Select delete set**
   - Plugins that were:
     - deactivated successfully in Phase 2
     - no errors observed
     - no dependent features broken
2. **Delete plugin files**
   - Preferred: delete plugin directory from `wp-content/plugins/<plugin-folder>/`
   - Alternate: use WP admin “Delete” only after deactivation verification
3. **Post-delete verification**
   - Reload critical front-end pages
   - Load WordPress admin pages that show typical plugin hooks:
     - `wp-admin/plugins.php`
     - any settings pages related to your key workflows
4. **Rollback window**
   - If deletion breaks anything:
     - Restore plugin folder from backup or plugin ZIP
     - Re-activate the plugin (move back to `KEEP`)

#### Expected File Modifications (Remote Server)
- `wp-content/plugins/<plugin-folder>/` deleted for each confirmed unused plugin.

#### Success Criteria (Automated / Objective)
- For each deleted plugin:
  - Plugin directory no longer exists on disk.
  - WordPress admin pages load without plugin-related fatal errors.
- If WP-CLI is available:
  - `wp plugin is-installed <plugin-slug>` returns `false`.

---

### Phase 4: Monitoring Window + Documentation Finalization

#### Overview
Confirm the site stays stable over a short monitoring period and finalize evidence for future maintenance.

#### Changes Required
1. **Monitoring window**
   - Monitor for at least 24 hours:
     - PHP error logs
     - contact/form submissions (if applicable)
     - checkout/cart behavior (if applicable)
2. **Documentation finalization**
   - Update:
     - `docs/wordpress-plugin-removal-log.md` with final statuses:
       - `Deleted`
       - `Kept (rolled back)`
       - `Not touched`
3. **Optional: enforce plugin policy**
   - Record a simple rule: “Only install plugins that demonstrably reduce maintenance burden or are required.”

#### Success Criteria (Automated / Objective)
- No new fatal PHP errors attributed to removed plugins appear in logs for the monitoring window.
- Critical flows you validated in Phase 2 continue to work.
- `docs/wordpress-plugin-removal-log.md` is complete and contains:
  - removed plugin names
  - timestamps
  - verification notes/screenshots (if you choose to add them)

---

## Testing Strategy

### Smoke Tests (Manual, but objective checks)
- Check front-end: home page + 1-2 representative content pages.
- If WooCommerce exists: category page + cart + checkout.
- Check admin: `wp-admin/plugins.php` and at least one key settings page you use.

### Log Checks (Prefer objective)
- Review PHP error logs and any `debug.log` output around each change window.

## References
- WordPress plugins admin: `https://www.luciastuy.com/wp-admin/plugins.php` ([login/Plugins page](https://www.luciastuy.com/wp-admin/plugins.php)).

---

## Completion Message (for your workflow)
When Phase 1-4 are complete:
- Review `docs/wordpress-plugin-inventory.md` + `docs/wordpress-plugin-removal-log.md`
- Confirm no rollbacks occurred after the delete stage

