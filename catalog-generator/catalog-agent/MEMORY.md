# MEMORY

## Current Decisions

- The first delivery is queue-driven: Google Sheets writes jobs into `catalog_jobs`, and the catalog agent claims them.
- Job routing is profile-safe. Each agent instance processes only one `profileKey`.
- The agent reads selected tabs through the Sheets API, merges them locally to CSV, renders with the existing generator, and uploads the PDF to Drive.
- OAuth credentials and refresh tokens stay outside the repository.
- Production portability uses a scheduled Cloud Run Job for `lucia-mybrocorp` instead of a customer Mac LaunchAgent.
- Cloud Run secrets are provided as JSON through Secret Manager and materialized into writable runtime files before the normal agent config is loaded.
- The Cloud Run runtime project is `mybroworld-catalog-260501`, administered and billed by `nacho.saski@gmail.com`; daily customer operation should not require Google Cloud access.
- Production WordPress now defaults catalog queue jobs to `lucia-mybrocorp`, so new customer jobs should be claimed by Cloud Run rather than the local `nacho-saski` LaunchAgent.
- Cloud Run runs the catalog container as root, so Chromium/Puppeteer launch options must include `--no-sandbox` and `--disable-setuid-sandbox` when UID is 0.
- Failed-job logs must preserve nested error causes; otherwise `pdf_render_failed` hides the actionable Puppeteer or Chromium failure.
- The Cloud Run worker must exit non-zero when it claims a job that ends in `failed`, so Cloud Run, Scheduler, and Monitoring can detect production failures.
- Production monitoring uses a separate Cloud Run Job, `lucia-mybrocorp-catalog-monitor`, scheduled every 10 minutes. It reads `catalog_jobs` for the `lucia-mybrocorp` profile and alerts on failed, stale queued, stale in-progress, or completed-without-URL rows.
- The production alert path is log metric `catalog_monitor_alerts` to alert policy `projects/mybroworld-catalog-260501/alertPolicies/6576773883271781072`, notifying channel `projects/mybroworld-catalog-260501/notificationChannels/12072695100356729995`.

## Working Assumptions

- Compatible year tabs are detected from canonical headers, not from a fixed title such as `Sheet1` or `2026`.
- The queue sheet is the system of record for job status transitions.
- Local install paths differ per macOS user, so `workspaceRoot` and `generatorDir` must stay explicit in config.
- In Cloud Run, `workspaceRoot` and `generatorDir` point at `/app`, while OAuth and job working paths are rewritten under `CATALOG_AGENT_RUNTIME_ROOT`.
- The Google Auth Platform app remains in Testing mode with `mybrocorp@gmail.com` and `nacho.saski@gmail.com` as test users; test-mode OAuth refresh tokens may expire and need reauthorization.
- The 2026-05-02 failed WordPress job `catalog_20260502_155151_3dcb` was caused by Chromium refusing to launch as root without no-sandbox flags, not by bad sheet data.
- Verification job `catalog_20260502_161854_retry` proved the corrected Cloud Run image can render and upload a 14-artwork PDF through `lucia-mybrocorp`.
- `CATALOG_MONITOR_IGNORE_BEFORE` is set on the production monitor to the monitor rollout timestamp so the known historical failed job does not create a permanent false alarm.
