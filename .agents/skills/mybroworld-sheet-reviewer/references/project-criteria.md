# Project Criteria

Use this file to accumulate reusable MyBroworld spreadsheet review criteria discovered during real work. Keep entries short, concrete, and evidence-based.

## Current Criteria

### Deterministic fills

- Extract `image_id_manual` from a stable Drive file URL in `image_main`.
- Fill `preview` with an in-cell image formula derived from `image_id_manual` on every populated canonical year-tab row. The formula should stay blank when `image_id_manual` is blank.
- Example: in an `es_ES` spreadsheet where `image_id_manual` is column `R`, row 24 uses `=IF($R24="";"";IMAGE("https://lh3.googleusercontent.com/d/"&$R24;1))`.
- Normalize `dimensions_clean` from `dimensions_raw` when the raw cell already contains the full dimensional data.
- Fill `location_clean` from notes only when the mapping is explicit in the notes and already evidenced by comparable rows.
- Keep `location_clean` for the current location only. When the row needs to preserve previous stops as well, add and fill a dedicated `location_history` field instead of storing multiple values in `location_clean`.
- Fill `series_name` only when the series is explicit from a repeated title stem already evidenced across multiple rows.
- Example: `Perrete en tablillas 01` through `Perrete en tablillas 05` should use `series_name = Perrete en tablillas`.
- Example: repeated stems such as `Flor de La Mancha #1` through `Flor de La Mancha #9`, `Mapa del tesoro #1` through `Mapa del tesoro #6`, `Apenas existe #01` through `Apenas existe #24`, and `Silent block Tale #1` through `Silent block Tale #6` should fill `series_name` with the shared stem.
- Split English medium/support text only when the grammar is as explicit as the Spanish `sobre` pattern and a consistent normalized equivalent is evidenced by the sheet.
- Example: `Mixed media collage on wood.` in the `Silent block Tale` rows can normalize to `medium_clean = Collage de técnicas mixtas` and `support_clean = madera` because the same series already contains `Collage de técnicas mixtas sobre madera`.
- Treat explicit destroyed or recycled wording as an archived status when `status_normalized` is blank.
- Example: a row titled `Heart of Gold (DESTRUIDO/RECICLADO)` with notes ending in `Destruido-reciclado` should use `status_normalized = archived`.
- Example: if a row says `Residencia Escala House 07.01/20.02 / El Grifo / Vendido a Juan Roller`, keep `location_clean = Juan Roller` and store `location_history = Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller`.

### Ambiguity handling

- When both `dimensions_raw` and `dimensions_clean` are blank, treat the issue as unresolved and flag the cells for review rather than guessing from nearby rows.
- Multi-price raw values are not automatically safe to normalize into one canonical price unless the row or the sheet makes the intended value explicit.
- Header notes define field purpose and allowed value shapes, but they do not by themselves supply row-level decisions. Do not fill a blank field only because its header note lists allowed values.
- Example: `include_in_catalog` expects `TRUE` or `FALSE`, but a blank historical row remains an editorial decision unless the source explicitly says whether that artwork should be considered for the catalog.
- If notes mention `Colección personal` and the workbook has not settled whether that should normalize to `personal_collection` or the existing historical `not_for_sale` pattern, leave blank statuses unresolved instead of silently choosing one.
- Location-route parsing must not split dates such as `22/07/2024`, `05/2024`, or `02/01/26 - 20/02/26` as if each slash were a location separator.

### Review behavior

