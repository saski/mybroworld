#!/bin/sh
set -eu

PROJECT_ID="${PROJECT_ID:-mybroworld-catalog-260501}"
REGION="${REGION:-europe-west1}"
JOB_NAME="${JOB_NAME:-lucia-mybrocorp-catalog-agent}"
EXPECT_ACCOUNT="${EXPECT_ACCOUNT:-mybrocorp@gmail.com}"
VERIFY_ATTEMPTS="${VERIFY_ATTEMPTS:-12}"
VERIFY_SLEEP_SECONDS="${VERIFY_SLEEP_SECONDS:-5}"
DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project)
      PROJECT_ID="${2:?Missing value for --project}"
      shift 2
      ;;
    --region)
      REGION="${2:?Missing value for --region}"
      shift 2
      ;;
    --job)
      JOB_NAME="${2:?Missing value for --job}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Usage: $0 [--project ID] [--region REGION] [--job NAME] [--dry-run]" >&2
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" -eq 1 ]; then
  cat <<MSG
  gcloud run jobs execute $JOB_NAME --project=$PROJECT_ID --region=$REGION --wait
gcloud logging read <cloud-run-job logs> and require authenticated as $EXPECT_ACCOUNT
Retry up to $VERIFY_ATTEMPTS times, sleeping $VERIFY_SLEEP_SECONDS seconds between attempts.
MSG
  exit 0
fi

EXECUTION_OUTPUT=$(gcloud run jobs execute "$JOB_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --wait 2>&1)

printf '%s\n' "$EXECUTION_OUTPUT"

EXECUTION_NAME=$(printf '%s\n' "$EXECUTION_OUTPUT" | sed -n 's/.*Execution \[\([^]]*\)\].*/\1/p' | tail -n 1)

if [ -z "$EXECUTION_NAME" ]; then
  echo "Unable to determine Cloud Run execution name from gcloud output." >&2
  exit 1
fi

LOG_FILTER="resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"$JOB_NAME\" AND labels.\"run.googleapis.com/execution_name\"=\"$EXECUTION_NAME\""

attempt=1
FOUND_LOG=0
while [ "$attempt" -le "$VERIFY_ATTEMPTS" ]; do
  echo "Checking logs for execution $EXECUTION_NAME (attempt $attempt/$VERIFY_ATTEMPTS)..." >&2
  LOG_OUTPUT=$(gcloud logging read "$LOG_FILTER" \
    --project "$PROJECT_ID" \
    --format='value(textPayload)' \
    --limit=1000 \
    --order=desc 2>/dev/null || true)

  if printf '%s\n' "$LOG_OUTPUT" | grep -F "authenticated as $EXPECT_ACCOUNT" >/dev/null 2>&1; then
    FOUND_LOG=1
    break
  fi

  if [ "$attempt" -lt "$VERIFY_ATTEMPTS" ]; then
    echo "Attempt $attempt/$VERIFY_ATTEMPTS: expected account log not found yet; sleeping $VERIFY_SLEEP_SECONDS seconds..." >&2
    sleep "$VERIFY_SLEEP_SECONDS"
  fi

  attempt=$((attempt + 1))
done

if [ "$FOUND_LOG" -ne 1 ]; then
  echo "Cloud Run verification did not find expected Google account log: $EXPECT_ACCOUNT" >&2
  echo "$LOG_OUTPUT" >&2
  exit 1
fi

echo "Cloud Run verification passed for execution $EXECUTION_NAME."
