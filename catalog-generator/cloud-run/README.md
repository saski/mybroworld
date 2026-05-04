# Catalog Agent Cloud Run Job

This guide packages the existing queue worker as a Cloud Run Job for the
`lucia-mybrocorp` production profile. The WordPress console and Apps Script queue
stay unchanged; Cloud Run only replaces the current macOS LaunchAgent worker.
The worker is started on demand when an operator queues a catalog from
WordPress or the bound spreadsheet UI. It is not intended to poll on a fixed
schedule.

## Runtime Boundary

- Google Cloud project: `mybroworld-catalog-260501`
- Billing/admin: `nacho.saski@gmail.com`
- Worker profile: `lucia-mybrocorp`
- Google API identity: `mybrocorp@gmail.com`
- Worker trigger: Apps Script calls the Cloud Run Admin API `jobs.run` method
- Worker command: `npm run catalog-agent:cloud-run-once`
- Monitor command: `npm run catalog-agent:monitor:cloud-run`

The Cloud Run entrypoint materializes Secret Manager-provided environment values
or mounted files into `CATALOG_AGENT_RUNTIME_ROOT` before starting the one-pass
worker. This keeps one runtime path for both supported secret delivery modes and
is required because mounted secrets are read-only, while the current OAuth
refresh flow rewrites `oauthTokenPath`.

## Required Secrets

Create three Secret Manager secrets. Do not commit their contents.

| Secret | Runtime env var | Contents |
|---|---|---|
| `catalog-agent-config` | `CATALOG_AGENT_CONFIG_JSON` | Agent config JSON for `lucia-mybrocorp` |
| `catalog-agent-oauth-client` | `CATALOG_AGENT_OAUTH_CLIENT_JSON` | OAuth client JSON from `mybroworld-catalog-260501` |
| `catalog-agent-oauth-token` | `CATALOG_AGENT_OAUTH_TOKEN_JSON` | OAuth token JSON authorized by `mybrocorp@gmail.com` |

The config secret should include the normal agent fields. The Cloud Run runtime
will override `oauthClientPath`, `oauthTokenPath`, and `jobWorkingRoot` with
writable paths under `CATALOG_AGENT_RUNTIME_ROOT`.

```json
{
  "profileKey": "lucia-mybrocorp",
  "googleAccountEmail": "mybrocorp@gmail.com",
  "workspaceRoot": "/app",
  "generatorDir": "/app",
  "watchSpreadsheetIds": ["15wvN5g8pQmnjF13v3lLzrIbuFysJ7GaTUAb_ps9oqJw"],
  "pollIntervalSeconds": 30,
  "oauthClientPath": "/secrets/oauth-client.json",
  "oauthTokenPath": "/secrets/oauth-token.json"
}
```

Optional: add `"catalogImageFolderId": "1ONBDh19aW9p9p_g1oSFmwbMxloTHxxOh"`
only after the customer-selected image folder contains exactly one `_cat` file
for every included, catalog-ready artwork. Once set, the Cloud Run worker builds
a per-job Drive manifest and blocks missing or duplicate catalog image matches.

## Build Image

For normal production deployment, prefer the GitHub Actions workflow in
`.github/workflows/deploy-catalog-agent.yml`. It builds SHA-tagged images,
updates `lucia-mybrocorp-catalog-agent`, verifies the job, and rolls back to the
previous image if verification fails.

The local helper below mirrors the same deployment shape:

```bash
catalog-generator/cloud-run/deploy.sh --dry-run
catalog-generator/cloud-run/deploy.sh
```

Set `CATALOG_AGENT_IMAGE_TAG` to override the default git SHA tag. Do not deploy
`latest` to production.

```bash
PROJECT_ID=mybroworld-catalog-260501
REGION=europe-west1
REPOSITORY=mybroworld
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/catalog-agent:latest"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com sheets.googleapis.com drive.googleapis.com
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION"
gcloud builds submit catalog-generator \
  --config catalog-generator/cloud-run/cloudbuild.yaml \
  --substitutions "_IMAGE=$IMAGE"
```

## Create Worker Identity

