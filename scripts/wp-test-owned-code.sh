#!/bin/sh
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

PHP_BIN="${PHP_BIN:-php}"

if ! command -v "$PHP_BIN" >/dev/null 2>&1; then
  echo "PHP is required. Install it with Homebrew or set PHP_BIN=/path/to/php." >&2
  exit 1
fi

PHP_FILES="$(mktemp)"
trap 'rm -f "$PHP_FILES"' EXIT

find wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins -name '*.php' -print > "$PHP_FILES"

echo "Linting WordPress owned PHP files..."
while IFS= read -r file_path; do
  "$PHP_BIN" -l "$file_path" >/dev/null
  echo "ok lint $file_path"
done < "$PHP_FILES"

echo "Running WordPress owned PHP tests..."
for test_file in wordpress/wp-content/mu-plugins/tests/*-test.php; do
  [ -e "$test_file" ] || continue
  "$PHP_BIN" "$test_file"
  echo "ok test $test_file"
done

if command -v node >/dev/null 2>&1; then
  echo "Running WordPress smoke helper tests..."
  node --test scripts/wp-smoke-test.test.mjs scripts/wp-inventory-parity.test.mjs
else
  echo "Node.js is required to run WordPress smoke helper tests." >&2
  exit 1
fi

echo "Running WordPress deploy script tests..."
sh scripts/wp-push-theme.test.sh
scripts/wp-remote-db-export.test.sh

echo "Running WordPress local runtime script tests..."
scripts/wp-local-runtime.test.sh

echo "WordPress owned-code checks passed."
