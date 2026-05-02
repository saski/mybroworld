#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SCRIPT="$PROJECT_ROOT/scripts/wp-deploy-manifest.sh"
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

MANIFEST_OUTPUT=$("$SCRIPT")

assert_contains "$MANIFEST_OUTPUT" "wordpress/wp-content/themes/luciastuy/style.css" "manifest should include owned theme files"
assert_contains "$MANIFEST_OUTPUT" "wordpress/wp-content/mu-plugins/lucia-bootstrap.php" "manifest should include owned mu-plugin files"
assert_contains "$MANIFEST_OUTPUT" "sha256=" "manifest should include sha256 checksums"
assert_not_contains "$MANIFEST_OUTPUT" ".DS_Store" "manifest should exclude local macOS metadata"

OUTPUT_FILE="$TMP_DIR/manifest.txt"
"$SCRIPT" --output "$OUTPUT_FILE" >/dev/null
test -s "$OUTPUT_FILE" || fail "manifest output file should be written"

echo "ok test scripts/wp-deploy-manifest.test.sh"
