## ADDED Requirements

### Requirement: Evidence-based commerce platform decision
The project SHALL decide whether to continue with WooCommerce or test a leaner ecommerce approach using explicit evidence rather than preference.

#### Scenario: Platform decision is reviewed
- **WHEN** the platform decision is reviewed
- **THEN** the review compares WooCommerce and at least one leaner option against launch speed, maintenance risk, plugin dependence, order flow, payment needs, content editing, and rollback cost
- **AND** the decision is recorded before visual identity implementation begins

### Requirement: Lean approach remains isolated until proven
The project SHALL keep any lean ecommerce experiment isolated from production commerce behavior until it satisfies the agreed launch-critical flows.

#### Scenario: Lean experiment is proposed
- **WHEN** a leaner ecommerce approach is tested
- **THEN** the experiment defines the flows it must prove
- **AND** production WooCommerce remains the fallback until the evidence is accepted

### Requirement: WooCommerce near-term shop baseline
The project SHALL treat WooCommerce plus the owned `luciastuy` theme as the near-term shop replacement baseline unless a recorded platform decision proves a better alternative.

#### Scenario: Shop replacement starts
- **WHEN** the project begins replacing the current production theme
- **THEN** WooCommerce remains the commerce engine for products, cart, checkout, orders, and payment configuration
- **AND** the work focuses on replacing the commercial/builder presentation layer with owned code
- **AND** any alternative commerce stack remains out of production until it proves payment, buyer data, shipping, order management, and rollback needs
