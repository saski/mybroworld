# Implementation Plan: Artwork Submission History Across Google Sheets And WooCommerce

## Overview

Add a dedicated field for “concursos y convocatorias a las que presenté la obra” to the canonical artwork spreadsheet first, validate that data shape with the client, and only then introduce the same field into the owned WooCommerce codebase. The recommended implementation is a single optional text field named `submission_history`, appended to the Google Sheet as a new column and later mapped to one WooCommerce product meta field.

## Current State

- The operational spreadsheet is `https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/edit` and the working tab is `Sheet1` (`gid=102593401`).
- `Sheet1` currently contains normalized artwork columns such as `artwork_id`, `notes_raw`, `status_normalized`, `location_clean`, and `catalog_notes_public`, but no dedicated field for contests/open calls/submissions.
- Historical context is currently mixed into `notes_raw`, for example:
  - `Residencia Escala House 07.01/20.02 / El Grifo`
  - `El Grifo / GBK Dusseldorf /`
- The local catalog source mirror in the repo is [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv).
- The PDF generator in [catalog-generator/src/generate.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/generate.mjs) parses CSV by header name, so adding a new column does not require column-order-sensitive changes.
- The shared artwork contract in [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md) does not yet define a submissions field.
- The WooCommerce owned code currently includes only baseline artwork helpers in [wordpress/wp-content/mu-plugins/lucia-artwork-rules.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-artwork-rules.php); no product meta field or admin UI for artwork submissions exists yet.

## Desired End State

- `Sheet1` includes a dedicated optional column `submission_history` for artwork submission history.
- The client validates the spreadsheet field and initial populated values before any WordPress changes begin.
- The shared artwork contract documents `submission_history` clearly enough that sheet, CSV exports, and WooCommerce use the same meaning.
- WooCommerce later stores the same information as a single owned meta field on artwork products and exposes it through the chosen admin/display surface.
- Existing fields such as `notes_raw`, `location_clean`, and catalog behavior remain stable unless a later approved cleanup phase explicitly refactors them.

## Out Of Scope

- Changing the visual PDF catalog output to display submission history in this pass.
- Replacing `notes_raw` with a fully normalized event model.
- Building a bi-directional sync pipeline between Google Sheets and WooCommerce in this pass.
- Migrating historical free-text notes into multiple structured relational tables.
- Editing production WooCommerce data before the spreadsheet shape is validated by the client.

## Recommended Approach

### Option A: Single Optional Text Field `submission_history`

Pros:
- Smallest change across sheet, CSV export, and WooCommerce.
- Matches the current spreadsheet style of pragmatic text fields.
- Lets the client validate the concept quickly.
- Avoids premature modeling of contests, open calls, results, and dates as separate entities.

Cons:
- Less structured for future reporting.
- Requires a formatting convention inside one field.

### Option B: Structured Submission Model

Pros:
- Better for future filtering, reporting, and automation.
- Clearer distinction between call name, year, result, and notes.

Cons:
- Over-designed for the current request.
- Requires multiple columns or a separate table plus import logic.
- Raises migration and UI complexity in WooCommerce immediately.

### Recommendation

Choose Option A now.

Implementation decisions:
- Use the canonical field name `submission_history` in technical artifacts.
- Append the new spreadsheet column at the end of `Sheet1` rather than inserting it in the middle. This minimizes risk to existing column references, hidden automation tabs, and manual workflows.
- Treat the value as optional free text with a simple delimiter convention: separate distinct submissions with `; ` inside the cell.
- Keep `notes_raw` unchanged during the first spreadsheet rollout. Do not combine the new field with notes cleanup in the same pass.

## Field Definition

| Field | Type | Required | Example | Notes |
|---|---|---|---|---|
| `submission_history` | string | no | `GBK Dusseldorf 2026; Fanzimad 2026` | Optional public/internal submission history for the artwork. Use `; ` as the separator between entries. |

Formatting rules:
- One artwork can have zero or more submissions.
- Store all entries in one cell separated by `; `.
- Preserve human-readable event names.
- Include year when known.
- Do not encode outcomes or prize details in a machine-oriented mini-language yet.

