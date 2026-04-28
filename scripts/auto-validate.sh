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
require_command openspec

echo "Validating active OpenSpec changes..."
for change_dir in openspec/changes/*; do
  [ -d "$change_dir" ] || continue

  change_name="$(basename -- "$change_dir")"
  [ "$change_name" = "archive" ] && continue

  openspec validate "$change_name"
done

echo "Running WordPress owned-code checks..."
scripts/wp-test-owned-code.sh

echo "Running catalog-generator tests..."
npm --prefix catalog-generator test

echo "Checking changed-file whitespace and conflict markers..."
git diff --check

echo "Auto-validation passed."
