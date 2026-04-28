## ADDED Requirements

### Requirement: Complete remaining artwork years
The project SHALL add the remaining years of artwork data to the source sheet using the canonical field contract approved for the catalog and ecommerce workflows.

#### Scenario: A year batch is added
- **WHEN** a new year of artwork rows is added to the source sheet
- **THEN** required canonical fields are populated or explicitly marked as unknown
- **AND** the batch can be reviewed independently before the next year is added

### Requirement: Validate catalog readiness
The project SHALL validate source-sheet completeness before generating customer-facing catalog output.

#### Scenario: Catalog generation is requested
- **WHEN** the source sheet is used to generate a PDF catalog
- **THEN** rows missing required catalog fields are reported before output is accepted
- **AND** rows intentionally excluded from the catalog remain traceable in the source data
