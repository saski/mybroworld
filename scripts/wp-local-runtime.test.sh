#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  case "$haystack" in
    *"$needle"*) ;;
    *) fail "$label" ;;
  esac
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  case "$haystack" in
    *"$needle"*) fail "$label" ;;
    *) ;;
  esac
}

ENV_FILE="$TMP_DIR/wordpress.env"
cat > "$ENV_FILE" <<'ENV'
WORDPRESS_PORT=9090
PHPMYADMIN_PORT=9091
MYSQL_DATABASE=wordpress
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress
MYSQL_ROOT_PASSWORD=root
WORDPRESS_TABLE_PREFIX=wp_lucia_
WORDPRESS_DEBUG=1
WORDPRESS_INSTALL_URL=http://localhost:9090
WORDPRESS_INSTALL_TITLE=Lucia Stuy Local Test
WORDPRESS_ADMIN_USER=admin
WORDPRESS_ADMIN_PASSWORD=change-me-now
WORDPRESS_ADMIN_EMAIL=studio@example.test
WORDPRESS_CONFIG_EXTRA=
ENV

cd "$PROJECT_ROOT"

SETUP_OUTPUT=$(WORDPRESS_ENV_FILE="$ENV_FILE" scripts/wp-local-setup.sh --dry-run)
assert_contains "$SETUP_OUTPUT" "docker compose --env-file" "setup dry-run should use docker compose"
assert_contains "$SETUP_OUTPUT" "wordpress/docker-compose.yml up -d" "setup dry-run should start the stack"
assert_contains "$SETUP_OUTPUT" "core install --url=http://localhost:9090" "setup dry-run should install WordPress with configured URL"
assert_contains "$SETUP_OUTPUT" "plugin install woocommerce --activate" "setup dry-run should install WooCommerce"
assert_contains "$SETUP_OUTPUT" "theme activate luciastuy" "setup dry-run should activate the owned theme"
assert_contains "$SETUP_OUTPUT" "WC_Install" "setup dry-run should create WooCommerce pages"

VALIDATE_OUTPUT=$(env -u WP_EXPECTED_THEME -u WP_REQUIRE_PRODUCT_SMOKE WORDPRESS_ENV_FILE="$ENV_FILE" scripts/wp-local-validate.sh --dry-run)
assert_contains "$VALIDATE_OUTPUT" "scripts/wp-test-owned-code.sh" "validate dry-run should run owned-code checks"
assert_contains "$VALIDATE_OUTPUT" "--skip-themes --skip-plugins plugin is-active woocommerce" "validate dry-run should assert WooCommerce is active without loading runtime code"
assert_contains "$VALIDATE_OUTPUT" "--skip-themes --skip-plugins theme is-active luciastuy" "validate dry-run should assert owned theme is active without loading runtime code"
assert_contains "$VALIDATE_OUTPUT" "WP_BASE_URL=http://localhost:9090" "validate dry-run should smoke the configured local URL"
assert_contains "$VALIDATE_OUTPUT" "WP_SMOKE_INCLUDE_FIRST_PRODUCT=1" "validate dry-run should include product-detail smoke coverage when a product exists"
assert_contains "$VALIDATE_OUTPUT" "WP_REQUIRE_PRODUCT_SMOKE=0" "validate dry-run should not require a product on clean local installs"

PRODUCTION_VALIDATE_OUTPUT=$(env -u WP_REQUIRE_PRODUCT_SMOKE WORDPRESS_ENV_FILE="$ENV_FILE" WP_EXPECTED_THEME=glacier scripts/wp-local-validate.sh --dry-run)
assert_contains "$PRODUCTION_VALIDATE_OUTPUT" "--skip-themes --skip-plugins theme is-active glacier" "validate dry-run should allow the production theme expectation without loading runtime code"
assert_contains "$PRODUCTION_VALIDATE_OUTPUT" "WP_REQUIRE_PRODUCT_SMOKE=1" "production snapshot validation should require product-detail smoke coverage"

SNAPSHOT_DIR="$TMP_DIR/snapshot"
mkdir -p "$SNAPSHOT_DIR/wp-content/plugins" "$SNAPSHOT_DIR/wp-content/themes/glacier" "$SNAPSHOT_DIR/wp-content/uploads"
printf '%s\n' '<?php' "\$table_prefix = 'wp_nueva';" > "$SNAPSHOT_DIR/wp-config.php"
printf '%s\n' '-- test dump' > "$SNAPSHOT_DIR/wordpress-db.sql"

IMPORT_OUTPUT=$(WORDPRESS_ENV_FILE="$ENV_FILE" scripts/wp-local-import-snapshot.sh --snapshot-dir "$SNAPSHOT_DIR" --dry-run)
assert_contains "$IMPORT_OUTPUT" "docker compose --env-file" "import dry-run should use docker compose"
assert_contains "$IMPORT_OUTPUT" "wordpress/docker-compose.yml up -d" "import dry-run should start the stack"
assert_contains "$IMPORT_OUTPUT" "/var/www/html/wp-content/plugins/" "import dry-run should copy snapshot plugins into the local runtime"
assert_contains "$IMPORT_OUTPUT" "/var/www/html/wp-content/themes/" "import dry-run should copy snapshot themes into the local runtime"
assert_contains "$IMPORT_OUTPUT" "/var/www/html/wp-content/uploads/" "import dry-run should copy snapshot uploads into the local runtime"
assert_contains "$IMPORT_OUTPUT" "config set table_prefix wp_nueva --type=variable" "import dry-run should use the snapshot table prefix when importing the database"
assert_contains "$IMPORT_OUTPUT" "db import /tmp/mybroworld-local-import.sql" "import dry-run should import the snapshot database when present"
assert_contains "$IMPORT_OUTPUT" "search-replace https://www.luciastuy.com http://localhost:9090" "import dry-run should rewrite the production URL for local use"

EMPTY_DB_SNAPSHOT_DIR="$TMP_DIR/empty-db-snapshot"
mkdir -p "$EMPTY_DB_SNAPSHOT_DIR/wp-content/plugins"
printf '%s\n' '<?php' "\$table_prefix = 'wp_nueva';" > "$EMPTY_DB_SNAPSHOT_DIR/wp-config.php"
touch "$EMPTY_DB_SNAPSHOT_DIR/wordpress-db.sql"

EMPTY_DB_IMPORT_OUTPUT=$(WORDPRESS_ENV_FILE="$ENV_FILE" scripts/wp-local-import-snapshot.sh --snapshot-dir "$EMPTY_DB_SNAPSHOT_DIR" --dry-run)
assert_contains "$EMPTY_DB_IMPORT_OUTPUT" "Database dump is empty; imported wp-content only" "import dry-run should explain empty database placeholders"
assert_not_contains "$EMPTY_DB_IMPORT_OUTPUT" "db import /tmp/mybroworld-local-import.sql" "import dry-run should not import an empty database placeholder"
assert_not_contains "$EMPTY_DB_IMPORT_OUTPUT" "config set table_prefix wp_nueva" "import dry-run should not change the table prefix without a database import"

echo "ok test scripts/wp-local-runtime.test.sh"
