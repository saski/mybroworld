# Shop Business Observability

## Objective

Track the Lucia Astuy shop's business funnel with the smallest acceptable dependency footprint: Site Kit by Google plus Google Analytics 4 for visitor and ecommerce behavior, WooCommerce Analytics for order records, and owned-code instrumentation only for verified gaps.

## Dependency Decision

- Site Kit plus GA4 is accepted as the first business analytics layer because it is Google-standard, familiar to the customer, and avoids adding a paid/freemium WooCommerce analytics extension.
- Keep the integration limited to the agreed analytics use case.
- Do not enable Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, Sign in with Google, or plugin conversion tracking unless a later explicit decision approves it.
- Any consent plugin or CMP must pass the local WordPress/WooCommerce dependency rule before installation.

## Baseline Audit

Source:
- Production DB export: `backups/production-db-export-20260501-203207/wordpress-db.sql`
- Public page-source checks: `https://www.luciastuy.com/` and `https://www.luciastuy.com/wp-admin/site-health.php`, checked on 2026-05-07
- Authenticated WordPress admin screenshots provided on 2026-05-07 for Site Health and Site Kit dashboard

### Site Kit Plugin State

- Plugin: `google-site-kit/google-site-kit.php`
- Status in production DB export: active
- Site Kit DB version in the 2026-05-01 export: `1.177.0`
- Live login/admin page generator tag on 2026-05-07: `Site Kit by Google 1.178.0`
- WooCommerce system-status plugin cache also reports `Site Kit by Google` version `1.177.0`
- Auto-update list includes `google-site-kit/google-site-kit.php`

### Connected Site Kit Modules

Active modules in the production DB export:

- `pagespeed-insights`
- `analytics`
- `analytics-4`

Search Console settings:

- Property: `https://www.luciastuy.com/`
- Owner user id: `1`

### GA4 Settings

- GA4 account id: `304572042`
- GA4 property id: `429908294`
- Web data stream id: `7591928299`
- Measurement id: `G-MVG8PL9Y42`
- Google tag id: `GT-M6B9CMXM`
- Site Kit `useSnippet`: `true`
- Site Kit `canUseSnippet`: `true`
- Disabled tracking audience: `loggedinUsers`
- AdSense linked: `false`
- Ads linked: `false`
- Ads conversion id: empty
- Detected conversion events: none in the DB export

Legacy Analytics settings in the DB export:

- Analytics account id: `304572042`
- Legacy property/profile fields are empty
- `anonymizeIP`: `true`
- `useSnippet`: `true`
- Disabled tracking audience: `loggedinUsers`

Connected Google profile evidence in the DB export:

- Current connected profile appears to be `mybrocorp@gmail.com` / `Lucía Astuy`
- Auth scopes include Site Verification, Analytics read-only, Search Console/Webmasters, Tag Manager read-only, OpenID, profile, and email.

### Ownership And Access

- Long-term owner for GA4, Search Console, and the Site Kit connection: `mybrocorp@gmail.com` / `Lucía Astuy`.
- Operator access: `nacho.saski@gmail.com` has been granted access to Analytics.
- Operating principle: analytics ownership remains with the customer's/business account; operator access is delegated and should not become the canonical owner.

### Public Page-Source Check

The live public home page includes a Site Kit-added Google tag snippet:

- `googletagmanager.com/gtag/js?id=GT-M6B9CMXM`
- `gtag("config", "GT-M6B9CMXM")`
- Source comment identifies the snippet as added by Site Kit.

This confirms Site Kit is currently placing a Google tag publicly. It does not by itself prove that all GA4 ecommerce events are emitted or that Site Health reports the setup as valid.

### Site Health Access Check

- `https://www.luciastuy.com/wp-admin/site-health.php` redirects to the WordPress login screen for anonymous access.
- The login screen includes `Site Kit by Google 1.178.0`, confirming the live plugin version has advanced beyond the 2026-05-01 DB export.
- The public Site Health REST endpoint checked at `/wp-json/wp-site-health/v1/tests/page-cache` returns `401 rest_forbidden`.
- Authenticated WordPress admin access is required to complete the Site Health / Site Kit diagnostics audit.

### Authenticated Site Health Snapshot

Captured from the production WordPress admin on 2026-05-07:

- Overall status: `Should be improved`
- Critical issues: `1`
  - `Page cache is not detected and the server response time is slow` (`Performance`)
- Recommended improvements: `4`
  - `You should remove inactive plugins` (`Security`)
  - `You should remove inactive themes` (`Security`)
  - `You should use a persistent object cache` (`Performance`)
  - `Your website does not use HTTPS` (`Security`)

No Site Health warning about duplicate Google Analytics or Google tag placement is visible in the provided Status screenshot. The HTTPS warning conflicts with the public `https://www.luciastuy.com/` access path and should be investigated separately, likely through WordPress Address/Site Address or mixed configuration.

### Authenticated Site Kit Snapshot

Captured from the production WordPress admin on 2026-05-07:

- Site Kit dashboard is accessible.
- Visible date range: `Last 28 days`
- Visible sections/tabs: `Key metrics`, `Traffic`, `Content`, `Speed`, `Monetization`
- Later authenticated dashboard evidence shows traffic and content data, including:
  - `All Visitors`: `40`
  - Search traffic totals: `29` impressions, `8` clicks, `9` unique visitors from Search
  - Top search query shown: `lucia astuy`
  - Top content includes portfolio/catalog/contact pages
- Visible prompts:
  - Ads setup CTA: `Get better quality leads and enhance conversions with Ads`
  - Key metrics setup CTA: personalized suggestions / select metrics
  - AdSense setup CTA under monetization
