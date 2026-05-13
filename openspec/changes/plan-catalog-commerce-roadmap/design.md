## Context

The project has two active delivery surfaces: `catalog-generator/` for PDF catalogs and `wordpress/` for owned WordPress/WooCommerce behavior. Supporting documents and plans now live under `thoughts/shared/`, with canonical operational docs under `thoughts/shared/docs/`.

The immediate risk is coordination drift: customer feedback, source-sheet completion, WooCommerce platform decisions, plugin removal, test coverage, and ecommerce visual identity can affect each other. The roadmap must keep those decisions sequenced so risky commerce changes are not made before the project has the evidence and tests needed to recover.

## Goals / Non-Goals

**Goals:**

- Define the explicit steps ahead before implementation.
- Make customer review gates visible.
- Keep the catalog contract and WooCommerce artwork status behavior aligned.
- Decide whether WooCommerce remains the right starting platform using evidence.
- If WooCommerce stays, reduce plugin risk with tests and rollback points.
- Treat WooCommerce plus the owned `luciastuy` theme as the near-term replacement baseline after the 2026-05-06 shop-stage decision.
- Require payment readiness, buyer data capture, and artwork fulfillment evidence before the shop is marked buyer-ready.

**Non-Goals:**

- Do not redesign the catalog in this change.
- Do not migrate ecommerce platforms in this change.
- Do not remove WordPress plugins in this change.
- Do not rebuild WooCommerce checkout or introduce a new production payment stack in this change.

## Decisions

1. Use OpenSpec as the planning source for the next roadmap.
   - Rationale: OpenSpec keeps proposal, specs, design, and tasks in one reviewable change folder before implementation.
   - Alternative considered: continue with only `thoughts/shared/plans/`. That keeps history, but it does not separate proposed requirements from implementation tasks as clearly.

2. Sequence catalog decisions before source-sheet expansion.
   - Rationale: adding the remaining years is easier and safer after the customer confirms the final catalog field set and visual direction.
   - Alternative considered: complete all sheet rows first. That risks rework if customer feedback changes required fields.

3. Treat WooCommerce as the default baseline until a leaner alternative is proven.
   - Rationale: the project already has WordPress/WooCommerce assets, local tooling, and smoke-test scaffolding. Replacing it should require evidence, not preference.
   - Alternative considered: start a lean ecommerce rewrite immediately. That may reduce plugin risk, but it delays commerce validation and creates new payment/order-management risk.

4. Gate plugin removal behind tests and one-plugin-at-a-time rollback.
   - Rationale: plugin removal is exactly where unsupported dependencies and hidden production coupling can break publication or commerce flows.
   - Alternative considered: bulk disable candidate plugins. That is faster but makes failures hard to attribute and rollback.

5. Use WooCommerce plus `luciastuy` as the near-term shop replacement surface.
   - Rationale: the customer-validated catalog generator moves the project into shop delivery, and the repo already has WooCommerce data, local validation scripts, canonical products, and an owned theme baseline.
   - Alternative considered: pause theme work until a full platform re-evaluation completes. That keeps options open, but delays the concrete replacement of the commercial/builder production layer.

6. Make checkout, payment, buyer data, and fulfillment evidence part of the theme replacement gate.
   - Rationale: a visually acceptable shop is not buyer-ready unless WooCommerce can take payment and expose the buyer/shipping data needed to deliver the artwork.
   - Alternative considered: complete visual replacement first and validate checkout later. That risks switching themes before the critical buyer path is proven.

7. Run ecommerce simplification as a Lean build-measure-learn loop.
   - Rationale: each WordPress/WooCommerce addition should be removed only when the smallest useful simplification hypothesis has been proposed, tested, measured, and recorded.
   - Alternative considered: create a one-time plugin cleanup project. That can reduce obvious waste, but it does not create a repeatable habit for future WP additions, custom code, theme dependencies, or configuration drift.

## Lean Simplification Loop

Each simplification cycle follows the same sequence:

1. **Propose**: identify one WP addition or ecommerce complexity source, state the Lean hypothesis, expected value, rollback path, and exact health checks.
2. **Baseline**: run owned-code checks and relevant storefront/admin smoke checks before changing anything.
3. **Change**: remove, disable, replace, or isolate only one addition at a time.
4. **Measure**: rerun the health checks and compare the result to the baseline.
5. **Learn**: record whether the change made the system simpler, safer, or easier to improve.
6. **Continue**: choose the next simplification proposal only after the current cycle is healthy or rolled back.

Default health criteria:

- Owned WordPress tests pass.
- Storefront, shop, cart, checkout, and critical-error smoke checks pass when those flows are in scope.
- Product publication and artwork availability behavior remain correct.
- The change removes or reduces a real maintenance risk, paid dependency, unsupported plugin, duplicated behavior, or future-change blocker.
- Rollback is documented and still possible.

Stop the loop when the next candidate requires a customer/platform decision, a test gap blocks confidence, or there is no remaining simplification candidate with enough value to justify its risk.

## Risks / Trade-offs

- Customer feedback changes the catalog field contract -> Mitigation: record each accepted change in `thoughts/shared/docs/artwork-data-contract.md` and update tests before generator changes.
- The source sheet grows before validation rules are ready -> Mitigation: use staged imports by year and run catalog readiness checks after each batch.
- WooCommerce plugins hide behavior needed by checkout or publication -> Mitigation: inventory each plugin, classify risk, run smoke checks before and after one removal at a time, and keep rollback notes.
- The simplification loop rewards removal without enough value -> Mitigation: require a written Lean hypothesis and expected improvement before each cycle.
- Lean ecommerce spike underestimates operational needs -> Mitigation: require explicit evidence for product publishing, orders, payments, inventory, taxes/shipping if relevant, and maintenance cost.
- Tests become too broad and slow -> Mitigation: keep many fast owned-code/unit checks, some integration checks, and only a small set of critical end-to-end commerce flows.
- Payment readiness is treated as visual-launch follow-up instead of launch gate -> Mitigation: require an approved payment test order or an explicit no-payment launch decision before marking the shop buyer-ready.
- Buyer data for artwork shipping is incomplete -> Mitigation: verify checkout fields, physical product settings, order emails, and the WooCommerce order record before production replacement is accepted.

## Migration Plan

This change is planning-only. Implementation should proceed through separate OpenSpec changes or small task branches:

1. Catalog feedback and contract update.
2. Source-sheet completion by year.
3. Commerce platform decision and optional lean spike.
4. Shop visual baseline and `luciastuy` replacement plan.
5. Checkout, payment, buyer data, and fulfillment readiness.
6. Lean simplification loop setup.
7. WooCommerce baseline tests and plugin inventory.
8. One-addition-at-a-time WooCommerce/WordPress reduction.
9. Ecommerce visual identity and implementation.

Rollback for this planning change is deleting or revising the active OpenSpec change before it is archived. Rollback for later implementation changes must be defined in each change's design or tasks.

## Open Questions

- Which customer feedback thread will be the canonical source for catalog visual and field decisions?
- Which years remain missing from the source sheet, and do they share the same required field set?
- Which exact payment method and shipping/pickup rules does the customer want for the first buyer-ready launch?
- Which WooCommerce plugins are currently active in production, and which are already unused?
- Should the leaner ecommerce alternative be a static catalog plus inquiry flow, a lightweight checkout provider, or a custom storefront backed by WooCommerce?
