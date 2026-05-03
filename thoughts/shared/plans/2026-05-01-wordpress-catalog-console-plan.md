# WordPress Catalog Console Plan

## Overview

Build a WordPress-based catalog console so the customer can generate and review PDF catalogs without using the terminal or manually operating the Google Sheet catalog sidebar.

The recommended architecture keeps WordPress as the operator UI and keeps the existing Google Sheet queue as the operational queue. The rendering backend should move from the current local catalog agent to an on-demand Cloud Run Job in the existing Google Cloud project `mybroworld-catalog-260501`, which is administered and billed by `nacho.saski@gmail.com`. WordPress should queue and monitor jobs; it should not run Node, Puppeteer, or long PDF generation work on the production hosting account.

Project tenet: avoid commercial paid WordPress plugins, including freemium plugins. The catalog console should be built with owned MU plugin code, WordPress core APIs, WooCommerce core only if needed, and the smallest unavoidable third-party dependency surface. Open-source plugins or add-ons may be considered only when they meet a clear quality bar and keep the implementation leaner and simpler than owned code.

## Sources Of Truth

- `catalog-generator/README.md`
- `thoughts/shared/docs/google-sheets-catalog-action.md`
- `thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md`
- `thoughts/shared/docs/artwork-data-contract.md`
- `wordpress/README.md`
- `PROJECT_STATUS.md`
- `catalog-generator/catalog-agent/src/agent.mjs`
- `catalog-generator/apps-script/Code.gs`

## Current State

- `catalog-generator` can render a PDF from canonical catalog CSV data with Puppeteer. On macOS it falls back to the existing system Google Chrome executable when Puppeteer's managed Chrome cache is empty.
- The bound Apps Script flow already creates `catalog_profiles` and `catalog_jobs` helper sheets and can queue jobs from the Google Sheet UI.
- The local `catalog-agent` can poll `catalog_jobs`, claim matching jobs by `execution_profile`, render the PDF, upload it to Google Drive, and write result metadata back to the queue.
- WordPress custom code is maintained as owned theme and MU plugin code under `wordpress/wp-content/`.
- Production-like local WordPress validation currently uses the imported `glacier` snapshot, so the catalog console should live in an MU plugin rather than depending on the owned theme being active.
- WooCommerce inventory sync is related but separate. PDF catalog generation should continue to use the canonical Google Sheet contract and its catalog inclusion flags.
- Production WordPress code is deployed and can queue catalog jobs, but the current validated worker path still depends on the `nacho-saski` LaunchAgent and Google OAuth setup on this Mac.
- Customer-operable portability remains pending until a `lucia-mybrocorp` worker running in Cloud Run, authorized for `mybrocorp@gmail.com`, completes a production WordPress job from the customer's mybro WordPress account while the local `nacho-saski` worker is not involved.

## Desired End State

- A customer-facing WordPress admin page, for example `Catalog PDFs`, is available to the customer after login.
- The page defaults to the production catalog profile and workbook scope, with advanced choices hidden or minimized.
- The customer can click one primary button to queue a catalog generation job.
- The page shows job progress states from `catalog_jobs`: `queued`, `claimed`, `exporting`, `merging`, `rendering`, `uploading`, `completed`, or `failed`.
- When the job completes, the page shows the Drive result link and a review action.
- The customer can mark the generated catalog as `approved` or `needs_changes` with an optional note.
- Review state is stored durably with the generation job so future sessions can see which PDF was approved.
- The portable production path runs through `mybrocorp@gmail.com`, the `lucia-mybrocorp` execution profile, and the customer's mybro WordPress account without depending on Nacho's Mac or Nacho's OAuth token. Google Cloud infrastructure and billing may remain Nacho-managed in project `mybroworld-catalog-260501`.
- No Google OAuth token, API token, client secret, or generated PDF artifact is committed to this repository.

## Out Of Scope

- Editing source artwork data from WordPress.
- Running Puppeteer or the Node generator inside WordPress hosting.
- Replacing the existing Google Sheet queue with a new production queue in this increment.
- Automatic stale-job retry or cancellation.
- Production WooCommerce inventory mutation.
- Public visitor access to the catalog console.
- Adding commercial paid or freemium WordPress plugins for queueing, PDF generation, admin UI, job monitoring, or review workflow.
- Adding open-source WordPress plugins or add-ons without a documented quality, simplicity, maintenance, and rollback review.