- Speed / PageSpeed section shows a Lighthouse/API failure message, so speed reporting in Site Kit is not currently healthy.

Decision impact:
- Do not click or configure the Ads CTA under the current dependency/governance rule.
- Do not click or configure the AdSense CTA under the current dependency/governance rule.
- Dashboard traffic exists, but GA4 Realtime/DebugView verification is still required for funnel acceptance.

### Site Kit Analytics Settings Verification

Verified for task 5.1 on 2026-05-07.

Sources:

- Production WordPress settings in `backups/production-db-export-20260501-203207/wordpress-db.sql`
- Public production HTML checks on `https://www.luciastuy.com/` and `https://www.luciastuy.com/shop/` at 2026-05-07 15:29 UTC
- Authenticated Site Kit dashboard screenshots provided on 2026-05-07

WordPress / Site Kit settings evidence:

- Active Site Kit modules are `pagespeed-insights`, `analytics`, and `analytics-4`.
- GA4 Analytics account id is `304572042`.
- GA4 property id is `429908294`.
- Web data stream id is `7591928299`.
- Measurement id is `G-MVG8PL9Y42`.
- Google tag id is `GT-M6B9CMXM`.
- Site Kit GA4 `useSnippet=true`.
- Site Kit GA4 `canUseSnippet=true`.
- `trackingDisabled` includes `loggedinUsers`.
- `adsConversionID` is empty.
- `adsLinked=false`.
- `adSenseLinked=false`.
- `detectedEvents` is empty.
- Legacy Analytics settings also have `useSnippet=true` and no legacy property/profile selected.

Public tag placement result:

- The production home page returns `HTTP 200` and includes `https://www.googletagmanager.com/gtag/js?id=GT-M6B9CMXM`.
- The production shop page returns `HTTP 200` and includes `https://www.googletagmanager.com/gtag/js?id=GT-M6B9CMXM`.
- Both checked pages include Site Kit's `google_gtagjs-js` handle and `gtag("config", "GT-M6B9CMXM")`.
- Both checked pages include `Site Kit by Google 1.178.0` generator metadata.

Acceptance for task 5.1:

- Site Kit is configured to place the GA4/Google tag snippet.
- Site Kit is currently placing the Google tag on public production pages.
- Logged-in users are excluded by Site Kit settings.
- Ads, AdSense, and plugin conversion tracking remain disabled/not configured.
- GA4 Realtime or DebugView validation is still required for ecommerce event acceptance in 5.2.

## Open Audit Items

- Confirm live `wp-admin/plugins.php` still matches the DB export before changing production configuration.
- Verify GA4 Realtime or DebugView for shop funnel events before accepting the setup.

## Configuration Plan

### GA4 Selection

Use the existing GA4 setup instead of creating a new property:

- Account id: `304572042`
- Property id: `429908294`
- Web data stream id: `7591928299`
- Measurement id: `G-MVG8PL9Y42`
- Google tag id: `GT-M6B9CMXM`

Rationale:
- The property is already connected through Site Kit.
- The public site already emits the Site Kit Google tag.
- Creating a new property would fragment the existing history and increase configuration risk.

### Search Console Decision

Keep Search Console connected in Site Kit for acquisition context.

Rationale:
- Search Console is already connected for `https://www.luciastuy.com/`.
- Site Kit is already showing Search traffic data, including impressions, clicks, search visitors, and top queries.
- This adds acquisition evidence without adding a new WordPress plugin or commercial module.

### Disabled Commercial / Expansion Modules

Keep these disabled unless explicitly approved later:

- Google Ads
- AdSense
- Reader Revenue Manager
- Tag Manager
- advertiser gateway
- Sign in with Google
- plugin conversion tracking / Ads conversion setup

Current evidence:
- Active Site Kit modules are limited to `pagespeed-insights`, `analytics`, and `analytics-4`.
- DB export shows `adSenseLinked=false`, `adsLinked=false`, and empty `adsConversionID`.
- Site Kit dashboard shows Ads and AdSense CTAs, but those should not be clicked under the current governance rule.

### Enhanced Measurement Plan

Keep GA4 enhanced measurement enabled for low-risk behavioral signals:

- Page views
- Scrolls
- Outbound clicks
- Site search, if WordPress search is used
- File downloads, if downloadable assets are linked
- Form interactions only after verifying payloads do not include personal data

Do not rely on enhanced measurement for WooCommerce funnel acceptance. Product, cart, checkout, and purchase behavior must be verified separately against GA4 ecommerce events.

## GA4 Shop Funnel Event Contract

Sources:
- GA4 ecommerce setup documentation: `https://developers.google.com/analytics/devguides/collection/ga4/ecommerce`
- GA4 recommended events reference: `https://developers.google.com/analytics/devguides/collection/ga4/reference/events`
- GA4 ecommerce validation documentation: `https://developers.google.com/analytics/devguides/collection/ga4/validate-ecommerce`

Contract principles:

- Use GA4 recommended ecommerce event names so the events can populate standard ecommerce reporting instead of becoming unrelated custom events.
- Use one Site Kit/Google tag path per page. Do not add Google Tag Manager or another ecommerce plugin as part of this contract.
- Send ecommerce events only after Analytics consent is granted.
- Keep Ads, remarketing, dynamic remarketing, AdSense, and advertising personalization out of scope.
- Each ecommerce event that represents products must include an `items` array when item data is available.
- If an event includes `value`, it must include `currency`; the shop currency is expected to be `EUR` unless WooCommerce configuration proves otherwise.
- Event payloads must never include buyer name, email, phone, billing address, shipping address, customer note, order note, order key, payment token, or free-text form fields.
- DebugView or Realtime must be used for acceptance because GA4 validation guidance exposes event-level and item-level parameters there.

