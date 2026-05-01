# Google Sheets Catalog Action

This guide documents the first local rollout of the Google Sheets catalog action described in [thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md](../plans/2026-04-19-google-sheets-catalog-action/contracts.md).

## Components

The implementation is split into two installable parts:

1. A bound Google Apps Script project stored in [catalog-generator/apps-script](../../../catalog-generator/apps-script)
2. A local `catalog-agent` process stored in [catalog-generator/catalog-agent](../../../catalog-generator/catalog-agent)

The sheet writes jobs into `catalog_jobs`. The local agent claims only jobs whose `execution_profile` matches its own config.

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
3. Create or reuse a Google Cloud OAuth desktop client owned by the same Google account family as the target profile. For the `nacho-saski` profile, use the personal project `mybroworld-catalog-260501` and OAuth app `MyBroworld Catalog Agent`, not any Eventbrite app.
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
- Use an access mode reachable by the production WordPress server.
- Store the deployed Web App URL in WordPress configuration outside tracked files.
- Keep the shared API token, OAuth client JSON, and OAuth token files outside the repository.

Before deployment, set the script property:

- `CATALOG_API_TOKEN`

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
8. Poll the queued job through `get_catalog_job`, then run the local agent once and verify the completed response includes `result_file_url`.
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
