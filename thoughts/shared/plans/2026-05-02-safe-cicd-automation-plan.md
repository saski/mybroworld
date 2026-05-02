# Safe CI/CD Automation Plan

## Overview

Automate deployments for the Lucía Astuy production stack so code changes and approved source-data changes can reach production without depending on this Mac, while preserving explicit safety gates for customer-facing changes.

The recommended automation model is hybrid:

- GitHub Actions owns code validation, release orchestration, immutable build tags, and deployment approvals.
- Google Cloud keeps running the catalog worker and source monitors because the production queue, Sheets, Drive, OAuth material, Cloud Run, Scheduler, Artifact Registry, Cloud Build, and billing already live in `mybroworld-catalog-260501`.
- WordPress production code deployment remains FTP-based for now because the host is DonDominio, but the FTP deploy should be wrapped by GitHub Actions environments, backups, smoke checks, and rollback artifacts.
- Google Sheet and Drive source changes should first trigger automated validation and reporting. Auto-apply to WooCommerce should be introduced only after the dry-run reports have proven stable and the safety thresholds are encoded in tests.

## Current State

- The repository has no `.github/workflows/` automation.
- `main` is already pushed to GitHub through `origin` using the `git@github.com-saski:` SSH host alias.
- The production Cloud Run catalog worker is deployed as job `lucia-mybrocorp-catalog-agent` in `europe-west1`.
- The active production worker image was moved from the prior git-SHA tag to hotfix image `catalog-agent:sandbox-fix-20260502-1818` after the first real Cloud Run PDF render failed. CI/CD must bring production back to immutable git-SHA tags after that fix is committed and promoted.
- Cloud Scheduler runs `lucia-mybrocorp-catalog-agent-every-5m`.
- Cloud Run worker secrets are stored in Secret Manager and the worker authenticates to Google APIs as `mybrocorp@gmail.com`.
- Cloud Run runs the current catalog container as UID 0. Chromium/Puppeteer must launch with `--no-sandbox` and `--disable-setuid-sandbox` in that runtime.
- Direct Cloud Run verification job `catalog_20260502_161854_retry` completed with 14 artworks after the sandbox fix and wrote a Drive PDF result back to `catalog_jobs`.
- The failed production WordPress job `catalog_20260502_155151_3dcb` proved that a Cloud Run execution can report success at the infrastructure level while the claimed catalog job is marked `failed`; the Cloud Run entrypoint must return a non-zero exit code when it claims a job that fails.
- WordPress owned code is deployed manually with `scripts/wp-push-theme.sh` over FTP to DonDominio.
- WordPress production runtime configuration remains outside git in `wp-config.php` or host environment variables.
- Fast local validation already exists:
  - `scripts/wp-test-owned-code.sh`
  - `npm --prefix catalog-generator test`
  - `node --test scripts/woo-catalog-sync.test.mjs scripts/woo-storefront-assert.test.mjs`
  - `scripts/auto-validate.sh`
- Production source-data mutation is still manual and guarded by dry-runs, backup identifiers, and Store API assertions.
- Customer-operated catalog validation from the customer's mybro WordPress account remains the final portability gate.

## Desired End State

- Every pull request runs deterministic checks for catalog generator code, WordPress owned code, scripts, formatting, and secret leakage.
- Merging to `main` deploys only the affected production surfaces:
  - catalog generator or worker changes build a new immutable Cloud Run image and update the Cloud Run Job after production approval
  - WordPress owned-code changes deploy only `wordpress/wp-content/themes/luciastuy` and `wordpress/wp-content/mu-plugins` after production approval
  - docs-only changes do not deploy
- Each production deployment records:
  - git SHA
  - image tag and digest when Cloud Run changes
  - WordPress changed-file manifest when WordPress changes
  - validation commands and results
  - rollback pointer
- Source changes in Google Sheets or Drive are detected without relying on this Mac.
- Source validation reports block unsafe catalog or WooCommerce changes before they reach customers.
- WooCommerce source sync can eventually auto-apply low-risk changes only after:
  - source contract validation passes
  - production backup succeeds
  - dry-run contains only allowed operations
  - post-apply Store API and storefront smoke checks pass