## Architecture Options

### Option A: WordPress Console To Apps Script Queue API

WordPress posts a signed server-side request to an Apps Script Web App endpoint. Apps Script validates the token, reuses the existing workbook logic, appends a `catalog_jobs` row, and returns the job id. WordPress then polls the same endpoint for job status and sends review decisions back to the queue.

This is the recommended first implementation because it reuses the existing catalog queue, keeps Google Sheet tab discovery in one place, and avoids requiring the production WordPress host to run PDF rendering.

Tradeoffs:

- Requires deploying the bound Apps Script as a Web App.
- Requires one shared API token stored in WordPress config and Apps Script script properties.
- Requires a small Apps Script API layer around the existing queue functions.

Production portability extension:

- The existing local `catalog-agent` should be containerized and run as a Cloud Run Job.
- Apps Script should invoke one-pass worker executions through the Cloud Run Admin API `jobs.run` method immediately after queueing a production `lucia-mybrocorp` job, instead of relying on a macOS LaunchAgent or worker polling scheduler.
- Secret Manager should hold the Cloud Run worker config, OAuth client JSON, and `mybrocorp@gmail.com` OAuth token material outside git.
- The Cloud Run service account should only need enough Google Cloud IAM access to read those secrets and run the job; Sheets and Drive access should continue to come from the configured `mybrocorp@gmail.com` authorization unless the implementation is explicitly migrated to a service account later.

### Option B: WordPress Queue With Agent Polling WordPress

WordPress owns a custom REST queue, and the local catalog agent learns to poll WordPress instead of Google Sheets.

This may be useful later if WordPress must become the operational system of record, but it duplicates queue/status logic and is larger than needed for the first customer-autonomy step.

### Rejected First Step: Direct PDF Generation In WordPress

Calling Node/Puppeteer from PHP on the production WordPress host is not a good first step. PDF rendering can be slow, host-dependent, and hard to secure or monitor on shared hosting.

## Phased Implementation

### Phase 1: Extend The Catalog Job Contract

Progress: complete.

Add review fields to the shared catalog job contract before touching UI code.

Expected files:

- `catalog-generator/src/catalog-action-contract.mjs`
- `catalog-generator/test/catalog-action-contract.test.mjs`
- `thoughts/shared/plans/2026-04-19-google-sheets-catalog-action/contracts.md`
- `thoughts/shared/docs/google-sheets-catalog-action.md`

Contract additions:

- `review_status`: blank, `approved`, or `needs_changes`
- `reviewed_at`: UTC ISO timestamp
- `reviewed_by`: best-effort WordPress user display name or email
- `review_notes`: optional short text

Automated success criteria:

- [x] A failing test is added first for the new review fields.
- [x] `npm --prefix catalog-generator test -- --test-name-pattern catalog-action-contract` passes.

### Phase 2: Add An Apps Script Queue API

Progress: deployed and verified end-to-end with the local `nacho-saski` catalog agent. Cloud Run `lucia-mybrocorp` production worker verification is tracked in Phase 6.

Expose a minimal JSON API from the existing bound Apps Script while preserving the current Google Sheets sidebar.

Expected files:

- `catalog-generator/apps-script/Code.gs`
- `catalog-generator/apps-script/CatalogSidebar.html` only if shared labels or status links need adjustment
- `thoughts/shared/docs/google-sheets-catalog-action.md`

Required actions:

- `queue_catalog_job`: create a new job row from a trusted WordPress request.
- `get_catalog_job`: return status, error fields, result URL, artwork count, and review fields.
- `list_recent_catalog_jobs`: return the most recent jobs for the console.
- `record_catalog_review`: write `approved` or `needs_changes` review fields.

Security rules:

- Validate a shared token from the request against `PropertiesService.getScriptProperties()`.
- Keep the token out of repository files.
- Validate catalog title, profile, folder, scope, and selected sheet ids before queueing.
- Return precise error messages for missing profile, incompatible tabs, and missing output folder.

