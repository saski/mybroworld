#!/bin/sh
set -eu

PROJECT_ID="${PROJECT_ID:-mybroworld-catalog-260501}"
REGION="${REGION:-europe-west1}"
JOB_NAME="${JOB_NAME:-lucia-mybrocorp-catalog-agent}"
EXPECT_ACCOUNT="${EXPECT_ACCOUNT:-mybrocorp@gmail.com}"
VERIFY_LOG_ATTEMPTS="${VERIFY_LOG_ATTEMPTS:-12}"
VERIFY_LOG_SLEEP_SECONDS="${VERIFY_LOG_SLEEP_SECONDS:-5}"
VERIFY_REQUIRE_LOG="${VERIFY_REQUIRE_LOG:-0}"
VERIFY_DEBUG="${VERIFY_DEBUG:-0}"
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
gcloud run jobs executions describe <execution> (must show completionTime set, failedCount=0, cancelledCount=0, succeededCount>=1)
Optional: retry Cloud Logging / gcloud run jobs logs read for textPayload containing authenticated as $EXPECT_ACCOUNT
  (VERIFY_REQUIRE_LOG=1 makes the log line mandatory; default is execution-status only)
Log probe retry: up to $VERIFY_LOG_ATTEMPTS attempts, sleeping $VERIFY_LOG_SLEEP_SECONDS seconds between reads (warning-only unless VERIFY_REQUIRE_LOG=1)
MSG
  exit 0
fi

set +e
EXECUTION_OUTPUT=$(gcloud run jobs execute "$JOB_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --wait 2>&1)
EXECUTE_STATUS=$?
set -e

printf '%s\n' "$EXECUTION_OUTPUT"

if [ "$EXECUTE_STATUS" -ne 0 ]; then
  echo "gcloud run jobs execute exited with status $EXECUTE_STATUS." >&2
  exit "$EXECUTE_STATUS"
fi

EXECUTION_NAME=$(printf '%s\n' "$EXECUTION_OUTPUT" | sed -n 's/.*Execution \[\([^]]*\)\].*/\1/p' | tail -n 1)

if [ -z "$EXECUTION_NAME" ]; then
  echo "Unable to determine Cloud Run execution name from gcloud output." >&2
  exit 1
fi

read_execution_field() {
  field=$1
  gcloud run jobs executions describe "$EXECUTION_NAME" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format="value($field)" 2>/dev/null || printf ''
}

failed=$(read_execution_field status.failedCount)
cancelled=$(read_execution_field status.cancelledCount)
succeeded=$(read_execution_field status.succeededCount)
completion=$(read_execution_field status.completionTime)

failed=${failed:-0}
cancelled=${cancelled:-0}
succeeded=${succeeded:-0}

if [ "$VERIFY_DEBUG" = "1" ]; then
  echo "DEBUG: execution=$EXECUTION_NAME failed=$failed cancelled=$cancelled succeeded=$succeeded completion=$completion" >&2
fi

if [ -z "$completion" ]; then
  echo "Cloud Run verification failed: execution $EXECUTION_NAME has no completionTime yet." >&2
  exit 1
fi

if [ "$failed" != "0" ]; then
  echo "Cloud Run verification failed: execution $EXECUTION_NAME failedCount=$failed (expected 0)." >&2
  exit 1
fi

if [ "$cancelled" != "0" ]; then
  echo "Cloud Run verification failed: execution $EXECUTION_NAME cancelledCount=$cancelled (expected 0)." >&2
  exit 1
fi

case "$succeeded" in
  ''|*[!0-9]*) succeeded=0 ;;
esac
if [ "$succeeded" -lt 1 ]; then
  echo "Cloud Run verification failed: execution $EXECUTION_NAME succeededCount=$succeeded (expected at least 1)." >&2
  exit 1
fi

echo "Cloud Run execution $EXECUTION_NAME succeeded (completionTime set, failed=0, cancelled=0, succeeded>=1)."

LOG_FOUND=0
LOG_FILTER="resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"$JOB_NAME\" AND labels.\"run.googleapis.com/execution_name\"=\"$EXECUTION_NAME\""
attempt=1
while [ "$attempt" -le "$VERIFY_LOG_ATTEMPTS" ]; do
  if [ "$VERIFY_DEBUG" = "1" ]; then
    echo "DEBUG: optional log probe attempt $attempt/$VERIFY_LOG_ATTEMPTS filter=$LOG_FILTER" >&2
  fi

  LOG_OUTPUT=$(gcloud logging read "$LOG_FILTER" \
    --project "$PROJECT_ID" \
    --format='value(textPayload)' \
    --limit=500 \
    --order=desc 2>/dev/null || true)

  if printf '%s\n' "$LOG_OUTPUT" | grep -F "authenticated as $EXPECT_ACCOUNT" >/dev/null 2>&1; then
    LOG_FOUND=1
    break
  fi

  JSON_LOG=$(gcloud logging read "$LOG_FILTER" \
    --project "$PROJECT_ID" \
    --format='value(jsonPayload.message)' \
    --limit=500 \
    --order=desc 2>/dev/null || true)
  if printf '%s\n' "$JSON_LOG" | grep -F "authenticated as $EXPECT_ACCOUNT" >/dev/null 2>&1; then
    LOG_FOUND=1
    break
  fi

  if [ "$attempt" -lt "$VERIFY_LOG_ATTEMPTS" ]; then
    sleep "$VERIFY_LOG_SLEEP_SECONDS"
  fi
  attempt=$((attempt + 1))
done

if [ "$LOG_FOUND" -eq 1 ]; then
  echo "Optional log check found authenticated as $EXPECT_ACCOUNT for execution $EXECUTION_NAME."
else
  echo "Optional log check did not observe authenticated as $EXPECT_ACCOUNT within $VERIFY_LOG_ATTEMPTS attempts (logging propagation can lag). Execution status already passed." >&2
  if [ "$VERIFY_REQUIRE_LOG" = "1" ]; then
    echo "VERIFY_REQUIRE_LOG=1: treating missing log line as failure." >&2
    echo "Log filter used: $LOG_FILTER" >&2
    if [ -n "$LOG_OUTPUT" ]; then
      echo "Last textPayload sample (truncated):" >&2
      printf '%s\n' "$LOG_OUTPUT" | tail -n 20 >&2
    fi
    exit 1
  fi
fi

echo "Cloud Run verification passed for execution $EXECUTION_NAME."
