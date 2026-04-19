# Project Criteria

Use this file to accumulate reusable MyBroworld spreadsheet review criteria discovered during real work. Keep entries short, concrete, and evidence-based.

## Current Criteria

### Deterministic fills

- Extract `image_id_manual` from a stable Drive file URL in `image_main`.
- Normalize `dimensions_clean` from `dimensions_raw` when the raw cell already contains the full dimensional data.
- Fill `location_clean` from notes only when the mapping is explicit in the notes and already evidenced by comparable rows.
- Fill `series_name` only when the series is explicit from a repeated title stem already evidenced across multiple rows.
- Example: `Perrete en tablillas 01` through `Perrete en tablillas 05` should use `series_name = Perrete en tablillas`.

### Ambiguity handling

- When both `dimensions_raw` and `dimensions_clean` are blank, treat the issue as unresolved and flag the cells for review rather than guessing from nearby rows.
- Multi-price raw values are not automatically safe to normalize into one canonical price unless the row or the sheet makes the intended value explicit.

### Review behavior

- Distinguish between a missing value and an inconsistent value. The reviewer must handle both.
- Do not expand project rules from a single anecdotal row unless the user explicitly states it is a recurring criterion.
- Do not assume the canonical catalog data lives in one fixed tab name. Multi-year workbooks may expose one canonical tab per year, such as `2026`, `2025`, or `2024`, with the same header contract.
- For integrations or review passes, identify in-scope tabs by canonical headers and explicit year selection, not by hardcoded names like `Sheet1`.
- Example: a catalog-generation action should accept the current tab, a selected set of yearly tabs, or explicit `gid` values instead of hardcoding `Sheet1` or `2026`.
- Treat range-backed enum fields such as `status_normalized` as shared contract fields. When a new canonical value is approved, update the hidden validation list, header note, and matching conditional-format rules together.
- Example: when `reserved` is added to `status_normalized`, extend `validation_lists`, update the `status_normalized` header note, and add the corresponding status color rule in column `I`.
- In normalized output columns, remove manual fill colors that do not correspond to a documented review state or conditional-format rule.
- Example: if `medium_clean` contains ad hoc green fills in some rows but the column has no conditional formatting and no documented color meaning, reset those cells to the neutral background.
- Legacy ad hoc orange or green fills are not canonical review colors. Keep only documented conditional-format colors and the standard unresolved-review light red when the issue still exists.
- Example: if `notes_raw`, `dimensions_clean`, `catalog_blocker`, or `price_eur` keep an old orange highlight after the underlying review point has been resolved or the column has no color rule, reset the cell to the neutral background.

### Manual review behavior

- When deterministic cleanup is not enough, convert unresolved issues into a cooperative review queue with one active focus item at a time.
- Each review turn should identify the exact cell, explain the problem briefly, show the evidence, and ask for one decision only.
- Prefer short, voice-friendly turns so the same workflow can be used in text chat or spoken back-and-forth.
- Group adjacent cells only when they depend on the same judgment. Otherwise, advance cell by cell.
- After each approved decision, write the change, confirm it, and move the focus to the next issue.

### Documentation behavior

- When a sheet needs persistent end-user guidance about what each field expects, document the header cells with notes rather than discussion comments.
- Example: add a Spanish note on each column header describing the purpose of the field and the expected value format.
- When the catalog needs to distinguish standalone artworks from artworks in a series, add a dedicated optional field such as `series_name` instead of encoding the series only inside the title.
- Example: keep `title_clean = Perrete en tablillas 03` and store the shared grouping separately as `series_name = Perrete en tablillas`.

## Update Rule

When a user gives a new reusable spreadsheet-review instruction for MyBroworld:

1. Add the rule here with a short rationale.
2. Add one concrete example if it clarifies the rule.
3. Update the reviewer skill if the new rule changes the workflow or judgment model.
