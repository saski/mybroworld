#!/bin/sh
set -eu

PROJECT_ID="${PROJECT_ID:-mybroworld-catalog-260501}"
REGION="${REGION:-europe-west1}"
JOB_NAME="${JOB_NAME:-lucia-mybrocorp-catalog-agent}"
EXPECT_ACCOUNT="${EXPECT_ACCOUNT:-mybrocorp@gmail.com}"
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
LOG_OUTPUT=$(gcloud logging read "$LOG_FILTER" \
  --project "$PROJECT_ID" \
  --format='value(textPayload)' \
  --limit=100 \
  --order=desc 2>/dev/null || true)

if ! printf '%s\n' "$LOG_OUTPUT" | grep -F "authenticated as $EXPECT_ACCOUNT" >/dev/null 2>&1; then
  echo "Cloud Run verification did not find expected Google account log: $EXPECT_ACCOUNT" >&2
  echo "$LOG_OUTPUT" >&2
  exit 1
fi

echo "Cloud Run verification passed for execution $EXECUTION_NAME."
