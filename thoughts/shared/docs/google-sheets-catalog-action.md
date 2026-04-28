# Google Sheets Catalog Action

This guide documents the first local rollout of the Google Sheets catalog action described in [thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md](/Users/nacho/saski/mybroworld/thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md).

## Components

The implementation is split into two installable parts:

1. A bound Google Apps Script project stored in [catalog-generator/apps-script](/Users/nacho/saski/mybroworld/catalog-generator/apps-script)
2. A local `catalog-agent` process stored in [catalog-generator/catalog-agent](/Users/nacho/saski/mybroworld/catalog-generator/catalog-agent)

The sheet writes jobs into `catalog_jobs`. The local agent claims only jobs whose `execution_profile` matches its own config.

## Workbook Install

1. Open the target spreadsheet.
2. Create or open the bound Apps Script project.
3. Copy the files from [catalog-generator/apps-script](/Users/nacho/saski/mybroworld/catalog-generator/apps-script) into the bound project:
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

1. Copy [catalog-generator/catalog-agent/config.example.json](/Users/nacho/saski/mybroworld/catalog-generator/catalog-agent/config.example.json) to the target macOS user profile:
   - `~/Library/Application Support/MyBroworld/catalog-agent/config.json`
2. Update the copied config with the real local paths for that user:
   - `profileKey`
   - `googleAccountEmail`
   - `workspaceRoot`
   - `generatorDir`
   - `watchSpreadsheetIds`
   - `oauthClientPath`
   - `oauthTokenPath`
3. Place the Google OAuth desktop client JSON outside the repository.
4. Run the one-time authorization flow:

```bash
cd /Users/nacho/saski/mybroworld/catalog-generator
npm run catalog-agent:authorize -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

5. Verify the token was stored at the configured `oauthTokenPath`.
6. Run one controlled poll:

```bash
cd /Users/nacho/saski/mybroworld/catalog-generator
npm run catalog-agent:once -- --config ~/Library/Application\ Support/MyBroworld/catalog-agent/config.json
```

7. After verification, install the user-level LaunchAgent that runs:

```bash
cd /Users/nacho/saski/mybroworld/catalog-generator
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

## Verification Checklist

Run the following acceptance checks after both profiles are installed:

1. Queue a `current_tab` job from `mybrocorp@gmail.com` and verify only `lucia-mybrocorp` claims it.
2. Queue a `current_tab` job from `nacho.saski@gmail.com` and verify only `nacho-saski` claims it.
3. Queue a `selected_tabs` job that combines at least two compatible yearly tabs and verify the merged PDF is produced.
4. Confirm the completed row includes:
   - `result_file_id`
   - `result_file_url`
   - `result_artwork_count`
5. Open the sidebar on an incompatible tab and verify it lists the exact missing required headers instead of queueing a broken job.
6. Remove both the explicit folder input and the profile default folder, then confirm the sidebar blocks queueing.

## Common Operational Issues

- `Authenticated Google identity <email> does not match configured <email>.`
  The OAuth token belongs to the wrong Google account for the selected profile.

- `Sheet "<title>" is missing required headers: ...`
  The local agent received a tab that no longer satisfies the canonical catalog contract.

- `An output folder is required before queueing a job.`
  The profile row and the sidebar input both lack a Drive folder id.

- `failed code=pdf_render_failed message=Unable to render PDF output: ...`
  Chromium could not start in the current environment. Verify the local runtime can launch Puppeteer outside any restrictive sandbox.
