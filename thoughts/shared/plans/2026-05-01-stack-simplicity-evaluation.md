# Stack Simplicity Evaluation

## Diagnosis

The project is not suffering from Python or arbitrary language sprawl in the tracked application code. The real complexity is cross-system coordination between the Google Sheet, Apps Script, a local Node catalog agent, Google Drive, WordPress/WooCommerce, and production operations.

The current system has two active delivery surfaces:

- `catalog-generator/` for PDF catalog generation, catalog-agent processing, contract checks, and WooCommerce sync planning.
- `wordpress/` for the owned WordPress/WooCommerce custom layer.

Everything else should justify itself as a thin adapter, validation wrapper, or temporary migration aid.

## Main Tension

The current stack solved real workflow problems quickly: customer-facing catalog generation, sheet-driven inventory, Drive PDF delivery, and WordPress shop operations. The cost is that the production catalog path now depends on too many runtime boundaries: WordPress -> Apps Script Web App -> Google Sheet queue -> local LaunchAgent -> Node/Puppeteer -> Drive -> WordPress review state.

This is acceptable as a pilot, but it should not become the unexamined long-term architecture.

## Stack Decisions

| Surface | Decision | Rationale |
|---|---|---|
| PHP / WordPress / WooCommerce | Keep as the commerce baseline for now. Simplify it aggressively. | The live site and shop are already there, and replacing commerce before proving a better flow would create risk. |
| Node ESM / `.mjs` | Keep as the single non-WordPress automation runtime. | PDF rendering, Google API calls, sync planning, and tests fit Node better than Apps Script or PHP. Treat `.mjs` as Node, not as a separate stack. |
| Apps Script | Keep only as a thin Sheets/Web App adapter. Freeze feature growth. | It gives the workbook UI and queue bridge, but it is a poor place for business logic, rendering, or long-running work. |
| Google Sheets | Keep as the current catalog source of truth. | The artwork data contract and reviewer criteria are already sheet-centered. |
| Google Drive | Keep for PDF delivery and source image references while catalog operations remain Google-native. Reduce storefront dependence on live Drive URLs. | Drive is operationally useful, but commerce should own or cache public image assets through WordPress media. |
| Shell scripts | Keep as tested operational wrappers only. | They are useful for local WordPress setup, backups, deploys, and validation. Do not move business logic into shell. |
| Docker / Colima | Keep for local WordPress validation. | This is infrastructure for feedback, not product runtime complexity. |
| Python | Do not introduce. | No tracked Python source or Python project marker is active in this repository. |

## Elimination Candidates

1. Eliminate `Python` from the project vocabulary and tooling plan.
   - There is no active tracked Python surface.
   - New data transforms, checks, and integrations should default to Node ESM unless there is strong evidence otherwise.

2. Eliminate the mental split between `node` and `mjs`.
   - `.mjs` is the existing Node ESM format.
   - Use "Node ESM" in docs and planning.
   - Keep reusable logic under `catalog-generator/src/`; keep root `scripts/*.mjs` as thin CLIs.

3. Retire production dependence on the operator Mac.
   - The current `nacho-saski` LaunchAgent is a pilot dependency.
   - The next simplification is either a customer-owned `lucia-mybrocorp` worker or a later cloud/off-machine renderer, but not both at once.

4. Freeze Apps Script as an adapter.
   - Allowed: queue job, list job, record review, discover compatible tabs, surface precise errors.
   - Not allowed: PDF rendering, WooCommerce sync, business-rule normalization, complex orchestration.
   - If WordPress becomes the only customer UI, retire the Sheets sidebar and keep only the minimal Web App bridge if still needed.

5. Remove commercial/builder WordPress dependency over time.
   - `Glacier`, Elementor, Slider Revolution, bundled builder/theme coupling, and All-in-One WP Migration should not be part of the maintained long-term runtime.
   - Remove one candidate at a time with baseline checks, smoke tests, and rollback evidence.

6. Remove unmanaged legacy/demo WooCommerce products after explicit approval.
   - Production managed canonical products are applied.
   - The remaining `unexpected=15` production products are now a concrete cleanup candidate, not a sync problem.

7. Reduce Drive image ambiguity before adding more catalog automation.
   - The source contract should keep stable image identifiers.
   - WooCommerce should serve storefront images from WordPress media, not depend on ad hoc Drive URL behavior.

8. Consolidate current operator docs.
   - Keep canonical operational docs per concern:
     - `thoughts/shared/docs/artwork-data-contract.md`
     - `thoughts/shared/docs/google-sheets-catalog-action.md`
     - `wordpress/README.md`
     - `PROJECT_STATUS.md`
   - Do not promote historical plans into current runbooks unless they are still actively used.

## Minimum Experiment

Run a two-week simplification pass with one owner and one primary metric.

- Owner: tech lead or delegated maintainer.
- Metric: number of production-critical runtime boundaries required for a customer to generate and approve a catalog.
- Baseline today: WordPress, Apps Script, Google Sheet queue, local LaunchAgent, Node/Puppeteer, Drive, WordPress review state.
- Target: reduce at least one boundary or make the boundary customer-owned and testable.

Recommended sequence:

1. Add or finish a `catalog-agent doctor` command that checks config, OAuth identity, watched sheet access, Drive write access, and Chrome/Puppeteer availability.
2. Complete the `lucia-mybrocorp` customer-owned worker handoff.
3. If the handoff is still operationally heavy after verification, propose one alternative renderer path and compare it against the local worker using actual setup and recovery time.

## Guardrails

- Do not rewrite commerce because the stack feels mixed.
- Do not add Python.
- Do not add another queue or database until one existing queue is removed.
- Do not add cloud rendering until the customer-owned local worker has either failed a concrete criterion or proven too costly to operate.
- Do not add WordPress plugins for catalog queueing, PDF generation, or admin UI unless owned code fails a documented quality or maintenance threshold.
- Do not move business rules into Apps Script.
- Do not run production cleanup without backup id, explicit approval, dry-run output, and rollback notes.

## Review

Review this proposal after the customer-owned worker handoff or within two weeks, whichever comes first.

Decision defaults:

- `pilot`: customer-owned catalog worker.
- `consolidate`: Node ESM as the only non-WordPress automation runtime.
- `retire`: Python references, unmanaged legacy/demo products, builder/theme dependencies, and any duplicate UI path that no customer uses.
- `postpone`: cloud renderer or ecommerce platform replacement until current bottlenecks are measured.
