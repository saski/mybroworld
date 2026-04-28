# Implementation Plan: Canonical Catalog Sheet Polish For Lucía Astuy

## Overview

Polish the canonical Google Sheet `Lucía Astuy - CATALOGO_BASE` so it is practical for day-to-day editing while preserving its value as the normalized source for the catalog generator. The target state is a single canonical tab that keeps normalized fields, but surfaces the first columns in the same editing order as `Obra TODO - Lucía Astuy`, adds dropdown selectors for binary and fixed-set fields, and shows an in-cell thumbnail preview in the first column for quick visual recognition.

## Current State

- Source guidance sheet:
  - `Obra TODO - Lucía Astuy` → tab `2026` (`gid=1409079167`)
- Canonical target sheet:
  - `Lucía Astuy - CATALOGO_BASE` → tab `Sheet1` (`gid=102593401`)
- The old `2026` tab is optimized for human editing:
  - active leading columns are effectively `availability_flag_raw`, blank spacer/preview, `title_raw`, `date_label`, `dimensions_raw`, `medium_raw`, `price_raw`, `notes_raw`
  - column `A` already uses Google Sheets dropdown validation with `Si` / `No`
- The canonical `Sheet1` is optimized for machine-normalized data:
  - column `A` is currently empty and can be reused for a preview column
  - normalized fields start immediately after that empty column
  - enum and boolean columns currently store raw values directly, without dropdown validation
- Live canonical values already imply stable selector candidates:
  - `availability_flag_raw`: `Si`, `No`
  - `status_normalized`: `available`, `commissioned`, `exchanged`, `gifted`, `not_for_sale`, `sold`
  - `include_in_catalog`: `TRUE`, `FALSE`
  - `catalog_ready`: `TRUE`, `FALSE`
  - `location_clean` is mostly chosen from a small repeated set such as `El Grifo`, `Escala House`, `GBK Dusseldorf`, `Alejandra Glez`, `familia de Alejandra Glez`
- The catalog generator in [catalog-generator/src/generate.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/generate.mjs) parses CSV by header name with `columns: true`, so column reordering is low risk for repo code as long as canonical header names are preserved.
- The local CSV mirror in [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv) does not yet include the UI-only leading preview column present in the live sheet plan.

## Desired End State

- `Sheet1` remains the canonical sheet and keeps the normalized data contract intact.
- The first visible columns in `Sheet1` match the editing rhythm of the old sheet:
  - `preview`
  - `availability_flag_raw`
  - `title_raw`
  - `date_label`
  - `dimensions_raw`
  - `medium_raw`
  - `price_raw`
  - `notes_raw`
- The remaining canonical columns stay available to the right, including normalized and catalog-specific fields.
- The first column shows an in-cell thumbnail preview for each artwork derived from the stored Drive image identifier.
- Binary and fixed-set columns use dropdown selectors instead of free typing wherever the allowed values are stable enough to justify validation.
- CSV export from the canonical sheet still works with the existing catalog generator without code changes.

## Out Of Scope

- Rebuilding the catalog generator layout or PDF design.
- Renaming canonical field headers that are already consumed by the repo.
- Replacing all free-text fields with controlled vocabularies.
- Bulk cleanup of notes, medium normalization, or location normalization beyond dropdown enablement.
- WordPress or WooCommerce changes.
- Modifying the historical source tabs (`2023`, `2024`, `2025`, `2026`) beyond using them as reference.

## Design Options

### Option A: Reorder `Sheet1` Itself And Add Sheet-Native Editing Ergonomics

What it does:
- keeps one canonical tab
- moves the human-editing columns to the front
- adds a `preview` helper column in `A`
- applies dropdown rules directly on the canonical tab

Pros:
- Matches the user request exactly.
- No split between “editor view” and “real source”.
- Safer for day-to-day use because the editable fields appear first.
- Repo code remains stable because headers, not order, drive parsing.

Cons:
- Column order changes may affect external users who rely on muscle memory from the current canonical layout.
- Requires a careful rollback point before rearranging the tab.

### Option B: Keep `Sheet1` Machine-Oriented And Create A Separate Operator View Tab

What it does:
- leaves the canonical tab untouched
- adds a second tab with reordered columns, previews, and dropdowns

Pros:
- Lowest risk to the current canonical tab.
- Easier rollback if the editing experiment fails.

Cons:
- Conflicts with the request to make the canonical sheet itself easier to edit.
- Introduces ambiguity about which tab is authoritative.
- Increases maintenance because formulas and validation must stay aligned across tabs.

