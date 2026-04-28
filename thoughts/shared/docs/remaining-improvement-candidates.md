# Remaining Improvement Candidates

This plan keeps the improvement loop small and evidence-led. Implement only candidates that are locally safe; defer anything that needs customer, production WordPress, or plugin-admin evidence.

## Candidate 1: Local Assistant State Noise

- Status: implemented in the current safe slice.
- Change: ignore `.claude/` as local assistant state.
- Validation: `git status --short --branch` should no longer report `.claude/`.
- Risk: low; no tracked project behavior changes.

## Candidate 2: Stale Absolute Repo Links In Current Operator Docs

- Status: implemented in the current safe slice for current operator-facing docs only.
- Change: replace `/Users/nacho/saski/mybroworld/...` repo links in `catalog-generator/README.md` and `thoughts/shared/docs/google-sheets-catalog-action.md` with relative links or neutral checkout placeholders.
- Validation: `rg -n "/Users/nacho/saski/mybroworld" catalog-generator/README.md thoughts/shared/docs/google-sheets-catalog-action.md` should return no matches.
- Risk: low; historical evidence docs and handoff plans are intentionally left unchanged unless promoted to current operator guidance.

## Candidate 3: WordPress Plugin Inventory Evidence

- Status: blocked until production/admin evidence is available.
- Next safe step:
  1. Run `scripts/auto-validate.sh` as the baseline.
  2. Open `https://www.luciastuy.com/wp-admin/plugins.php`.
  3. Capture active/inactive state, version, update status, and visible plugin purpose for each plugin.
  4. Update `thoughts/shared/docs/wordpress-plugin-inventory.md` with evidence and keep every uncertain plugin as `UNKNOWN`.
  5. Choose at most one `CANDIDATE` plugin for a Lean simplification cycle.
- Validation before any deactivation: owned-code checks and storefront/shop/cart/checkout smoke checks.
- Stop condition: no plugin is removed until backup evidence and a rollback path are recorded.

## Candidate 4: Historical `/Users/nacho` References

- Status: intentionally deferred.
- Rationale: many remaining references are historical plan evidence or operator-context records.
- Rule: do not bulk rewrite historical paths. Normalize paths only when a document becomes current operator guidance.
- Validation: each promoted guide should avoid hardcoded personal repo checkout paths unless the path is evidence, not instruction.

## Iteration Rule

Each next improvement cycle must:

1. Propose one candidate.
2. Add or confirm a failing/safety check when possible.
3. Make the smallest safe change.
4. Run `scripts/auto-validate.sh`.
5. Commit and push only after validation passes.
