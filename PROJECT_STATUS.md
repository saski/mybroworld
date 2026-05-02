# mybroworld - Project Status

**Last Updated**: 2026-05-02
**Overall Status**: 🟡 **Multiple active workstreams** - Catalog editorial uplift now implements the approved client feedback and official assets, with strict `_cat` image selection prepared but waiting on customer-renamed files; the WordPress catalog PDF console is production-deployed with the Cloud Run worker scheduled and now awaits customer-account validation; production plugin cleanup remains paused on remote backup/admin execution.

---

## Executive Summary

| Component | Status | Progress | Blocking |
|-----|-----|----|----|
| Catalog editorial uplift | 🟡 Awaiting customer image selections | 94% | Yes |
| WordPress production snapshot runtime | 🟢 Ready | 100% | No |
| WordPress catalog PDF console | 🟡 Customer validation pending | 96% | Requires one catalog queued/reviewed from the customer's mybro WordPress account |
| WordPress plugin cleanup plan | 🟡 In Progress | 5% | No |
| Safe cleanup execution + verification | ⚠️ Pending | 0% | Requires admin access + backups |

**Current Readiness**: 🟡 - The catalog generator now implements the client-approved rules for inclusion, ordering, metadata, PVP price, contact details, cover use, Gotham fonts, and official logos. `_cat` image resolution is implemented and wired as an optional worker config, but the shared image folder currently has 0 `_cat` candidates, so strict image-folder selection should remain disabled until the customer renames one image per included artwork. The WordPress catalog PDF console is deployed and operator-validated, and the `lucia-mybrocorp` Cloud Run worker is authorized as `mybrocorp@gmail.com`, scheduled, and updated with the latest PDF generator. Customer operation is not complete until one catalog is queued and reviewed from the customer's mybro WordPress account.

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
- Added the local WooCommerce catalog sync dry-run/apply path on 2026-05-01. The local apply created 20 managed `LA-2026-*` products with images, the Store API assertion initially reported `products=35 expected=20 missing=0 missing_images=0`, and unmanaged cleanup then hid the 15 legacy/demo products so the final Store API assertion reported `products=20 expected=20 missing=0 missing_images=0 unexpected=0`.
- Captured the public production Store API baseline on 2026-05-01 before any production write: `products=15 expected=20 missing=20 missing_images=0 unexpected=15`.
- Completed the production WooCommerce catalog sync dry-run on 2026-05-01 without applying catalog writes. Backup identifier `production-db-export-20260501-195148` maps to `backups/production-db-export-20260501-195148/wordpress-db.sql`; the dry-run plan reported `create=20 update=0 needs_image=0 unchanged=0 invalid_source=0 unexpected_unmanaged=15` and only targeted canonical `LA-2026-*` products for writes.
- Completed the production WooCommerce managed-product apply on 2026-05-01. The owned Drive image sideload MU helper was deployed first, then 20 canonical `LA-2026-*` products were created with images; Store API verification reported `products=35 expected=20 missing=0 missing_images=0 unexpected=15`, and the post-apply dry-run reported `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
- Completed the production unmanaged legacy/demo cleanup on 2026-05-01 after fresh backup identifier `production-db-export-20260501-203207`. Store API verification now reports `products=20 expected=20 missing=0 missing_images=0 unexpected=0`, and the post-cleanup dry-run reports `create=0 update=0 needs_image=0 unchanged=20 invalid_source=0 unexpected_unmanaged=15`.
- Completed Phase 4 of the WordPress catalog PDF console on 2026-05-01. The local WordPress admin UI queued `catalog_20260501_120151_899f`, the local catalog agent rendered and uploaded a 14-artwork PDF, and the UI persisted the review state as `approved`.
- Completed interim production validation of the WordPress catalog PDF console on 2026-05-01. Production WordPress queued `catalog_20260501_145137_9d09` with title `demo con clienta`, the LaunchAgent-backed `nacho-saski` local catalog worker completed it with 14 artworks, and the production UI persisted review status `needs_changes`.
- Captured client PDF catalog feedback on 2026-05-01: `_cat` manually selected images, `include_in_catalog` as editorial selection, newest-first ordering, PVP-only price display, reduced artwork metadata, approved current cover, final contact details, and Drive folder for Gotham/logo assets.
- Added local Cloud Run packaging for the catalog worker on 2026-05-02: Dockerfile, cloudbuild config, one-pass Cloud Run entrypoint, Secret Manager JSON materialization into writable runtime paths, and automated coverage for the runtime materializer.
- Deployed the `lucia-mybrocorp` Cloud Run catalog worker on 2026-05-02 in `mybroworld-catalog-260501`: OAuth token authorized as `mybrocorp@gmail.com`, secrets stored in Secret Manager, job deployed in `europe-west1`, Scheduler enabled every 5 minutes, and production WordPress default profile switched to `lucia-mybrocorp` outside git.
- Implemented the 2026-05-01 client PDF catalog feedback on 2026-05-02: `include_in_catalog` + `catalog_ready` filtering, newest-first ordering, reduced artwork metadata, PVP-only display, final contact details, official PNG logos, embedded Gotham font files, optional strict `_cat` image manifests, and Cloud Run redeploy of the updated worker image. Manual Cloud Run execution `lucia-mybrocorp-catalog-agent-bblht` completed successfully as `mybrocorp@gmail.com`.
- Imported the legacy `2025`, `2024`, and `2023` tabs from `Obra TODO - Lucia Astuy` into `Lucia Astuy - CATALOGO_BASE` on 2026-05-02 using the consolidated `2026` header contract. The imported tabs are ordered `2026`, `2025`, `2024`, `2023`; verification counted 89 rows/89 images for 2025, 46 rows/46 images for 2024, and 35 rows/31 images for 2023.

---

## 🚧 In Progress

- Catalog editorial uplift iteration:
  - client-approved reduced metadata layout is implemented locally and in the Cloud Run worker
  - official Gotham and PNG logo assets are embedded into the portable PDF render
  - strict `_cat` resolution is implemented but remains disabled until the shared image folder contains customer-selected `_cat` files
  - derived catalog period from `date_label`
  - latest outputs available under `catalog-generator/output/`
  - client feedback implementation plan now lives at `thoughts/shared/plans/2026-05-01-catalog-client-feedback-implementation-plan.md`
- Phased plan creation and safety criteria definition.
- Creating inventory + executing cleanup phases on the WordPress admin site (remote backup record + plugin versions still pending).
- Local WordPress runtime remains available through Docker Compose for production snapshot testing, owned-theme work, and `mu-plugin` validation.
- Local plugin cleanup now has one passing deactivation entry; production remains untouched until explicit remote backup/admin execution.
- Product-detail smoke coverage is now in place before the next one-plugin-at-a-time simplification cycle.
- Inventory sync is unblocked locally: local WooCommerce contains the canonical sheet/catalog artwork inventory with images, and the legacy/demo products are no longer exposed by the local Store API after explicit unmanaged cleanup.
- Production WooCommerce now contains the canonical sheet/catalog artwork inventory with images, and the legacy/demo products are hidden from the public Store API.
- The WordPress catalog PDF console is live in production. Runtime config and secrets remain outside git. New jobs now target the scheduled Cloud Run `lucia-mybrocorp` worker; the remaining handoff gate is customer validation from the mybro WordPress account using `thoughts/shared/docs/customer-testing-and-handoff.md`.

---

## 📋 Next Steps

1. Run `fic-validate-plan thoughts/shared/plans/2026-05-01-woocommerce-catalog-photo-gap-plan.md` to close the WooCommerce catalog photo-gap workstream.
2. Run the customer test flow in `thoughts/shared/docs/customer-testing-and-handoff.md` for the online shop and catalog PDF console.
3. Complete Phase 6 of `thoughts/shared/plans/2026-05-01-wordpress-catalog-console-plan.md`: queue one catalog from the customer's mybro WordPress account, verify Cloud Run completes it, verify Drive read/write from the customer session, and persist a review state.
4. Ask the customer to rename exactly one image per included, catalog-ready artwork with the `_cat` suffix in `https://drive.google.com/drive/folders/1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`.
5. After `_cat` files exist, enable `catalogImageFolderId` in the `catalog-agent-config` Secret Manager value and run one Cloud Run test job to verify strict image matching.
6. Run `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` before production-snapshot WordPress/WooCommerce changes on this machine.
7. Execute Phase 2: deactivate one `CANDIDATE` plugin at a time from `wp-admin/plugins.php`, run smoke tests, and log results in `thoughts/shared/docs/wordpress-plugin-removal-log.md`.
8. After a plugin passes smoke tests, execute Phase 3: delete its plugin files (preferred: delete from `wp-content/plugins/<plugin-folder>/`).
9. Execute Phase 4: monitor stability and finalize removal log statuses.
10. Use `fic-implement-plan thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md` when remote/admin access is ready for Phase 2 execution.

