## ADDED Requirements

### Requirement: Customer-approved catalog contract
The project SHALL capture customer-approved PDF catalog visual direction and field requirements before implementing catalog layout or data-contract changes.

#### Scenario: Customer feedback is accepted
- **WHEN** the customer confirms a catalog visual or field decision
- **THEN** the project records the decision in the relevant `thoughts/shared/` artifact
- **AND** updates the catalog implementation plan before code changes begin

#### Scenario: Customer requests a field change
- **WHEN** customer feedback adds, removes, renames, or changes a catalog field
- **THEN** the project updates the canonical artwork data contract
- **AND** identifies the generator, sheet, and WordPress impacts before implementation

### Requirement: Catalog and shop status consistency
The project SHALL keep artwork availability semantics consistent between the PDF catalog and WordPress/WooCommerce display, including the canonical `reserved` status label `Reservada`.

#### Scenario: Reserved artwork is published
- **WHEN** an artwork has canonical status `reserved`
- **THEN** the PDF catalog and WooCommerce availability display use the customer-approved reserved wording
- **AND** automated tests cover the WordPress status normalization and label