### Recommendation

Choose Option A.

Reasoning:
- The user explicitly wants the first columns of the canonical sheet to match the previous editing workflow.
- The existing repo integration is header-based, so column reordering is acceptable.
- `Sheet1` already has an empty leading column, which lowers the cost of introducing `preview`.

## Approach

### Layout Strategy

Reorder only the front of `Sheet1` so the editing-critical fields appear first, while the canonical normalized fields remain present to the right. The recommended target order is:

1. `preview`
2. `availability_flag_raw`
3. `title_raw`
4. `date_label`
5. `dimensions_raw`
6. `medium_raw`
7. `price_raw`
8. `notes_raw`
9. `status_normalized`
10. `location_clean`
11. `include_in_catalog`
12. `catalog_ready`
13. `catalog_blocker`
14. `catalog_notes_public`
15. `submission_history`
16. `image_main`
17. `image_id_manual`
18. `source_year`
19. `source_row`
20. `artwork_id`
21. `title_clean`
22. `year`
23. `dimensions_clean`
24. `medium_clean`
25. `support_clean`
26. `price_eur`
27. `price_display_clean`

This preserves all current canonical fields while putting the editing columns first.

### Preview Strategy

Use an in-cell image formula in the new `preview` column rather than floating images:

- derive the image from `image_id_manual`
- generate the preview URL using the same Drive URL pattern already normalized in [catalog-generator/src/generate.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/generate.mjs)
- prefer a row formula such as `=IF(image_id_manual_cell=\"\",\"\",IMAGE(\"https://lh3.googleusercontent.com/d/\"&image_id_manual_cell,1))`

This keeps the thumbnails tied to the row data and avoids manual image placement.

### Validation Strategy

Use dropdown selectors for stable-value columns.

Recommended validation shape:
- `availability_flag_raw`: inline dropdown `Si`, `No`
- `status_normalized`: range-backed dropdown using the full canonical enum from [thoughts/shared/docs/artwork-data-contract.md](../docs/artwork-data-contract.md)
- `include_in_catalog`: inline dropdown `TRUE`, `FALSE`
- `catalog_ready`: inline dropdown `TRUE`, `FALSE`
- `location_clean`: range-backed dropdown from a helper list, but allow warnings instead of rejection if a genuinely new location is entered

Recommended implementation detail:
- create a hidden helper tab such as `validation_lists`
- store each reusable option list in its own column
- drive `status_normalized` and `location_clean` from ranges instead of hard-coded per-column lists

This keeps the UI maintainable when new statuses or locations are introduced.

## Phased Changes

## Phase 1: Snapshot And Confirm The Target Canonical Layout
Objective: establish a safe rollback point and lock the exact front-column order before changing validation or formulas.

Tasks:
- Duplicate the current `Sheet1` into a dated backup before modifying the canonical tab.
- Record the target front-column order inside the implementation artifact.
- Confirm that `preview` is a UI helper column and not part of the canonical repo contract.
- Confirm that all existing canonical field headers are preserved exactly.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)
- Backup copy of the current `Sheet1`
- This plan file: [thoughts/shared/plans/2026-04-19-canonical-catalog-sheet-polish-plan.md](/Users/nacho/saski/mybroworld/thoughts/shared/plans/2026-04-19-canonical-catalog-sheet-polish-plan.md)

Automated success criteria:
- Google Drive Sheets metadata shows the original `Sheet1` still exists and a backup copy was created.
- `_get_spreadsheet_range` on `Sheet1!A1:AA2` confirms the preserved canonical header names after reordering.

## Phase 2: Reorder `Sheet1` So The Editing Columns Match The Old Workflow
Objective: make the canonical sheet immediately usable by moving the human-editing fields to the front.

Tasks:
- Rename the empty leading column `A` to `preview`.
- Move `availability_flag_raw`, `title_raw`, `date_label`, `dimensions_raw`, `medium_raw`, `price_raw`, and `notes_raw` directly behind `preview`.
- Move edit-critical status and catalog controls next, followed by technical and normalized fields.
- Freeze the header row and the leading editing columns if that improves usability.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)

Automated success criteria:
- `_get_spreadsheet_range` on `Sheet1!A1:O3` returns the expected leading header order.
- CSV export header still contains all canonical field names needed by the generator:
  - `curl -L "https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" | head -n 1`

## Phase 3: Add The Preview Thumbnail Column
Objective: embed a fast visual thumbnail in each row without changing the canonical image source fields.

