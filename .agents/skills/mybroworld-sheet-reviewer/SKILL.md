---
name: mybroworld-sheet-reviewer
description: Review and improve connected Google Sheets for MyBroworld project workflows. Use when Codex needs to inspect spreadsheet quality, detect gaps, infer deterministic values, normalize fields, apply project-specific readiness and blocker criteria, flag ambiguous cells for review, guide a cooperative manual review queue, and keep the reviewer updated with new reusable project rules learned during the work.
---

# MyBroworld Sheet Reviewer

Use this skill to review project spreadsheets as living operational data, not just tables with blanks. Fill only deterministic values, apply project review criteria consistently, make unresolved issues visible for fast human review, and support a cooperative manual review flow when human judgment is needed.

## Workflow

1. Ground the task with exact spreadsheet metadata, target sheet name or sheet set, header row, and used range.
   - Do not assume a fixed canonical tab name such as `Sheet1` or `2026`.
   - For year-based catalog workbooks, inspect spreadsheet metadata first and identify candidate tabs by required header signature plus explicit user scope when available.
   - If multiple year tabs share the canonical contract, treat tab selection as a first-class task input and report which tabs are in scope before editing or reviewing.
2. Read the target area with `get_spreadsheet_cells` before editing so live values, formats, and validation rules are visible. Use `get_spreadsheet_range` only for wider plain-value sampling.
3. Identify which columns are required, which are optional, and whether the sheet already has blocker, readiness, or review columns.
4. If the task is to explain fields to end users, prefer header cell notes over comment threads because notes are persistent field help attached to the header itself.
5. Build inference and review rules from the sheet plus the project criteria reference before writing anything.
   - If the sheet uses range-backed enum columns such as `status_normalized`, treat them as shared contract fields. When a new canonical value is introduced, update the validation list, the header note, and any explicit color rule for that enum together.
6. Classify each blank, suspect value, or inconsistent cell:
   - Deterministic: one clear value follows from the same row or a repeated transformation elsewhere in the sheet. Fill it.
   - Review issue: the cell is present but inconsistent with project rules or neighboring patterns. Flag or normalize it if the rule is explicit.
   - Ambiguous: more than one plausible value exists, or the source evidence is missing. Do not fill it.
   - Optional: comparable rows are often blank and the column does not behave like a required field. Leave it alone.
7. Inspect cell formatting before editing. If a normalized output column contains manual fill colors without a documented meaning or matching conditional rule, treat that formatting as a review issue and reset it to the neutral background.
   - Legacy ad hoc green or orange fills count as undocumented manual formatting unless the sheet metadata shows a matching conditional rule for that column.
   - Keep the standard unresolved-review light red only when the underlying issue is still unresolved; otherwise clear the fill back to neutral.
8. When unresolved issues remain or the user asks for a guided pass, switch into manual review mode and build a review queue before editing ambiguous cells.
9. Batch edits into one coherent `batchUpdate`: write inferred or normalized values first, then color unresolved cells.
10. Report touched cells as `Filled`, `Normalized`, `Flagged`, and `Skipped`.
11. If the user introduced a new reusable review rule during the task, update this skill and `references/project-criteria.md` before finishing.
   - In Codex sessions, edit files under `.agents/` with the file edit tool, not shell redirection or shell-created temp files, because shell writes under `.agents/` may be sandbox-blocked even when direct file edits are allowed.

## Review Criteria

- Fill a cleaned column from its raw column only when the transformation is already demonstrated elsewhere in the sheet.
- Extract stable IDs from stable URL patterns, such as a Drive file ID from an `image_main` link into `image_id_manual`.
- Normalize dimensions only when the raw text already contains the full information, for example `23x16` to `23 x 16 cm`.
- Split medium and support only when the grammar is consistent across rows, for example `... sobre lienzo` to `medium_clean` plus `support_clean`.
- Normalize prices only when one numeric value is clearly intended. If a cell contains multiple prices or conflicting numbers, do not invent a canonical value unless the sheet already shows the rule.
- Normalize status or location only when the sheet already shows the same notes-to-clean-field mapping pattern in comparable rows.
- When a work needs both its current holder and its route through prior holders or venues, keep `location_clean` as the current location only and use a dedicated `location_history` field for the chronological route.
- When the catalog needs to capture whether an artwork belongs to a series, prefer a dedicated optional text field such as `series_name` instead of overloading `title_clean`, `notes_raw`, or public notes.
- Fill `series_name` only when the shared series name is explicit from a repeated title pattern already evidenced in the sheet, such as a common title stem followed by item numbers.
- When a new canonical enum value is explicitly approved for a range-backed field such as `status_normalized`, add it consistently across the hidden validation list, header note, and any matching conditional-format rules rather than only editing one cell.
- When a catalog workbook is split across multiple yearly tabs, keep judgments and automations generic across tabs. Use the canonical headers to detect compatible year sheets, and prefer explicit `sheetId` or selected-year scope over hardcoded tab names.
- Treat missing values and inconsistent values as different review cases. Some tasks require filling data; others require judging whether an existing value violates the project pattern.