- No OAuth token, API token, FTP password, WooCommerce credential, generated PDF, DB dump, or production backup is committed to git.

## Out Of Scope

- Migrating production WordPress hosting away from DonDominio.
- Replacing the Apps Script queue with a new queue service.
- Running Puppeteer or Node PDF generation inside WordPress hosting.
- Automatically deleting products or media from WooCommerce.
- Automatically changing WordPress runtime secrets in `wp-config.php`.
- Giving the customer Google Cloud access for day-to-day operation.
- Deploying third-party WordPress plugins.

## Recommended Architecture

Use GitHub Actions for code CI/CD and Google Cloud for source-change automation.

### Code Path

1. Developer opens a PR.
2. GitHub Actions runs CI.
3. Branch protection requires CI success before merge.
4. Merge to `main` runs path-filtered deployment workflows.
5. Production environments require approval before customer-facing deploys.
6. Deploy jobs use immutable git SHA tags, not `latest`.
7. Post-deploy smoke checks decide whether the deployment is accepted or rolled back.

### Source Path

1. A scheduled Cloud Run source monitor scans the canonical Google Sheet and configured Drive folders.
2. The monitor computes a source manifest and compares it with the last accepted manifest stored in a hidden sheet tab such as `catalog_source_runs`.
3. If the manifest changed, the monitor runs validation and writes a report row.
4. If validation fails, no production write is attempted.
5. If validation passes, the first automation increment creates only a WooCommerce dry-run plan and report.
6. A later increment may auto-apply low-risk WooCommerce updates after the dry-run thresholds are proven and tested.

This avoids Drive webhook complexity and keeps the source automation inside the already-approved Google Cloud runtime boundary.

## Architecture Options Considered

### Option A: GitHub Actions Orchestrates Everything

GitHub Actions would build Cloud Run images, deploy WordPress over FTP, poll Google Sheets/Drive on a schedule, and run WooCommerce syncs.

Tradeoffs:

- Simple single automation surface.
- Requires more Google and WordPress secrets in GitHub.
- Scheduled source checks depend on GitHub Actions availability and are less naturally colocated with Secret Manager and Cloud Run.

### Option B: Google Cloud Build Orchestrates Everything

Google Cloud Build triggers would build images, deploy Cloud Run, run WordPress FTP deploys, and run source checks.

Tradeoffs:

- Keeps most secrets in Google Cloud.
- Less ergonomic for WordPress FTP deployment approvals and PR checks.
- GitHub branch protection still needs GitHub-side CI signals.

### Option C: Hybrid GitHub Actions + Google Cloud Runtime

GitHub Actions handles repository events and production approvals. Google Cloud handles scheduled source monitoring and customer runtime jobs.

This is the recommended path because it matches the current system boundaries and minimizes new hosting surfaces.

## Phased Implementation

### Phase 1: Add GitHub CI Foundation

Progress: implemented.

Purpose: make every repository change prove it is safe before merge.

Expected files:

- `.github/workflows/ci.yml`
- `.github/workflows/secret-scan.yml` or a combined CI workflow
- `.github/dependabot.yml`
- `scripts/auto-validate.sh`
- `catalog-generator/package.json`
- `README.md` or `thoughts/shared/docs/deploy-wordpress.md`

Required changes:

- Add a GitHub Actions CI workflow for pull requests and pushes to `main`.
- Install Node and PHP in CI.
- Run `npm ci` in `catalog-generator`.
- Run `npm --prefix catalog-generator test`.
- Run `scripts/wp-test-owned-code.sh`.
- Run script tests for WooCommerce sync and storefront assertion.
- Run `git diff --check`.
- Add a secret scan that fails on likely OAuth tokens, API tokens, FTP passwords, DB dumps, and `.env` content.
- Make `scripts/auto-validate.sh` CI-friendly by either installing required tools in CI or splitting OpenSpec validation into a conditional step.
- Add Dependabot for GitHub Actions and npm dependencies.

Automated success criteria:

- [x] A PR that changes catalog generator code fails if catalog tests fail.
- [x] A PR that changes WordPress owned PHP fails if PHP lint or owned-code tests fail.
- [x] A PR that introduces a fake high-confidence secret fixture outside an allowed test fixture fails the secret scan.
- [x] `scripts/auto-validate.sh` still passes locally.

