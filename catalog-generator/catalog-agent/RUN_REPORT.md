# RUN REPORT

## What Was Implemented

- Added the local queue agent core for profile-safe job selection and multi-tab CSV merging.
- Added Google OAuth session handling, including token refresh and a one-time authorization CLI.
- Added Google Sheets and Drive API integration for reading queue rows, updating status, and uploading the rendered PDF.
- Added CLI entrypoints for continuous polling and one-shot verification.
- Added the Cloud Run one-shot entrypoint for production portability.
- Added Secret Manager JSON materialization into writable runtime paths before loading the normal agent config.
- Fixed Cloud Run PDF rendering by adding Chromium root sandbox launch flags when the worker runs as UID 0.
- Added failed-job diagnostics that preserve nested error causes in Cloud Logging and `catalog_jobs.log_excerpt`.
- Added production monitoring:
  - the Cloud Run worker exits non-zero when a claimed job fails
  - a separate catalog monitor scans `catalog_jobs` for failed, stale, or incomplete jobs
  - a Cloud Scheduler trigger runs the monitor every 10 minutes
  - a Cloud Monitoring alert policy notifies through the project email channel when the monitor logs an alert or fails

## Verification

- Unit tests cover:
  - compatible-tab discovery and scope resolution
  - queued job defaults and folder validation
  - multi-tab CSV merge behavior
  - profile-safe oldest-job selection
  - Cloud Run secret materialization into writable config, OAuth client, and OAuth token files
  - generator CLI flags and stable error codes
- Local Docker image `mybroworld-catalog-agent:test` builds from `catalog-generator/Dockerfile.catalog-agent`.
- Running the built image without required secrets fails fast with `cloud_run_secret_missing`.
- Cloud Build pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:latest` successfully from build `2b258825-874d-48da-8dea-a9dc734d9e3a`.
- Google Cloud APIs, Artifact Registry, the dedicated Cloud Run service account, Secret Manager containers, config secret version, OAuth client secret version, and Secret Manager IAM bindings are in place in `mybroworld-catalog-260501`.
- OAuth authorization for `mybrocorp@gmail.com` completed after adding it as an OAuth test user; the token is stored as Secret Manager version 1 for `catalog-agent-oauth-token`.
- Cloud Run Job `lucia-mybrocorp-catalog-agent` is deployed in `europe-west1`.
- Manual job execution and Scheduler-triggered executions completed successfully, authenticated as `mybrocorp@gmail.com`, and ignored the queue when no `lucia-mybrocorp` jobs were pending.
- Cloud Scheduler job `lucia-mybrocorp-catalog-agent-every-5m` is enabled with dedicated invoker service account `catalog-agent-scheduler@mybroworld-catalog-260501.iam.gserviceaccount.com`.
- Reproduced the failed render in Docker: Chromium exited with `Running as root without --no-sandbox is not supported`.
- Verified the fix with `docker run` using the local code mounted into the catalog-agent image; the sample PDF render completed.
- Built and pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:sandbox-fix-20260502-1818` from Cloud Build `46affd56-27fe-4656-bbaf-f195d8225b4d`.
- Updated Cloud Run Job `lucia-mybrocorp-catalog-agent` to use the `sandbox-fix-20260502-1818` image.
- Manual Cloud Run execution `lucia-mybrocorp-catalog-agent-zz8m5` completed verification job `catalog_20260502_161854_retry`, uploaded a 14-artwork PDF, and wrote Drive URL `https://drive.google.com/file/d/1eR-wTNJn5mMxGzgz5CCV6xahb5mIPHwa/view?usp=drivesdk`.
- Added automated coverage for worker exit-code summarization and catalog job health checks.
- Built and pushed `europe-west1-docker.pkg.dev/mybroworld-catalog-260501/mybroworld/catalog-agent:monitoring-20260502-163238` from Cloud Build `692b3cf1-69a2-4f9a-8686-9dad46dc9af0`.
- Updated Cloud Run Job `lucia-mybrocorp-catalog-agent` to use the monitoring image.
- Created Cloud Run Job `lucia-mybrocorp-catalog-monitor`, scheduled it with `lucia-mybrocorp-catalog-monitor-every-10m`, and verified both direct execution `lucia-mybrocorp-catalog-monitor-tkwkr` and Scheduler-triggered execution `lucia-mybrocorp-catalog-monitor-fncxz` completed successfully with `[catalog-monitor] ok spreadsheets=1 jobs=2`.
- Created log metric `catalog_monitor_alerts`, notification channel `projects/mybroworld-catalog-260501/notificationChannels/12072695100356729995`, and alert policy `projects/mybroworld-catalog-260501/alertPolicies/6576773883271781072`.
- `npm --prefix catalog-generator test` passes with 45 tests.

## Remaining Manual Work

- Validate a production WordPress job from the customer's mybro account with the local `nacho-saski` worker stopped or irrelevant.
- Verify the completed Drive PDF is readable from the customer's browser session and persist a review state from that account.