## Manual Review Mode

- Build an issue queue from every unresolved blank, suspect value, validation mismatch, undocumented manual format, or ambiguity that cannot be fixed deterministically.
- Prioritize the queue so the user sees the highest-leverage issues first: blockers and readiness problems, required missing values, inconsistent normalized outputs, ambiguities, then formatting anomalies.
- Keep a single active focus item at a time. Always identify it with sheet name, A1 cell reference, header name, current value, and the shortest explanation of why it needs review.
- When multiple adjacent cells in the same row depend on the same judgment, review them as one compact bundle. Otherwise, move one cell at a time.
- For each focus item, present only the minimum context needed: source cells, repeated sheet pattern, safe suggestion if one exists, and what decision is needed from the user.
- Ask for one decision at a time. After the user responds, apply only the approved change, confirm the write, then move the focus to the next queued issue.
- Keep the dialogue voice-friendly: short turns, explicit cell references, no large tables unless the user asks, and a brief readback of the chosen value before writing it.
- If the client supports voice conversation, use the same queue and turn-taking protocol. The skill does not depend on audio features, but it should remain easy to use through spoken back-and-forth.
- Persist unresolved items visibly in the sheet when needed, but do not lose the conversational queue state while the session is active.

## Do Not Infer

- Do not invent dimensions, dates, titles, ownership, or public-facing notes from weak context.
- Do not overwrite non-empty cells unless the user explicitly asks for correction or normalization, or the project rule is already explicit.
- Do not treat every blank as a blocker. Some narrative or optional columns are intentionally sparse.
- Do not change boolean readiness flags unless the dependency is explicit in the sheet or in the project criteria reference.

## Review Color

- Use one consistent unresolved-review color. Default to light red with RGB `1.0, 0.8, 0.8`.
- Keep normalized output columns visually neutral unless a documented conditional rule or unresolved-review state requires color.
- Treat legacy green and orange manual highlights as non-canonical unless a conditional-format rule explicitly produces them for that column.
- Color only the exact unresolved cells, not the full row.
- Preserve existing text and formatting other than the background color.
- If the sheet already uses a blocker column, add a blocker reason there only when the reason is explicit from the missing source field or project criteria.

## Project Criteria Maintenance

- Read `./references/project-criteria.md` before making final review judgments on project sheets.
- When the user gives a new reusable rule, add it to `project-criteria.md` with a short rationale and a concrete example.
- The canonical criteria file is `./references/project-criteria.md`. Do not target a sibling path such as `./project-criteria.md`.
- Keep this skill concise. Put project-specific examples and accumulated criteria in the reference file instead of bloating the main workflow.

## Example Judgments

- `image_id_manual` blank while `image_main` contains a Drive file URL: fill the ID.
- `dimensions_clean` blank while `dimensions_raw` contains `23x16`: fill `23 x 16 cm`.
- `dimensions_raw` and `dimensions_clean` both blank: flag the cells instead of guessing from title, price, or nearby works.
- `location_clean` blank for a commissioned work: fill it only if the notes clearly identify the current holder/location and the sheet already uses that same mapping elsewhere.
- A notes trail such as `Residencia Escala House 07.01/20.02 / El Grifo / Vendido a Juan Roller` should keep the current holder in `location_clean` and the full route in `location_history`, for example `Residencia Escala House 07.01/20.02 -> El Grifo -> Juan Roller`.
- `title_clean` values `Perrete en tablillas 01` through `Perrete en tablillas 05` with a new `series_name` column present: fill `series_name` as `Perrete en tablillas`.
- Existing value conflicts with a repeated project normalization pattern: treat it as a review issue, not just a blank-cell issue.

## References

- Read `./references/batch-update-patterns.md` before drafting raw Sheets write requests.
- Read `./references/manual-review-mode.md` when the task involves cooperative review, queue-building, or voice-friendly turn taking.
- Read `./references/project-criteria.md` before finalizing project review decisions.