Automated success criteria:

- [x] Shared pure queue behavior remains covered by `npm --prefix catalog-generator test`.
- [x] Existing Google Sheets action behavior remains compatible with the documented job schema.

Manual success criteria:

- [x] A local test POST can queue one job into `catalog_jobs`.
- [x] `npm --prefix catalog-generator run catalog-agent:once -- --config <local-config>` can complete a queued job.
- [x] The Apps Script API returns the completed `result_file_url`.

Deployment notes:

- Apps Script project: `MyBroworld Catalog Action`
- Script id: `1C0BfkhSDExiq7Ik4jvxoeGzMtNqQsAolMpBzpCqd81iuB5datD43bkot`
- Web App URL: `https://script.google.com/macros/s/AKfycbz9C2jMtj42LWgWFl1duHEFUiGqs0b6svz0zgcOJjeSQtBUl-8j_iTH7S2iAUIAKVBJ/exec`
- Deployment access: `Anyone`, with `CATALOG_API_TOKEN` enforced by Apps Script.
- `setupCatalogInfrastructure` completed from the Apps Script editor on 2026-05-01.
- Token-authenticated `list_recent_catalog_jobs` returned HTTP 200 with `ok: true`.
- Token-authenticated `queue_catalog_job` created smoke-test job `catalog_20260501_110033_b323` for sheet `2026` (`gid=102593401`).
- Token-authenticated `get_catalog_job` returned the smoke-test job in `queued` status.
- Local catalog-agent config and OAuth files are stored outside git under `~/Library/Application Support/MyBroworld/catalog-agent/`.
- Google Cloud project: `mybroworld-catalog-260501` (`MyBroworld Catalog Agent`), owned and billed by `nacho.saski@gmail.com`. The project is the intended production Cloud Run runtime boundary.
- Development OAuth app/client: `MyBroworld Catalog Agent` / `Catalog Agent Local Desktop Client`, configured for `nacho.saski@gmail.com` as a test user. This specific local OAuth token proves the integration path only; Phase 6 must create/store production worker token material authorized by `mybrocorp@gmail.com`.
- OAuth scopes configured and granted: Google Sheets, Google Drive, OpenID, email, and profile.
- The first smoke job, `catalog_20260501_110033_b323`, failed before the renderer fix because Puppeteer had no managed Chrome cache and the initial token lacked Sheets/Drive scopes.
- After regenerating the OAuth token and updating the renderer, token-authenticated `queue_catalog_job` created smoke-test job `catalog_20260501_113219_5614`.
- `npm --prefix catalog-generator run catalog-agent:once -- --config "$HOME/Library/Application Support/MyBroworld/catalog-agent/config.json"` completed `catalog_20260501_113219_5614`.
- Token-authenticated `get_catalog_job` returned `status: completed`, `result_artwork_count: 14`, and Drive result URL `https://drive.google.com/file/d/10_S6k5IhAHiR7TJytMHNHS2lMDahdQsn/view?usp=drivesdk`.

### Phase 3: Add The WordPress MU Plugin Console Backend

Progress: complete.

Add an MU plugin module so the console works regardless of whether production is using the owned theme or the imported `glacier` theme.

Expected files:

- `wordpress/wp-content/mu-plugins/lucia-bootstrap.php`
- `wordpress/wp-content/mu-plugins/lucia-catalog-console.php`
- `wordpress/wp-content/mu-plugins/tests/lucia-catalog-console-test.php`
- `wordpress/README.md`
- `thoughts/shared/docs/deploy-wordpress.md`

Backend responsibilities:

- Register an authenticated admin page such as `Catalog PDFs`.
- Store endpoint URL, default profile, default Drive folder, default active sheet id, and shared token outside tracked files.
- Provide WordPress AJAX handlers for queue, status, recent jobs, and review actions.
- Use WordPress nonces for browser requests.
- Require an appropriate capability, preferably `manage_woocommerce` for shop operators or a custom capability if needed.
- Send server-side `wp_remote_post` requests to Apps Script, so the browser never sees the shared token.
- Avoid adding plugin dependencies for this console by default; implement the small needed surface in owned MU plugin code unless an open-source dependency clearly passes the lean quality review.

