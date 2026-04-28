# Findings & Decisions

## Requirements

- The client must be able to trigger catalog generation from Google Sheets.
- The install path must be client-friendly and not depend on a local terminal.
- The integration must work across multiple yearly tabs in the same workbook.
- The solution must not depend on a fixed tab name such as `Sheet1` or `2026`.
- The existing catalog generator should be reused instead of rewritten.
- The resulting PDF should be easy to retrieve from the spreadsheet workflow.
- The rendering machine is fixed to this Mac, but generation must work from more than one local/Google operator profile.
- The first required profiles are `lucia-mybrocorp` and `nacho-saski`.

## Research Findings

- The existing generator already supports Google Sheets CSV export as an input source via `GOOGLE_SHEET_CSV_URL`.
- The current live spreadsheet `Lucía Astuy - CATALOGO_BASE` now exposes the primary operational tab as `2026`, not `Sheet1`.
- The workbook currently includes hidden support tabs such as `NVScriptsProperties` and `validation_lists`, which means sheet-level helper infrastructure already exists.
- The `2026` tab uses canonical headers such as `preview`, `availability_flag_raw`, `title_raw`, `status_normalized`, `include_in_catalog`, `catalog_ready`, `submission_history`, and `image_id_manual`.
- The `preview` column is driven by row formulas using the Drive image identifier, which confirms the workbook is already optimized for operator use.
- Apps Script bound to Sheets can add custom menus, sidebars, dialogs, and script actions attached to images or drawings.
- A copy of a spreadsheet also copies its bound script, which makes a template-copy installation flow practical for a single client.
- Apps Script can call external HTTP(S) services with `UrlFetchApp`, but execution time and quotas make it a poor place for heavy PDF rendering logic.
- A web app endpoint can be implemented with Apps Script `doPost(e)`, but that is not necessary if the sheet-bound script only calls an external backend.
- Google Workspace add-ons are viable later, but they add packaging and publication overhead that is not justified for the first client deployment.
- The local account `/Users/luciaastuy` exists on this machine, so a machine-specific local agent is a real deployment option rather than a hypothetical one.
- The current workspace path confirms `/Users/nacho` is also an active local profile on the same machine.
- The repository checkout is not currently present at `/Users/luciaastuy/saski/mybroworld`, so the Lucia-side agent cannot assume the same workspace path as the current Nacho checkout.
- Because execution stays on one machine even across multiple operators, a local queue-driven agent is still operationally simpler than standing up a first cloud rendering service.
- Google Apps Script `Session.getActiveUser().getEmail()` can return a blank string in some contexts, so profile routing should not rely solely on automatic email detection.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Use a bound Apps Script instead of a browser extension | It lives inside Sheets, is supported by Google, and gives the best UX for this workflow |
| Use a local `catalog-agent` on this machine for the first renderer | The execution environment is local, so this is simpler and avoids cloud setup |
| Model generation scope as a tab set | Future workbooks will include multiple yearly tabs |
| Use canonical headers as the compatibility check | Headers are the stable contract already used by repo tooling |
| Keep tab naming helpful but non-authoritative | A tab named `2026` is a signal, but not enough to hardcode integration behavior |
| Use a hidden `catalog_jobs` tab or equivalent queue in the workbook | It is the cleanest bridge between Google Sheets UX and a local machine process |
| Introduce named execution profiles | Multiple local/Google combinations must be supported without mixing credentials or output paths |
| Install one agent per macOS user profile | Each local account can keep its own launchd setup, config file, browser session, and Drive auth |
| Use explicit profile selection with remembered defaults | It is safer than assuming Apps Script can always infer the active Google identity |
| Treat `workspaceRoot` as per-profile configuration instead of a derived convention | The repo is not currently checked out under `/Users/luciaastuy/saski/mybroworld` |
| Defer cloud deployment until multi-user or off-machine generation is actually needed | Premature cloud infrastructure adds avoidable complexity for the current constraint set |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Historical docs and plan references still assumed `Sheet1` as the canonical tab | Updated project documentation and reviewer rules to treat the workbook as multi-year and tab-generic |
| Initial architecture favored a cloud backend by default | Revised the recommendation after confirming that generation stays on one local machine |
| A later clarification invalidated the single-account assumption | Reframed the design around execution profiles instead of one fixed Google account |

## Resources

- [catalog-generator/src/generate.mjs](/Users/nacho/saski/mybroworld/catalog-generator/src/generate.mjs)
- [catalog-generator/README.md](/Users/nacho/saski/mybroworld/catalog-generator/README.md)
- [thoughts/shared/docs/artwork-data-contract.md](../../docs/artwork-data-contract.md)
- [contracts.md](/Users/nacho/saski/mybroworld/thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md)
- [Custom Menus in Google Workspace](https://developers.google.com/apps-script/guides/menus)
- [Container-bound Scripts](https://developers.google.com/apps-script/guides/bound)
- [Dialogs and Sidebars in Google Workspace Documents](https://developers.google.com/apps-script/guides/dialogs)
- [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app)
- [Web Apps](https://developers.google.com/apps-script/guides/web)
- [Extend Google Sheets with add-ons](https://developers.google.com/workspace/add-ons/editors/sheets)
- [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)

## Visual/Browser Findings

- Spreadsheet metadata confirms the live workbook title is `Lucía Astuy - CATALOGO_BASE`.
- Spreadsheet metadata confirms the active data tab is `2026` with `sheetId = 102593401`.
- The first row of the `2026` tab contains the canonical operator headers needed to detect compatible year tabs.
- The first rows of `2026` confirm that preview formulas reference `image_id_manual`, not a tab-specific construct, so the operator UX is already mostly generic.
- The failed `Sheet1` range read is direct evidence that any future integration must resolve the target tab dynamically before reading data.
- Local filesystem inspection confirms `/Users/luciaastuy` exists on this machine, so a macOS LaunchAgent or similar local worker can be treated as deployable.
- The current working copy path confirms `/Users/nacho` is also a real local operator context on the same machine.
- A direct path check confirms `/Users/luciaastuy/saski/mybroworld` is missing, so the Lucia-side local install needs an explicit repo or packaged-generator path during setup.