### Baseline Engagement Events

| Event | Source | Trigger | Launch status | Privacy rule |
| --- | --- | --- | --- | --- |
| `page_view` | Site Kit / Google tag | Public page load, except sensitive WooCommerce order endpoints | Active baseline | Do not send `order-pay` or `order-received` URLs containing order ids or order keys. |
| `scroll` | GA4 enhanced measurement | Visitor reaches GA4 scroll threshold | Planned baseline | No custom parameters. |
| `click` | GA4 enhanced measurement | Outbound link click | Planned baseline | Do not add link text or form data manually. |
| `view_search_results` | GA4 enhanced measurement | WordPress search results page is viewed | Planned baseline | Search terms are acceptable only as standard GA4 site-search behavior; do not add buyer free text. |
| `file_download` | GA4 enhanced measurement | Downloadable catalog or asset link is clicked | Planned baseline | File metadata only; no user-entered data. |

### Launch-Critical Ecommerce Events

| Event | Trigger | Required payload shape | Launch status |
| --- | --- | --- | --- |
| `view_item_list` | A catalog, shop, category, or related-artwork grid displays products | `item_list_id`, `item_list_name`, `items[]` with non-personal item facts | Contracted; emission still to verify. |
| `select_item` | Visitor opens an artwork/product from a list | Same selected item data plus list context when known | Contracted; emission still to verify. |
| `view_item` | Visitor views an artwork/product detail page | `currency`, `value` when price is available, `items[]` | Contracted; emission still to verify. |
| `add_to_cart` | WooCommerce confirms an artwork/product was added to cart | `currency`, `value`, `items[]` for the added product | Contracted; emission still to verify. |
| `remove_from_cart` | Visitor removes an artwork/product from cart | `currency`, `value`, `items[]` for the removed product | Contracted; emission still to verify. |
| `view_cart` | Visitor views the cart | `currency`, `value`, `items[]` for current cart contents | Contracted; emission still to verify. |
| `begin_checkout` | Visitor opens checkout with a non-empty cart | `currency`, `value`, `items[]` for checkout contents | Contracted; emission still to verify. |
| `purchase` | WooCommerce order is completed and a sanitized order summary is available | `transaction_id`, `currency`, `value`, optional `tax`/`shipping`, `items[]` | Contracted; requires explicit sanitized implementation or verified standard emission. |

### Conditional Ecommerce Events

| Event | Trigger | Required payload shape | Launch status |
| --- | --- | --- | --- |
| `add_shipping_info` | Checkout exposes a distinct shipping method step or shipping option submit | `currency`, `value`, optional `shipping_tier`, `items[]` | Defer unless the checkout UX has a measurable shipping step. |
| `add_payment_info` | Checkout exposes a distinct payment method step or payment submit | `currency`, `value`, optional non-sensitive `payment_type`, `items[]` | Defer unless the checkout UX has a measurable payment step. |
| `refund` | A refund is recorded and refund reporting becomes operationally useful | `transaction_id`, `currency`, `value`, `items[]` when known | Defer until refunds are part of reporting operations. |
| `generate_lead` | A non-purchase inquiry becomes an agreed business conversion | Non-personal conversion context only | Defer; contact form contents must not be sent. |

### Event-Level Parameters

Allowed event-level parameters:

- `currency`: ISO 4217 currency code, expected `EUR`.
- `value`: numeric sum of item `price * quantity`; do not include personal or free-text data.
- `transaction_id`: WooCommerce order id only, not order key and not buyer-facing secret.
- `tax`: numeric tax amount for `purchase` only when available.
- `shipping`: numeric shipping amount for `purchase` only when available.
- `coupon`: only sanitized coupon code/name if WooCommerce uses coupons; do not use free-text discount notes.
- `item_list_id` / `item_list_name`: stable list identifiers such as `catalog`, `shop`, `related_artworks`, or `search_results`.
- `shipping_tier`: non-personal shipping method label only, if used.
- `payment_type`: coarse non-sensitive payment method label only, if used.

Disallowed event-level parameters:

- Buyer name, email, phone, username, user id, customer id, billing or shipping address, postcode, city, country combined with buyer identity, order key, payment token, customer note, order note, contact-form message, or arbitrary request/query/form payloads.

### Item Payload Contract

WooCommerce product data must map to GA4 `items[]` with a stable, non-personal artwork contract:

| GA4 item parameter | Source and rule |
| --- | --- |
| `item_id` | Canonical artwork id. Prefer WooCommerce product meta `_lucia_artwork_id`; fall back to product `sku` only when it matches `LA-YYYY-NNN`. Managed Lucia artwork events must treat a missing canonical id as a verification failure. |
| `item_name` | WooCommerce product name, generated from catalog `title_clean` with `title_raw` as the catalog-sync fallback. Strip HTML and trim whitespace before emission. |
| `item_brand` | Fixed value `Lucia Astuy`. |
| `item_category` | Fixed value `Artwork` for managed Lucia artwork products. For any future non-artwork product, use a sanitized primary WooCommerce product category and document the exception. |
| `item_category2` | Artwork series from product meta `_lucia_series_name`, generated from catalog `series_name`; omit when empty. |
| `item_category3` | Artwork year. Prefer a future dedicated product meta field if added; otherwise parse the year from canonical ids matching `LA-YYYY-NNN`. Do not infer the year from the product title. |
| `item_variant` | Normalized artwork availability/status from `_lucia_artwork_status`, generated from `status_normalized`; use values such as `available`, `reserved`, `sold`, `not_for_sale`, `personal_collection`, or `archived`. Omit when empty or ambiguous. |
| `price` | Numeric WooCommerce product price when available. Catalog sync currently sets `regular_price` from `price_eur` only for purchasable artwork statuses; omit `price` when WooCommerce exposes an empty or non-numeric price. |
| `quantity` | Cart or order line quantity when the event has cart/order context; otherwise `1` for single original-artwork impressions and product views. |
| `item_list_id` / `item_list_name` | Stable list context when known, such as `catalog` / `Catalog`, `shop` / `Shop`, `related_artworks` / `Related artworks`, or `search_results` / `Search results`. |
| `index` | 1-based list position when known; omit outside list contexts. |