Implemented backend surface:

- MU plugin file: `wordpress/wp-content/mu-plugins/lucia-catalog-console.php`
- Bootstrap include: `wordpress/wp-content/mu-plugins/lucia-bootstrap.php`
- AJAX actions:
  - `lucia_catalog_console_queue`
  - `lucia_catalog_console_get_job`
  - `lucia_catalog_console_recent_jobs`
  - `lucia_catalog_console_review`
- Runtime config constants or environment variables:
  - `LUCIA_CATALOG_API_URL`
  - `LUCIA_CATALOG_API_TOKEN`
  - `LUCIA_CATALOG_DEFAULT_PROFILE`
  - `LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID`
  - `LUCIA_CATALOG_DEFAULT_ACTIVE_SHEET_ID`
  - optional `LUCIA_CATALOG_DEFAULT_SCOPE_MODE`
  - optional `LUCIA_CATALOG_CONSOLE_CAPABILITY`

Automated success criteria:

- [x] A failing PHP test is added first for request sanitization or permission behavior.
- [x] `scripts/wp-test-owned-code.sh` passes.

### Phase 4: Build The Customer Console UI

Progress: complete and validated end-to-end from the local WordPress admin UI.

Build the admin UI as a focused operational screen, not a marketing page.

Expected files:

- `wordpress/wp-content/mu-plugins/lucia-catalog-console.php`
- Optional extracted admin asset files only if the UI grows beyond a small inline screen.

Required UI states:

- Ready to generate
- Queued
- In progress, with the current status label
- Completed, with Drive link and review actions
- Failed, with the clear error message from the queue
- Agent offline or stale, inferred from old `heartbeat_at`

Required controls:

- Primary `Generate PDF` action.
- Catalog title input with a sensible default.
- Scope selector for current year or all compatible years, with production default preselected.
- Recent jobs list with status, result link, and review state.
- `Approve` and `Needs changes` review buttons after a result is available.

Dependency rule:

- Do not add commercial paid or freemium plugins for the admin UI.
- Use plain WordPress admin markup, small owned JavaScript if needed, and existing WordPress AJAX/REST primitives.
- If an open-source dependency is proposed later, document why owned code or core APIs are insufficient, verify minimum quality, and record the rollback path before implementation.

Automated success criteria:

- [x] `scripts/wp-test-owned-code.sh` passes.
- [x] `WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh` passes against the local production-like runtime.

Manual success criteria:

- [x] Customer can queue a PDF from WordPress without opening Google Sheets.
- [x] Completed PDF link appears in WordPress.
- [x] Review state persists and is visible after page reload.

Implementation notes:

- The admin screen lives in owned MU plugin code at `wordpress/wp-content/mu-plugins/lucia-catalog-console.php`.
- The UI uses plain WordPress admin markup, inline owned JavaScript, WordPress nonces, and server-side AJAX requests. The browser never receives `LUCIA_CATALOG_API_TOKEN`.
- WordPress HTTP follows Apps Script redirects in a way that Google rejects for this Web App response. The MU plugin disables automatic redirects for the Apps Script POST and follows the allowed Google result redirect with a GET.
- Local Docker runtime config was set outside git in `wp-config.php` constants for the Apps Script URL, token, default profile, Drive folder, active sheet id, and scope.
- Manual UI validation on 2026-05-01 queued `catalog_20260501_120151_899f` from `http://localhost:8080/wp-admin/admin.php?page=lucia-catalog-console`.
- The local catalog agent completed the job with `result_artwork_count: 14` and Drive result URL `https://drive.google.com/file/d/1XEaPUZc9H4svbDj12eFfDP4C7vHgADOy/view?usp=drivesdk`.
- The WordPress UI displayed the completed `Open PDF` link, saved the review as `approved`, and the approved state remained visible after reloading the admin page.

### Phase 5: Roll Out Safely

Progress: production deployed and validated with the configured `nacho-saski` catalog worker. Cloud Run customer-operable portability is pending Phase 6.

Deploy and validate the workflow one environment at a time.