- Distinguish between a missing value and an inconsistent value. The reviewer must handle both.
- Treat commerce inventory parity as part of catalog data quality. When a task involves WooCommerce inventory, compare canonical sheet rows, generated catalog scope, and WooCommerce products before recommending or applying product writes.
- Example: if the sheet contains `LA-2026-002` with `title_clean = Perrete en tablillas 01` but local WooCommerce only contains demo products such as `Armchair`, report `LA-2026-002` as missing from WooCommerce and `Armchair` as unexpected instead of treating the systems as synced.
- WooCommerce inventory scope is all canonical sheet artworks, not only `include_in_catalog` or `catalog_ready` rows. `status_normalized` should control storefront visibility and purchasability.
- Example: an `available` row should be visible and purchasable, a `sold` row should remain visible but not purchasable, and an `archived` row should remain in WooCommerce but be hidden and not purchasable.
- Do not expand project rules from a single anecdotal row unless the user explicitly states it is a recurring criterion.
- Do not assume the canonical catalog data lives in one fixed tab name. Multi-year workbooks may expose one canonical tab per year, such as `2026`, `2025`, or `2024`, with the same header contract.
- For integrations or review passes, identify in-scope tabs by canonical headers and explicit year selection, not by hardcoded names like `Sheet1`.
- Example: a catalog-generation action should accept the current tab, a selected set of yearly tabs, or explicit `gid` values instead of hardcoding `Sheet1` or `2026`.
- When importing legacy year tabs into the consolidated catalog workbook, inspect whether the source tab actually has canonical headers before using row 1 as headers. If the source year tab is positional legacy data, row 1 is artwork data and must be imported.
- Example: the original `2023`, `2024`, and `2025` tabs in `Obra TODO - Lucia Astuy` are positional artwork rows, not canonical-header tables; import their non-empty artwork rows into year tabs that use the consolidated `2026` header contract.
- For legacy image imports, use the corresponding Drive year folder and deterministic evidence from filename/title or a row-number prefix. Missing or ambiguous matches should remain blank and be marked in `catalog_blocker`.
- Example: if a 2023 artwork title has no deterministic image match in the `2023` Drive folder, leave `image_main` and `image_id_manual` blank and mark `Missing deterministic image match.` instead of choosing a nearby filename.
- When importing historical rows, do not infer `include_in_catalog` from the legacy availability flag or normalized status. Leave the editorial inclusion gate unset unless the source explicitly provides that decision.
- Treat range-backed enum fields such as `status_normalized` as shared contract fields. When a new canonical value is approved, update the hidden validation list, header note, and matching conditional-format rules together.
- Example: when `reserved` is added to `status_normalized`, extend `validation_lists`, update the `status_normalized` header note, and add the corresponding status color rule in column `I`.
- In normalized output columns, remove manual fill colors that do not correspond to a documented review state or conditional-format rule.
- Example: if `medium_clean` contains ad hoc green fills in some rows but the column has no conditional formatting and no documented color meaning, reset those cells to the neutral background.
- Legacy ad hoc orange or green fills are not canonical review colors. Keep only documented conditional-format colors and the standard unresolved-review light red when the issue still exists.
- Example: if `notes_raw`, `dimensions_clean`, `catalog_blocker`, or `price_eur` keep an old orange highlight after the underlying review point has been resolved or the column has no color rule, reset the cell to the neutral background.
- For PDF catalog selection, `include_in_catalog` is the explicit editorial inclusion gate. Do not infer inclusion from `status_normalized`, availability labels, price, or whether a work is purchasable.
- Example: if `status_normalized = available` but `include_in_catalog = FALSE`, exclude the work from the PDF catalog; if `status_normalized = sold` but `include_in_catalog = TRUE`, include it unless another technical blocker such as missing title, image, or dimensions prevents rendering.
- Keep `catalog_ready` as the technical render-readiness gate after editorial selection. A row with `include_in_catalog = TRUE` and `catalog_ready = FALSE` should remain out of generated PDFs until its blockers are resolved.
- For PDF catalog image selection, the customer will manually identify the catalog image by keeping one existing Drive file per artwork whose filename ends in `_cat`. Missing or duplicate `_cat` images are blockers; do not auto-create, copy, or infer the `_cat` file.
- Do not enable strict production `_cat` image-folder selection until the shared folder contains one `_cat` file for every included, catalog-ready artwork.
- The PDF catalog should sort newest works first and display only title, year, dimensions, technique, and PVP price for each artwork.

### Manual review behavior

- When deterministic cleanup is not enough, convert unresolved issues into a cooperative review queue with one active focus item at a time.
- Each review turn should identify the exact cell, explain the problem briefly, show the evidence, and ask for one decision only.
- Prefer short, voice-friendly turns so the same workflow can be used in text chat or spoken back-and-forth.
- Group adjacent cells only when they depend on the same judgment. Otherwise, advance cell by cell.
- After each approved decision, write the change, confirm it, and move the focus to the next issue.

### Documentation behavior

- When a sheet needs persistent end-user guidance about what each field expects, document the header cells with notes rather than discussion comments.
- Example: add a Spanish note on each column header describing the purpose of the field and the expected value format.
- Treat header notes as the live sheet field contract. If a canonical column lacks a note, add one before relying on external memory to interpret the field.
- Example: `location_history` should have a header note explaining that it stores a chronological route separated with ` -> ` and should normally end in the current `location_clean`.
- When the catalog needs to distinguish standalone artworks from artworks in a series, add a dedicated optional field such as `series_name` instead of encoding the series only inside the title.
- Example: keep `title_clean = Perrete en tablillas 03` and store the shared grouping separately as `series_name = Perrete en tablillas`.

## Update Rule

When a user gives a new reusable spreadsheet-review instruction for MyBroworld:

1. Add the rule here with a short rationale.
2. Add one concrete example if it clarifies the rule.
3. Update the reviewer skill if the new rule changes the workflow or judgment model.
