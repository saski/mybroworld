# luciastuy-portfolio-cpt-ownership Specification

## Purpose
The owned `luciastuy` runtime SHALL register and manage the `portfolio` custom post type and its associated metadata without depending on Advanced Custom Fields PRO or any other third-party plugin.

## Requirements

### Requirement: Portfolio custom post type is owned
The owned WordPress layer SHALL register the `portfolio` custom post type on `init` with public visibility, REST exposure, and the supports needed for catalog item rendering.

#### Scenario: Portfolio post type is available without ACF
- **GIVEN** ACF PRO is deactivated or absent
- **WHEN** WordPress initializes
- **THEN** the `portfolio` post type is registered with slug `/portfolio/{slug}`
- **AND** `show_in_rest` is true
- **AND** the post type supports `title`, `editor`, `thumbnail`, `page-attributes`, and `custom-fields`

### Requirement: Portfolio metadata keys are registered
The owned WordPress layer SHALL register the 10 metadata keys used by the `luciastuy` theme for portfolio item rendering via `register_post_meta()`.

#### Scenario: Meta keys are available in REST and admin
- **GIVEN** the `portfolio` post type is registered
- **WHEN** a REST API request reads a portfolio item
- **THEN** the response includes `visible_details`, `author_title`, `author`, `client_name_title`, `client_name`, `project_date_title`, `project_date`, `project_location_title`, `project_location`, and `gallery_projects`
- **AND** each key is single-value and exposed in REST

#### Scenario: Gallery meta accepts comma-separated IDs
- **GIVEN** a portfolio item is saved with `gallery_projects` set to `2379,2380,2381`
- **WHEN** the meta is read back
- **THEN** the value is a normalized comma-separated string of unique positive attachment IDs

### Requirement: Portfolio meta box replaces ACF field group
The owned WordPress layer SHALL provide a meta box UI for editing the 10 portfolio metadata fields in the WordPress admin post editor.

#### Scenario: Meta box is visible when editing a portfolio item
- **GIVEN** an operator opens the edit screen for a `portfolio` post
- **WHEN** the editor renders
- **THEN** a "Portfolio Details" meta box is visible in the normal location
- **AND** it contains fields for all 10 metadata keys
- **AND** the `visible_details` field is a select with `show` and empty options

#### Scenario: Meta box saves with nonce protection
- **GIVEN** an operator saves a portfolio item
- **WHEN** the save handler runs
- **THEN** a nonce is verified before any meta is written
- **AND** autosave is skipped
- **AND** the user has `edit_post` capability for the item

### Requirement: Existing portfolio data survives ACF deactivation
The owned `luciastuy` theme SHALL read portfolio metadata via `get_post_meta()` so that data created under ACF remains accessible after ACF is deactivated.

#### Scenario: Portfolio item renders with legacy meta
- **GIVEN** ACF PRO is deactivated and a portfolio item has existing `wp_postmeta` rows
- **WHEN** a visitor opens `/portfolio/{slug}`
- **THEN** the page renders with title, metadata rows, gallery images, and navigation
- **AND** no PHP fatal error or missing-field crash occurs