The item payload must remain intentionally small. Do not send location metadata, location history, submission history, catalog notes, descriptions, dimensions, medium/support free text, image URLs, filesystem paths, admin URLs, spreadsheet operator metadata, or buyer-specific reservation/order information.

### Verification Contract

- 4.3 must determine which contracted ecommerce events are emitted by the current Site Kit/WooCommerce setup without owned-code changes.
- 4.4 must add owned-code instrumentation only for launch-critical gaps, with one failing verification before each implementation step.
- 5.2 must verify representative `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` events in GA4 Realtime or DebugView.
- 5.3 must compare one approved WooCommerce test order against the GA4 `purchase` event for transaction id, value, currency, and duplication.

### Standard Setup Ecommerce Verification

Sources:
- Site Kit event tracking documentation: `https://sitekit.withgoogle.com/documentation/using-site-kit/event-tracking/`
- Site Kit plugin conversion tracking documentation: `https://sitekit.withgoogle.com/documentation/using-site-kit/plugin-conversion-tracking/`
- Site Kit key metrics documentation: `https://apps.sitekit.withgoogle.com/documentation/using-site-kit/key-metrics/`
- Production DB export: `backups/production-db-export-20260501-203207/wordpress-db.sql`
- Public HTML checks on 2026-05-07 for `/`, `/catalogo/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/algunas-situaciones-requieres-dos-de-azucar/`
- Owned-code search for `gtag`, `dataLayer`, and GA4 ecommerce event names under `wordpress/wp-content`, `scripts`, and `catalog-generator`

Current standard setup means the production Site Kit plus WooCommerce configuration before adding owned ecommerce event instrumentation. It does not include Google Tag Manager, Google for WooCommerce, WooCommerce Google Analytics Integration, Ads conversion setup, AdSense, or a third-party ecommerce tracking plugin.

Evidence summary:

- Active production plugins include `google-site-kit/google-site-kit.php` and `woocommerce/woocommerce.php`.
- Active Site Kit modules in the DB export are `pagespeed-insights`, `analytics`, and `analytics-4`.
- Site Kit Analytics settings have `useSnippet=true`, `adsConversionID` empty, `adsLinked=false`, `adSenseLinked=false`, and `detectedEvents` empty.
- Public pages checked all include the Site Kit Google tag script and `gtag("config", "GT-M6B9CMXM")`.
- Public `/shop/` and product HTML include WooCommerce product cards, add-to-cart links, product ids, and SKUs such as `LA-2026-013`, but no `gtag("event", ...)` ecommerce payloads.
- The only owned `gtag`/`dataLayer` use found is Consent Mode plumbing in the owned consent banner; owned code does not emit ecommerce events.
- WooCommerce order attribution and Sourcebuster scripts are present, but they populate WooCommerce attribution context rather than GA4 ecommerce events.
- Site Kit plugin conversion tracking is a separate Site Kit feature that can inject front-end JavaScript for supported plugins including WooCommerce when enabled; current production evidence does not show that front-end conversion script or generated ecommerce events.

Observed emission result:

| Event | Standard setup result | Evidence / next action |
| --- | --- | --- |
| `page_view` | Emitted baseline, not an ecommerce event. | Site Kit places `gtag("config", "GT-M6B9CMXM")` on checked public pages. |
| `view_item_list` | Not emitted. | `/shop/` renders product list data, but no GA4 `view_item_list` event or `items[]` payload appears. Add owned verification/instrumentation in 4.4. |
| `select_item` | Not emitted. | Product links render without GA4 click instrumentation. Add owned verification/instrumentation in 4.4. |
| `view_item` | Not emitted. | Product detail page renders title and SKU, but no GA4 `view_item` event or item payload appears. Add owned verification/instrumentation in 4.4. |
| `add_to_cart` | Not emitted. | WooCommerce add-to-cart buttons and Ajax scripts are present, but no GA4 `add_to_cart` event is emitted by the checked source. Add owned verification/instrumentation in 4.4. |
| `remove_from_cart` | Not emitted / not accepted. | Empty-cart public check cannot exercise removal; no standard GA4 emitter is present in source. Add owned verification/instrumentation in 4.4 if cart removal tracking remains launch-critical. |
| `view_cart` | Not emitted. | `/cart/` renders an empty WooCommerce cart and only the Site Kit page-view tag. Add owned verification/instrumentation in 4.4. |
| `begin_checkout` | Not emitted / not accepted. | `/checkout/` redirects to `/cart/` when the cart is empty; no standard checkout event emitter is present in checked source. Add owned verification/instrumentation in 4.4 with a controlled non-empty cart. |
| `purchase` | Not emitted / not accepted. | No standard purchase emitter is visible in active plugin configuration or checked source. Purchase must use sanitized owned instrumentation or a separately verified acceptable Site Kit conversion-tracking path. |
| `add_shipping_info`, `add_payment_info`, `refund`, `generate_lead` | Deferred. | These remain conditional events and are not launch acceptance requirements. |

Acceptance for task 4.3:

- The current standard Site Kit/WooCommerce setup is accepted only for baseline GA4 page-view placement.
- No launch-critical GA4 ecommerce event is confirmed from the standard setup.
- 4.4 must start from failing owned verifications for the launch-critical ecommerce gaps before adding any event emitter.

### Owned Ecommerce Instrumentation

Implementation files:

- `wordpress/wp-content/mu-plugins/lucia-ga4-ecommerce.php`
- `wordpress/wp-content/mu-plugins/assets/lucia-ga4-ecommerce.js`
- `wordpress/wp-content/mu-plugins/tests/lucia-ga4-ecommerce-test.php`
- `wordpress/wp-content/mu-plugins/lucia-bootstrap.php`
- `wordpress/wp-content/mu-plugins/assets/lucia-consent-banner.js`

Implemented launch-critical events:

| Event | Owned-code path |
| --- | --- |
| `view_item_list` | PHP collects WooCommerce loop products and renders a footer config with indexed `items[]` and stable list context. |
| `select_item` | Owned JS emits when a visitor clicks a tracked WooCommerce product link. |
| `view_item` | PHP emits an initial product-detail event for the current WooCommerce product. |
| `add_to_cart` | Owned JS emits from WooCommerce's `added_to_cart` frontend event using the server-rendered product item map. |
| `remove_from_cart` | Owned JS emits from WooCommerce cart removal links using the server-rendered product item map. |
| `view_cart` | PHP emits an initial cart event when the WooCommerce cart has items. |
| `begin_checkout` | PHP emits an initial checkout event when checkout has a non-empty cart and is not an order endpoint. |
| `purchase` | PHP emits a sanitized purchase payload from WooCommerce order line items on `order-received`. |

Privacy and dependency rules:

- The implementation is owned code in an mu-plugin; it adds no WordPress plugin dependency.
- Events are emitted only by the frontend JS when the owned consent storage key is `granted`.
- Ads storage, Ads conversion tracking, AdSense, remarketing, and Google Tag Manager remain out of scope.
- Item payloads use the documented non-personal artwork mapping.
- Purchase payloads use WooCommerce order id as `transaction_id`, numeric line-item value, optional tax/shipping, and sanitized `items[]`.
- Purchase payloads do not include order key, buyer identity, billing/shipping address, payment token, customer note, order note, or form free text.
- Since Site Kit remains blocked on sensitive WooCommerce order endpoints, the owned ecommerce plugin loads the Google tag on `order-received` with `send_page_view:false` so the sanitized `purchase` event can be sent without collecting the sensitive order URL as a page view.
- The frontend stores a local `lucia_ga4_purchase_<transaction_id>` marker to reduce duplicate purchase emission on page refresh; GA4 should still use `transaction_id` for purchase deduplication.

Validation for task 4.4:

- Failing verifications were added before implementation in `wordpress/wp-content/mu-plugins/tests/lucia-ga4-ecommerce-test.php`.
- `scripts/wp-test-owned-code.sh` passed after implementation.

### GA4 Realtime / DebugView Verification Status

Attempted for task 5.2 on 2026-05-07 and continued on 2026-05-08.

Current status:

- Production has the owned consent banner and GA4 ecommerce instrumentation deployed.
- Authenticated GA4 access was confirmed for account `304572042`, property `429908294`, stream `7591928299`, measurement id `G-MVG8PL9Y42`.
- GA4 Realtime for `Lucia Astuy / www.luciastuy.com` showed the anonymous controlled browser as `1` active user after the test flow.
- GA4 Realtime showed active page title evidence including `Cart - Lucia Astuy` and `Checkout - Lucia Astuy`.
- Network evidence from anonymous controlled browser runs has confirmed GA4 requests to `region1.google-analytics.com/g/collect` for:
  - `page_view` on `G-MVG8PL9Y42`.
  - `view_item` on `G-MVG8PL9Y42` in an earlier controlled run for item `LA-2026-018`, item name `Muy feliz por lo que acabo de tramar`, currency `EUR`, value `230`.
  - `add_to_cart` on `G-MVG8PL9Y42` after the shop product-map deploy, for item `LA-2026-006`, item name `Corriendo en bici`, currency `EUR`, value `230`.
- The 2026-05-08 production recheck stored evidence under `/private/tmp/lucia-ga4-codex_ga4_recheck_1778250155209`.
- That recheck confirmed `/shop/` exposes `9` products in `window.luciaGa4Ecommerce.products` and `add_to_cart` reaches GA4.
- The same recheck showed product and checkout pages render initial event config for `view_item` and `begin_checkout`, but those initial events did not reach GA4 in that run.
- The initial-event timing fix was merged and deployed on 2026-05-08 as `Fix GA4 initial event timing (#13)`, observed locally as `origin/main` commit `78e730c`.
- Production asset verification after that deploy confirmed `assets/lucia-ga4-ecommerce.js` contains `sendInitialEventsWhenTagIsReady()` and waits for `window.load` before initial ecommerce events.
- A post-deploy checkout-focused production run stored evidence under `/private/tmp/lucia-ga4-codex_begin_auto_1778252313270` and confirmed automatic GA4 collection for:
  - `view_item_list` on `/shop/`, currency `EUR`, value `870`, with `9` product items.
  - `add_to_cart` on `/shop/`, item `LA-2026-006`, currency `EUR`, value `230`.
- A post-deploy product/manual-send run stored evidence under `/private/tmp/lucia-ga4-codex_ga4_manual_1778251770829` and confirmed GA4 accepts the configured `view_item` payload for `LA-2026-006`, currency `EUR`, value `230`.
- A post-deploy checkout/manual-send run stored evidence under `/private/tmp/lucia-ga4-codex_begin_debug_1778251881202` and confirmed GA4 accepts the configured `begin_checkout` payload for `LA-2026-006`, currency `EUR`, value `230`.
- Automatic `begin_checkout` still did not appear in the long-wait checkout run, despite checkout rendering the correct `begin_checkout` config.
- `purchase` was not tested because no approved WooCommerce test order can currently be placed through checkout.