Expected files:

- `thoughts/shared/docs/deploy-wordpress.md`
- `thoughts/shared/docs/google-sheets-catalog-action.md`
- `wordpress/README.md`
- `PROJECT_STATUS.md`

Rollout steps:

1. [x] Deploy or update the bound Apps Script Web App.
2. [x] Configure the Apps Script shared token as a script property.
3. [x] Configure WordPress endpoint URL and token outside git.
4. [x] Deploy the MU plugin through the owned-code deployment workflow.
5. [x] Confirm the current operator Mac catalog agent is installed as a LaunchAgent and watching the production spreadsheet id.
6. [x] Queue one test job from WordPress using the configured execution profile.
7. [x] Queue one production WordPress validation job with the operator present.
8. [x] Record the final operator workflow in the docs.

Automated success criteria:

- [x] `scripts/wp-test-owned-code.sh` passes before deployment.
- [x] `scripts/wp-push-theme.sh --dry-run` shows only expected owned files.
- [x] Post-deploy WordPress smoke checks pass for the production site.

Manual success criteria:

- [x] The production WordPress console can queue and complete a catalog through the current `nacho-saski` worker.
- [ ] The customer can generate and review a catalog from the mybro WordPress account through a `lucia-mybrocorp` worker authenticated as `mybrocorp@gmail.com`, without relying on Nacho's Mac or OAuth token.

Deployment notes:

- Production owned-code upload completed on 2026-05-01 through FTP to `/public/wp-content/themes/luciastuy` and `/public/wp-content/mu-plugins`.
- DonDominio's FTP certificate is valid for `*.dondominio.com`, so the deployment used `WP_FTP_HOST=ftp.dondominio.com` while keeping the same remote `/public` paths.
- `scripts/wp-push-theme.sh` now uses idempotent `mkdir -pf` in its `lftp` script because this FTP server exits non-zero when `mkdir -p` targets an existing directory.
- Production `wp-config.php` now contains the catalog runtime constants outside git: Apps Script URL, token, default profile, default Drive folder, active sheet id, and scope mode.
- The local LaunchAgent `com.mybroworld.catalog-agent` is installed and running for `nacho-saski`, watching spreadsheet `15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw`.
- Production smoke checks returned HTTP 200 for `/`, `/shop/`, `/cart/`, `/checkout/`, and `/product/bottle/` after upload and after the production config update.
- Production WordPress validation job `catalog_20260501_145137_9d09` was queued from `https://www.luciastuy.com/wp-admin/admin.php?page=lucia-catalog-console` with title `demo con clienta`.
- The catalog worker completed that job with `result_artwork_count: 14` and Drive result URL `https://drive.google.com/file/d/11mI1A6FWVZE0pcRIE0QERA7KFqRAM5PM/view?usp=drivesdk`.
- The production WordPress UI showed the completed `Open PDF` link and persisted the review state as `needs_changes`, reviewed by `nacho saski`.

### Phase 6: Customer-Operable Cloud Run Handoff

Progress: Cloud Run worker image, secrets, job, production WordPress profile switch, direct `lucia-mybrocorp` Cloud Run PDF verification, production monitoring, and Apps Script source support for on-demand worker startup are complete. The remaining handoff gates are deploying the updated Apps Script Web App, setting trigger properties, granting Cloud Run invoke access to the Web App executing account, pausing the legacy worker polling scheduler, and running a customer-account WordPress validation job that records the customer identity and persists review state through the `lucia-mybrocorp` worker.

Make the production workflow portable so the customer can operate it from `mybrocorp@gmail.com` and the mybro WordPress account without depending on the current operator Mac or Nacho's OAuth token. The Google Cloud project and billing account remain Nacho-managed: project `mybroworld-catalog-260501`, billing covered by `nacho.saski@gmail.com`.

Required actions:

1. [x] Confirm `mybroworld-catalog-260501` is the production Google Cloud runtime project and that its billing remains attached to Nacho's billing account.
2. [x] Decide whether `mybrocorp@gmail.com` needs Google Cloud visibility. Daily operation should not require Google Cloud access; no customer Google Cloud role is required for the initial handoff because the operator workflow is WordPress plus Drive. If visibility is useful later, grant only the smallest role set needed for viewing Cloud Run jobs/logs or manually rerunning the job.
3. [x] Enable or verify the required Google Cloud APIs in `mybroworld-catalog-260501`: Cloud Run, Cloud Scheduler, Secret Manager, Artifact Registry, Cloud Build, Google Sheets API, and Google Drive API.
4. [x] Add the minimal Cloud Run packaging path for the catalog worker:
   - container image with Node, project dependencies, and Chromium/Puppeteer runtime support
   - one-pass command equivalent to `npm run catalog-agent:once`
   - writable runtime directory for temporary CSV, PDF, and OAuth refresh artifacts
   - no generated PDF, OAuth token, OAuth client secret, or API token committed to git
5. [x] Store Cloud Run worker runtime material in Secret Manager:
   - `profileKey = lucia-mybrocorp`
   - `googleAccountEmail = mybrocorp@gmail.com`
   - the production spreadsheet id in `watchSpreadsheetIds`
   - OAuth client JSON from the existing Google Cloud project
   - OAuth token material authorized by `mybrocorp@gmail.com`
6. [x] Ensure the container entrypoint materializes read-only secrets into a writable runtime path when needed, because the current OAuth refresh flow writes updated token data to `oauthTokenPath`.
7. [x] Create a dedicated Cloud Run service account with least-privilege Google Cloud IAM, primarily Secret Manager secret access for the worker secrets and enough permissions to run/log the job.
8. [x] Create the `lucia-mybrocorp` Cloud Run Job in `mybroworld-catalog-260501`.
9. [x] Implement Apps Script support for starting the Cloud Run Job on demand after a `lucia-mybrocorp` job is queued.
10. [ ] Deploy the updated Apps Script Web App, set the `CATALOG_CLOUD_RUN_*` trigger properties, and grant `roles/run.invoker` on the Cloud Run Job to the Web App executing account.
11. [ ] Pause the legacy `lucia-mybrocorp-catalog-agent-every-5m` worker polling scheduler after the Apps Script trigger is validated.
12. [x] Run the Cloud Run Job manually and verify it authenticates as `mybrocorp@gmail.com`, fails fast for any other configured identity, claims only `lucia-mybrocorp` jobs, ignores `nacho-saski` jobs, uploads the PDF to Drive, and writes completion metadata back to `catalog_jobs`.
13. [ ] Verify the configured Drive output folder is writable by `mybrocorp@gmail.com` and that completed PDFs are readable from the customer's browser session.
14. [ ] Log into production WordPress as the customer's mybro account and verify the `Catalog PDFs` page is visible.
15. [ ] Queue one production catalog from that mybro WordPress account and complete it through the Apps Script-triggered Cloud Run `lucia-mybrocorp` worker with the local `nacho-saski` LaunchAgent stopped or irrelevant.
16. [ ] Confirm the completed row records the customer WordPress identity, shows the Drive PDF link, and persists `approved` or `needs_changes` after reload.

Implementation notes:

