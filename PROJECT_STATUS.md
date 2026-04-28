# mybroworld - Project Status

**Last Updated**: 2026-04-26  
**Overall Status**: 🟡 **Multiple active workstreams** - Catalog editorial uplift has a corrected editorial shell and is awaiting only higher-fidelity asset decisions; WordPress plugin cleanup remains paused on remote execution.

---

## Executive Summary

| Component | Status | Progress | Blocking |
|-----|-----|----|----|
| Catalog editorial uplift | 🟡 In Progress | 82% | Yes |
| WordPress plugin cleanup plan | 🟡 In Progress | 5% | No |
| Safe cleanup execution + verification | ⚠️ Pending | 0% | Requires admin access + backups |

**Current Readiness**: 🟡 - The catalog generator now matches the original PDF much more closely in cover/footer grammar, centered metadata layout, and fallback typography treatment, but exact Gotham parity and image-selection criteria are still unresolved. Remote/admin execution for WordPress cleanup remains pending.

---

## ✅ Completed Components

- Reworked the generated catalog toward the client's reference template using local `.ai` and PDF reference files.
- Extracted temporary reference assets for the catalog generator and regenerated the latest PDF output.
- Wrote a durable handoff for the catalog editorial uplift at `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Created initial implementation plan for removing unused WordPress plugins (2026-04-02).
- Created `thoughts/shared/docs/wordpress-plugin-inventory.md` and `thoughts/shared/docs/wordpress-plugin-removal-log.md` (Phase 1 evidence + logging scaffolding).
- Added repeatable backup scripts (`scripts/wp-backup*.sh`) and documented them.

---

## 🚧 In Progress

- Catalog editorial uplift iteration:
  - white-background layout aligned more closely to the original template
  - restored original editorial shell on cover, artwork pages, and closing page
  - centered artwork metadata treatment that now matches the original PDF's alignment more closely
  - derived catalog period from `date_label`
  - latest outputs available under `catalog-generator/output/`
- Phased plan creation and safety criteria definition.
- Creating inventory + executing cleanup phases on the WordPress admin site (remote backup record + plugin versions still pending).

---

## 📋 Next Steps

1. Resolve the remaining catalog blockers: Gotham font files, final brand assets, and the client's reusable photo-selection criteria.
2. Run the next catalog iteration after client feedback using `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md` as the session bootstrap.
3. Execute Phase 2: deactivate one `CANDIDATE` plugin at a time from `wp-admin/plugins.php`, run smoke tests, and log results in `thoughts/shared/docs/wordpress-plugin-removal-log.md`.
4. After a plugin passes smoke tests, execute Phase 3: delete its plugin files (preferred: delete from `wp-content/plugins/<plugin-folder>/`).
5. Execute Phase 4: monitor stability and finalize removal log statuses.
6. Use `fic-implement-plan thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md` when remote/admin access is ready for Phase 2 execution.

---

## 🐛 Known Issues

- The catalog still does not use real Gotham files because no installable Gotham assets were found on disk during the session.
- The generated catalog now uses Avenir Next fallback consistently, but that still differs from the original Gotham package in fine spacing and weight.
- Photo selection policy for the Google Drive image folder is still undefined, which is the main product blocker for a high-confidence final catalog.
- The original Google Drive template link was not reliably readable without authentication in this session.
- Remote admin execution is not performed yet in this environment; exact plugin versions/status still need re-capture from `wp-admin/plugins.php`.
- The actual “remove no longer needed” set will be confirmed only after Phase 2 deactivation + smoke tests.

---

## 📝 Notes

- Catalog continuation handoff: `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Implementation plan lives at `thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md`.