Gaps found during verification:

- The Glacier theme's shop archive renders product cards without populating the standard `woocommerce_after_shop_loop_item` collection path used by the owned GA4 plugin.
- Fixed and deployed on 2026-05-08: `lucia_ga4_ecommerce_loop_products()` now falls back to WooCommerce products from the main query when the loop hook did not collect products.
- Regression coverage was added in `wordpress/wp-content/mu-plugins/tests/lucia-ga4-ecommerce-test.php`.
- The production recheck confirmed this fix by collecting `add_to_cart` for product `16596` / `LA-2026-006`.
- A second timing gap was reduced by PR `#13`, which defers initial ecommerce events until `window.load` and keeps consent-triggered initial events on the same path.
- Local verification for that timing fix passed with `php wordpress/wp-content/mu-plugins/tests/lucia-ga4-ecommerce-test.php`, `sh scripts/wp-test-owned-code.sh`, and `/opt/homebrew/bin/openspec validate configure-shop-business-observability --strict`.
- Production verification after PR `#13` shows `view_item_list` is now collected automatically with a sufficiently long shop-page wait.
- Automatic `begin_checkout` remains a gap: the checkout page renders a valid `begin_checkout` config and GA4 accepts the payload when sent manually after load, but the automatic initial event did not appear in the long-wait checkout run.

Checkout blocker found during verification:

- The 2026-05-08 checkout inspection stored evidence under `/private/tmp/lucia-woo-codex_payment_inspect_1778250263250`.
- The post-deploy 2026-05-08 checkout inspection stored evidence under `/private/tmp/lucia-woo-codex_payment_inspect_1778252700962` and showed the same blocker.
- The controlled browser added product `16596` to the cart and opened checkout.
- WooCommerce rendered no `payment_method` inputs and no payment method labels.
- WooCommerce showed: `Lo siento, parece que no hay métodos de pago disponibles. Por favor, ponte en contacto con nosotros si necesitas ayuda.`
- Do not place or simulate a production order until a safe approved payment/test-order path is available.

Requirements to complete task 5.2:

1. Decide whether automatic `begin_checkout` must be fixed before purchase verification or whether a manually verified checkout payload is acceptable as interim evidence.
2. Repeat an anonymous controlled GA4 Realtime or DebugView flow with analytics consent granted.
3. Confirm received events for `page_view`, `view_item`, `add_to_cart`, and `begin_checkout`.
4. Provide a safe approved WooCommerce test-order path with a payment method that does not expose real customers to an unintended payment option.
5. Run one explicitly approved WooCommerce test order.
6. Confirm the received `purchase` event and compare WooCommerce order id, currency, and value against GA4.
7. Record any remaining delay, missing event, duplicate event, or reporting limitation.

Do not mark task 5.2 complete until GA4 Realtime or DebugView confirms every required event.

## Consent And Privacy Audit

Sources:
- Site Kit Consent Mode documentation: `https://sitekit.withgoogle.com/documentation/using-site-kit/consent-mode/`
- WP Consent API plugin documentation: `https://wordpress.org/plugins/wp-consent-api/`
- Public page-source check on `https://www.luciastuy.com/`, checked on 2026-05-07
- Production DB export: `backups/production-db-export-20260501-203207/wordpress-db.sql`

Current production evidence:

- No dedicated cookie banner / CMP plugin appears in the active plugin list from the production DB export.
- Public page source does not show a Site Kit Consent Mode snippet comment.
- Public page source does not show a `gtag("consent", ...)` or `gtag('consent', ...)` call.
- Public page source does not show obvious CMP fingerprints for `complianz`, `cookiebot`, `cookieyes`, `iubenda`, `onetrust`, `termly`, `moove`, or similar strings.
- WordPress comments cookie opt-in is enabled (`show_comments_cookies_opt_in=1`), but that is not a site-wide analytics consent banner.
- WooCommerce order attribution is present and currently reports `allowTracking=true`, so consent configuration needs to account for WooCommerce attribution cookies as well as GA4.

Conclusion:

- Consent Mode / CMP integration is not detected from available evidence.
- Site Kit documentation says Consent Mode should be enabled when Analytics is connected and that a complete setup needs both WP Consent API and a consent management plugin/banner.
- Do not enable additional analytics or advertising features until consent is resolved.

## Consent Component Evaluation

Required shape:

- Enable Site Kit Consent Mode only after choosing the consent path.
- Install/activate WP Consent API if Site Kit requires it.
- Add exactly one consent management plugin or owned banner path that communicates consent choices through WP Consent API / Google Consent Mode.
- Keep the solution limited to statistics/analytics consent unless a later explicit business decision adds marketing/ads use.

Evaluation against the project dependency rule:

- WP Consent API is acceptable as plumbing if required by Site Kit. It does not collect consent by itself and should not be treated as the banner/CMP.
- Site Kit names CMP plugins such as Complianz, Cookiebot, and CookieYes as compatible examples, but these are third-party CMP products and commonly have freemium or SaaS expansion paths.
- Under the project rule, do not install a CMP automatically just because Site Kit suggests it.
- Next acceptable step is a small, explicit consent-choice review: choose the smallest CMP/banner option that supports Site Kit Consent Mode, WP Consent API, Spanish/EEA consent UX, no paid requirement for the needed scope, and minimal upsell/runtime coupling.

Decision:

