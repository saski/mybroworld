# Contracts: Google Sheets Catalog Action

## Purpose

Define the first implementation contract for triggering catalog PDF generation from Google Sheets on a single Mac that supports multiple local and Google operator profiles.

This contract is intentionally biased toward:

- Google Sheets as the operator UI
- one local renderer per macOS user profile
- multiple compatible yearly tabs in one workbook
- explicit profile routing instead of hidden account assumptions

## Actors

### Spreadsheet Operator

- Uses the Google Sheet UI
- Selects tab scope and execution profile
- Starts generation from a menu, sidebar, or on-sheet button

### Bound Apps Script

- Lives inside the workbook
- Discovers compatible yearly tabs
- Loads available execution profiles
- Creates queue rows in `catalog_jobs`
- Surfaces status and result links back to the operator

### Local Catalog Agent

- Runs on this Mac under a specific macOS user
- Polls jobs for exactly one `execution_profile`
- Exports tab data, merges CSVs, renders the PDF, uploads the result, and writes job updates

## Execution Profiles

The first implementation must support named execution profiles.

Required initial profiles:

| profile_key | macos_user | google_account_email | Purpose |
|---|---|---|---|
| `lucia-mybrocorp` | `luciaastuy` | `mybrocorp@gmail.com` | Main production operator |
| `nacho-saski` | `nacho` | `nacho.saski@gmail.com` | Testing and development |

Rules:

- One local agent instance runs per macOS user profile.
- Each agent is configured with exactly one `profile_key`.
- A job can only be claimed by an agent whose configured `profile_key` matches the job row.
- The Sheet UI must expose profile selection explicitly.

## Workbook Infrastructure Tabs

### Year Tabs

Year tabs such as `2026`, `2025`, and `2024` are the source data tabs.

Compatibility rule:

- A tab is considered compatible if it contains the canonical header contract required by the generator.
- Tab names are hints, not the contract.
- The compatibility check should use headers, not a hardcoded tab title.

### `catalog_profiles`

Hidden helper tab used to configure which execution profiles are available to the workbook UI.

Recommended columns:

| Column | Type | Required | Notes |
|---|---|---|---|
| `profile_key` | string | yes | Stable routing key used by jobs and agents |
| `label` | string | yes | Human-readable label shown in the sidebar |
| `enabled` | boolean | yes | `TRUE` or `FALSE` |
| `google_account_email` | string | recommended | UI hint only; not a security boundary |
| `macos_user_hint` | string | recommended | UI hint only |
| `default_drive_folder_id` | string | optional | Default upload folder for this profile |
| `notes` | string | optional | Admin notes |

First rows should include:

- `lucia-mybrocorp`
- `nacho-saski`

### `catalog_jobs`

Hidden queue tab used as the system of record for generation requests and job status.

## `catalog_jobs` Schema

Recommended columns:

| Column | Type | Required | Notes |
|---|---|---|---|
| `job_id` | string | yes | Stable unique id, for example `catalog_20260419_153012_ab12` |
| `created_at` | ISO datetime | yes | Creation timestamp in UTC |
| `created_by_email` | string | optional | Best effort from Apps Script; may be blank |
| `created_by_user_key` | string | optional | Temporary user key when email is unavailable |
| `execution_profile` | string | yes | Must match one enabled `profile_key` |
| `scope_mode` | enum | yes | `current_tab`, `selected_tabs`, or `all_compatible_tabs` |
| `sheet_ids_json` | JSON array | yes | Ordered array of numeric `sheetId` values |
| `sheet_titles_json` | JSON array | yes | Ordered array of titles, same order as `sheet_ids_json` |
| `catalog_title` | string | yes | User-facing title for the generated catalog |
| `artist_name` | string | optional | Defaults to `Lucía Astuy` if blank |
| `output_folder_id` | string | optional | Drive folder target; may default from profile |
| `output_filename` | string | optional | Final filename if the user supplied one |
| `status` | enum | yes | See lifecycle below |
| `claim_token` | string | optional | Unique token written by the claiming agent |
| `claimed_at` | ISO datetime | optional | When an agent claimed the job |
| `claimed_by_profile` | string | optional | Redundant safety field; should equal `execution_profile` |
| `claimed_by_host` | string | optional | Hostname of the local Mac |
| `claimed_by_user` | string | optional | macOS user running the agent |
| `heartbeat_at` | ISO datetime | optional | Last liveness update from the agent |
| `started_at` | ISO datetime | optional | When actual processing began |
| `completed_at` | ISO datetime | optional | Completion timestamp |
| `result_file_id` | string | optional | Google Drive file id of the generated PDF |
| `result_file_url` | string | optional | Google Drive or Docs viewer URL |
| `result_local_path` | string | optional | Local path written for debugging only |
| `result_artwork_count` | integer | optional | Number of artworks included |
| `error_code` | string | optional | Short machine-readable error code |
| `error_message` | string | optional | Human-readable error summary |
| `log_excerpt` | string | optional | Short diagnostic excerpt |