## Phase Plan

## Phase 1: Define The Spreadsheet Contract And Safe Column Placement
Objective: document the new field before editing data so the spreadsheet, exports, and later WooCommerce work from the same definition.

Tasks:
- Update [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md) to add `submission_history` as an optional canonical artwork field.
- Record that the initial implementation is a single text field, not a normalized submission model.
- Record that the spreadsheet column must be appended at the end of `Sheet1`.
- Confirm that the catalog generator does not need logic changes just to tolerate an additional exported column.

Expected file modifications:
- [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md)
- This plan file for phase tracking: [thoughts/shared/plans/2026-04-19-artwork-submission-history-plan.md](/Users/nacho/saski/mybroworld/thoughts/shared/plans/2026-04-19-artwork-submission-history-plan.md)

Automated success criteria:
- `rg -n "submission_history" docs/artwork-data-contract.md`
- `rg -n "columns: true" catalog-generator/src/generate.mjs`

## Phase 2: Add The New Column To Google Sheets Without Disturbing Existing Data
Objective: introduce the dedicated field in the source spreadsheet with the lowest possible risk.

Tasks:
- Append a new header cell `submission_history` at the end of `Sheet1`.
- Leave all existing columns in place, especially `notes_raw`, `status_normalized`, `location_clean`, and `catalog_notes_public`.
- Do not repurpose `notes_raw` in the same phase.
- If needed, freeze or format the new header consistently with the existing header row.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)

Automated success criteria:
- Exported header contains `submission_history`:
  - `curl -L "https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" | head -n 1`
- Sample exported rows still retain existing headers:
  - `curl -L "https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" | head -n 3`

## Phase 3: Backfill And Validate Submission Data In The Spreadsheet
Objective: populate the new field only for artworks where submission history is known, then validate the values with the client before any WordPress work.

Tasks:
- Backfill `submission_history` from known cases currently embedded in `notes_raw` or provided by the client.
- Prefer moving only contest/open-call history into `submission_history`; leave location, sale, gift, and residency context in `notes_raw` for now.
- Review rows that mention examples such as `GBK Dusseldorf` and `Fanzimad 2026` first.
- Validate a small sample set with the client before large-scale cleanup.
- After validation, optionally backfill more rows, but keep note cleanup out of scope unless explicitly approved.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)
- Local mirror update after approval: [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv)

Automated success criteria:
- Search exported CSV for the new field values:
  - `curl -L "https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" | rg "GBK Dusseldorf|Fanzimad|submission_history"`
- Local mirror can be refreshed and still parse:
  - `cd catalog-generator && npm run generate -- --input data/CATALOGO_BASE.csv --output output/catalogo.pdf`

## Phase 4: Lock The Post-Validation Repository Contract
Objective: update the repo artifacts that define or tolerate the new field after the spreadsheet is approved.

Tasks:
- Refresh [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv) from the validated spreadsheet export.
- Confirm whether [catalog-generator/README.md](/Users/nacho/saski/mybroworld/catalog-generator/README.md) should list `submission_history` as an optional accepted field.
- Keep [catalog-generator/src/generate.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/generate.mjs) unchanged unless a future catalog display requirement needs the field.
- Update [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md) if the client-approved wording changes during spreadsheet validation.

Expected file modifications:
- [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv)
- [catalog-generator/README.md](/Users/nacho/saski/mybroworld/catalog-generator/README.md)
- [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md)

Automated success criteria:
- `cd catalog-generator && npm run generate -- --input data/CATALOGO_BASE.csv --output output/catalogo.pdf`
- `rg -n "submission_history" docs/artwork-data-contract.md catalog-generator/README.md catalog-generator/data/CATALOGO_BASE.csv`

## Phase 5: Introduce The Field Into WooCommerce After Spreadsheet Approval
Objective: add one owned WooCommerce meta field that matches the validated spreadsheet contract.

Tasks:
- Add a canonical meta key, recommended name `_lucia_submission_history`, in the owned WordPress layer.
- Decide the minimum owned implementation surface:
  - admin save/read helpers in a `mu-plugin`
  - optional storefront rendering only if requested after data validation
