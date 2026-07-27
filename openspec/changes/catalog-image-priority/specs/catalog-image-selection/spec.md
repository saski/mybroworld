## MODIFIED Requirements

### Requirement: _CAT01 image has highest priority
The catalog generator SHALL select the image file with suffix `_CAT01` when it exists for an artwork, with priority order: `_CAT01` > other `_cat*` > no suffix.

#### Scenario: _CAT01 exists alongside other variants
- **GIVEN** an artwork has files `ART001_CAT01.jpg`, `ART001_CAT02.jpg`, and `ART001.jpg` in the Drive folder
- **WHEN** the catalog generator resolves the image for this artwork
- **THEN** it selects `ART001_CAT01.jpg`

#### Scenario: _CAT01 exists alone
- **GIVEN** an artwork has only `ART001_CAT01.jpg` in the Drive folder
- **WHEN** the catalog generator resolves the image for this artwork
- **THEN** it selects `ART001_CAT01.jpg`

#### Scenario: Multiple same-priority files use alphabetical order
- **GIVEN** an artwork has `ART001_CAT01_a.jpg` and `ART001_CAT01_b.jpg`
- **WHEN** the catalog generator resolves the image
- **THEN** it selects `ART001_CAT01_a.jpg` (alphabetically first)

### Requirement: Non-CAT01 _cat variants are fallback
The catalog generator SHALL select a non-`_CAT01` `_cat` suffixed file when no `_CAT01` exists.

#### Scenario: _CAT02 exists without _CAT01
- **GIVEN** an artwork has `ART001_CAT02.jpg` and `ART001.jpg` but no `_CAT01`
- **WHEN** the catalog generator resolves the image
- **THEN** it selects `ART001_CAT02.jpg`

### Requirement: Base image is last-resort fallback
The catalog generator SHALL select a base image (no `_cat` suffix) when no `_cat` suffixed files exist.

#### Scenario: Only base image exists
- **GIVEN** an artwork has only `ART001.jpg` in the Drive folder
- **WHEN** the catalog generator resolves the image
- **THEN** it selects `ART001.jpg`

### Requirement: Error when no images found
The catalog generator SHALL fall back to the spreadsheet `image_main` when no `_cat` file matches an artwork in the manifest.

#### Scenario: No _cat files match an artwork
- **GIVEN** the manifest exists but no `_cat` files match the current artwork
- **WHEN** the catalog generator resolves the image
- **THEN** it uses the `image_main` URL from the spreadsheet row

#### Scenario: No _cat files in manifest at all
- **GIVEN** the manifest is empty (no `_cat` files in the Drive folder)
- **WHEN** the catalog generator resolves the image
- **THEN** it uses the `image_main` URL from the spreadsheet row for every artwork
