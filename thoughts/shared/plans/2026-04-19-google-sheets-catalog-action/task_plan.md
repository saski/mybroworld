# Task Plan: Google Sheets Catalog Action

## Goal

Design an installable Google Sheets action that lets the client generate the catalog PDF from one or more yearly tabs without depending on a fixed tab name.

## Current Phase

Planning complete

## Phases

### Phase 1: Requirements & Discovery

- [x] Confirm the current generator entrypoint and input contract
- [x] Inspect the live spreadsheet structure and active yearly tab
- [x] Review Google Sheets integration options and limits
- [x] Document findings in `findings.md`
- **Status:** complete

### Phase 2: Architecture Decision

- [x] Choose the preferred installation model for a single client
- [x] Decide where the PDF generation should run
- [x] Define the generic multi-tab scope model
- [x] Incorporate the fixed executor account and machine constraints
- [x] Expand the design to support multiple local/Google execution profiles on the same machine
- [x] Record the final API contract and UX contract
- **Status:** complete

### Phase 3: Apps Script UX Plan

- [x] Define menu structure
- [x] Define sidebar flow
- [x] Define button-on-sheet behavior
- [x] Define how tabs are discovered and selected
- **Status:** complete

### Phase 4: Backend Contract Plan

- [x] Define the request payload from Apps Script to the generator backend
- [x] Define job lifecycle and status polling
- [x] Define PDF storage strategy in Drive
- [x] Define auth and secret handling
- **Status:** complete

### Phase 5: Rollout Plan

- [x] Define installation steps for the client
- [x] Define template-copy workflow
- [x] Define verification checklist
- [x] Define later migration path to a published add-on if needed
- **Status:** complete

## Key Questions

1. How should the user choose scope: current tab, selected years, or all compatible yearly tabs?
2. How will the Apps Script identify compatible tabs without relying on a fixed name?
3. Which parts must stay in Apps Script and which must stay in the external backend?
4. Where should the generated PDF be stored and how will the link be surfaced back in Sheets?
5. What is the lowest-friction installation flow for a single client today?
6. How should the system take advantage of the fact that generation runs on this machine under more than one local/Google profile?
7. How should the UI let the operator choose or default the execution profile safely?

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use a container-bound Apps Script as the first delivery format | Lowest-friction install path for one client and one workbook family |
| Make the first renderer a local `catalog-agent` on this machine instead of a cloud backend | Local execution removes cloud deployment, public endpoints, and extra secrets management from the first version |
| Make tab scope explicit and generic | The workbook will contain multiple yearly tabs, so hardcoded `Sheet1` or `2026` assumptions are unstable |
| Detect candidate tabs by canonical headers plus optional year-like naming | Header contract is the stable invariant; names are useful hints, not the source of truth |
| Prefer a menu and sidebar, with an optional on-sheet button | Menus and sidebars are robust; a visual button improves usability for non-technical users |
| Use a hidden job queue in the spreadsheet as the handshake between Sheets and the local agent | Apps Script cannot directly launch a local process, but it can enqueue jobs reliably inside the same workbook |
| Model execution with named profiles instead of one hardcoded account | The same machine must support at least `luciaastuy + mybrocorp@gmail.com` and `nacho + nacho.saski@gmail.com` |
| Prefer one local agent installation per macOS user profile | It keeps local paths, launchd setup, and browser/Drive auth isolated per user account |
| Require explicit or persisted profile selection in the Sheet UI | Apps Script user-email detection can be unavailable in some contexts, so profile routing must not depend only on inferred identity |
| Keep a cloud backend as a later migration path, not the first delivery | The local-machine constraint makes cloud infrastructure unnecessary for the initial deployment |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Initial live-sheet read assumed `Sheet1` and failed with `Unable to parse range: Sheet1!A1:Z5` | 1 | Re-read spreadsheet metadata and switch to the actual live tab `2026`; convert the finding into a reusable multi-tab rule |

## Notes

- The final solution must support one or more yearly tabs in the same workbook.
- The generating machine is fixed, but the operator profile is not.
- The first two required execution profiles are:
  - `lucia-mybrocorp`: local account `/Users/luciaastuy`, Google account `mybrocorp@gmail.com`
  - `nacho-saski`: local account `/Users/nacho`, Google account `nacho.saski@gmail.com`
- The integration should support at least these user scopes:
  - current compatible tab
  - selected compatible tabs
  - all compatible yearly tabs
- The generator should evolve from a single-CSV assumption toward a tab-set input model, even if the first agent implementation merges rows before invoking the current renderer.
- The first deployment should install two pieces:
  - a bound Apps Script in the spreadsheet
  - a local macOS `catalog-agent` running under each enabled macOS user profile
- The detailed contract is captured in `contracts.md` in this same plan folder.
- The local agent install must treat `workspaceRoot` as an explicit per-user setting because `/Users/luciaastuy/saski/mybroworld` does not currently exist.

## Planned Implementation Slices

1. Apps Script infrastructure
   Create `catalog_profiles` and `catalog_jobs`, add `onOpen()`, and wire the custom menu.
2. Apps Script sidebar
   Build compatible-tab discovery, profile selection, scope selection, validation, and queue-row creation.
3. Local catalog agent
   Poll queued rows by `execution_profile`, claim safely, read selected tabs with the Sheets API, and write progress.
4. Generator CLI hardening
   Add non-interactive flags for catalog title, artist name, and stable exit behavior.
5. End-to-end verification
   Validate both profiles, both account contexts, and multi-tab generation with Drive upload.
