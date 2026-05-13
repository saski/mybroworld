## ADDED Requirements

### Requirement: Platform-aware ecommerce identity
The project SHALL start ecommerce visual identity implementation only after the platform direction is accepted.

#### Scenario: Visual identity work begins
- **WHEN** ecommerce identity work starts
- **THEN** the selected platform or experiment target is known
- **AND** the identity work includes the actual frontend surfaces customers will use

### Requirement: Customer-approved identity handoff
The project SHALL capture customer-approved ecommerce identity decisions in implementation-ready artifacts before frontend changes begin.

#### Scenario: Identity direction is accepted
- **WHEN** the customer accepts an ecommerce visual direction
- **THEN** the project records the agreed typography, color, imagery, product presentation, and interaction priorities
- **AND** maps those decisions to the selected ecommerce implementation surface

### Requirement: Owned theme visual replacement gate
The project SHALL visually compare the owned `luciastuy` theme against the current production `Glacier` experience before production theme replacement.

#### Scenario: Theme replacement is reviewed
- **WHEN** `luciastuy` is considered for production activation
- **THEN** desktop and mobile screenshots exist for the current production theme and the owned theme
- **AND** the reviewed surfaces include the home page, shop, product detail, cart, and checkout
- **AND** required visual gaps are resolved or explicitly accepted before switching themes

### Requirement: Owned theme interaction replacement gate
The project SHALL replay launch-critical shop interactions against the owned `luciastuy` theme before production theme replacement.

#### Scenario: Interaction replacement is reviewed
- **WHEN** `luciastuy` is considered for production activation
- **THEN** interaction reports exist for current production affordances and the owned theme
- **AND** the reviewed interactions include navigation, shop sorting, product links, add-to-cart controls, product detail behavior, cart state, and checkout buyer fields
- **AND** required interaction gaps are resolved or explicitly accepted before switching themes