## Job Lifecycle

Allowed status values for the first implementation:

- `queued`
- `claimed`
- `exporting`
- `merging`
- `rendering`
- `uploading`
- `completed`
- `failed`

Valid flow:

1. Apps Script creates a row with `status = queued`.
2. Matching local agent atomically claims the row and sets `status = claimed`.
3. Agent updates status as work progresses:
   - `exporting`
   - `merging`
   - `rendering`
   - `uploading`
4. Agent finishes with:
   - `completed`, or
   - `failed`

## Claim Contract

Each agent polls only for:

- `status = queued`
- `execution_profile = <its configured profile>`

Claim algorithm:

1. Read candidate rows.
2. Choose the oldest queued row for the profile.
3. Write:
   - `status = claimed`
   - `claim_token = <uuid>`
   - `claimed_at = now`
   - `claimed_by_profile = <profile_key>`
   - `claimed_by_host = <hostname>`
   - `claimed_by_user = <macos user>`
   - `heartbeat_at = now`
4. Re-read the row and proceed only if the stored `claim_token` matches.

Heartbeat:

- Update `heartbeat_at` at least once every 30 seconds while the job is active.

Stale job rule:

- A claimed or in-progress job with no heartbeat for more than 15 minutes is considered stale.
- Stale-job recovery is a later step; the first version may only surface these rows for manual cleanup.

## Sidebar Contract

The Apps Script sidebar should collect:

- execution profile
- scope mode
- current tab or selected tabs
- catalog title
- optional output folder
- optional output filename

Preselection rules:

1. If `Session.getActiveUser().getEmail()` is available and matches exactly one enabled profile, preselect it.
2. Else, if `UserProperties` contains a remembered `default_execution_profile`, preselect it.
3. Else, force explicit user selection.

The final submit action must write a `queued` row into `catalog_jobs`.

## Local Agent Contract

Each macOS user profile gets its own local installation.

Recommended paths:

- Config:
  - `~/Library/Application Support/MyBroworld/catalog-agent/config.json`
- Working directory:
  - `~/Library/Application Support/MyBroworld/catalog-agent/jobs/<job_id>/`
- LaunchAgent:
  - `~/Library/LaunchAgents/com.mybroworld.catalog-agent.plist`

Recommended config shape:

```json
{
  "profileKey": "lucia-mybrocorp",
  "googleAccountEmail": "mybrocorp@gmail.com",
  "workspaceRoot": "/Users/luciaastuy/path/to/mybroworld",
  "generatorDir": "/Users/luciaastuy/path/to/mybroworld/catalog-generator",
  "watchSpreadsheetIds": ["15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw"],
  "pollIntervalSeconds": 30,
  "oauthClientPath": "/Users/luciaastuy/Library/Application Support/MyBroworld/catalog-agent/oauth-client.json",
  "oauthTokenPath": "/Users/luciaastuy/Library/Application Support/MyBroworld/catalog-agent/oauth-token.json"
}
```

Equivalent config exists per user profile. Example:

- `nacho-saski` uses:
  - `profileKey = "nacho-saski"`
  - `googleAccountEmail = "nacho.saski@gmail.com"`
  - `workspaceRoot = "/Users/nacho/saski/mybroworld"`

Installation rule:

- `workspaceRoot` and `generatorDir` must be set to the real local path for that macOS user.
- Do not assume the same checkout path exists for every profile.
- Current local inspection confirms `/Users/luciaastuy/saski/mybroworld` is not present today, so the Lucia installation path must be chosen explicitly during rollout.

## Apps Script Menu Contract

Recommended top-level menu: `Catalogs`

Recommended menu items:

- `Generate Catalog PDF`
- `View Catalog Jobs`
- `Refresh Catalog Metadata`
- `Admin: Setup Catalog Infrastructure`

Behavior rules:

- `onOpen()` adds the custom menu because the script is container-bound.
- `Generate Catalog PDF` opens the sidebar in normal mode.
- `View Catalog Jobs` unhides or focuses the `catalog_jobs` tab for editors.
- `Refresh Catalog Metadata` rebuilds the cached compatible-tab and profile list used by the sidebar.
- `Admin: Setup Catalog Infrastructure` creates missing helper tabs, writes headers, and rehides them.

## On-Sheet Button Contract

The spreadsheet should also expose an optional visual button on each yearly tab.

Recommended pattern:

- Add a drawing or image labeled `Generate Catalog PDF`.
- Assign it to `openCatalogSidebarForActiveTab`.
- The handler opens the same sidebar as the menu action, but preselects:
  - `scope_mode = current_tab`
  - active tab as the current target

Maintenance rule:

- New yearly tabs should be created by duplicating an existing compatible yearly tab so the visual button and tab-local layout come across automatically.
- The menu remains the canonical fallback when the button is missing.

## Compatible Tab Discovery Contract

The sidebar must discover compatible tabs dynamically on every open or refresh.

Tab exclusion rules:

- Ignore hidden tabs by default.
- Ignore helper titles explicitly:
  - `catalog_jobs`
  - `catalog_profiles`
  - `validation_lists`
  - `NVScriptsProperties`

Header normalization rules:

- Read row 1 only.
- Trim whitespace.
- Lowercase for comparison.
- Compare by header name, not by column position.

Required compatibility headers:

- `artwork_id`
- `title_clean`
- `year`
- `medium_clean`
- `support_clean`
- `dimensions_clean`
- `status_normalized`
- `image_main`
- `include_in_catalog`
- `catalog_ready`

Optional-but-expected headers:

- `price_display_clean`
- `catalog_section`
- `catalog_order`
- `show_price`
- `catalog_notes_public`
- `submission_history`

Display ordering rules:

1. Active compatible tab first
2. Remaining tabs whose titles look like 4-digit years, sorted descending
3. Other compatible tabs, sorted alphabetically

Failure behavior:

- If the active tab is incompatible, the sidebar should still open.
- The UI should show the exact missing required headers for the active tab.
- The user can still select another compatible tab or choose all compatible tabs.

## Sidebar Flow Contract

The sidebar should load in four steps:

1. Load enabled execution profiles from `catalog_profiles`.
2. Load compatible tabs from the workbook.
3. Resolve defaults for profile and scope.
4. Render the form and validate before enqueue.

Recommended fields:

- execution profile
- scope mode
- compatible tab checklist when `scope_mode = selected_tabs`
- catalog title
- optional artist name
- optional output folder id
- optional output filename

Scope modes:

- `current_tab`
- `selected_tabs`
- `all_compatible_tabs`

Validation rules before enqueue:

- A profile must be selected.
- At least one compatible tab must resolve from the chosen scope.
- `catalog_title` must be non-empty.
- `output_folder_id` must resolve from:
  - explicit sidebar input, or
  - profile default folder id
- If neither folder source exists, fail fast in the UI instead of queueing a doomed job.

Successful submit behavior:

- Append a new `queued` row into `catalog_jobs`.
- Persist `default_execution_profile` into `UserProperties`.
- Show a confirmation toast with the new `job_id`.
- Offer a direct jump to the jobs tab.

## Job Row Defaults

Defaults at enqueue time:

- `created_at` uses UTC ISO timestamp
- `status = queued`
- `artist_name = Lucía Astuy` when left blank
- `output_folder_id` falls back to the profile default when blank

Recommended `output_filename` rule when blank:

- Build from catalog title plus timestamp, for example `catalog_2026_20260419_154500.pdf`
- Sanitize spaces and unsafe filesystem characters before queueing

## Local Agent API Contract

The first implementation does not require a separate HTTP backend.

The spreadsheet row is the request payload. The local agent should:

- poll `catalog_jobs`
- claim a matching queued row
- read selected tabs directly through the Google Sheets API
- write progress updates directly back to `catalog_jobs`
- upload the PDF with the Google Drive API

This keeps the first implementation inside:

- bound Apps Script for operator UX
- Google Sheets as the queue
- local Node agent for rendering

## Agent Authentication Contract

The local agent must use Google OAuth under the intended operator account for that macOS profile.

Required checks:

- On startup, the agent reads the authenticated Google identity.
- If that email does not match `googleAccountEmail` in config, the agent should fail fast with a clear error.
- The agent must never claim jobs until the configured Google identity is confirmed.

