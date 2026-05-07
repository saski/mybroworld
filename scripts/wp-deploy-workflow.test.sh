#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
WORKFLOW="$PROJECT_ROOT/.github/workflows/deploy-wordpress.yml"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

grep -q 'sh scripts/wp-backup.sh --skip-db' "$WORKFLOW" ||
  fail "deploy workflow should invoke the non-executable backup wrapper through sh"

if grep -q '^[[:space:]]*scripts/wp-backup.sh --skip-db' "$WORKFLOW"; then
  fail "deploy workflow should not execute scripts/wp-backup.sh directly"
fi

echo "ok test scripts/wp-deploy-workflow.test.sh"
