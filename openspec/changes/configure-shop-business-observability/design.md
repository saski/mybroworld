## Context

WooCommerce Analytics is useful for orders, products, customers, and revenue after commerce events happen, but the shop also needs visibility into visitor behavior before purchase. Site Kit is the official Google WordPress plugin and can connect Analytics from the WordPress admin, place the GA4 tag, expose Analytics data inside WordPress, exclude logged-in users, enable enhanced measurement, and verify snippet placement through Site Health.

Google's GA4 ecommerce model provides recommended events for online sales such as `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `refund`, and `remove_from_cart`. Because the site serves Spain/EEA visitors, Consent Mode and a working consent management path are part of the baseline rather than a later optimization.

## Goals / Non-Goals

**Goals:**

- Use Site Kit plus GA4 as the first business observability layer.
- Keep the dependency footprint lean and avoid paid/freemium analytics add-ons.
- Configure Analytics for the actual production shop property and web stream.
- Track the launch-critical artwork browse-to-purchase funnel.
- Verify tracking with Google tools before calling the setup complete.
- Preserve a path to owned-code instrumentation only for gaps that the standard setup does not cover.

**Non-Goals:**

- Do not introduce Google Ads, AdSense, Reader Revenue Manager, or advertiser-focused gateway features.
- Do not add a paid WooCommerce analytics extension.
- Do not add a tag manager dependency unless a later explicit decision proves it is needed.
- Do not solve OpenTelemetry, logs, traces, infrastructure metrics, or uptime in this change.

## Decisions

1. Use Site Kit as the GA4 integration surface.
   - Rationale: it is the official Google plugin, already appears in the production plugin inventory, and avoids a separate analytics plugin.
   - Guardrail: Site Kit is acceptable only for the agreed Google analytics use case; additional Google modules require explicit review.

2. Connect only the required Google services for business observability.
   - Required: Analytics, and Search Console if it is already owned by the customer or needed for acquisition context.
   - Not enabled by default: Ads, AdSense, Reader Revenue Manager, Tag Manager, Sign in with Google, advertiser gateway, and plugin conversion tracking.

3. Treat consent as a launch requirement.
   - Rationale: Site Kit documents that Analytics tracking for EEA, Switzerland, and UK visitors depends on Consent Mode and a consent management path.
   - Guardrail: any consent plugin or CMP must pass the same dependency-quality rule as other WordPress components.

4. Prefer GA4 recommended ecommerce events over custom event names.
   - Rationale: recommended event names populate standard GA4 ecommerce reporting and reduce custom-reporting maintenance.
   - Guardrail: custom parameters are allowed only for artwork-specific facts that do not contain personal data.

## Event Contract

Baseline page and engagement events come from GA4 enhanced measurement:

- `page_view`
- `scroll`
- `click` for outbound links
- `view_search_results` when site search is used
- `file_download` if downloadable assets are linked

The shop funnel should use GA4 ecommerce events where the WooCommerce flow supports them:

- `view_item_list`: shop or collection grid is viewed.
- `select_item`: visitor opens an artwork from a list.
- `view_item`: visitor views an artwork product page.
- `add_to_cart`: visitor adds an artwork to cart.
- `remove_from_cart`: visitor removes an artwork from cart.
- `view_cart`: visitor views cart.
- `begin_checkout`: visitor opens checkout.
- `add_shipping_info`: shipping details are submitted.
- `add_payment_info`: payment information step is reached or submitted.
- `purchase`: WooCommerce order is completed.
- `refund`: refund is recorded if refunds become part of operational reporting.
- `generate_lead`: optional only if inquiry/contact becomes a meaningful non-purchase conversion.

Item mapping:

- `item_id`: canonical artwork id or WooCommerce SKU, preferring `LA-YYYY-NNN` when available.
- `item_name`: artwork title.
- `item_brand`: `Lucia Astuy`.
- `item_category`: `Artwork`.
- `item_category2`: series name when known.
- `item_category3`: artwork year when known.
- `item_variant`: normalized availability/status only if useful and non-personal.
- `price`: item price when shown and allowed for reporting.
- `quantity`: usually `1` for original artwork.
- `transaction_id`: WooCommerce order id for purchase events to avoid duplicate purchase reporting.

No event payload may include buyer name, email, phone, billing address, shipping address, order note text, or other personally identifying free text.

## Validation

- Confirm active Site Kit version and connected services in WordPress.
- Confirm the selected GA4 account, property, and web data stream belong to the intended customer/business context.
- Confirm only one GA4 tag path is active to avoid duplicate page views.
- Confirm Site Kit places the Analytics snippet, or intentionally records why it does not.
- Confirm logged-in WordPress users are excluded from Analytics tracking.
- Confirm enhanced measurement is enabled for the web data stream.
- Confirm Consent Mode is enabled and connected to a working WP Consent API/CMP path before accepting EEA tracking.
- Use GA4 Realtime or DebugView to verify at least `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` during a controlled shop test.
- Compare WooCommerce order totals with GA4 purchase events after the test order to identify duplicate or missing purchases.

## Risks / Trade-offs

- Consent setup may require one additional plugin. Mitigation: evaluate only the smallest compliant option and document why it passes the project dependency rule.
- Existing manual GA snippets may duplicate Site Kit tracking. Mitigation: audit page source and Site Health before enabling placement.
- GA4 reporting can lag. Mitigation: use DebugView or Realtime for initial verification and reports for follow-up validation.
- WooCommerce may not emit all recommended ecommerce events through Site Kit alone. Mitigation: add owned-code instrumentation only after proving the gap with a failing verification case.
- Google tools are commercial SaaS, not self-hosted. Mitigation: accepted by project decision for business metrics because they are standard, reputable, customer-familiar, and do not add a paid WordPress extension tree.

## Rollback

- Disconnect Analytics from Site Kit or disable Site Kit tag placement.
- Remove any owned-code GA event instrumentation added by this change.
- Keep WooCommerce order analytics available as the fallback sales record.
- Record the rollback and the reason in the shop observability documentation before trying an alternative analytics stack.

## Open Questions

- Which Google account should own the GA4 property and Search Console property long term?
- Is there already an active cookie/consent banner in production, and does it integrate with WP Consent API?
- Does the existing Site Kit production configuration already connect Analytics, or only another Google service?
