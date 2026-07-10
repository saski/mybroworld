## 1. Baseline Audit

- [x] 1.1 Audit the production Site Kit plugin version, active status, connected Google services, and current Analytics settings.
- [x] 1.2 Audit the production page source and Site Health information for existing GA4 snippets or duplicate tag placement.
- [x] 1.3 Identify the intended long-term owner for the GA4 property, Search Console property, and WordPress Site Kit connection.
- [x] 1.4 Record the audit result in a repository shop observability document.

## 2. Configuration Plan

- [x] 2.1 Select or create the GA4 account, property, and web data stream for `luciastuy.com`.
- [x] 2.2 Decide whether Search Console should be connected in Site Kit for acquisition context.
- [x] 2.3 Confirm Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, and plugin conversion tracking remain disabled.
- [x] 2.4 Define the exact enhanced measurement options to keep enabled.

## 3. Consent And Privacy

- [x] 3.1 Audit whether production already has a cookie banner, CMP, or WP Consent API integration.
- [x] 3.2 If a consent component is missing, evaluate the smallest compliant option against the project dependency rule before installing it.
- [x] 3.3 Configure Consent Mode and verify it receives consent state from the consent management path.
- [x] 3.4 Verify analytics event payloads do not include personally identifying buyer or free-text order data.

## 4. Funnel Event Contract

- [x] 4.1 Document the GA4 event contract for the shop funnel in the repository.
- [x] 4.2 Map WooCommerce product fields to GA4 item parameters, including canonical artwork id/SKU, title, brand, category, series, year, price, and quantity.
- [x] 4.3 Verify which ecommerce events are emitted by the standard Site Kit/WooCommerce setup without owned-code changes.
- [x] 4.4 For each missing launch-critical event, add one failing verification first, then implement the smallest owned-code instrumentation needed.

## 5. Verification

- [x] 5.1 Verify Site Kit Analytics settings in WordPress and record whether Site Kit places the GA4 tag.
- [ ] 5.2 Use GA4 Realtime or DebugView to confirm `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` during a controlled test.
- [ ] 5.3 Run one approved WooCommerce test order and compare the WooCommerce order id and value with the GA4 purchase event.
- [x] 5.4 Record any delay, missing event, duplicate event, or reporting limitation discovered during verification.

## 6. Handoff And Rollback

- [x] 6.1 Document the final configuration, event contract, consent setup, owner accounts, validation evidence, and known gaps.
- [x] 6.2 Document the rollback path for disabling Site Kit tag placement or removing owned-code instrumentation.
- [x] 6.3 Give the customer a short operating guide for where to read visits, acquisition, product interest, checkout behavior, and purchases.

## 7. Final Verification Runbook

### Sequential Critical Path

- [ ] 7.1 Confirm the operator has access to WordPress admin, GA4 Realtime or DebugView, and the approved non-production or production test-order path. (Unblocked 2026-07-10: production 500 error resolved, site stable for GA4 verification.)
- [ ] 7.2 Open a public buyer session with analytics consent accepted and logged-in user tracking excluded.
- [ ] 7.3 Trigger `page_view`, `view_item`, `add_to_cart`, and `begin_checkout` on one available artwork while recording timestamps and URLs.
- [ ] 7.4 Confirm each triggered event appears in GA4 Realtime or DebugView with non-personal item parameters.
- [ ] 7.5 Run one approved WooCommerce test order only after the payment/shipping test path is confirmed.
- [ ] 7.6 Compare WooCommerce order id, total, currency, and item identity against the GA4 `purchase` event.
- [ ] 7.7 Update `thoughts/shared/docs/shop-business-observability.md` with evidence, gaps, and any accepted reporting delay.
- [ ] 7.8 Archive this change only after tasks 5.2 and 5.3 are complete or an explicit no-purchase-verification waiver is documented.

### Parallel Work

- [ ] 7.9 Event observer: watch GA4 Realtime/DebugView, capture event names, timestamps, item ids, value, currency, and consent state.
- [ ] 7.10 Buyer-flow operator: perform the public shop path without logging in, avoid entering personal free text beyond the approved test order data, and record the WooCommerce order evidence.
- [ ] 7.11 Repository recorder: update the observability doc and this task file, keeping raw screenshots or account-sensitive exports out of git unless explicitly sanitized.

### Fallback If Events Are Missing

- [ ] 7.12 Record the missing event and exact reproduction path before adding code.
- [ ] 7.13 Add or extend a failing owned-code verification for the missing launch-critical event.
- [ ] 7.14 Implement the smallest owned instrumentation needed, preserving the no-PII event payload rule.
- [ ] 7.15 Rerun the same GA4 verification path before marking the fallback complete.

## 8. Trunk Sync And Branch Closure

- [x] 8.1 Confirm the observability workstream branch is merged into `main` and the remote tracks `main` as its only branch.
- [x] 8.2 Confirm the GA4 initial-event timing work is represented by `origin/main` commit `78e730c` and `thoughts/shared/docs/shop-business-observability.md`, so no separate branch remains open.
- [ ] 8.3 Rerun the section 7 evidence path before adding new owned instrumentation for `view_item`, `begin_checkout`, or `purchase`.
- [ ] 8.4 If final verification exposes another instrumentation gap, create the smallest trunk-based fix slice with the failing verification from 7.12/7.13 before implementing code.
