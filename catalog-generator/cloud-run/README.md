# Catalog Agent Cloud Run Job

This guide packages the existing queue worker as a Cloud Run Job for the
`lucia-mybrocorp` production profile. The WordPress console and Apps Script queue
stay unchanged; Cloud Run only replaces the current macOS LaunchAgent worker.

## Runtime Boundary

- Google Cloud project: `mybroworld-catalog-260501`
- Billing/admin: `nacho.saski@gmail.com`
- Worker profile: `lucia-mybrocorp`
- Google API identity: `mybrocorp@gmail.com`
- Command: `npm run catalog-agent:cloud-run-once`

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

Run one manual execution before enabling the schedule:

```bash
gcloud run jobs execute "$JOB_NAME" --region "$REGION" --wait
```

## Schedule

Create the Cloud Scheduler trigger only after the manual run proves that the job
authenticates as `mybrocorp@gmail.com` and ignores non-`lucia-mybrocorp` jobs.

```bash
SCHEDULER_SA="catalog-agent-scheduler@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create catalog-agent-scheduler \
  --display-name="Catalog Agent Scheduler"

gcloud run jobs add-iam-policy-binding "$JOB_NAME" \
  --region "$REGION" \
  --member "serviceAccount:$SCHEDULER_SA" \
  --role roles/run.invoker

gcloud scheduler jobs create http lucia-mybrocorp-catalog-agent-every-5m \
  --location "$REGION" \
  --schedule "*/5 * * * *" \
  --time-zone "Europe/Madrid" \
  --uri "https://run.googleapis.com/v2/projects/$PROJECT_ID/locations/$REGION/jobs/$JOB_NAME:run" \
  --http-method POST \
  --oauth-service-account-email "$SCHEDULER_SA"
```

The production deployment currently uses the dedicated Scheduler service account
`catalog-agent-scheduler@mybroworld-catalog-260501.iam.gserviceaccount.com`.

## Validation Gate

Do not mark the handoff complete until a job queued from the customer's mybro
WordPress account completes through this Cloud Run job while the local
`nacho-saski` LaunchAgent is stopped or irrelevant.

References:

- Cloud Run Job secrets: https://cloud.google.com/run/docs/configuring/jobs/secrets
- Scheduled Cloud Run Jobs: https://cloud.google.com/run/docs/execute/jobs-on-schedule