- 2026-05-02: `mybroworld-catalog-260501` was confirmed by the operator as the intended production Google Cloud project, with billing covered by `nacho.saski@gmail.com`.
- 2026-05-02: Added `catalog-generator/Dockerfile.catalog-agent`, `catalog-generator/.dockerignore`, and `catalog-generator/cloud-run/cloudbuild.yaml`.
- 2026-05-02: Added `npm run catalog-agent:cloud-run-once`, which materializes Secret Manager-provided JSON into a writable runtime directory before running one agent polling pass.
- 2026-05-02: Added automated coverage in `catalog-generator/test/catalog-agent-cloud-run-runtime.test.mjs` for secret materialization into writable `config.json`, `oauth-client.json`, and `oauth-token.json` paths.
- 2026-05-02: Local Docker image `mybroworld-catalog-agent:test` built successfully from `catalog-generator/Dockerfile.catalog-agent`.
- 2026-05-02: Running the built image without secrets fails fast with `cloud_run_secret_missing`, before any job can be claimed.
- 2026-05-02: Billing was linked to Nacho's `Mybroworld billing account` (`0143F0-C18C6D-EDAFFD`) and verified as enabled for `mybroworld-catalog-260501`.
- 2026-05-02: Required production APIs were verified as enabled: Cloud Run, Cloud Scheduler, Secret Manager, Artifact Registry, Cloud Build, Google Sheets API, and Google Drive API.
- 2026-05-02: Created Artifact Registry Docker repository `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld`.
- 2026-05-02: Cloud Build successfully built and pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:latest` from build `2b258825-874d-48da-8dea-a9dc734d9e3a`.
- 2026-05-02: Created dedicated service account `catalog-agent-runner@mybroworld-catalog-260501.iam.gserviceaccount.com`.
- 2026-05-02: Created Secret Manager containers `catalog-agent-config`, `catalog-agent-oauth-client`, and `catalog-agent-oauth-token`; secret versions are still pending the `mybrocorp@gmail.com` OAuth token.
- 2026-05-02: Stored Secret Manager version 1 for `catalog-agent-config` and `catalog-agent-oauth-client`; `catalog-agent-oauth-token` is pending successful `mybrocorp@gmail.com` OAuth authorization.
- 2026-05-02: Granted `roles/secretmanager.secretAccessor` on `catalog-agent-config`, `catalog-agent-oauth-client`, and `catalog-agent-oauth-token` to `catalog-agent-runner@mybroworld-catalog-260501.iam.gserviceaccount.com`.
- 2026-05-02: Two local OAuth authorization attempts for `mybrocorp@gmail.com` timed out before the loopback redirect completed. Next attempt should confirm the browser consent finishes successfully; if Google shows `access_denied`, add `mybrocorp@gmail.com` as a test user on the existing OAuth app before retrying.
- 2026-05-02: Confirmed the OAuth app is in Testing mode and `mybrocorp@gmail.com` is listed as a test user in Google Auth Platform Audience.
- 2026-05-02: OAuth authorization completed for `mybrocorp@gmail.com`; stored Secret Manager version 1 for `catalog-agent-oauth-token`.
- 2026-05-02: Deployed Cloud Run Job `lucia-mybrocorp-catalog-agent` in `europe-west1` using service account `catalog-agent-runner@mybroworld-catalog-260501.iam.gserviceaccount.com`.
- 2026-05-02: Manual execution `lucia-mybrocorp-catalog-agent-f2hfg` completed successfully; logs showed `authenticated as mybrocorp@gmail.com` and `no queued jobs matched the configured profile`.
- 2026-05-02: Created dedicated Scheduler service account `catalog-agent-scheduler@mybroworld-catalog-260501.iam.gserviceaccount.com`, granted it `roles/run.invoker` on the Cloud Run Job, and created Cloud Scheduler job `lucia-mybrocorp-catalog-agent-every-5m` in `europe-west1`.
- 2026-05-02: Manual Scheduler run created execution `lucia-mybrocorp-catalog-agent-vd6kg`, which completed successfully and authenticated as `mybrocorp@gmail.com`.
- 2026-05-02: First automatic scheduled run created execution `lucia-mybrocorp-catalog-agent-prtpr`, completed successfully in 41.96s, authenticated as `mybrocorp@gmail.com`, and ignored the queue because no `lucia-mybrocorp` jobs were pending.
- 2026-05-02: Updated production `wp-config.php` outside git so `LUCIA_CATALOG_DEFAULT_PROFILE` is now `lucia-mybrocorp`; verified the remote file line after upload and confirmed the public site and admin login redirect still respond.
- 2026-05-02: Production WordPress job `catalog_20260502_155151_3dcb` failed during PDF rendering because Chromium refused to launch as root without `--no-sandbox` in Cloud Run.
- 2026-05-02: Added root-aware Chromium launch flags and nested cause logging for failed catalog-agent jobs; `npm --prefix catalog-generator test` passed with 41 tests.
- 2026-05-02: Cloud Build `46affd56-27fe-4656-bbaf-f195d8225b4d` pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:sandbox-fix-20260502-1818`, and Cloud Run Job `lucia-mybrocorp-catalog-agent` was updated to use that image.
- 2026-05-02: Direct verification job `catalog_20260502_161854_retry` completed through manual Cloud Run execution `lucia-mybrocorp-catalog-agent-zz8m5`, wrote `result_artwork_count: 14`, and uploaded Drive PDF `https://drive.google.com/file/d/1eR-wTNJn5mMxGzgz5CCV6xahb5mIPHwa/view?usp=drivesdk`.
- 2026-05-02: Added production monitoring. The one-shot worker now exits non-zero when a claimed job fails; `npm run catalog-agent:monitor:cloud-run` scans `catalog_jobs` for failed, stale, and incomplete jobs.
- 2026-05-02: Cloud Build `692b3cf1-69a2-4f9a-8686-9dad46dc9af0` pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:monitoring-20260502-163238`, and Cloud Run Job `lucia-mybrocorp-catalog-agent` was updated to use that image.
- 2026-05-02: Created Cloud Run Job `lucia-mybrocorp-catalog-monitor`, Cloud Scheduler job `lucia-mybrocorp-catalog-monitor-every-10m`, log metric `catalog_monitor_alerts`, notification channel `projects/mybroworld-catalog-260501/notificationChannels/12072695100356729995`, and alert policy `projects/mybroworld-catalog-260501/alertPolicies/6576773883271781072`.
- 2026-05-02: Direct monitor execution `lucia-mybrocorp-catalog-monitor-tkwkr` and Scheduler-triggered execution `lucia-mybrocorp-catalog-monitor-fncxz` both completed successfully with `[catalog-monitor] ok spreadsheets=1 jobs=2`.
- 2026-05-03: Added Apps Script on-demand worker startup. When `CATALOG_CLOUD_RUN_TRIGGER_ENABLED=true` and the queued profile matches `CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS`, `queue_catalog_job` calls `https://run.googleapis.com/v2/projects/{project}/locations/{region}/jobs/{job}:run` with the Apps Script OAuth token.

