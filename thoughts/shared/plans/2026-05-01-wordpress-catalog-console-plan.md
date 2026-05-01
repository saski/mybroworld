# WordPress Catalog Console Plan

## Overview

Build a WordPress-based catalog console so the customer can generate and review PDF catalogs without using the terminal or manually operating the Google Sheet catalog sidebar.

The recommended architecture keeps WordPress as the operator UI and keeps the existing Google Sheet queue plus local catalog agent as the rendering backend. WordPress should queue and monitor jobs; it should not run Node, Puppeteer, or long PDF generation work on the production hosting account.

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
- Customer-owned portability remains pending until a `lucia-mybrocorp` worker authenticated as `mybrocorp@gmail.com` completes a production WordPress job from the customer's mybro WordPress account.

## Desired End State

- A customer-facing WordPress admin page, for example `Catalog PDFs`, is available to the customer after login.
- The page defaults to the production catalog profile and workbook scope, with advanced choices hidden or minimized.
- The customer can click one primary button to queue a catalog generation job.
- The page shows job progress states from `catalog_jobs`: `queued`, `claimed`, `exporting`, `merging`, `rendering`, `uploading`, `completed`, or `failed`.
- When the job completes, the page shows the Drive result link and a review action.
- The customer can mark the generated catalog as `approved` or `needs_changes` with an optional note.
- Review state is stored durably with the generation job so future sessions can see which PDF was approved.
- The portable production path runs through `mybrocorp@gmail.com`, the `lucia-mybrocorp` execution profile, and the customer's mybro WordPress account without depending on Nacho's Mac, OAuth token, or Google Cloud ownership.
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

Progress: deployed and verified end-to-end with the local `nacho-saski` catalog agent. Customer-owned Google/OAuth verification is tracked in Phase 6.

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
- Development smoke Google Cloud project: `mybroworld-catalog-260501` (`MyBroworld Catalog Agent`), owned by `nacho.saski@gmail.com`. This proves the integration path only; it is not the final customer-owned production credential boundary.
- Development OAuth app/client: `MyBroworld Catalog Agent` / `Catalog Agent Local Desktop Client`, configured for `nacho.saski@gmail.com` as a test user.
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

Progress: production deployed and validated with the configured `nacho-saski` catalog worker. Customer-owned portability is pending Phase 6.

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

### Phase 6: Customer-Owned Handoff And Portability

Progress: pending.

Make the production workflow portable so the customer can operate it from `mybrocorp@gmail.com` and the mybro WordPress account without depending on the current operator Mac, Nacho's OAuth token, or Nacho-owned Google Cloud resources.

Required actions:

1. [ ] Confirm the Apps Script project and Web App can be administered, redeployed, and recovered by `mybrocorp@gmail.com` or another customer-controlled Google account.
2. [ ] Create or transfer the production Google Cloud OAuth desktop client so the `lucia-mybrocorp` worker credentials are controlled by the customer account family, not only by `nacho.saski@gmail.com`.
3. [ ] Install the catalog generator and `catalog-agent` config on the intended customer or always-on machine with:
   - `profileKey = lucia-mybrocorp`
   - `googleAccountEmail = mybrocorp@gmail.com`
   - the production spreadsheet id in `watchSpreadsheetIds`
   - OAuth client and token files outside git under that user's profile
4. [ ] Authorize the worker in a browser session for `mybrocorp@gmail.com` and verify the agent fails fast if any other Google identity is used.
5. [ ] Install and start the `com.mybroworld.catalog-agent` LaunchAgent for the customer-owned worker account.
6. [ ] Verify the worker claims only `lucia-mybrocorp` jobs and ignores `nacho-saski` jobs.
7. [ ] Verify the configured Drive output folder is writable by `mybrocorp@gmail.com` and that completed PDFs are readable from the customer's browser session.
8. [ ] Log into production WordPress as the customer's mybro account and verify the `Catalog PDFs` page is visible.
9. [ ] Queue one production catalog from that mybro WordPress account and complete it through the `lucia-mybrocorp` worker.
10. [ ] Confirm the completed row records the customer WordPress identity, shows the Drive PDF link, and persists `approved` or `needs_changes` after reload.

Completion criteria:

- A production WordPress job queued by the customer's mybro WordPress account completes through a `lucia-mybrocorp` worker authenticated as `mybrocorp@gmail.com`.
- The job does not require the `nacho-saski` LaunchAgent, Nacho's OAuth token, or a Nacho-only Google Cloud project.
- The final operator workflow and recovery notes are recorded in `wordpress/README.md`, `thoughts/shared/docs/google-sheets-catalog-action.md`, and `PROJECT_STATUS.md`.

## Risks And Mitigations

- If the local catalog agent is offline, WordPress should show the last heartbeat and explain that the job is waiting for the catalog worker.
- If the Apps Script Web App token is wrong, WordPress should fail before creating a job and show a precise configuration error.
- If the Drive result is not embeddable, WordPress should show a direct link instead of depending on iframe preview.
- If production hosting blocks outbound HTTP to Apps Script, switch only the transport layer: let browser AJAX call Apps Script directly with a short-lived nonce issued by WordPress, or move to Option B.
- If the customer needs public page access instead of wp-admin access, add a shortcode later using the same backend and capability/token model.

## First Implementation Step

Start with Phase 1 by adding one failing test for the review fields in `catalog-generator/test/catalog-action-contract.test.mjs`, then update `catalog-generator/src/catalog-action-contract.mjs` and the documented job schema.