- Use an owned minimal banner instead of a third-party CMP for the first implementation.
- Keep the banner compact and non-intrusive.
- Store only the visitor's analytics consent choice in local browser storage.
- Grant only `analytics_storage` when the visitor accepts analytics.
- Keep `ad_storage`, `ad_user_data`, and `ad_personalization` denied even when analytics is accepted.
- Do not enable Site Kit's Ads, AdSense, advertiser gateway, or conversion setup as part of this consent work.

Implementation:

- `wordpress/wp-content/mu-plugins/lucia-consent-banner.php`
- `wordpress/wp-content/mu-plugins/assets/lucia-consent-banner.js`
- `wordpress/wp-content/mu-plugins/assets/lucia-consent-banner.css`
- `wordpress/wp-content/mu-plugins/lucia-bootstrap.php` loads the consent mu-plugin.

Behavior:

- The mu-plugin prints a `gtag('consent', 'default', ...)` command at early `wp_head` priority before Site Kit's Google tag should run.
- The default state is denied for advertising and analytics storage.
- If a stored `granted` choice exists, analytics storage is granted before the Google tag config runs.
- The footer banner exposes only two actions: reject or accept analytics.
- The banner's JavaScript sends `gtag('consent', 'update', ...)` when the visitor chooses.
- The UI is owned code and adds no third-party WordPress dependency.

Validation:

- `wordpress/wp-content/mu-plugins/tests/lucia-consent-banner-test.php` covers default denied state, analytics-only acceptance, compact banner actions, asset enqueueing, and absence of Ads-oriented controls.

## Analytics Payload Privacy Verification

Sources:
- Google Analytics page view documentation: `https://developers.google.com/analytics/devguides/collection/ga4/views`
- Site Kit support guidance for disabling the Site Kit Analytics snippet with `googlesitekit_analytics-4_tag_blocked`: `https://wordpress.org/support/topic/turn-off-analytics-on-certain-pages/`
- Production DB export: `backups/production-db-export-20260501-203207/wordpress-db.sql`
- Owned-code audit with `rg` over `wordpress/wp-content`
- Local rendered HTML checks against `http://127.0.0.1:8090/`, `/checkout/order-received/1234/?key=wc_order_test`, and `/checkout/order-pay/1234/?key=wc_order_test` on 2026-05-07

Current event emitters:

- Site Kit is the only active GA4 placement path detected in the production DB export.
- Active production plugins do not include a dedicated WooCommerce GA plugin, Tag Manager plugin, Facebook/Meta pixel plugin, Mailchimp/Klaviyo/Metorik analytics plugin, or another ecommerce tracking add-on.
- Owned code emits Google Consent Mode commands and consent-gated GA4 ecommerce events through `lucia-ga4-ecommerce.php` and `assets/lucia-ga4-ecommerce.js`.
- Owned code does not emit buyer identifiers, billing/shipping addresses, payment tokens, order keys, customer notes, order notes, or free-text form contents.
- Local rendered HTML for the home page still shows Site Kit's `google_gtagjs-js` script and `gtag("config", "GT-M6B9CMXM")`.

Payload privacy result:

- No current GA4 event payload from owned code includes buyer name, email, phone, billing address, shipping address, customer note, order note, or other buyer free-text data.
- Ecommerce event payloads use the documented non-personal `items[]` mapping and purchase uses WooCommerce order id only as `transaction_id`.
- Full GA4 acceptance is still pending because `view_item`, `begin_checkout`, and `purchase` require repeat Realtime/DebugView verification after the initial-event timing fix is deployed, and checkout currently has no available payment method for a safe test order.
- WooCommerce order attribution is present in rendered HTML and exposes attribution field names for source/referrer/UTM/session/user-agent data. It does not expose buyer fields and is not itself a GA4 event payload, but it remains part of the consent/privacy surface.

Risk found and mitigated:

- Google documents that a default `gtag('config', ...)` sends a `page_view` and uses `location.href` as the default `page_location`.
- WooCommerce order endpoints can include order id and order key in URLs, for example `order-received/.../?key=wc_order_...` and `order-pay/.../?key=wc_order_...`.
- To prevent Site Kit automatic page views from sending those sensitive order URLs, owned code now blocks Site Kit Analytics snippets on WooCommerce `order-received` and `order-pay` endpoints:
  - `wordpress/wp-content/mu-plugins/lucia-analytics-privacy.php`
  - `wordpress/wp-content/mu-plugins/tests/lucia-analytics-privacy-test.php`
- Local verification after the change:
  - Home page: Site Kit GA tag still renders.
  - `order-received` test URL: consent script renders, but `google_gtagjs-js` and `gtag("config", "GT-M6B9CMXM")` do not render.
  - `order-pay` test URL: consent script renders, but `google_gtagjs-js` and `gtag("config", "GT-M6B9CMXM")` do not render.

Acceptance for task 3.4:

- Current analytics payloads are acceptable for the baseline because they do not include buyer PII or order free text.
- Sensitive WooCommerce order URLs are excluded from automatic Site Kit page-view collection until a later sanitized purchase event is explicitly verified.
- `scripts/wp-test-owned-code.sh` passed after implementation.

## Final Configuration And Handoff Status

Final configured baseline:

- Business analytics stack: Site Kit plus GA4, with WooCommerce Analytics kept as the operational order record.
- GA4 account id: `304572042`.
- GA4 property id: `429908294`.
- Web data stream id: `7591928299`.
- Measurement id: `G-MVG8PL9Y42`.
- Google tag id: `GT-M6B9CMXM`.
- Site Kit places the public Google tag and excludes logged-in WordPress users.
- Search Console remains connected for acquisition context.
- Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, Sign in with Google, and plugin conversion tracking remain disabled unless explicitly approved later.
- Consent is handled by the owned compact banner. The default state denies analytics and advertising storage; accepting analytics grants only `analytics_storage`.
- Ecommerce instrumentation is owned mu-plugin code and adds no commercial/freemium WordPress dependency.

