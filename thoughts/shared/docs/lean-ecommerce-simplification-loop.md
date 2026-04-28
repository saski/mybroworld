# Lean Ecommerce Simplification Loop

Use this loop to reduce WordPress/WooCommerce complexity without guessing. Each cycle removes or reduces one addition only after the proposal, baseline, change, measurement, and learning are explicit.

## Loop

1. Propose one simplification.
   - Identify one WP addition, plugin, theme dependency, custom hook, duplicated workflow, paid dependency, or unsupported dependency.
   - State the Lean hypothesis: what waste this removes and what improvement should be easier afterward.
   - Define the rollback path and the exact health checks.
2. Baseline before changing anything.
   - Run owned-code checks.
   - Run storefront, shop, cart, checkout, and critical-error smoke checks when those flows are in scope.
   - Add or improve a test first if the proposal exposes a test gap.
3. Change one thing.
   - Disable, remove, replace, or isolate only the proposed addition.
   - Do not batch unrelated cleanup into the same cycle.
4. Measure the same checks.
   - Compare post-change results to the baseline.
   - Check publication, product display, artwork availability, and checkout behavior as applicable.
5. Learn and decide.
   - Keep the change if it is healthy and simplifies future work.
   - Roll back if health regresses.
   - Revise if the learning shows a smaller or better next step.
6. Go back to step 1.

Stop the loop when the next candidate needs a customer decision, the platform decision is unresolved, a test gap blocks confidence, or no remaining candidate has enough value to justify its risk.

## Cycle Record Template

```md
## Cycle N: <candidate>

- Date:
- Candidate:
- Type: plugin | theme dependency | custom code | configuration | workflow | paid dependency | unsupported dependency
- Lean hypothesis:
- Expected improvement:
- Risk:
- Rollback:
- Baseline checks:
- Change made:
- Post-change checks:
- Decision: keep | rollback | revise
- Learning:
- Next candidate:
```
