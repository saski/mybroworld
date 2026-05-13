# Google Sheets Catalog Action

This guide documents the first local rollout of the Google Sheets catalog action described in [thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md](../plans/2026-04-19-google-sheets-catalog-action/contracts.md).

## Components

The implementation is split into two installable parts:

1. A bound Google Apps Script project stored in [catalog-generator/apps-script](../../../catalog-generator/apps-script)
2. A `catalog-agent` process stored in [catalog-generator/catalog-agent](../../../catalog-generator/catalog-agent), running locally for development and as an on-demand Cloud Run Job for production portability

The sheet writes jobs into `catalog_jobs`. The agent claims only jobs whose `execution_profile` matches its own config.

The same Apps Script project can also be deployed as a token-protected Web App for the WordPress catalog console. WordPress should call that endpoint server-side and keep the shared token outside tracked files.

## Workbook Install

1. Open the target spreadsheet.
2. Create or open the bound Apps Script project.
3. Copy the files from [catalog-generator/apps-script](../../../catalog-generator/apps-script) into the bound project:
   - `Code.gs`
   - `CatalogSidebar.html`
   - `appsscript.json`
4. Reload the spreadsheet.
5. Run `Catalogs → Admin: Setup Catalog Infrastructure`.
6. Confirm that the hidden sheets `catalog_profiles` and `catalog_jobs` were created.
7. Fill or verify the initial `catalog_profiles` rows:
   - `lucia-mybrocorp`
   - `nacho-saski`
   - Production `lucia-mybrocorp.default_drive_folder_id`: `183-IMb93mqASyyKEMz3lTVG1S8GLrK_2` (`OBRA/Catalogos`)
8. Hide both helper sheets again after verifying the configuration.
9. Optionally add a drawing or image button on a yearly tab and assign it to `openCatalogSidebarForActiveTab`.

## Local Agent Install

1. Copy [catalog-generator/catalog-agent/config.example.json](../../../catalog-generator/catalog-agent/config.example.json) to the target macOS user profile:
   - `~/Library/Application Support/MyBroworld/catalog-agent/config.json`
2. Update the copied config with the real local paths for that user:
   - `profileKey`
   - `googleAccountEmail`
   - `workspaceRoot`
   - `generatorDir`
   - `watchSpreadsheetIds`
   - `oauthClientPath`
   - `oauthTokenPath`
3. Create or reuse a Google Cloud OAuth desktop client appropriate for the target profile.
   - For local development profile `nacho-saski`, the existing project `mybroworld-catalog-260501` and OAuth app `MyBroworld Catalog Agent` are acceptable for smoke testing.
   - For production profile `lucia-mybrocorp`, the Cloud Run worker should use OAuth token material authorized by `mybrocorp@gmail.com`, stored outside git in Secret Manager within `mybroworld-catalog-260501`.
4. Confirm the OAuth app declares the required scopes before authorizing:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive`
   - `openid`
   - `email`
   - `profile`
5. Place the Google OAuth desktop client JSON outside the repository.
6. Run the one-time authorization flow:

```bash
cd /path/to/mybroworld/catalog-generator
npm run catalog-agent:authorize -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

7. Verify the token was stored at the configured `oauthTokenPath` and that the granted scope list includes Google Sheets and Drive.
8. Confirm the machine can render with Puppeteer. On macOS, the generator falls back to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` when Puppeteer's managed Chrome cache is empty.
9. Run one controlled poll:

```bash
cd /path/to/mybroworld/catalog-generator
npm run catalog-agent:once -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

10. After verification, install the user-level LaunchAgent that runs:

