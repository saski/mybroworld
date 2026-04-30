# mybroworld - Project Status

**Last Updated**: 2026-04-30
**Overall Status**: 🟡 **Multiple active workstreams** - Catalog editorial uplift remains awaiting higher-fidelity asset decisions; WooCommerce production facts were refreshed and owned-code deploy handoff is blocked only on local PHP/runtime verification plus fresh DB/wp-content backups and deployment credentials.

---

## Executive Summary

| Component | Status | Progress | Blocking |
|-----|-----|----|----|
| Catalog editorial uplift | 🟡 In Progress | 82% | Yes |
| WordPress plugin cleanup plan | 🟡 In Progress | 25% | No |
| WooCommerce owned-code deploy handoff | 🟡 In Progress | 65% | Needs deploy credentials + backups |
| Safe cleanup execution + verification | ⚠️ Pending | 0% | Requires fresh backups before production changes |

**Current Readiness**: 🟡 - The catalog generator now matches the original PDF much more closely in cover/footer grammar, centered metadata layout, and fallback typography treatment, but exact Gotham parity and image-selection criteria are still unresolved. WooCommerce production admin facts are current as of 2026-04-30, but no deploy or plugin cleanup should run until backups and local deployment credentials are completed.

---

## ✅ Completed Components

- Reworked the generated catalog toward the client's reference template using local `.ai` and PDF reference files.
- Extracted temporary reference assets for the catalog generator and regenerated the latest PDF output.
- Wrote a durable handoff for the catalog editorial uplift at `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Created initial implementation plan for removing unused WordPress plugins (2026-04-02).
- Created `docs/wordpress-plugin-inventory.md` and `docs/wordpress-plugin-removal-log.md` (Phase 1 evidence + logging scaffolding).
- Added repeatable backup scripts (`scripts/wp-backup*.sh`) and documented them.
- Re-captured WooCommerce production status on 2026-04-30: WordPress `6.9.4`, WooCommerce `10.7.0`, PHP `8.4.18`, MariaDB `11.8.3`, active theme `Glacier` `5.0.1`, and 17 active plugins with versions.
- Added `scripts/wp-test-owned-code.sh` for owned theme and `mu-plugin` verification without touching production; Docker fallback is opt-in only via `WP_TEST_USE_DOCKER=1`.

---

## 🚧 In Progress

- Catalog editorial uplift iteration:
  - white-background layout aligned more closely to the original template
  - restored original editorial shell on cover, artwork pages, and closing page
  - centered artwork metadata treatment that now matches the original PDF's alignment more closely
  - derived catalog period from `date_label`
  - latest outputs available under `catalog-generator/output/`
- Phased plan creation and safety criteria definition.
- Creating the WooCommerce production handoff for owned-code-only deployment. Public front page, shop, and admin login/admin pages load; dry-run target points at `ftp.luciastuy.com:/public/...` but deployment user/credentials are not configured in a repo-safe local env yet.

---

## 📋 Next Steps

1. Resolve the remaining catalog blockers: Gotham font files, final brand assets, and the client's reusable photo-selection criteria.
2. Run the next catalog iteration after client feedback using `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md` as the session bootstrap.
3. Finish the WooCommerce handoff: fill local `scripts/wp-remote.env` credentials outside git, create fresh production DB and `wp-content` backups, and run `scripts/wp-test-owned-code.sh` on a PHP-enabled or Docker-enabled destination machine.
4. Execute Phase 2: deactivate one `CANDIDATE` plugin at a time from `wp-admin/plugins.php`, run smoke tests, and log results in `docs/wordpress-plugin-removal-log.md`.
5. After a plugin passes smoke tests, execute Phase 3: delete its plugin files (preferred: delete from `wp-content/plugins/<plugin-folder>/`).
6. Execute Phase 4: monitor stability and finalize removal log statuses.
7. Use `fic-implement-plan thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md` when remote/admin access is ready for Phase 2 execution.

---

## 🐛 Known Issues

- The catalog still does not use real Gotham files because no installable Gotham assets were found on disk during the session.
- The generated catalog now uses Avenir Next fallback consistently, but that still differs from the original Gotham package in fine spacing and weight.
- Photo selection policy for the Google Drive image folder is still undefined, which is the main product blocker for a high-confidence final catalog.
- The original Google Drive template link was not reliably readable without authentication in this session.
- Local `scripts/wp-test-owned-code.sh` cannot complete on this machine because local PHP is unavailable and Docker must not be run here; run it on the destination machine or another approved PHP runtime.
- Fresh production backups are still required. The current session did not have repo-safe FTP/MySQL/phpMyAdmin credentials, and the logged-in WordPress admin role could not access the direct All-in-One WP Migration export page.
- The actual “remove no longer needed” set will be confirmed only after Phase 2 deactivation + smoke tests.

---

## 📝 Notes

- Catalog continuation handoff: `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Implementation plan lives at `thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md`.
- WooCommerce production facts live in `docs/woocommerce-audit.md`; plugin cleanup evidence lives in `docs/wordpress-plugin-inventory.md` and `docs/wordpress-plugin-removal-log.md`.