```bash
PROJECT_ID=mybroworld-catalog-260501
WORKER_SA="catalog-agent-runner@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create catalog-agent-runner --display-name="Catalog Agent Cloud Run Runner"

gcloud secrets add-iam-policy-binding catalog-agent-config \
  --member="serviceAccount:$WORKER_SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding catalog-agent-oauth-client \
  --member="serviceAccount:$WORKER_SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding catalog-agent-oauth-token \
  --member="serviceAccount:$WORKER_SA" \
  --role="roles/secretmanager.secretAccessor"
```

## Create Or Update The Job

```bash
JOB_NAME=lucia-mybrocorp-catalog-agent

gcloud run jobs deploy "$JOB_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$WORKER_SA" \
  --memory 2Gi \
  --cpu 1 \
  --tasks 1 \
  --max-retries 0 \
  --task-timeout 15m \
  --set-secrets CATALOG_AGENT_CONFIG_JSON=catalog-agent-config:latest,CATALOG_AGENT_OAUTH_CLIENT_JSON=catalog-agent-oauth-client:latest,CATALOG_AGENT_OAUTH_TOKEN_JSON=catalog-agent-oauth-token:latest
```

Replace `latest` with pinned secret version numbers for controlled production
rollouts after the first successful manual run.

Run one manual execution before relying on the Apps Script trigger:

```bash
gcloud run jobs execute "$JOB_NAME" --region "$REGION" --wait
```

Production CI/CD verification uses:

```bash
catalog-generator/cloud-run/verify-job.sh --project "$PROJECT_ID" --region "$REGION" --job "$JOB_NAME"
```

That check first asserts the job **execution** finished successfully via
`gcloud run jobs executions describe` (`completionTime` set, `failedCount` and
`cancelledCount` zero, `succeededCount` at least one). That matches what
`gcloud run jobs execute --wait` already waited for, but reads authoritative API
status instead of relying on log indexing alone.

An **optional** log probe still searches Cloud Logging for
`authenticated as mybrocorp@gmail.com` (with retries). A missing log line is a
warning only unless you set `VERIFY_REQUIRE_LOG=1`. Set `VERIFY_DEBUG=1` for
verbose probe output.

To **re-point the job** at an already-built image without Cloud Build (for
example after a verify-only fix), use:

```bash
chmod +x catalog-generator/cloud-run/update-job-image.sh
./catalog-generator/cloud-run/update-job-image.sh \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/catalog-agent:$GIT_SHA"
```

## On-Demand Trigger

The production Apps Script Web App starts the worker immediately after it writes
a `queued` row to `catalog_jobs`. The checked-in defaults target production:
`lucia-mybrocorp` jobs run `lucia-mybrocorp-catalog-agent` in
`mybroworld-catalog-260501/europe-west1`. These Apps Script properties can
override or disable that behavior in a copied script:

| Property | Value |
|---|---|
| `CATALOG_CLOUD_RUN_TRIGGER_ENABLED` | `true` |
| `CATALOG_CLOUD_RUN_TRIGGER_PROFILE_KEYS` | `lucia-mybrocorp` |
| `CATALOG_CLOUD_RUN_PROJECT_ID` | `mybroworld-catalog-260501` |
| `CATALOG_CLOUD_RUN_REGION` | `europe-west1` |
| `CATALOG_CLOUD_RUN_JOB_NAME` | `lucia-mybrocorp-catalog-agent` |

The source also includes `configureProductionCatalogCloudRunTrigger()`, which
sets exactly those non-secret properties explicitly in the production project.

The Apps Script manifest must include:

- Web App access: `webapp.access = ANYONE_ANONYMOUS`
- Web App execution identity: `webapp.executeAs = USER_DEPLOYING`
- API executable access for owner-only scope bootstrap: `executionApi.access = MYSELF`
- `https://www.googleapis.com/auth/script.external_request`
- `https://www.googleapis.com/auth/cloud-platform`

The Apps Script project must also be linked to the standard Google Cloud project
`mybroworld-catalog-260501` so the script owner OAuth grant, Apps Script API, and
Cloud Run Admin API calls all share the same Google Cloud project.

Grant the account that executes the Apps Script Web App permission to run the
Cloud Run Job. The current production script is operated from
`nacho.saski@gmail.com`, so that Google account is the invoker. If the production
Web App is later moved to execute as `mybrocorp@gmail.com`, grant that account
instead.

```bash
gcloud run jobs add-iam-policy-binding "$JOB_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --member "user:nacho.saski@gmail.com" \
  --role roles/run.invoker
```

