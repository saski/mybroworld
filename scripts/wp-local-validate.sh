#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Usage: $0 [--dry-run]" >&2
      exit 1
      ;;
  esac
done

ENV_FILE="${WORDPRESS_ENV_FILE:-wordpress/.env}"
ENV_EXAMPLE="wordpress/.env.example"
COMPOSE_FILE="${WORDPRESS_COMPOSE_FILE:-wordpress/docker-compose.yml}"

load_env_file() {
  local file_path="$1"
  local line
  local key
  local value

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|\#*) continue ;;
    esac

    key="${line%%=*}"
    value="${line#*=}"

    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      export "$key=$value"
    fi
  done < "$file_path"
}

if [ -f "$ENV_FILE" ]; then
  load_env_file "$ENV_FILE"
else
  load_env_file "$ENV_EXAMPLE"
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
WP_URL="${WORDPRESS_INSTALL_URL:-http://localhost:${WORDPRESS_PORT:-8080}}"
EXPECTED_THEME="${WP_EXPECTED_THEME:-luciastuy}"
if [ "${WP_REQUIRE_PRODUCT_SMOKE+x}" = x ]; then
  PRODUCT_SMOKE_REQUIRED="$WP_REQUIRE_PRODUCT_SMOKE"
elif [ "$EXPECTED_THEME" = "glacier" ]; then
  PRODUCT_SMOKE_REQUIRED=1
else
  PRODUCT_SMOKE_REQUIRED=0
fi

print_command() {
  printf "+"
  printf " %q" "$@"
  printf "\n"
}

run() {
  print_command "$@"
  if [ "$DRY_RUN" -eq 0 ]; then
    "$@"
  fi
}

wp_cli() {
  run "${COMPOSE[@]}" run --rm wpcli "$@"
}

run scripts/wp-test-owned-code.sh
run "${COMPOSE[@]}" ps
wp_cli --skip-themes --skip-plugins core is-installed
wp_cli --skip-themes --skip-plugins plugin is-active woocommerce
wp_cli --skip-themes --skip-plugins theme is-active "$EXPECTED_THEME"
run env "WP_BASE_URL=$WP_URL" "WP_SMOKE_INCLUDE_FIRST_PRODUCT=1" "WP_REQUIRE_PRODUCT_SMOKE=$PRODUCT_SMOKE_REQUIRED" scripts/wp-plugin-removal-smoke.sh

echo "Local WordPress validation passed for $WP_URL"