- Extend [wordpress/wp-content/mu-plugins/lucia-artwork-rules.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-artwork-rules.php) or a new owned helper file if the field needs formatting helpers.
- Update [wordpress/wp-content/mu-plugins/lucia-bootstrap.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-bootstrap.php) to load any new helper file if needed.
- Keep transport/import logic separate from field registration so the field can be tested safely before sync work.

Expected file modifications:
- [wordpress/wp-content/mu-plugins/lucia-artwork-rules.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-artwork-rules.php)
- [wordpress/wp-content/mu-plugins/lucia-bootstrap.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-bootstrap.php)
- Possible new file if the field handling grows beyond the current helpers:
  - [wordpress/wp-content/mu-plugins/lucia-artwork-meta.php](/Users/nacho/saski/mybroworld/wordpress/wp-content/mu-plugins/lucia-artwork-meta.php)
- [docs/artwork-data-contract.md](/Users/nacho/saski/mybroworld/docs/artwork-data-contract.md)

Automated success criteria:
- `php -l wordpress/wp-content/mu-plugins/lucia-artwork-rules.php`
- `php -l wordpress/wp-content/mu-plugins/lucia-bootstrap.php`
- If a new file is added: `php -l wordpress/wp-content/mu-plugins/lucia-artwork-meta.php`
- `rg -n "submission_history|_lucia_submission_history" wordpress/wp-content/mu-plugins docs/artwork-data-contract.md`

## Phase 6: Add A One-Way Import Step Only After The WooCommerce Field Exists
Objective: define a safe path from validated spreadsheet data into WooCommerce without coupling field creation to sync automation.

Tasks:
- Choose a one-way import mechanism only after Phase 5 is complete:
  - manual admin entry for a small initial batch
  - WP-CLI/import script if shell access becomes available
  - controlled CSV import mapping if the hosting workflow supports it
- Map spreadsheet `submission_history` to WooCommerce `_lucia_submission_history`.
- Test on a small sample of products before bulk rollout.
- Document the chosen import path in repo docs if it becomes part of the maintained workflow.

Expected file modifications:
- Possible new implementation doc:
  - [docs/woocommerce-submission-history-import.md](/Users/nacho/saski/mybroworld/docs/woocommerce-submission-history-import.md)
- Possible import helper script if later approved:
  - [scripts/](/Users/nacho/saski/mybroworld/scripts)

Automated success criteria:
- If a script is introduced, it must have a concrete verification command recorded in the implementation PR or follow-up plan.
- `rg -n "submission_history|_lucia_submission_history" docs wordpress scripts`

## Risks And Mitigations

- Risk: adding the new column in the middle of the sheet breaks hidden references or external workflows.
  - Mitigation: append the column at the far right of `Sheet1`.
- Risk: submission data remains mixed with unrelated historical notes.
  - Mitigation: keep `notes_raw` stable and backfill `submission_history` incrementally instead of trying to clean all notes at once.
- Risk: WooCommerce work starts before the client validates the field meaning.
  - Mitigation: enforce a hard gate between spreadsheet validation and WordPress implementation.
- Risk: the field later needs more structure than one text cell allows.
  - Mitigation: keep the first version as a canonical raw text field and only normalize later if repeated use cases justify it.

## Phase List

1. Define the spreadsheet contract and safe column placement.
2. Add the new column to Google Sheets.
3. Backfill and validate submission data in the spreadsheet.
4. Lock the post-validation repository contract.
5. Introduce the field into WooCommerce.
6. Add a one-way import step after the WooCommerce field exists.

## Progress Tracking

- [x] Phase 1: Define the spreadsheet contract and safe column placement
- [x] Phase 2: Add the new column to Google Sheets
- [ ] Phase 3: Backfill and validate submission data in the spreadsheet
- [ ] Phase 4: Lock the post-validation repository contract
- [ ] Phase 5: Introduce the field into WooCommerce
- [ ] Phase 6: Add a one-way import step after the WooCommerce field exists

## Next Step

`fic-implement-plan thoughts/shared/plans/2026-04-19-artwork-submission-history-plan.md`
