#!/bin/sh
set -eu

REPO_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
THEME_DIR="$REPO_ROOT/wordpress/wp-content/themes/luciastuy"
MU_PLUGIN_DIR="$REPO_ROOT/wordpress/wp-content/mu-plugins"
MU_PLUGIN_TEST="$MU_PLUGIN_DIR/tests/lucia-artwork-meta-test.php"

if [ ! -d "$THEME_DIR" ]; then
  echo "Owned theme directory not found: $THEME_DIR" >&2
  exit 1
fi

if [ ! -d "$MU_PLUGIN_DIR" ]; then
  echo "mu-plugin directory not found: $MU_PLUGIN_DIR" >&2
  exit 1
fi

if [ ! -f "$MU_PLUGIN_TEST" ]; then
  echo "mu-plugin test not found: $MU_PLUGIN_TEST" >&2
  exit 1
fi

run_local_php_checks() {
  find "$THEME_DIR" "$MU_PLUGIN_DIR" -type f -name '*.php' -print | while IFS= read -r php_file; do
    php -l "$php_file" >/dev/null
    echo "Lint OK: ${php_file#$REPO_ROOT/}"
  done

  php "$MU_PLUGIN_TEST"
  echo "Test OK: ${MU_PLUGIN_TEST#$REPO_ROOT/}"
}

run_docker_php_checks() {
  docker compose \
    --env-file "$REPO_ROOT/wordpress/.env.example" \
    -f "$REPO_ROOT/wordpress/docker-compose.yml" \
    run \
    --rm \
    --no-deps \
    --entrypoint sh \
    wordpress \
    -c '
      set -eu
      find /var/www/html/wp-content/themes/luciastuy /var/www/html/wp-content/mu-plugins -type f -name "*.php" -print | while IFS= read -r php_file; do
        php -l "$php_file" >/dev/null
        echo "Lint OK: ${php_file#/var/www/html/}"
      done

      php /var/www/html/wp-content/mu-plugins/tests/lucia-artwork-meta-test.php
      echo "Test OK: wp-content/mu-plugins/tests/lucia-artwork-meta-test.php"
    '
}

echo "Checking owned WordPress code..."

if command -v php >/dev/null 2>&1; then
  run_local_php_checks
elif [ "${WP_TEST_USE_DOCKER:-0}" = "1" ] && command -v docker >/dev/null 2>&1; then
  run_docker_php_checks
else
  echo "Local php is not available; install php or rerun with WP_TEST_USE_DOCKER=1 on a Docker-enabled machine." >&2
  exit 1
fi

echo "Owned WordPress code checks passed."
