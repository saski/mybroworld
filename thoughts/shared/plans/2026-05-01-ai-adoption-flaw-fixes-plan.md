# AI Adoption Flaw Fixes Plan

## Goal

Reduce coordination and contract drift in the current catalog/commerce system before adding more automation or AI workflow surface.

## Scope

- Implement one phase at a time.
- Keep changes test-first and reversible.
- Do not write production WordPress, WooCommerce, Google Sheets, or Drive data from this plan.
- Leave unrelated workspace changes untouched.

## Phases

1. [x] Consolidate the shared catalog contract.
   - Make one code-owned source of truth for required headers, job fields, review statuses, and status mappings.
   - Validate Apps Script and PHP copies against that source where they cannot import it directly.
   - Verification: fail when Node, Apps Script, or WordPress copies drift.

2. [x] Add Apps Script contract regression coverage.
   - Add a lightweight local test harness for pure Apps Script queue behavior where practical.
   - Cover token rejection, missing folder, incompatible tab, review status validation, and recent-job serialization.

3. [ ] Harden local catalog agent operations.
   - Add an explicit agent health/check command for config, OAuth identity, watched sheet reachability, Drive scope, and Chrome/Puppeteer availability.
   - Document one operator command for checking worker readiness.

4. [ ] Fix WooCommerce inventory parity locally first.
   - Start with dry-run product update payloads using `artwork_id` as identity.
   - Add local apply only after dry-run output is stable.
   - Do not write production inventory without an explicit production task, backup, and rollback path.

5. [ ] Reduce documentation drift.
   - Keep canonical docs per concern:
     - `thoughts/shared/docs/artwork-data-contract.md`
     - `thoughts/shared/docs/google-sheets-catalog-action.md`
     - `wordpress/README.md`
     - `PROJECT_STATUS.md`
   - Add or clarify source-of-truth sections only where current operator docs need them.

6. [ ] Keep the simplification loop blocked until inventory is healthy.
   - Do not continue plugin removal while local WooCommerce inventory is known out of sync.
   - Resume plugin cleanup only after inventory parity and product-detail smoke coverage are stable.

## Progress

- Created from the approved proposal on 2026-05-01.
- Completed Phase 1 on 2026-05-01:
  - Added `catalog-generator/src/shared-catalog-contract.mjs` as the code-owned source for catalog headers, job fields, review statuses, and artwork status mappings.
  - Refactored Node catalog and inventory code to use the shared status/default contract.
  - Added drift tests that compare Apps Script queue constants and WordPress review/status copies against the shared contract.
- Completed Phase 2 on 2026-05-01:
  - Added a lightweight local Apps Script harness for `catalog-generator/apps-script/Code.gs`.
  - Covered token rejection, missing output folder handling, incompatible current-tab rejection, review status validation, and recent-job serialization.
  - Kept the coverage local and did not change deployed Apps Script behavior.

## Verification Log

- 2026-05-01: `node --test catalog-generator/test/shared-catalog-contract.test.mjs` passed.
- 2026-05-01: `npm --prefix catalog-generator test` passed.
- 2026-05-01: `scripts/auto-validate.sh` passed. OpenSpec emitted telemetry network flush errors because `edge.openspec.dev` was unreachable in the restricted environment, but the command exited successfully and completed all validation steps.
- 2026-05-01: `node --test catalog-generator/test/apps-script-queue-api.test.mjs` passed.
- 2026-05-01: `npm --prefix catalog-generator test` passed with 29 tests, including the new Apps Script API regressions.
- 2026-05-01: `scripts/auto-validate.sh` passed. OpenSpec emitted telemetry network flush errors because `edge.openspec.dev` was unreachable in the restricted environment, but the command exited successfully and completed all validation steps.
