#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
SCRIPT="$PROJECT_ROOT/catalog-generator/cloud-run/deploy.sh"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  haystack="$1"
  needle="$2"
  label="$3"

  case "$haystack" in
    *"$needle"*) ;;
    *) fail "$label" ;;
  esac
}

assert_not_contains() {
  haystack="$1"
  needle="$2"
  label="$3"

  case "$haystack" in
    *"$needle"*) fail "$label" ;;
    *) ;;
  esac
}

cd "$PROJECT_ROOT"

DRY_RUN_OUTPUT=$(CATALOG_AGENT_IMAGE_TAG=abc123 "$SCRIPT" --dry-run)

assert_contains "$DRY_RUN_OUTPUT" "catalog-agent:abc123" "dry-run should use the requested immutable image tag"
assert_contains "$DRY_RUN_OUTPUT" "gcloud builds submit catalog-generator" "dry-run should show the Cloud Build command"
assert_contains "$DRY_RUN_OUTPUT" "--suppress-logs" "dry-run should suppress Cloud Build log streaming"
assert_contains "$DRY_RUN_OUTPUT" "gcloud run jobs update lucia-mybrocorp-catalog-agent" "dry-run should show the Cloud Run update"
assert_contains "$DRY_RUN_OUTPUT" "catalog-generator/cloud-run/verify-job.sh" "dry-run should show post-deploy verification"
assert_not_contains "$DRY_RUN_OUTPUT" "catalog-agent:latest" "dry-run should not deploy latest"

echo "ok test catalog-generator/cloud-run/deploy.test.sh"
