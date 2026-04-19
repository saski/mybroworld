---
name: review-google-sheet-gaps
description: Review connected Google Sheets for missing or inconsistent values. Use when Codex needs to inspect a spreadsheet tab, infer missing cell values from repeated row patterns or raw-to-clean transformations, write only deterministic fills, and highlight unresolved cells for fast manual review. Best for catalog, inventory, CRM, and cleanup workflows where some columns can be derived from nearby values but ambiguous blanks must stay visible.
---

# Review Google Sheet Gaps

Use this skill to clean partially completed Google Sheets without inventing data. Fill deterministic gaps, leave ambiguous gaps untouched, and make unresolved cells visually obvious.

## Workflow

1. Ground the task with exact spreadsheet metadata, target sheet name, header row, and used range.
2. Read the target area with `get_spreadsheet_cells` before editing so live values, formats, and validation rules are visible. Use `get_spreadsheet_range` only for wider plain-value sampling.
3. Identify which columns are required, which are optional, and whether the sheet already has blocker or review columns.
4. Build inference rules from the sheet itself before writing anything. Prefer repeated patterns already present in multiple rows.
5. Classify each blank or suspect cell:
   - Deterministic: one clear value follows from the same row or a repeated transformation elsewhere in the sheet. Fill it.
   - Ambiguous: more than one plausible value exists, or the source evidence is missing. Do not fill it.
   - Optional: comparable rows are often blank and the column does not behave like a required field. Leave it alone.
6. Batch edits into one coherent `batchUpdate`: write inferred values first, then color unresolved cells.
7. Report touched cells as `Filled`, `Flagged`, and `Skipped`.

## Deterministic Inference Rules

- Fill a cleaned column from its raw column only when the transformation is already demonstrated elsewhere in the sheet.
- Extract stable IDs from stable URL patterns, such as a Drive file ID from an `image_main` link into `image_id_manual`.
- Normalize dimensions only when the raw text already contains the full information, for example `23x16` to `23 x 16 cm`.
- Split medium and support only when the grammar is consistent across rows, for example `... sobre lienzo` to `medium_clean` plus `support_clean`.
- Normalize prices only when one numeric value is clearly intended. If a cell contains multiple prices or conflicting numbers, do not invent a canonical value unless the sheet already shows the rule.
- Normalize status or location only when the sheet already shows the same notes-to-clean-field mapping pattern in comparable rows.

## Do Not Infer

- Do not invent dimensions, dates, titles, ownership, or public-facing notes from weak context.
- Do not overwrite non-empty cells unless the user explicitly asks for correction or normalization.
- Do not treat every blank as a blocker. Some narrative or optional columns are intentionally sparse.
- Do not change boolean readiness flags unless the dependency is explicit in the sheet.

## Review Color

- Use one consistent unresolved-review color. Default to light red with RGB `1.0, 0.8, 0.8`.
- Color only the exact unresolved cells, not the full row.
- Preserve existing text and formatting other than the background color.
- If the sheet already uses a blocker column, add a blocker reason there only when the reason is explicit from the missing source field.

## Example Judgments

- `image_id_manual` blank while `image_main` contains a Drive file URL: fill the ID.
- `dimensions_clean` blank while `dimensions_raw` contains `23x16`: fill `23 x 16 cm`.
- `dimensions_raw` and `dimensions_clean` both blank: flag the cells instead of guessing from title, price, or nearby works.
- `location_clean` blank for a commissioned work: fill it only if the notes clearly identify the current owner or location and the sheet already uses that same mapping elsewhere.

## References

- Read `./references/batch-update-patterns.md` before drafting raw Sheets write requests.