---

## 🐛 Known Issues

- The shared catalog image folder currently has 51 files and 0 `_cat` candidates. Strict `_cat` production selection is implemented but should not be enabled until the customer renames one image per included, catalog-ready artwork.
- The imported historical tabs still need manual blocker review before catalog generation: 2025 has 30 blocker rows, 2024 has 3 blocker rows, and 2023 has 12 blocker rows. The 2023 import has four rows without deterministic image matches: `LA-2023-011`, `LA-2023-021`, `LA-2023-022`, and `LA-2023-034`.
- The original Google Drive template link was not reliably readable without authentication in this session.
- Customer-operated catalog generation is not yet fully verified; Cloud Run and Scheduler are live and production WordPress now targets `lucia-mybrocorp`, but the final proof still requires a catalog queued/reviewed from the customer's mybro WordPress account.
- Remote admin execution is not performed yet in this environment; exact plugin versions/status still need re-capture from `wp-admin/plugins.php`.
- The actual “remove no longer needed” set will be confirmed only after Phase 2 deactivation + smoke tests.

---

## 📝 Notes

- Catalog continuation handoff: `thoughts/shared/plans/2026-04-26-catalog-editorial-uplift-handoff.md`.
- Implementation plan lives at `thoughts/shared/plans/2026-04-02-wordpress-plugin-cleanup-plan.md`.
