## ADDED Requirements

### Requirement: Single catalog item layout matches live structure
The owned `luciastuy` theme SHALL render single catalog item pages (`/portfolio/{slug}`) with the same core information architecture as the current live site.

#### Scenario: Two-column composition on desktop
- **GIVEN** a visitor opens a catalog item page on desktop
- **WHEN** the page is rendered
- **THEN** the primary content area shows a media-focused column and an information column
- **AND** the information column includes title, short description, and metadata rows in a live-like hierarchy

#### Scenario: Stacked composition on mobile
- **GIVEN** a visitor opens a catalog item page on mobile
- **WHEN** the page is rendered
- **THEN** content is stacked in a readable sequence
- **AND** metadata remains visible and readable without horizontal overflow

### Requirement: Metadata panel preserves live rhythm
The owned `luciastuy` theme SHALL render the metadata panel with the same semantic labels and visual rhythm as live pages.

#### Scenario: Metadata labels and values are rendered
- **GIVEN** a portfolio item has metadata values
- **WHEN** the page is rendered
- **THEN** labels for `PÁGS`, `TAMAÑO`, `IMPRESIÓN`, and `FECHA` appear with their values
- **AND** label/value typography and spacing follow the approved live reference

#### Scenario: Missing metadata is handled safely
- **GIVEN** one or more metadata values are missing
- **WHEN** the page is rendered
- **THEN** the layout remains stable
- **AND** the template avoids broken placeholders or invalid empty visual artifacts

### Requirement: Gallery behavior mimics live interaction
The owned `luciastuy` theme SHALL provide live-like media interaction for item images.

#### Scenario: Image interaction is discoverable and accessible
- **GIVEN** a visitor views the image stack
- **WHEN** they hover, focus, or activate an image
- **THEN** interaction affordances are visible
- **AND** keyboard users can navigate interactive media controls

#### Scenario: Gallery sequence is preserved
- **GIVEN** an item has multiple images
- **WHEN** the page is rendered and interacted with
- **THEN** the image order and sequence follow the configured catalog order

### Requirement: Previous/next navigation parity is present
The owned `luciastuy` theme SHALL render previous/next catalog item navigation consistent with live behavior.

#### Scenario: Bottom navigation is rendered
- **GIVEN** adjacent catalog items exist
- **WHEN** the visitor reaches the end of a single item page
- **THEN** previous and next navigation controls are visible and functional

### Requirement: Typography uses original theme fonts on item pages
The owned `luciastuy` theme SHALL use the approved original-theme font stack on single catalog item pages.

#### Scenario: Title and metadata typography parity
- **GIVEN** a visitor views a single item page
- **WHEN** text is rendered for title, labels, values, and navigation controls
- **THEN** computed font family and text rhythm match approved live-font parity rules (`Dosis` and `Source Sans Pro`) or documented exceptions

### Requirement: Item page changes remain adaptive and non-regressive
Single-item parity changes SHALL be adaptive across breakpoints and SHALL not regress key shop behavior.

#### Scenario: Adaptive rendering across viewport sizes
- **GIVEN** viewport widths representative of desktop, tablet, and mobile
- **WHEN** a single item page is rendered
- **THEN** layout, typography, and interactions remain usable and consistent with approved parity targets

#### Scenario: WooCommerce surfaces remain stable
- **GIVEN** item-page parity changes are applied
- **WHEN** `/shop/`, one product page, `/cart/`, and `/checkout/` are validated
- **THEN** no critical visual or interaction regression is introduced by catalog-item template/style changes
