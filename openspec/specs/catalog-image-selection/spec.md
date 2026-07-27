## Purpose

Define deterministic image selection rules for the catalog generator so each artwork uses the correct product image from the Drive folder.

## Requirements

### Requirement: _CAT01 image has highest priority
The catalog generator SHALL select the image file with suffix `_CAT01` when it exists for an artwork.

#### Scenario: _CAT01 exists alongside other variants
- **GIVEN** an artwork has files `ART001_CAT01.jpg`, `ART001_CAT02.jpg`, and `ART001.jpg` in the Drive folder
- **WHEN** the catalog generator resolves the image for this artwork
- **THEN** it selects `ART001_CAT01.jpg`

#### Scenario: _CAT01 exists alone
- **GIVEN** an artwork has only `ART001_CAT01.jpg` in the Drive folder
- **WHEN** the catalog generator resolves the image for this artwork
- **THEN** it selects `ART001_CAT01.jpg`

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
The catalog generator SHALL throw an error with code `catalog_image_selection_blocked` when no image files match an artwork.

#### Scenario: No files match artwork
- **GIVEN** an artwork has no matching files in the Drive folder
- **WHEN** the catalog generator resolves the image
- **THEN** it throws an error indicating no image was found
