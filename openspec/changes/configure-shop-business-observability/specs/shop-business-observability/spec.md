## ADDED Requirements

### Requirement: Approved business analytics baseline
The project SHALL use Site Kit plus Google Analytics 4 as the first business observability layer for the WooCommerce shop while preserving the local dependency-governance rule.

#### Scenario: Analytics stack is reviewed
- **WHEN** the shop business observability stack is reviewed
- **THEN** Site Kit and GA4 are accepted for business metrics because they are Google-standard, customer-familiar tools
- **AND** the review confirms that no paid analytics extension, freemium buy-to-extend module, or complicated analytics dependency tree is introduced
- **AND** Ads, AdSense, Reader Revenue Manager, Tag Manager, advertiser gateway, and plugin conversion tracking remain disabled unless explicitly approved later

### Requirement: Correct Site Kit and GA4 configuration
The project SHALL configure Site Kit and GA4 against the intended production account, property, and web data stream with duplicate tracking avoided.

#### Scenario: Site Kit Analytics is configured
- **WHEN** Site Kit is configured for Analytics
- **THEN** the selected GA4 account, property, and web data stream are recorded
- **AND** Site Kit is either the single source placing the GA4 tag or the reason for an alternate placement is documented
- **AND** logged-in WordPress users are excluded from Analytics tracking
- **AND** enhanced measurement is enabled unless a documented conflict requires disabling a specific option

### Requirement: Consent and privacy are launch gates
The project SHALL treat consent and privacy configuration as required for accepting GA4 business observability on the production shop.

#### Scenario: Production analytics is prepared for EEA visitors
- **WHEN** GA4 tracking is enabled for the production shop
- **THEN** Consent Mode is enabled or an explicit no-tracking exception is recorded
- **AND** the WP Consent API and consent management path are configured when required by Site Kit
- **AND** no GA4 event payload includes buyer name, email, phone, billing address, shipping address, order note text, or personally identifying free text

### Requirement: Shop funnel events use GA4 ecommerce semantics
The project SHALL measure the artwork browse-to-purchase funnel using GA4 recommended ecommerce event names and stable non-personal item parameters.

#### Scenario: Funnel tracking is verified
- **WHEN** the launch-critical shop flow is tested
- **THEN** GA4 receives events for product discovery, product detail interest, cart activity, checkout start, and completed purchase where those steps occur
- **AND** item data uses the canonical artwork id or SKU, title, brand, artwork category, series, year, price when allowed, and quantity
- **AND** the WooCommerce order id is used as `transaction_id` for purchase events to prevent duplicate purchase reporting

### Requirement: Observability setup is verified before acceptance
The project SHALL verify the analytics setup with Google and WooCommerce evidence before marking business observability complete.

#### Scenario: Setup evidence is collected
- **WHEN** business observability is accepted
- **THEN** Site Health or equivalent evidence confirms the GA4 snippet placement status
- **AND** GA4 Realtime or DebugView confirms representative funnel events during a controlled test
- **AND** a WooCommerce test order is compared with the GA4 `purchase` event for missing or duplicate purchase tracking
- **AND** the final configuration, event contract, known gaps, and rollback path are documented in the repository
