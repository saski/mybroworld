## ADDED Requirements

### Requirement: Plugin inventory and classification
The project SHALL classify each WordPress plugin before removal as `KEEP`, `CANDIDATE`, or `UNKNOWN`, with evidence for its production role and replacement or rollback path.

#### Scenario: Plugin is marked as a removal candidate
- **WHEN** a plugin is classified as `CANDIDATE`
- **THEN** the classification records why it appears removable
- **AND** names the smoke checks required before and after deactivation

### Requirement: One-plugin-at-a-time removal
The project SHALL remove or deactivate WooCommerce-adjacent plugins one at a time after baseline tests pass.

#### Scenario: Candidate plugin is removed
- **WHEN** a candidate plugin is deactivated or removed
- **THEN** the project runs the agreed smoke checks immediately before and after the change
- **AND** logs the result, rollback instructions, and final status in the plugin-removal record
