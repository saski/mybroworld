## ADDED Requirements

### Requirement: Baseline owned-code checks
The project SHALL keep fast automated checks for owned WordPress code so catalog and commerce helper behavior can change safely.

#### Scenario: Owned WordPress helper changes
- **WHEN** owned WordPress PHP code changes
- **THEN** PHP linting and owned-code tests run before the change is accepted
- **AND** status-label behavior remains covered by a regression test

### Requirement: Publication and commerce smoke coverage
The project SHALL cover launch-critical publication and commerce flows before plugin removal or platform changes proceed.

#### Scenario: Plugin removal begins
- **WHEN** the project starts a plugin removal step
- **THEN** the smoke suite covers storefront reachability, shop reachability, cart reachability, checkout reachability, and critical error detection
- **AND** failures block further plugin removal until investigated

### Requirement: Buyer-ready checkout evidence
The project SHALL verify checkout, payment readiness, buyer data capture, and fulfillment visibility before the shop is marked buyer-ready.

#### Scenario: Buyer-ready shop is reviewed
- **WHEN** the shop is considered ready for external buyers
- **THEN** an approved payment test order has been recorded or an explicit no-payment launch decision exists
- **AND** the WooCommerce order record contains the buyer contact, billing, shipping, purchased artwork, payment status, and order-note information needed for fulfillment
- **AND** buyer and admin order notifications have been verified