```bash
cd /path/to/mybroworld/catalog-generator
npm run catalog-agent -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

## Customer-Operable Production Handoff

Do not treat the WordPress catalog console as customer-portable until this production path is verified:

1. Google Cloud project `mybroworld-catalog-260501` remains the production runtime project, administered and billed by `nacho.saski@gmail.com`.
2. A `lucia-mybrocorp` agent config exists in Secret Manager for the Cloud Run worker.
3. The Cloud Run worker is authorized as `mybrocorp@gmail.com` and fails fast if any other Google identity is configured.
4. The Apps Script Web App starts the Cloud Run Job through the Cloud Run Admin API immediately after a `lucia-mybrocorp` job is queued.
5. The agent claims only `lucia-mybrocorp` jobs and ignores `nacho-saski` jobs.
6. The configured Drive output folder is writable by `mybrocorp@gmail.com`, and the resulting PDF is readable from the customer's browser session.
7. The local `nacho-saski` LaunchAgent is stopped or irrelevant during the validation run.
8. The customer logs into production WordPress with the mybro account, opens `Catalog PDFs`, queues a catalog, sees the completed Drive link, and saves `approved` or `needs_changes`.
9. The completed `catalog_jobs` row records the customer WordPress identity and the review state remains visible after a page reload.

Current status as of 2026-05-03: the Cloud Run worker, Secret Manager material,
and production monitor are deployed. Manual worker executions authenticate as
`mybrocorp@gmail.com`; verification job `catalog_20260502_161854_retry`
completed through Cloud Run, produced a 14-artwork PDF, and wrote the Drive
result URL back to `catalog_jobs`. Apps Script now supports starting the worker
on demand when a `lucia-mybrocorp` catalog is queued. The production Apps Script
project is linked to standard Cloud project `mybroworld-catalog-260501`; Web App
deployment `AKfycbz9C2jMtj42LWgWFl1duHEFUiGqs0b6svz0zgcOJjeSQtBUl-8j_iTH7S2iAUIAKVBJ`
runs version 6 with server-side WordPress access and an owner-only API executable
scope bootstrap. Direct token-authenticated job `catalog_20260503_100246_1dd2`
started Cloud Run execution `lucia-mybrocorp-catalog-agent-s22ln`, authenticated
as `mybrocorp@gmail.com`, completed with 14 artworks, and wrote the Drive result
URL back to `catalog_jobs`. The legacy worker polling scheduler should remain
active until one customer-account WordPress UI validation passes; after that it
should be paused. The monitor job `lucia-mybrocorp-catalog-monitor` runs
separately and has a Cloud Monitoring email alert policy. The remaining gate is
one customer-account WordPress job that records the customer WordPress identity
and persists review state.

Production output-folder status as of 2026-05-03: the Drive folder
`183-IMb93mqASyyKEMz3lTVG1S8GLrK_2` is the catalog output folder. It is named
`Catalogos`, its parent is the shared artwork folder
`1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh`, and `mybrocorp@gmail.com` has writer
access. The `lucia-mybrocorp` worker token created and deleted a write probe
there, `catalog_profiles!F2` points to that folder, and validation job
`catalog_20260503_102110_2c0d` wrote PDF
`15NBUz7i1VJaqQZiakMltH-pEHTW6XZXF` there.

Cloud Run implementation notes:

- Build the worker from [catalog-generator/Dockerfile.catalog-agent](../../../catalog-generator/Dockerfile.catalog-agent).
- Use `npm run catalog-agent:cloud-run-once` as the Cloud Run Job command.
- The entrypoint reads Secret Manager-provided JSON from `CATALOG_AGENT_CONFIG_JSON`, `CATALOG_AGENT_OAUTH_CLIENT_JSON`, and `CATALOG_AGENT_OAUTH_TOKEN_JSON`, or from the corresponding `*_PATH` variables if secrets are mounted as files.
- The entrypoint writes those secrets into `CATALOG_AGENT_RUNTIME_ROOT` before loading the normal agent config, so OAuth refresh can update `oauthTokenPath` in a writable location.
- Chromium runs as root in the current Cloud Run container, so Puppeteer launch options add `--no-sandbox` and `--disable-setuid-sandbox` when UID is 0.
- Failed agent jobs write nested error causes into `catalog_jobs.log_excerpt`; check that field or Cloud Logging before retrying a generic `pdf_render_failed` job.
- The one-shot Cloud Run worker exits non-zero when it claims a job that ends in `failed`.
- The separate monitor command, `npm run catalog-agent:monitor:cloud-run`, scans `catalog_jobs` for recent failed rows, stale queued rows, stale in-progress heartbeats, and completed rows missing a Drive URL.
- Deployment and on-demand trigger commands live in [catalog-generator/cloud-run/README.md](../../../catalog-generator/cloud-run/README.md).

## Job Contract Highlights

- Scope modes:
  - `current_tab`
  - `selected_tabs`
  - `all_compatible_tabs`
- Compatible tabs are discovered dynamically from canonical headers, not from a hardcoded tab name.
- The sidebar blocks queueing when no output folder can be resolved.
- The agent claims the oldest `queued` job for its configured `profileKey`.
- The agent writes progress states back to `catalog_jobs`:
  - `claimed`
  - `exporting`
  - `merging`
  - `rendering`
  - `uploading`
  - `completed`
  - `failed`
- Completed jobs can later carry review fields written by a trusted operator UI:
  - `review_status`
  - `reviewed_at`
  - `reviewed_by`
  - `review_notes`

## WordPress Web App API

Deploy the bound Apps Script as a Web App when WordPress needs to queue and monitor catalog jobs.

Deployment settings:

- Execute as the script owner account that can edit the workbook.
- Use Web App access `Anyone` / manifest `ANYONE_ANONYMOUS` so the production WordPress server can reach the endpoint; the shared token remains the API authorization boundary.
- Store the deployed Web App URL in WordPress configuration outside tracked files.
- Keep the shared API token, OAuth client JSON, and OAuth token files outside the repository.

Before deployment, set the script property:

- `CATALOG_API_TOKEN`

For production on-demand Cloud Run execution, also set:

- `CATALOG_CLOUD_RUN_TRIGGER_ENABLED=true`
- `CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS=lucia-mybrocorp`
- `CATALOG_CLOUD_RUN_PROJECT_ID=mybroworld-catalog-260501`
- `CATALOG_CLOUD_RUN_REGION=europe-west1`
- `CATALOG_CLOUD_RUN_JOB_NAME=lucia-mybrocorp-catalog-agent`

Supported JSON actions:

- `queue_catalog_job`
- `get_catalog_job`
- `list_recent_catalog_jobs`
- `record_catalog_review`

All requests use this envelope:

```json
{
  "token": "<shared-token>",
  "action": "queue_catalog_job",
  "data": {}
}
```

The WordPress side must send this request from server-side code, not from browser JavaScript, so the token is not exposed to the customer browser.

## Verification Checklist

Run the following acceptance checks after both profiles are installed:

1. Queue a `current_tab` job from `mybrocorp@gmail.com` and verify only `lucia-mybrocorp` claims it.
2. Queue a `current_tab` job from `nacho.saski@gmail.com` and verify only `nacho-saski` claims it.
3. Queue a `selected_tabs` job that combines at least two compatible yearly tabs and verify the merged PDF is produced.
4. Confirm the completed row includes:
   - `result_file_id`
   - `result_file_url`
   - `result_artwork_count`
   - blank review fields ready for later approval workflow
5. Open the sidebar on an incompatible tab and verify it lists the exact missing required headers instead of queueing a broken job.
6. Remove both the explicit folder input and the profile default folder, then confirm the sidebar blocks queueing.
7. Deploy the Apps Script Web App, send a token-authenticated `queue_catalog_job` request from a controlled local client, and verify the row appears in `catalog_jobs`.
8. Poll the queued job through `get_catalog_job`, then verify the on-demand Cloud Run execution completes and the completed response includes `result_file_url`.
9. Record an approval with `record_catalog_review` and verify the job row includes `review_status`, `reviewed_at`, and `reviewed_by`.

## Common Operational Issues

- `Authenticated Google identity <email> does not match configured <email>.`
  The OAuth token belongs to the wrong Google account for the selected profile.

- `Sheet "<title>" is missing required headers: ...`
  The local agent received a tab that no longer satisfies the canonical catalog contract.

- `An output folder is required before queueing a job.`
  The profile row and the sidebar input both lack a Drive folder id.

- `failed code=pdf_render_failed message=Unable to render PDF output: ...`
  Chromium could not start or the catalog images did not finish loading in the render window. Verify the local runtime can launch Puppeteer outside any restrictive sandbox, and on macOS confirm `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` exists.

- `Catalog API token is not configured.`
  The Apps Script Web App was called before setting `CATALOG_API_TOKEN` in script properties.

- `Unauthorized catalog API request.`
  The WordPress-side token does not match the Apps Script `CATALOG_API_TOKEN` property.

- `Catalog API Web App is not reachable from WordPress.`
  The Apps Script Web App returned Google access-denied HTML before catalog token validation. Redeploy the Web App with access set to `Anyone`, confirm the deployment URL still matches `LUCIA_CATALOG_API_URL`, then send a no-secret probe with a dummy token. A reachable endpoint should return JSON containing `Unauthorized catalog API request`, not HTTP 403.

- `Cloud Run catalog worker trigger failed with HTTP ...`
  The Apps Script Web App queued the job but could not start the Cloud Run Job. Verify the Apps Script trigger properties, OAuth scopes, and `roles/run.invoker` access for the account that executes the Web App.