### Phase 2: Automate Cloud Run Catalog Worker Deployment

Progress: implemented in repository automation; GitHub Environment secrets, Google Workload Identity Federation, and `ENABLE_CATALOG_AGENT_AUTO_DEPLOY=true` still need to be configured in GitHub/Google Cloud before push-triggered deployment can run remotely. Manual workflow dispatch remains available after secrets are configured.

Purpose: deploy catalog generator and worker code changes to the production Cloud Run Job safely.

Expected files:

- `.github/workflows/deploy-catalog-agent.yml`
- `catalog-generator/cloud-run/deploy.sh`
- `catalog-generator/cloud-run/verify-job.sh`
- `catalog-generator/cloud-run/README.md`
- `thoughts/shared/docs/deployments.md`

Required changes:

- Configure GitHub to authenticate to `mybroworld-catalog-260501` with Workload Identity Federation. Do not store Google service account JSON keys in GitHub.
- Add a production GitHub Environment such as `production-catalog-agent` with required approval.
- Trigger the deployment workflow on pushes to `main` that touch:
  - `catalog-generator/src/**`
  - `catalog-generator/catalog-agent/**`
  - `catalog-generator/assets/**`
  - `catalog-generator/package*.json`
  - `catalog-generator/Dockerfile.catalog-agent`
  - `catalog-generator/cloud-run/**`
- Build with Cloud Build using image tag `${GITHUB_SHA}`.
- Capture the pushed image digest.
- Update `lucia-mybrocorp-catalog-agent` to the SHA-pinned image.
- Execute the Cloud Run Job once with `--wait`.
- Verify logs include `authenticated as mybrocorp@gmail.com`.
- Verify the worker image can render a real PDF in Cloud Run, not only start and find no queued jobs.
- Verify Chromium root-runtime launch flags are covered by tests and present in the deployed image when the container runs as UID 0.
- Verify the job exits successfully when no queued jobs match the configured profile and does not claim jobs for another profile.
- Verify a claimed catalog job that writes `status=failed` makes the Cloud Run process exit non-zero, so GitHub Actions, Cloud Scheduler, and Cloud Monitoring can detect the failed run.
- Keep Scheduler enabled only after the manual execution gate passes.
- Record deployment metadata as a GitHub Actions artifact.

Rollback strategy:

- Before update, read the current Cloud Run Job image.
- If post-deploy verification fails, update the job back to the previous image and execute one rollback verification run.
- Keep the failed image in Artifact Registry for diagnosis.

Automated success criteria:

- [x] A catalog worker code change on `main` produces an image tagged with the exact git SHA.
- [x] The Cloud Run Job image after deployment equals the exact git SHA image.
- [x] A failed verification run rolls the job back to the previous image.
- [x] Deployment logs prove the worker identity is `mybrocorp@gmail.com`.
- [ ] A deployed image can complete a queued `lucia-mybrocorp` PDF render and write `result_file_url` back to `catalog_jobs`.
- [x] A claimed failed job returns a non-zero Cloud Run execution status.

### Phase 3: Automate WordPress Owned-Code Deployment

Progress: implemented in repository automation; GitHub Environment secrets, required reviewers, and `ENABLE_WORDPRESS_AUTO_DEPLOY=true` still need to be configured before push-triggered deployment can run remotely. Manual workflow dispatch remains available after secrets are configured.

Purpose: deploy WordPress custom code safely without deploying WordPress core, vendor plugins, uploads, or DB content.

Expected files:

- `.github/workflows/deploy-wordpress.yml`
- `scripts/wp-push-theme.sh`
- `scripts/wp-backup-wp-content.sh`
- `scripts/wp-plugin-removal-smoke.sh`
- `scripts/wp-deploy-manifest.sh`
- `thoughts/shared/docs/deploy-wordpress.md`

Required changes:

- Add a production GitHub Environment such as `production-wordpress` with required approval.
- Store FTP credentials only as GitHub Environment secrets.
- Trigger deployment on pushes to `main` that touch:
  - `wordpress/wp-content/themes/luciastuy/**`
  - `wordpress/wp-content/mu-plugins/**`
  - `scripts/wp-push-theme.sh`
  - `scripts/wp-test-owned-code.sh`