Recommended first-version OAuth scopes:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive`

Secret handling rules:

- Store OAuth client credentials outside the repo.
- Store refresh tokens outside the repo with user-only permissions.
- Do not hardcode any token, client secret, or spreadsheet credential into the workbook or repository.

Apps Script auth rule:

- The bound Apps Script should not need external backend secrets in the first version.
- It only needs the spreadsheet permissions required to read/write the current workbook UI and helper tabs.

## Agent Processing Pipeline

For each claimed job:

1. Read `sheet_ids_json` and `sheet_titles_json`.
2. Read each selected tab through the Google Sheets API and serialize it to temporary CSV.
3. Validate that required canonical headers are present.
4. Merge rows into one temporary CSV using canonical headers.
5. Invoke the generator with:
   - merged CSV path
   - output PDF path
   - catalog title
   - optional artist name
6. Upload the final PDF to the target Drive folder under the profile's Google auth.
7. Write completion metadata back to `catalog_jobs`.

Temporary local outputs should live under:

- `~/Library/Application Support/MyBroworld/catalog-agent/jobs/<job_id>/`

## Required Generator Changes

The current generator already supports CSV input, but the first integration pass should add:

- `--catalog-title`
- optional `--artist-name`
- stable non-interactive exit codes
- clear stdout/stderr messages suitable for queue logging

Optional but useful:

- `--input-merged-from-json` or similar is not required initially
- the local agent can merge CSVs first and keep the generator single-input

## Drive Result Contract

On success, the agent must write back:

- `result_file_id`
- `result_file_url`
- `completed_at`
- `result_artwork_count`
- `status = completed`

The Sheet UI should surface:

- latest result link
- latest status
- failure message when present

Folder resolution order:

1. Explicit `output_folder_id` from the queued row
2. `default_drive_folder_id` from the selected execution profile
3. Fail validation before render starts

## Rollout Contract

### Workbook Rollout

For the first live workbook:

1. Add the bound Apps Script project to the existing spreadsheet.
2. Run `Admin: Setup Catalog Infrastructure`.
3. Populate `catalog_profiles` with:
   - `lucia-mybrocorp`
   - `nacho-saski`
4. Hide `catalog_profiles` and `catalog_jobs`.
5. Add the optional visual button to the active yearly tab.

### Local Agent Rollout

Per macOS user profile:

1. Ensure the repo or packaged generator exists at a stable local path readable by that user.
2. Write the per-profile config file with:
   - `profileKey`
   - `googleAccountEmail`
   - `workspaceRoot`
   - `generatorDir`
   - `watchSpreadsheetIds`
   - OAuth client/token paths
3. Run a one-time OAuth authorization flow in the correct browser session.
4. Install the LaunchAgent.
5. Start the agent and verify it polls without claiming unrelated jobs.

### Template-Copy Workflow

Preferred workflow for future workbooks:

- Make a copy of an already configured workbook so the bound script and hidden helper tabs copy with it.
- Duplicate an existing compatible yearly tab when creating a new year so the visual button also carries forward.
- Add the new spreadsheet id to each enabled local agent config allowlist before relying on the copy.

## Verification Checklist Contract

Minimum acceptance checks:

1. From `mybrocorp@gmail.com`, queue a `current_tab` job and verify only `lucia-mybrocorp` claims it.
2. From `nacho.saski@gmail.com`, queue a `current_tab` job and verify only `nacho-saski` claims it.
3. Queue a `selected_tabs` job that combines at least two compatible yearly tabs and verify the merged PDF is produced.
4. Verify `completed` rows contain `result_file_id`, `result_file_url`, and `result_artwork_count`.
5. Verify an incompatible active tab produces a precise validation message instead of a broken queued job.
6. Verify missing folder configuration is blocked in the sidebar before queueing.

## Security Boundaries

- The workbook routes jobs by `execution_profile`, but that is not the security boundary by itself.
- The real boundary is the local agent config plus the Google auth available to that macOS user.
- A `lucia-mybrocorp` agent must ignore any row whose `execution_profile` is not `lucia-mybrocorp`.
- A `nacho-saski` agent must ignore any row whose `execution_profile` is not `nacho-saski`.

## First Implementation Non-Goals

- Distributed cloud rendering
- Cross-machine job routing
- Automatic stale-job requeue
- Published Google Workspace Marketplace add-on
- Full cancellation and retry workflow from the UI

## Recommended First Build Order

1. Add hidden tabs `catalog_profiles` and `catalog_jobs`.
2. Build Apps Script sidebar and queue writer.
3. Add a minimal local polling agent for one profile.
4. Add multi-profile support by config duplication and profile-safe claim filtering.
5. Add Drive upload and result-link writeback.
