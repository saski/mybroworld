# mybroworld - Project Status

**Last Updated**: 2026-05-01
**Overall Status**: 🟡 **Multiple active workstreams** - Catalog editorial uplift has a corrected editorial shell and is awaiting higher-fidelity asset decisions; the WordPress catalog PDF console is production-deployed but still needs customer-owned handoff; production plugin cleanup remains paused on remote backup/admin execution.

---

## Executive Summary

| Component | Status | Progress | Blocking |
|-----|-----|----|----|
| Catalog editorial uplift | 🟡 In Progress | 82% | Yes |
| WordPress production snapshot runtime | 🟢 Ready | 100% | No |
| WordPress catalog PDF console | 🟡 Customer handoff pending | 85% | Requires `lucia-mybrocorp` worker and mybro WordPress validation |
| WordPress plugin cleanup plan | 🟡 In Progress | 5% | No |
| Safe cleanup execution + verification | ⚠️ Pending | 0% | Requires admin access + backups |

**Current Readiness**: 🟡 - The catalog generator now matches the original PDF much more closely in cover/footer grammar, centered metadata layout, and fallback typography treatment, but exact Gotham parity and image-selection criteria are still unresolved. The WordPress catalog PDF console is deployed and operator-validated, but customer-only operation is not complete until the `lucia-mybrocorp` worker runs under `mybrocorp@gmail.com` and the customer's mybro WordPress account completes a job.

---

## ✅ Completed Components

- Reworked the generated catalog toward the client's reference template using local `.ai` and PDF reference files.
- Extracted temporary reference assets for the catalog generator and regenerated the latest PDF output.
- Wrote a durable handoff for the catalog editorial uplift at `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Created initial implementation plan for removing unused WordPress plugins (2026-04-02).
- Created `thoughts/shared/docs/wordpress-plugin-inventory.md` and `thoughts/shared/docs/wordpress-plugin-removal-log.md` (Phase 1 evidence + logging scaffolding).
- Added repeatable backup scripts (`scripts/wp-backup*.sh`) and documented them.
- Added local WordPress/WooCommerce setup and validation wrappers (`scripts/wp-local-setup.sh`, `scripts/wp-local-validate.sh`) with dry-run tests.
- Bootstrapped the local Docker runtime on 2026-04-30 and validated `/`, `/shop/`, `/cart/`, and `/checkout/` at `http://localhost:8080`.
- Mirrored production `wp-content`, exported the production database through a temporary token-protected exporter, imported the snapshot locally, and validated the production `glacier` theme runtime on 2026-04-30.
- Deactivated local `all-in-one-wp-migration-src` after baseline validation, verified the plugin is inactive, and reran the `glacier` validation loop successfully on 2026-05-01.
- Added product-detail smoke coverage to local WordPress validation on 2026-05-01; the `glacier` validation loop now requires one published product page and passed against `/product/armchair/`.
- Added a read-only WooCommerce/sheet inventory parity audit on 2026-05-01. Current local baseline is out of sync: 20 sheet artworks are missing from WooCommerce and 15 local WooCommerce products are unexpected relative to the sheet.
- Recorded the WooCommerce inventory scope decision on 2026-05-01: all canonical sheet artworks belong in WooCommerce, and `status_normalized` controls visibility and purchasability.
- Completed Phase 4 of the WordPress catalog PDF console on 2026-05-01. The local WordPress admin UI queued `catalog_20260501_120151_899f`, the local catalog agent rendered and uploaded a 14-artwork PDF, and the UI persisted the review state as `approved`.
- Completed interim production validation of the WordPress catalog PDF console on 2026-05-01. Production WordPress queued `catalog_20260501_145137_9d09` with title `demo con clienta`, the LaunchAgent-backed `nacho-saski` local catalog worker completed it with 14 artworks, and the production UI persisted review status `needs_changes`.

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
- Local WordPress runtime remains available through Docker Compose for production snapshot testing, owned-theme work, and `mu-plugin` validation.
- Local plugin cleanup now has one passing deactivation entry; production remains untouched until explicit remote backup/admin execution.
- Product-detail smoke coverage is now in place before the next one-plugin-at-a-time simplification cycle.
- Inventory sync is now the active blocker before further WooCommerce simplification: local WooCommerce still has imported/demo products rather than the canonical sheet/catalog artwork inventory.
- The next local-only sync step is to turn the tested product drafts into a dry-run/apply importer that creates or updates local WooCommerce products by `artwork_id`.
- The WordPress catalog PDF console is live in production. Runtime config and secrets remain outside git, and the current production worker depends on the user LaunchAgent `com.mybroworld.catalog-agent` running on this Mac.
- Customer-owned catalog console handoff is pending: install and authorize a `lucia-mybrocorp` worker under `mybrocorp@gmail.com`, then validate the flow from the customer's mybro WordPress account.

---

## 📋 Next Steps

1. Complete Phase 6 of `thoughts/shared/plans/2026-05-01-wordpress-catalog-console-plan.md`: customer-owned Apps Script/OAuth control, `lucia-mybrocorp` LaunchAgent under `mybrocorp@gmail.com`, Drive write/read verification, and mybro WordPress account validation.
2. Resolve the remaining catalog blockers: Gotham font files, final brand assets, and the client's reusable photo-selection criteria.
3. Run the next catalog iteration after client feedback using `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md` as the session bootstrap.
4. Run `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` before production-snapshot WordPress/WooCommerce changes on this machine.
5. Execute Phase 2: deactivate one `CANDIDATE` plugin at a time from `wp-admin/plugins.php`, run smoke tests, and log results in `thoughts/shared/docs/wordpress-plugin-removal-log.md`.
6. After a plugin passes smoke tests, execute Phase 3: delete its plugin files (preferred: delete from `wp-content/plugins/<plugin-folder>/`).
7. Execute Phase 4: monitor stability and finalize removal log statuses.
8. Use `fic-implement-plan thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md` when remote/admin access is ready for Phase 2 execution.

---

## 🐛 Known Issues

- The catalog still does not use real Gotham files because no installable Gotham assets were found on disk during the session.
- The generated catalog now uses Avenir Next fallback consistently, but that still differs from the original Gotham package in fine spacing and weight.
- Photo selection policy for the Google Drive image folder is still undefined, which is the main product blocker for a high-confidence final catalog.
- The original Google Drive template link was not reliably readable without authentication in this session.
- Customer-only catalog generation is not yet verified; the production console currently depends on the `nacho-saski` LaunchAgent running on this Mac.
- Remote admin execution is not performed yet in this environment; exact plugin versions/status still need re-capture from `wp-admin/plugins.php`.
- The actual “remove no longer needed” set will be confirmed only after Phase 2 deactivation + smoke tests.

---

## 📝 Notes

- Catalog continuation handoff: `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Implementation plan lives at `thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md`.
