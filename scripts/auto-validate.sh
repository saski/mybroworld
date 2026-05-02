#!/bin/sh
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$REPO_ROOT"

require_command() {
  command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required for auto-validation." >&2
    exit 1
  fi
}

require_command git
require_command node
require_command npm

if command -v openspec >/dev/null 2>&1; then
  echo "Validating active OpenSpec changes..."
  for change_dir in openspec/changes/*; do
    [ -d "$change_dir" ] || continue

    change_name="$(basename -- "$change_dir")"
    [ "$change_name" = "archive" ] && continue

    openspec validate "$change_name"
  done
else
  echo "Skipping OpenSpec validation because openspec is not installed."
fi

echo "Running secret scan..."
scripts/secret-scan.sh

echo "Running CI helper tests..."
scripts/secret-scan.test.sh
catalog-generator/cloud-run/deploy.test.sh

echo "Running WordPress owned-code checks..."
scripts/wp-test-owned-code.sh

echo "Running catalog-generator tests..."
npm --prefix catalog-generator test

echo "Checking changed-file whitespace and conflict markers..."
git diff --check

echo "Auto-validation passed."