Validation evidence:

- Site Kit dashboard and public HTML confirmed Site Kit tag placement.
- GA4 Realtime confirmed the `Lucia Astuy / www.luciastuy.com` property and one anonymous active user during the controlled flow.
- Network evidence confirmed `page_view`, `view_item_list`, an earlier `view_item`, and post-deploy `add_to_cart` on `G-MVG8PL9Y42`.
- The post-deploy controlled browser state confirmed `/shop/` now exposes `9` product items and that `add_to_cart` reaches GA4 for `LA-2026-006`, value `230`, currency `EUR`.
- The post-deploy controlled browser state also confirmed `view_item` and `begin_checkout` page config exists; GA4 accepts both payloads when sent after load, but automatic `begin_checkout` is still not confirmed.
- Verification found and fixed the missing `add_to_cart` product map on `/shop/`; the deployed fallback fix is covered by `wordpress/wp-content/mu-plugins/tests/lucia-ga4-ecommerce-test.php`.
- PR `#13` / `origin/main` commit `78e730c` deployed the initial-event `window.load` timing fix.

Known gaps:

- Automatic `begin_checkout` still needs either an owned-code fix or an explicit acceptance decision that the manually verified payload is enough until purchase testing.
- `view_item` and `begin_checkout` still need final GA4 Realtime or DebugView confirmation in the accepted evidence path, not only network/manual-send evidence.
- `purchase` still needs one explicitly approved WooCommerce test order and GA4 comparison against WooCommerce order id/value.
- Checkout currently exposes no payment method inputs or labels and shows WooCommerce's no-payment-methods notice, so a normal customer checkout test order cannot be placed yet.
- Site Health still reports performance/security improvements unrelated to this analytics acceptance path.

## Rollback

Use the smallest rollback that matches the issue found:

1. Disable owned ecommerce events only:
   - Remove or disable `wordpress/wp-content/mu-plugins/lucia-ga4-ecommerce.php`.
   - Remove or stop enqueueing `wordpress/wp-content/mu-plugins/assets/lucia-ga4-ecommerce.js`.
   - Keep Site Kit active if baseline visit/acquisition analytics should remain.

2. Disable the owned consent banner only:
   - Remove or disable `wordpress/wp-content/mu-plugins/lucia-consent-banner.php`.
   - Remove or stop enqueueing `wordpress/wp-content/mu-plugins/assets/lucia-consent-banner.js`.
   - Remove or stop enqueueing `wordpress/wp-content/mu-plugins/assets/lucia-consent-banner.css`.
   - Replace it only with an approved CMP that passes the project dependency rule.

3. Disable Site Kit tag placement:
   - In WordPress admin, open Site Kit settings and disable Analytics snippet placement or disconnect Analytics.
   - Alternatively use the Site Kit `googlesitekit_analytics-4_tag_blocked` path for sensitive pages if a page-specific issue is found.
   - Keep WooCommerce Analytics and WooCommerce order records as the sales fallback.

4. Restore deployed owned code:
   - Use the production deploy workflow rollback backup id recorded for the relevant deploy run.
   - The successful production owned-code deploy recorded backup id `wordpress-owned-code-25509617424-1`.
   - After rollback, verify public HTML no longer includes the removed owned script/config and record the reason in this document.

## Customer Operating Guide

Use Google Analytics for visitor behavior before purchase:

- Visits and recurrence: GA4 `Reports > Realtime` for immediate checks, and `Reports > Life cycle > Engagement` for pages and repeated visits over time.
- Acquisition: Site Kit dashboard and GA4 acquisition reports for Search, direct, referral, and campaign traffic. Search Console in Site Kit is the simplest place to read search impressions, clicks, and queries.
- Product interest: GA4 ecommerce item events, especially `view_item`, `view_item_list`, and later `select_item` once enough data accumulates.
- Cart and checkout behavior: GA4 ecommerce funnel events `add_to_cart`, `view_cart`, and `begin_checkout`; automatic `begin_checkout` still needs final acceptance evidence.
- Purchases and order truth: WooCommerce remains the source of truth for orders, customer fulfillment, tax/shipping, refunds, and operational revenue. GA4 `purchase` is for analytics trend comparison after the approved test order verifies it.
- Consent checks: Open an anonymous/incognito browser, accept analytics in the compact banner, then use GA4 Realtime to confirm the visit. Rejecting analytics should not create accepted analytics events.

Operator rules:

- Do not enable Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, or Site Kit plugin conversion tracking without a separate explicit decision.
- Do not install paid/freemium analytics or consent plugins unless they pass the local WordPress dependency rule.
- Do not treat GA4 as the source of fulfillment truth; use WooCommerce orders for customer and money facts.
- Do not share screenshots containing buyer personal data when validating purchase events.

## Completion Blockers

- Decide and implement or explicitly defer the remaining automatic `begin_checkout` gap.
- Repeat GA4 Realtime or DebugView for the accepted funnel path.
- Confirm `view_item` and `begin_checkout` as received GA4 events; `view_item_list` and `add_to_cart` already have post-deploy network evidence but should be included in the final Realtime/DebugView pass.
- Provide a safe payment/test-order path that does not unintentionally enable a real customer payment method.
- Run one explicitly approved WooCommerce test order through that safe path.
- Compare the WooCommerce order id/currency/value against the GA4 `purchase` event.
- Only then mark OpenSpec tasks 5.2 and 5.3 complete.
