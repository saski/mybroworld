## ADDED Requirements

### Requirement: Lean simplification proposal
The project SHALL start each WordPress/WooCommerce simplification cycle with a written proposal for one small change that removes or reduces a specific ecommerce complexity source.

#### Scenario: Simplification candidate is proposed
- **WHEN** a WP addition, plugin, theme dependency, custom hook, duplicated workflow, or paid/unsupported dependency is proposed for removal or replacement
- **THEN** the proposal records the Lean hypothesis, expected value, risk, rollback path, and required health checks
- **AND** no implementation begins until the proposal identifies the single change being tested

### Requirement: Baseline before change
The project SHALL measure the relevant health checks before applying each simplification change.

#### Scenario: Simplification cycle starts
- **WHEN** a simplification proposal is accepted for testing
- **THEN** the owned-code checks and relevant commerce smoke checks run before the change
- **AND** failures block the simplification until the baseline is healthy or the proposal is revised

### Requirement: Healthy learning loop
The project SHALL complete each simplification cycle by measuring health after the change and recording the learning before proposing the next change.

#### Scenario: Simplification change is tested
- **WHEN** a simplification change has been applied
- **THEN** the same health checks run after the change
- **AND** the result is recorded as keep, rollback, or revise
- **AND** the next simplification proposal waits until the current cycle is healthy or rolled back
