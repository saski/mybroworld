## Status Sync

- [x] 0.1 Sync the roadmap tracker with the 2026-05-08 local `luciastuy` visual, interaction, and checkout-readiness evidence.
- [x] 0.2 Separate locally proven checkout behavior from the remaining production/staging payment and fulfillment launch gates.
- [x] 0.3 Publish `luciastuy` on production and record the immediate next-stage blocker from interaction evidence: `missing_checkout_payment_method` during production checkout-readiness validation (`2026-05-15-production-next-stage-checkout-readiness`).
- [x] 0.4 Sync the 2026-06-05 end-to-end verification: local catalog generation and local owned ecommerce flow pass; production Store API parity and public smoke pass; production buyer checkout remains blocked by `cart_did_not_receive_item` and missing payment/checkout fields.
- [x] 0.5 Sync the 2026-07-10 production stabilization: resolve 500 fatal (`Allowed memory size exhausted` in WooCommerce `countries.php`) by raising `WP_MEMORY_LIMIT` to 512M and disabling `WP_DEBUG`/`SAVEQUERIES`/`SCRIPT_DEBUG`; deploy owned `lucia-portfolio-post-type.php` MU-plugin; deactivate ACF PRO in production (folder renamed, not deleted); verify all portfolio URLs, REST API meta, and admin meta box post-deactivation.
- [x] 0.6 Sync the 2026-07-10 production catalogo page fix and auto-deploy enablement: fix broken `/catalogo/` page (stale WPBakery shortcodes rendering as plain text) with owned `page-catalogo.php` template; enable WordPress auto-deploy on `main` (`ENABLE_WORDPRESS_AUTO_DEPLOY=true`) with `ftp.luciastuy.com` + `WP_FTP_INSECURE=1`; verify full CI pipeline (owned-code checks, backup, FTP deploy, smoke tests including `/catalogo/`, Store API inventory) passes; confirm `luciastuy` theme is active in production with no Elementor/RevSlider/WPBakery/Kirki front-end assets.
- [x] 0.7 Sync the 2026-07-23 production incident: `pinterest-for-woocommerce` (client-installed) triggered fatal memory exhaustion (`167772160 bytes` = 160MB limit). Root cause: DonDominio shared hosting overrides `ini_set('memory_limit')` — `WP_MEMORY_LIMIT=512M` in `wp-config.php` has no effect. Fix: created `/public/.user.ini` with `memory_limit = 512M`. Site restored to 200. Also discovered 7 new client-installed plugins (WooCommerce Payments, PayPal Payments, Klaviyo, Pinterest, Reddit, Packlink Pro, Google Listings & Ads, Jetpack) bringing total to 22 plugins. Updated `wordpress-plugin-inventory.md` and `wordpress-plugin-removal-log.md`.

## 1. Catalog Contract And Customer Feedback

- [ ] 1.1 Select the canonical customer-feedback thread for PDF catalog visual design and required fields.
- [ ] 1.2 Convert customer feedback into explicit accepted, rejected, and open catalog decisions.
- [ ] 1.3 Update `thoughts/shared/docs/artwork-data-contract.md` for every accepted field or wording change.
- [ ] 1.4 Confirm the `reserved` -> `Reservada` behavior remains covered in WordPress tests before new status work begins.
- [ ] 1.5 Update the catalog-generator plan with the approved layout, typography, image treatment, and field set.

## 2. Source Sheet Completion

- [ ] 2.1 Identify the missing artwork years and record the year-by-year import order.
- [ ] 2.2 Add one year batch to the source sheet using the canonical field contract.
- [ ] 2.3 Validate required catalog fields, inclusion flags, status normalization, and image references for that batch.
- [ ] 2.4 Generate a catalog preview from the updated sheet and review data-quality failures before adding the next year.
- [ ] 2.5 Repeat the year-batch loop until all remaining years are present and validated.

## 3. Commerce Platform Decision

- [x] 3.1 Capture the minimum launch-critical commerce flow from the 2026-05-06 customer-stage decision: owned shop theme replacement, direct payment readiness, and buyer data capture for artwork shipping.
- [ ] 3.2 Document WooCommerce baseline strengths, risks, plugin dependencies, production payment needs, and maintenance costs. Note artwork shipping/packing only as follow-up context for later.
- [ ] 3.3 Define one leaner alternative and the evidence it must produce to beat the WooCommerce baseline.
- [ ] 3.4 If needed, run a bounded lean-commerce spike outside production commerce behavior.
- [ ] 3.5 Record the platform decision in `thoughts/shared/docs/woocommerce-audit.md` or a successor OpenSpec change before production theme replacement starts.

## 4. Lean Ecommerce Simplification Loop