The old polling scheduler should stay paused once the Apps Script trigger is
deployed and validated:

```bash
gcloud scheduler jobs pause lucia-mybrocorp-catalog-agent-every-5m \
  --location "$REGION" \
  --project "$PROJECT_ID"
```

Delete that scheduler only after one customer-queued WordPress catalog completes
through the Apps Script trigger and no stale queued jobs remain.

Production evidence as of 2026-05-03: Apps Script Web App deployment
`AKfycbz9C2jMtj42LWgWFl1duHEFUiGqs0b6svz0zgcOJjeSQtBUl-8j_iTH7S2iAUIAKVBJ`
runs version 6. Direct token-authenticated job `catalog_20260503_100246_1dd2`
created Cloud Run execution `lucia-mybrocorp-catalog-agent-s22ln`, which
authenticated as `mybrocorp@gmail.com`, completed successfully, and wrote a
14-artwork Drive PDF result back to `catalog_jobs`.

Output-folder evidence as of 2026-05-03: the production Drive output folder is
`183-IMb93mqASyyKEMz3lTVG1S8GLrK_2` (`OBRA/Catalogos`). The worker OAuth identity
`mybrocorp@gmail.com` has write access, `catalog_profiles!F2` and production
WordPress `LUCIA_CATALOG_DEFAULT_DRIVE_FOLDER_ID` both point to that folder, and
validation job `catalog_20260503_102110_2c0d` wrote PDF
`15NBUz7i1VJaqQZiakMltH-pEHTW6XZXF` there.

## Monitor

The production monitor is a separate Cloud Run Job:

- Job: `lucia-mybrocorp-catalog-monitor`
- Schedule: `lucia-mybrocorp-catalog-monitor-every-10m`
- Cadence: every 10 minutes, Europe/Madrid time zone
- Alert policy: `projects/mybroworld-catalog-260501/alertPolicies/6576773883271781072`
- Log metric: `catalog_monitor_alerts`
- Notification channel: `projects/mybroworld-catalog-260501/notificationChannels/12072695100356729995`

The monitor reads the same Secret Manager runtime config as the worker, checks
`catalog_jobs` for the configured execution profile, and exits non-zero when it
finds:

- a recent `failed` job
- a stale `queued` job
- a stale in-progress heartbeat
- a recent `completed` job without a Drive result URL

Deploy or update it with the same image as the worker:

```bash
MONITOR_JOB_NAME=lucia-mybrocorp-catalog-monitor

gcloud run jobs deploy "$MONITOR_JOB_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --service-account "$WORKER_SA" \
  --memory 512Mi \
  --cpu 1 \
  --tasks 1 \
  --max-retries 0 \
  --task-timeout 5m \
  --command npm \
  --args run,catalog-agent:monitor:cloud-run \
  --set-secrets CATALOG_AGENT_CONFIG_JSON=catalog-agent-config:latest,CATALOG_AGENT_OAUTH_CLIENT_JSON=catalog-agent-oauth-client:latest,CATALOG_AGENT_OAUTH_TOKEN_JSON=catalog-agent-oauth-token:latest \
  --set-env-vars CATALOG_MONITOR_IGNORE_BEFORE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

`CATALOG_MONITOR_IGNORE_BEFORE` suppresses known historical failed jobs created
before the monitor rollout. Remove or move it only when old queue rows have been
cleaned up or acknowledged.

Run and inspect it manually before relying on the schedule:

```bash
gcloud run jobs execute "$MONITOR_JOB_NAME" --region "$REGION" --wait
```

The current log-based alert policy is stored in
`catalog-generator/cloud-run/catalog-monitor-alert-policy.json`. It alerts on
error logs from `lucia-mybrocorp-catalog-monitor`, including functional catalog
alerts and monitor runtime failures.

## Validation Gate

Do not mark the handoff complete until a job queued from the customer's mybro
WordPress account completes through this Cloud Run job while the local
`nacho-saski` LaunchAgent is stopped or irrelevant.

References:

- Cloud Run Job secrets: https://cloud.google.com/run/docs/configuring/jobs/secrets
- Execute Cloud Run Jobs: https://cloud.google.com/run/docs/execute/jobs
- Cloud Run Jobs `run` API: https://docs.cloud.google.com/run/docs/reference/rest/v2/projects.locations.jobs/run
