#!/bin/sh
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
WP_BASE_URL="${WP_BASE_URL:-http://localhost:8080}"

scripts/wp-test-owned-code.sh

echo "Running WordPress storefront smoke checks against $WP_BASE_URL..."
WP_BASE_URL="$WP_BASE_URL" node scripts/wp-smoke-test.mjs

echo "Plugin-removal smoke checks passed."