- [ ] 4.1 Use `thoughts/shared/docs/lean-ecommerce-simplification-loop.md` as the cycle template for each WP/WooCommerce reduction.
- [ ] 4.2 Propose exactly one simplification candidate with a Lean hypothesis, expected value, rollback path, and required health checks.
- [ ] 4.3 Run baseline checks before changing anything and add a missing test first if the proposal exposes a coverage gap.
- [ ] 4.4 Apply only the proposed simplification candidate.
- [ ] 4.5 Run the same health checks after the change and record keep, rollback, or revise.
- [ ] 4.6 Choose the next simplification candidate only after the current cycle is healthy or rolled back.

## 5. WooCommerce Test Coverage And Plugin Safety

- [x] 5.1 Record that the visual and local checkout slices were supported by owned-code, local runtime, interaction, and OpenSpec checks.
- [ ] 5.2 Keep `scripts/wp-test-owned-code.sh` green before the next owned WordPress code change.
- [ ] 5.3 Expand tests for any new artwork meta, status, publication, or product-display rules before implementing them.
- [x] 5.4 Define repeatable storefront, shop, product, cart, checkout, and critical-error smoke or interaction paths for local and production-like environments.
- [x] 5.5 Classify every active plugin as `KEEP`, `CANDIDATE`, or `UNKNOWN` with evidence and rollback notes.
- [x] 5.6 Remove or deactivate only one `CANDIDATE` plugin at a time after baseline tests pass.
- [x] 5.7 Run smoke checks before and after each plugin change and update the plugin-removal log immediately.
- [ ] 5.8 After the ACF PRO soak period (1-2 weeks without incidents), delete the deactivated `acf_pro.deactivated` folder from production and record the final deletion in the removal log.
- [ ] 5.9 Propose the next plugin deactivation candidate from the inventory (`kirki`, `envato-market`, `hello`, or `duplicate-page-src` are low-risk next targets — all confirmed no front-end asset markers on 2026-07-10 production inspection) and run the one-at-a-time deactivation cycle with pre/post smoke checks.
- [x] 5.10 Confirm the owned `luciastuy` theme is active in production and Elementor, RevSlider, WPBakery, and Kirki no longer load front-end assets (2026-07-10 production front-end inspection). Update plugin inventory and removal log with current production evidence.

## 6. Ecommerce Visual Identity

- [x] 6.1 Treat WooCommerce plus the owned `luciastuy` theme as the near-term implementation surface unless the platform decision records different evidence.
- [x] 6.2 Capture desktop and mobile screenshots for current production `Glacier` and `luciastuy` on `/`, `/shop/`, one product page, `/cart/`, and `/checkout/`.
- [x] 6.3 Replay and compare production and owned-theme interactions for navigation, shop sorting, product links, add-to-cart controls, product detail behavior, cart state, and checkout buyer fields.
- [ ] 6.4 Prepare a customer-facing identity brief covering typography, color, imagery, product presentation, cart/checkout readability, and interaction priorities.
- [ ] 6.5 Map approved identity decisions to the actual selected ecommerce surfaces.
- [x] 6.6 Implement local `luciastuy` identity changes incrementally for header/navigation, shop grid, product detail, cart, and checkout with screenshots or browser verification at each step.
- [x] 6.7 Apply the individual portfolio-page typography rhythm to individual WooCommerce product pages, including uppercase rhythm, image framing, buttons, and desktop/mobile spacing.
- [ ] 6.8 Confirm with the customer which catalog identity decisions must also carry into the final ecommerce surfaces.
- [ ] 6.9 Finish catalog item-page parity validation and customer sign-off (local implementation 2026-05-16 in `luciastuy` `single-portfolio.php`; compare `wordpress/.tmp/visual-baseline/2026-05-16-catalog-item-supergreat-after/` vs live) and sync accepted deltas back into this roadmap.

## 7. Checkout, Payment, And Fulfillment Readiness

