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
- [ ] 5.4 Record any delay, missing event, duplicate event, or reporting limitation discovered during verification.

## 6. Handoff And Rollback

- [ ] 6.1 Document the final configuration, event contract, consent setup, owner accounts, validation evidence, and known gaps.
- [ ] 6.2 Document the rollback path for disabling Site Kit tag placement or removing owned-code instrumentation.
- [ ] 6.3 Give the customer a short operating guide for where to read visits, acquisition, product interest, checkout behavior, and purchases.