- Add a deploy manifest step that records the exact local files and checksums to be uploaded.
- Pull or archive current remote owned code before upload.
- Deploy only the owned theme and MU plugin directories.
- Run public smoke checks after upload:
  - `/`
  - `/shop/`
  - `/cart/`
  - `/checkout/`
  - one representative product page
  - `/wp-admin/` login/admin redirect response
- Run Store API assertion when WooCommerce-facing owned code changes.
- Do not queue a real catalog PDF from CI unless a workflow input explicitly requests a production catalog smoke.

Rollback strategy:

- Use the pre-deploy remote owned-code archive to restore the previous theme and MU plugin files if public smoke checks fail.
- Re-run smoke checks after rollback.
- Keep both deploy and rollback manifests as GitHub Actions artifacts.

Automated success criteria:

- [x] A WordPress owned-code change cannot deploy unless `scripts/wp-test-owned-code.sh` passes.
- [x] The deploy uploads only the owned theme and MU plugin paths.
- [ ] A failed smoke check restores the previous owned-code archive.
- [x] The deployment artifact contains the file manifest, remote target, smoke results, and rollback pointer.

### Phase 4: Add Source Readiness Monitoring

Purpose: detect Google Sheet and Drive source changes and report readiness without making customer-facing writes first.

Expected files:

- `catalog-generator/src/source-readiness.mjs`
- `catalog-generator/test/source-readiness.test.mjs`
- `catalog-generator/catalog-agent/src/source-monitor.mjs`
- `catalog-generator/catalog-agent/src/cloud-run-source-monitor-once.mjs`
- `catalog-generator/cloud-run/source-monitor-job.md`
- `catalog-generator/apps-script/Code.gs`
- `thoughts/shared/docs/source-readiness.md`

Required changes:

- Define a source manifest contract:
  - spreadsheet id
  - sheet tabs included
  - row ids
  - `include_in_catalog`
  - `catalog_ready`
  - PVP price presence
  - required artwork metadata
  - Drive image folder id
  - `_cat` image matches when strict image selection is enabled
  - brand asset versions when relevant
- Store source run reports in a hidden sheet tab such as `catalog_source_runs`.
- Add a Cloud Run Job command that computes the manifest and validates readiness.
- Schedule the source monitor separately from the PDF worker.
- Treat validation failures as reports only; do not mutate WordPress or WooCommerce in this phase.
- Add a manual GitHub workflow dispatch that can run the same validation and attach the report as an artifact.

Automated success criteria:

- The source readiness validator fails for missing required columns.
- The validator fails for duplicate artwork ids.
- The validator fails for included catalog rows without required PVP price.
- The validator fails for missing or duplicate `_cat` files when strict mode is enabled.
- The validator writes one source run report without modifying WooCommerce.

### Phase 5: Automate WooCommerce Source Sync Dry-Runs

Purpose: produce safe production plans from source changes before allowing automatic customer-facing catalog updates.

Expected files:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `scripts/woo-storefront-assert.mjs`
- `catalog-generator/catalog-agent/src/source-sync-dry-run.mjs`
- `catalog-generator/cloud-run/source-sync-dry-run.md`
- `thoughts/shared/docs/deploy-wordpress.md`

Required changes:

- Run WooCommerce sync in dry-run mode after source readiness passes.
- Store WooCommerce API credentials in Secret Manager if this runs in Cloud Run, or in GitHub Environment secrets if it runs from GitHub Actions.
- Prefer Cloud Run plus Secret Manager for source sync to avoid spreading production credentials into GitHub.
- Require a fresh production backup identifier before any apply path is enabled.
- Save dry-run JSON reports outside git as Cloud Run logs and/or GitHub artifacts.
- Block plans that include:
  - product deletion
  - unmanaged cleanup
  - missing images
  - invalid source rows
  - unexpected operation counts above configured thresholds

Automated success criteria:

- A source change can generate a dry-run plan without applying writes.
- Dry-run output includes counts for create, update, needs_image, unchanged, invalid_source, and unexpected_unmanaged.
- Plans with product deletion or unmanaged cleanup fail the automation gate.
- Plans with missing images fail the automation gate.