- [x] 7.1 Audit and repair local WooCommerce currency, country, payment, shipping, and checkout-field readiness for buyer-flow validation.
- [ ] 7.2 Audit production/staging WooCommerce currency, tax, payment, checkout field, email, and order settings.
- [ ] 7.3 Choose the smallest production/staging payment configuration that satisfies customer needs and avoids paid add-ons.
- [x] 7.4 Verify local checkout captures buyer name, email, phone, billing address, shipping address, and order notes.
- [ ] 7.5 Verify production/staging checkout captures buyer name, email, phone when needed, billing address, shipping address, delivery instructions, and order notes.
- [x] 7.6 Verify local physical artwork checkout collects shipping data when fulfillment needs it.
- [ ] 7.7 Verify production/staging physical artwork products require shipping data when fulfillment needs it, but keep the detailed shipping model out of the critical payment milestone.
- [x] 7.8 Run one local non-production BACS checkout order and record payment status, order id, buyer data, shipping fields, and order note evidence.
- [ ] 7.9 Run one approved production/staging payment test order and record payment status, order id, buyer confirmation, admin notification, and refund/cancel path.
- [ ] 7.10 Confirm the customer can use the WooCommerce order record for the first sale; shipping process definition can follow once payment is live.
- [x] 7.11 Diagnose why the anonymous production add-to-cart path leaves the cart empty before attempting a production payment test order. (Resolved 2026-07-09: cart/session persistence works for `LA-2026-006`; the remaining blocker is missing payment methods at checkout, not cart emptiness.)
- [ ] 7.12 After the production 500 fix (2026-07-10), re-verify that checkout still reaches the payment-method selection step and audit which WooCommerce payment gateways are enabled in production admin.

## 8. OpenSpec Governance

- [x] 8.1 Review this OpenSpec change and sync the task tracker with completed local implementation evidence while the plan is still active.
- [x] 8.2 Split implementation into smaller OpenSpec changes when a phase is ready to begin.
- [ ] 8.3 Keep each implementation change test-first and archive it only after validation passes.
- [ ] 8.4 Archive this roadmap change after the planning scope is accepted and the first implementation change is created.

## 9. Next-Stage Execution Plan

### Sequential Critical Path

- [x] 9.1 Confirm the two completed implementation changes are archived and their accepted requirements live under `openspec/specs/`.
- [ ] 9.2 Choose the next buyer-readiness gate owner: customer feedback, production checkout/payment, GA4 verification, or plugin-safety inventory.
- [ ] 9.3 Run the chosen gate to evidence before starting production-affecting code or admin changes.
- [ ] 9.4 Update the relevant operational doc immediately after the gate produces evidence or a blocker.
- [ ] 9.5 Create or update a smaller implementation OpenSpec for the next executable slice before this roadmap is archived.
- [ ] 9.6 Archive this roadmap only after the first next-slice OpenSpec exists and the remaining open decisions are captured outside this planning tracker.

### Parallel Lanes

- [ ] 9.7 Customer/catalog lane: identify the canonical feedback source, extract accepted/rejected/open decisions, update `thoughts/shared/docs/artwork-data-contract.md`, and translate approved visual/field decisions into the catalog-generator plan.
- [ ] 9.8 Source-data lane: identify missing artwork years, import one year batch, validate required headers/status/images, generate a preview, and repeat only after blockers from the current batch are closed.
- [ ] 9.9 Commerce-readiness lane: audit production WooCommerce payment, checkout fields, emails, and order records before running an approved test order; shipping and courier handoff can wait until after the first paid sale.
- [ ] 9.10 Observability lane: finish GA4 Realtime/DebugView and purchase/order reconciliation through `openspec/changes/configure-shop-business-observability/`.
- [x] 9.11 Plugin-safety lane: refresh production plugin inventory, classify each plugin as `KEEP`, `CANDIDATE`, or `UNKNOWN`, then propose exactly one reversible simplification candidate. (ACF PRO deactivated 2026-07-10 as first candidate; production front-end inspection confirms `luciastuy` theme active with no Elementor/RevSlider/WPBakery/Kirki assets; next candidates identified in task 5.9; updated deactivation priority recorded in removal log.)

### Coordination Rules

- [ ] 9.12 Do not let the source-data lane change the contract while the customer/catalog lane still has open field decisions.
- [x] 9.13 Do not let plugin deactivation run before the commerce-readiness lane has a fresh smoke baseline and rollback evidence. (Baseline captured 2026-07-10: smoke checks passed before ACF deactivation; backup in `backups/production-backup-2026-07-10/`.)
- [ ] 9.14 Do not mark the shop buyer-ready until payment, buyer data, fulfillment record, and GA4 purchase visibility are all evidenced or explicitly waived.

## 10. Trunk-Based Delivery Hygiene

- [x] 10.1 Merge the verified roadmap and observability workstream branches back to `main`.
- [x] 10.2 Absorb useful stale branch evidence into current documentation or confirm it is already represented on trunk.
- [x] 10.3 Confirm the remote tracks `main` as its only branch after pruning completed, stale, and dependency-update branches.
- [ ] 10.4 Keep future roadmap edits on `main` when they are documentation-only and validated; use short-lived `eb/...` branches only for executable slices that need isolated review.
- [x] 10.5 Before starting the next executable slice, update its OpenSpec on `main`, name the gate it advances, and list the branch deletion condition. (2026-07-10 ACF deactivation slice landed on `main` as commit `5c85aa7`; gate: plugin-safety lane; no separate branch needed for production FTP operations.)
