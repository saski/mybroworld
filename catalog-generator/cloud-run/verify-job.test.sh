#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
SCRIPT="$PROJECT_ROOT/catalog-generator/cloud-run/verify-job.sh"
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

cd "$PROJECT_ROOT"

DRY_RUN_OUTPUT=$(VERIFY_LOG_ATTEMPTS=3 VERIFY_LOG_SLEEP_SECONDS=1 "$SCRIPT" --dry-run)

assert_contains "$DRY_RUN_OUTPUT" "gcloud run jobs execute" "dry-run should show the verification job execute command"
assert_contains "$DRY_RUN_OUTPUT" "gcloud run jobs executions describe" "dry-run should mention execution status verification"
assert_contains "$DRY_RUN_OUTPUT" "authenticated as mybrocorp@gmail.com" "dry-run should mention the expected identity log"
assert_contains "$DRY_RUN_OUTPUT" "VERIFY_REQUIRE_LOG=1" "dry-run should document strict log mode"
assert_contains "$DRY_RUN_OUTPUT" "retry" "dry-run should describe log probe retries"

printf 'ok test catalog-generator/cloud-run/verify-job.test.sh\n'
