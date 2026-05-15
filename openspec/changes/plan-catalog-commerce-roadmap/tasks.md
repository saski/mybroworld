## Status Sync

- [x] 0.1 Sync the roadmap tracker with the 2026-05-08 local `luciastuy` visual, interaction, and checkout-readiness evidence.
- [x] 0.2 Separate locally proven checkout behavior from the remaining production/staging payment and fulfillment launch gates.

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
- [ ] 3.2 Document WooCommerce baseline strengths, risks, plugin dependencies, production payment needs, shipping needs, and maintenance costs.
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
- [ ] 5.5 Classify every active plugin as `KEEP`, `CANDIDATE`, or `UNKNOWN` with evidence and rollback notes.
- [ ] 5.6 Remove or deactivate only one `CANDIDATE` plugin at a time after baseline tests pass.
- [ ] 5.7 Run smoke checks before and after each plugin change and update the plugin-removal log immediately.

## 6. Ecommerce Visual Identity

- [x] 6.1 Treat WooCommerce plus the owned `luciastuy` theme as the near-term implementation surface unless the platform decision records different evidence.
- [x] 6.2 Capture desktop and mobile screenshots for current production `Glacier` and `luciastuy` on `/`, `/shop/`, one product page, `/cart/`, and `/checkout/`.
- [x] 6.3 Replay and compare production and owned-theme interactions for navigation, shop sorting, product links, add-to-cart controls, product detail behavior, cart state, and checkout buyer fields.
- [ ] 6.4 Prepare a customer-facing identity brief covering typography, color, imagery, product presentation, cart/checkout readability, and interaction priorities.
- [ ] 6.5 Map approved identity decisions to the actual selected ecommerce surfaces.
- [x] 6.6 Implement local `luciastuy` identity changes incrementally for header/navigation, shop grid, product detail, cart, and checkout with screenshots or browser verification at each step.
- [x] 6.7 Apply the individual portfolio-page typography rhythm to individual WooCommerce product pages, including uppercase rhythm, image framing, buttons, and desktop/mobile spacing.
- [ ] 6.8 Confirm with the customer which catalog identity decisions must also carry into the final ecommerce surfaces.

## 7. Checkout, Payment, And Fulfillment Readiness

- [x] 7.1 Audit and repair local WooCommerce currency, country, payment, shipping, and checkout-field readiness for buyer-flow validation.
- [ ] 7.2 Audit production/staging WooCommerce currency, tax, payment, shipping, checkout field, email, and order settings.
- [ ] 7.3 Choose the smallest production/staging payment configuration that satisfies customer needs and avoids paid add-ons.
- [x] 7.4 Verify local checkout captures buyer name, email, phone, billing address, shipping address, and order notes.
- [ ] 7.5 Verify production/staging checkout captures buyer name, email, phone when needed, billing address, shipping address, and order notes.
- [x] 7.6 Verify local physical artwork checkout collects shipping data when fulfillment needs it.
- [ ] 7.7 Verify production/staging physical artwork products require shipping data when fulfillment needs it.
- [x] 7.8 Run one local non-production BACS checkout order and record payment status, order id, buyer data, shipping fields, and order note evidence.
- [ ] 7.9 Run one approved production/staging payment test order and record payment status, order id, buyer confirmation, admin notification, shipping fields, and refund/cancel path.
- [ ] 7.10 Confirm the customer can use the WooCommerce order record to ship the purchased artwork.

## 8. OpenSpec Governance

- [x] 8.1 Review this OpenSpec change and sync the task tracker with completed local implementation evidence while the plan is still active.
- [ ] 8.2 Split implementation into smaller OpenSpec changes when a phase is ready to begin.
- [ ] 8.3 Keep each implementation change test-first and archive it only after validation passes.
- [ ] 8.4 Archive this roadmap change after the planning scope is accepted and the first implementation change is created.