Tasks:
- Populate `preview` with an `IMAGE(...)` row formula derived from `image_id_manual`.
- Size rows and the `preview` column so thumbnails are visible but compact.
- Keep `image_main` and `image_id_manual` as the authoritative underlying image data fields.
- Leave the preview blank when no image identifier is present.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)

Automated success criteria:
- `_get_spreadsheet_cells` on `Sheet1!A2:A10` with `userEnteredValue,formattedValue` returns formula values in populated rows.
- `_get_spreadsheet_range` on `Sheet1!A1:C5` shows the `preview` header and the adjacent human-editing columns in place.
- CSV export remains parseable by the existing generator:
  - `cd /Users/nacho/saski/mybroworld/catalog-generator && GOOGLE_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" npm run generate -- --output output/catalogo.pdf`

## Phase 4: Add Dropdown Validation For Binary And Fixed-Set Fields
Objective: reduce typing mistakes and make editing behave like the old sheet, but across all stable-value columns.

Tasks:
- Apply `Si` / `No` dropdown validation to `availability_flag_raw`.
- Apply `TRUE` / `FALSE` dropdown validation to `include_in_catalog` and `catalog_ready`.
- Apply canonical enum dropdown validation to `status_normalized`.
- Add a hidden `validation_lists` tab and use it to back `status_normalized` and `location_clean`.
- Configure `location_clean` to show a warning, not reject input, so new valid locations can still be entered before the list is updated.
- Use Google Sheets dropdown chip UI rather than plain text validation.

Expected modifications:
- Google Sheet: `Lucía Astuy - CATALOGO_BASE` → `Sheet1` (`gid=102593401`)
- Google Sheet: new hidden helper tab `validation_lists`

Automated success criteria:
- `_get_spreadsheet_cells` on `Sheet1!B2:B20` shows `ONE_OF_LIST` or range-backed validation for `availability_flag_raw`.
- `_get_spreadsheet_cells` on the `status_normalized`, `include_in_catalog`, and `catalog_ready` columns shows validation rules for populated rows.
- `_get_spreadsheet_range` on `validation_lists!A1:D20` returns the seeded option lists.

## Phase 5: Verify Export Compatibility And Refresh The Local Mirror
Objective: confirm that sheet ergonomics did not break downstream catalog generation.

Tasks:
- Export the updated canonical tab to CSV.
- Refresh [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv) from the polished canonical sheet once the layout is accepted.
- Verify that the catalog generator still renders from the refreshed CSV without code changes.
- Update docs only if the refreshed workflow now depends on UI helper columns being present in exports.

Expected modifications:
- [catalog-generator/data/CATALOGO_BASE.csv](/Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv)
- Possible clarification in [catalog-generator/README.md](/Users/nacho/saski/mybroworld/catalog-generator/README.md)
- Possible clarification in [thoughts/shared/docs/artwork-data-contract.md](../docs/artwork-data-contract.md)

Automated success criteria:
- `cd /Users/nacho/saski/mybroworld/catalog-generator && GOOGLE_SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw/export?format=csv&gid=102593401" npm run generate -- --output output/catalogo.pdf`
- `rg -n "preview|submission_history|status_normalized|include_in_catalog|catalog_ready" /Users/nacho/saski/mybroworld/catalog-generator/data/CATALOGO_BASE.csv`
- If docs are updated:
  - `rg -n "preview|dropdown|validation|sheet" catalog-generator/README.md thoughts/shared/docs/artwork-data-contract.md`

## Risks And Mitigations

- Risk: column reordering breaks an unseen sheet automation.
  - Mitigation: create a backup copy before editing and verify CSV export plus generator output immediately after reordering.
- Risk: preview formulas depend on an image URL pattern that works in the catalog generator but not in Google Sheets images.
  - Mitigation: validate the formula on 3 to 5 sample rows before rolling it down the full column.
- Risk: dropdown validation becomes too strict for `location_clean`.
  - Mitigation: use warning mode for locations and reject mode only for truly fixed enums and booleans.
- Risk: the UI helper `preview` column gets mistaken for canonical business data.
  - Mitigation: document it as a sheet-only helper column and keep it out of the repo data contract unless downstream tooling starts depending on it.

## Phase List

1. Snapshot and confirm the target canonical layout.
2. Reorder `Sheet1` so the editing columns match the old workflow.
3. Add the preview thumbnail column.
4. Add dropdown validation for binary and fixed-set fields.
5. Verify export compatibility and refresh the local mirror.

