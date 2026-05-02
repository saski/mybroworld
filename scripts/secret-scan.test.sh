#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SCRIPT="$PROJECT_ROOT/scripts/secret-scan.sh"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

SAFE_FILE="$TMP_DIR/safe.txt"
TOKEN_FILE="$TMP_DIR/token.txt"
FORBIDDEN_FILE="$TMP_DIR/wp-remote.env"

printf '%s\n' 'CATALOG_API_TOKEN is a variable name, not a secret value.' > "$SAFE_FILE"
printf '%s%s\n' 'token=ghp_1234567890abcdefghijkl' 'mnopqrstuvwxyzABCD' > "$TOKEN_FILE"
printf '%s\n' 'WP_FTP_PASSWORD=example' > "$FORBIDDEN_FILE"

"$SCRIPT" "$SAFE_FILE" >/dev/null

if "$SCRIPT" "$TOKEN_FILE" >/dev/null 2>&1; then
  fail "secret scan should reject high-confidence GitHub tokens"
fi

if "$SCRIPT" "$FORBIDDEN_FILE" >/dev/null 2>&1; then
  fail "secret scan should reject committed local env files"
fi

echo "ok test scripts/secret-scan.test.sh"
