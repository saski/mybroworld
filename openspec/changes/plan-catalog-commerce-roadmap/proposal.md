## Why

The next work needs a shared, explicit roadmap because the project spans customer-facing catalog decisions, source data completion, ecommerce architecture, WooCommerce risk reduction, and test coverage. Planning this as an OpenSpec change keeps decisions reviewable before changing production commerce behavior.

## What Changes

- Establish a staged roadmap for the catalog and ecommerce work ahead.
- Make customer decision points explicit before implementation begins.
- Define the requirements for source-sheet completion, catalog contract alignment, platform evaluation, WooCommerce plugin reduction, smoke/regression testing, and ecommerce visual identity.
- Record the 2026-05-06 stage decision that the customer-validated catalog generator lets the project shift focus to the owned shop theme replacement.
- Add checkout, payment, buyer data, and artwork fulfillment readiness as explicit launch gates for the shop.
- Add an explicit Lean simplification loop for proposing, testing, measuring, and learning from each WordPress/WooCommerce reduction step.
- Treat the fixed `reserved` status mapping as baseline behavior that future catalog and shop flows must preserve.
- No production ecommerce behavior changes are included in this planning change.

## Capabilities

### New Capabilities

- `catalog-feedback-loop`: Customer-reviewed PDF catalog design and field decisions.
- `artwork-source-completion`: Completion and validation of the source sheet across remaining years of work.
- `commerce-platform-decision`: Evidence-based decision between continuing WooCommerce and testing a leaner ecommerce approach, with WooCommerce plus `luciastuy` as the near-term shop replacement baseline.
- `lean-commerce-simplification-loop`: Iterative Lean loop for proposing and validating smaller ecommerce/WP additions before removal.
- `woocommerce-plugin-safety`: Safe reduction toward vanilla WooCommerce with reversible plugin removal.
- `commerce-flow-test-coverage`: Automated coverage for publishing, catalog, shop, checkout, payment readiness, buyer data capture, and plugin-removal smoke flows.
- `ecommerce-visual-identity`: Customer-approved visual identity process and visual replacement gate for the ecommerce experience.

### Modified Capabilities

- None. This repository does not yet contain archived OpenSpec specs; this change introduces the planning capabilities.

## Impact

- Affected planning artifacts: `openspec/changes/plan-catalog-commerce-roadmap/`, `thoughts/shared/plans/`, and `thoughts/shared/docs/`.
- Affected implementation areas in later changes: `catalog-generator/`, connected source sheets, `wordpress/`, WordPress/WooCommerce configuration, and test scripts.
- Affected decisions: catalog fields and visual design, ecommerce platform choice, plugin-retention policy, test strategy, and ecommerce identity direction.
- Dependencies: customer feedback, source-sheet access, WordPress/WooCommerce environment access, plugin inventory evidence, and baseline test execution.
- Affected operational docs: the Lean simplification loop record under `thoughts/shared/docs/`.