### Phase 6: Enable Controlled Auto-Apply For Low-Risk Source Changes

Purpose: let customer-owned source changes update the live shop automatically once the dry-run process is trusted.

Expected files:

- `scripts/woo-catalog-sync.mjs`
- `scripts/woo-catalog-sync.test.mjs`
- `catalog-generator/catalog-agent/src/source-sync-apply.mjs`
- `thoughts/shared/docs/source-sync-runbook.md`
- `PROJECT_STATUS.md`

Required changes:

- Define low-risk operations:
  - create or update managed canonical products only
  - no unmanaged cleanup
  - no deletion
  - no missing images
  - no invalid source rows
  - no operation count above the configured threshold
- Require production DB backup success before apply.
- Apply only the reviewed dry-run plan hash.
- Run Store API assertion immediately after apply.
- Run storefront smoke checks immediately after apply.
- Roll back or pause automation if post-apply checks fail.
- Keep unmanaged legacy cleanup as manual-only.

Automated success criteria:

- Auto-apply refuses to run without a matching dry-run plan hash.
- Auto-apply refuses to run without a backup identifier.
- Auto-apply refuses unmanaged cleanup even when requested by source data.
- Post-apply Store API assertion reports no missing managed products and no missing images.
- A failed post-apply check disables the next scheduled auto-apply until a human re-enables it.

### Phase 7: Add Release Visibility And Alerts

Purpose: make failures visible and make every production state traceable.

Expected files:

- `thoughts/shared/docs/deployments.md`
- `thoughts/shared/docs/source-readiness.md`
- `.github/workflows/deploy-catalog-agent.yml`
- `.github/workflows/deploy-wordpress.yml`
- Google Cloud alerting configuration documentation

Required changes:

- Record the current production git SHA, Cloud Run image, WordPress deploy SHA, and source manifest hash.
- Add Cloud Monitoring alerts for failed Cloud Run Job executions.
- Add Cloud Scheduler failure alerts.
- Add GitHub Actions deployment summaries with links to artifacts and rollback commands.
- Optionally send failure notifications to Gmail or Slack later, but do not make notification plumbing a release blocker.

Automated success criteria:

- A failed Cloud Run Job is visible in Cloud Monitoring.
- A failed GitHub production deploy blocks the environment deployment status.
- The latest production deployment can be traced back to one git SHA and one workflow run.

## Production Gates

Do not enable unattended production deployment until these gates are true:

1. Customer account gate: one catalog is queued, completed, opened, and reviewed from the customer's mybro WordPress account.
2. Cloud Run identity gate: worker logs prove `authenticated as mybrocorp@gmail.com`.
3. GitHub branch protection gate: `main` requires CI success.
4. Secret gate: no production secret is stored in repo or Actions logs.
5. WordPress rollback gate: a pre-deploy owned-code archive can restore production.
6. Cloud Run rollback gate: the previous image can be restored automatically.
7. Cloud Run render gate: a real queued PDF render completes in Cloud Run after deployment.
8. Cloud Run failure-signal gate: a claimed failed catalog job makes the Cloud Run execution fail.
9. Source-readiness gate: source monitor reports validation failures without making production writes.
10. WooCommerce write gate: auto-apply is disabled until repeated dry-runs are stable.

## Initial Implementation Order

1. Implement Phase 1 CI.
2. Implement Phase 2 Cloud Run CD with production approval.
3. Implement Phase 3 WordPress CD with production approval.
4. Complete the customer account handoff validation.
5. Implement Phase 4 source readiness monitoring.
6. Run Phase 5 dry-runs for at least several source changes before considering Phase 6 auto-apply.

## Completion Criteria

This plan is complete when:

- PR checks protect `main`.
- Code changes deploy through GitHub Actions instead of this Mac.
- Cloud Run production image tags match git SHAs.
- WordPress owned code deploys through a reviewed workflow with backup and smoke checks.
- Source changes are detected and validated from Cloud Run.
- Customer-facing source sync either produces a safe dry-run report or auto-applies only operations that pass the encoded safety policy.
- The customer can run the store and catalog workflow from her own WordPress and Google accounts.