Completion criteria:

- A production WordPress job queued by the customer's mybro WordPress account completes through a Cloud Run `lucia-mybrocorp` worker authorized as `mybrocorp@gmail.com`.
- The job does not require the `nacho-saski` LaunchAgent, this Mac, or Nacho's OAuth token.
- The daily operator workflow requires only the customer's WordPress account and customer-visible Drive output; Google Cloud infrastructure remains Nacho-managed and Nacho-billed in `mybroworld-catalog-260501`.
- The final operator workflow and recovery notes are recorded in `wordpress/README.md`, `thoughts/shared/docs/google-sheets-catalog-action.md`, and `PROJECT_STATUS.md`.

## Risks And Mitigations

- If the Cloud Run worker trigger fails, WordPress should show the Apps Script error from `queue_catalog_job`; check the Apps Script trigger properties, OAuth scopes, and Cloud Run IAM before asking the customer to retry.
- If the Apps Script Web App token is wrong, WordPress should fail before creating a job and show a precise configuration error.
- If the Drive result is not embeddable, WordPress should show a direct link instead of depending on iframe preview.
- If production hosting blocks outbound HTTP to Apps Script, switch only the transport layer: let browser AJAX call Apps Script directly with a short-lived nonce issued by WordPress, or move to Option B.
- If the customer needs public page access instead of wp-admin access, add a shortcode later using the same backend and capability/token model.
- If the OAuth refresh token for `mybrocorp@gmail.com` is revoked or expires, the Cloud Run worker should fail clearly before claiming jobs and the reauthorization runbook should be documented.
- If multiple Cloud Run executions overlap, keep the existing claim-token guard so a slow PDF job does not create noisy contested runs.
- If the monitor alerts, first inspect `catalog_jobs.log_excerpt` and Cloud Logging for `lucia-mybrocorp-catalog-monitor`; do not ask the customer to retry until the failed, stale, or incomplete row has an understood cause.

## Next Implementation Step

Deploy the updated Apps Script Web App, configure the Cloud Run trigger properties and IAM grant, pause the legacy worker polling scheduler after validation, then run the remaining Phase 6 customer validation from the customer's mybro WordPress account and verify the Drive link, customer identity, and persisted review state.
