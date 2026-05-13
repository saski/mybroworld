## Why

The Lucia Astuy shop needs business observability for visits, useful visitor behavior, recurrence, product interest, checkout flow, and purchase outcomes before the shop is treated as buyer-ready. The project has accepted Site Kit and Google Analytics 4 as the first business analytics layer because they are Google-standard tools familiar to the customer, while still preserving the local rule against paid, freemium, or dependency-heavy WordPress extensions.

## Workstream Branch

Use branch `eb/configure-shop-business-observability` for this OpenSpec workstream. Keep PRs from this branch scoped to `openspec/changes/configure-shop-business-observability/` and the supporting GA4/Site Kit evidence, blocker, and verification artifacts that close this observability change.

## What Changes

- Establish Site Kit plus GA4 as the baseline business observability stack for the WooCommerce shop.
- Configure analytics through Site Kit in WordPress instead of adding a separate paid analytics plugin or custom tag dependency.
- Define the minimum GA4 event contract for the artwork browsing and checkout funnel.
- Require consent, privacy, duplicate-tag, and verification checks before accepting the setup.
- Keep Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, and any conversion-advertising features out of scope unless explicitly approved later.
- Keep system observability with OpenTelemetry out of this change; that remains a separate technical workstream.

## Capabilities

### New Capabilities

- `shop-business-observability`: Tracks shop discovery, browsing, ecommerce funnel behavior, and purchase outcomes through Site Kit and GA4 with lean dependency governance.

### Modified Capabilities

- None.

## Impact

- Production WordPress admin configuration for Site Kit and Google Analytics.
- GA4 account/property/web data stream ownership and access.
- WordPress consent configuration for EEA/Spain visitors.
- Potential owned `luciastuy` theme or plugin code only if GA4 ecommerce events are not already emitted correctly by the existing WooCommerce/Site Kit setup.
- Project documentation and launch readiness evidence for shop observability.