## Implementation Progress

- [x] Phase 1 completed on 2026-04-19.
- [x] Phase 2 completed on 2026-04-19.
- [x] Phase 3 completed on 2026-04-19.
- [x] Phase 4 completed on 2026-04-19.
- [x] Phase 5 completed on 2026-04-19.

### Phase 1 Notes

- Backup created as `Lucía Astuy - CATALOGO_BASE - Sheet1 backup 2026-04-19`.
- Backup spreadsheet id: `1qtO9EnsiLMoVKd-AkVZ_VpS7_knSMmBzvul6AWGjphI`.
- Backup sheet name: `Sheet1 backup 2026-04-19`.
- Verified that live `Sheet1` still exists with sheet id `102593401`.
- Confirmed `preview` remains a sheet-only helper column and not part of the repo data contract.
- Confirmed existing canonical repo-consumed headers remain unchanged before reordering:
  - `source_year`
  - `source_row`
  - `artwork_id`
  - `title_raw`
  - `title_clean`
  - `date_label`
  - `year`
  - `dimensions_raw`
  - `dimensions_clean`
  - `medium_raw`
  - `medium_clean`
  - `support_clean`
  - `price_raw`
  - `price_eur`
  - `price_display_clean`
  - `availability_flag_raw`
  - `notes_raw`
  - `status_normalized`
  - `location_clean`
  - `include_in_catalog`
  - `catalog_ready`
  - `catalog_blocker`
  - `image_main`
  - `image_id_manual`
  - `catalog_notes_public`
  - `submission_history`

### Phase 2 Notes

- Renamed column `A` header from blank to `preview`.
- Reordered `Sheet1` so the first visible columns now match the requested editing flow.
- Frozen the header row for easier day-to-day editing.
- Verified `Sheet1!A1:O3` now starts with:
  - `preview`
  - `availability_flag_raw`
  - `title_raw`
  - `date_label`
  - `dimensions_raw`
  - `medium_raw`
  - `price_raw`
  - `notes_raw`
  - `status_normalized`
  - `location_clean`
  - `include_in_catalog`
  - `catalog_ready`
  - `catalog_blocker`
  - `catalog_notes_public`
  - `submission_history`
- Verified CSV export header still contains the full canonical header set needed by the catalog generator.

### Phase 3 Notes

- Tested the preview formula on sample rows first before rolling it down the full populated range.
- Initial formula attempt failed because the spreadsheet locale is `es_ES` and required semicolon argument separators.
- Final row formula applied in `Sheet1!A2:A21`:
  - `=IF($Q2="";"";IMAGE("https://lh3.googleusercontent.com/d/"&$Q2;1))`
- Resized the `preview` column to `120px`.
- Resized populated artwork rows to `96px` so thumbnails stay compact but visible.
- Verified `Sheet1!A2:A10` contains live formula values without parse errors.
- Verified the catalog generator still renders from the canonical sheet export.

### Phase 4 Notes

- Added hidden helper tab `validation_lists` with sheet id `20260419`.
- Seeded reusable dropdown sources for:
  - `availability_flag_raw`
  - `status_normalized`
  - boolean `TRUE` / `FALSE`
  - `location_clean`
- Applied dropdown chip validation to:
  - `availability_flag_raw`
  - `status_normalized`
  - `include_in_catalog`
  - `catalog_ready`
  - `location_clean`
- Configured `location_clean` with warning-only validation so new valid locations can still be entered before the helper list is updated.
- Verified validation rules are present on `Sheet1!B2:B20` and `Sheet1!I2:L20`.
- Verified helper values in `validation_lists!A1:D20`.

### Phase 5 Notes

- Refreshed `catalog-generator/data/CATALOGO_BASE.csv` from the live canonical sheet export after the sheet polish completed.
- Restored `Sheet1!A1` to `preview` after catching an export regression where the helper header had drifted back to blank.
- Verified the refreshed local mirror contains:
  - `preview`
  - `submission_history`
  - `status_normalized`
  - `include_in_catalog`
  - `catalog_ready`
- Updated `thoughts/shared/docs/artwork-data-contract.md` so it reflects the new header-based contract and the sheet-only `preview` helper column.
- Verified final catalog generation from the live canonical export succeeds with no generator code changes.

## Next Step

`fic-implement-plan thoughts/shared/plans/2026-04-19-canonical-catalog-sheet-polish-plan.md`
