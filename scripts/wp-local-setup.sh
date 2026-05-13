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

print_command() {
  printf "+"
  printf " %q" "$@"
  printf "\n"
}

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

run() {
  print_command "$@"
  if [ "$DRY_RUN" -eq 0 ]; then
    "$@"
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  run cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

if [ -f "$ENV_FILE" ]; then
  load_env_file "$ENV_FILE"
else
  load_env_file "$ENV_EXAMPLE"
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
WP_URL="${WORDPRESS_INSTALL_URL:-http://localhost:${WORDPRESS_PORT:-8080}}"
WP_TITLE="${WORDPRESS_INSTALL_TITLE:-Lucia Stuy Local}"
WP_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
WP_ADMIN_PASSWORD="${WORDPRESS_ADMIN_PASSWORD:-change-me-now}"
WP_ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-studio@example.test}"

wp_cli() {
  run "${COMPOSE[@]}" run --rm wpcli "$@"
}

wp_cli_eval_file() {
  local local_file="$1"
  local container_file="/tmp/$(basename "$local_file")"

  run "${COMPOSE[@]}" run --rm -v "$REPO_ROOT/$local_file:$container_file:ro" wpcli eval-file "$container_file"
}

run "${COMPOSE[@]}" up -d

if [ "$DRY_RUN" -eq 1 ]; then
  wp_cli core is-installed
  wp_cli core install \
    --url="$WP_URL" \
    --title="$WP_TITLE" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" \
    --skip-email
  wp_cli option update home "$WP_URL"
  wp_cli option update siteurl "$WP_URL"
  wp_cli plugin install woocommerce --activate
  wp_cli eval 'if (class_exists("WC_Install")) { WC_Install::create_pages(); }'
  wp_cli_eval_file scripts/wp-local-ensure-commerce-pages.php
  wp_cli_eval_file scripts/wp-local-ensure-checkout-readiness.php
  wp_cli theme activate luciastuy
  wp_cli rewrite structure '/%postname%/'
  wp_cli rewrite flush
  exit 0
fi

for _ in {1..30}; do
  if "${COMPOSE[@]}" run --rm wpcli core version >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! "${COMPOSE[@]}" run --rm wpcli core is-installed >/dev/null 2>&1; then
  wp_cli core install \
    --url="$WP_URL" \
    --title="$WP_TITLE" \
    --admin_user="$WP_ADMIN_USER" \
    --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" \
    --skip-email
fi

wp_cli option update home "$WP_URL"
wp_cli option update siteurl "$WP_URL"

if ! "${COMPOSE[@]}" run --rm wpcli plugin is-installed woocommerce >/dev/null 2>&1; then
  wp_cli plugin install woocommerce --activate
else
  wp_cli plugin activate woocommerce
fi

wp_cli eval 'if (class_exists("WC_Install")) { WC_Install::create_pages(); }'
wp_cli_eval_file scripts/wp-local-ensure-commerce-pages.php
wp_cli_eval_file scripts/wp-local-ensure-checkout-readiness.php
wp_cli theme activate luciastuy
wp_cli rewrite structure '/%postname%/'
wp_cli rewrite flush

echo "Local WordPress is ready at $WP_URL"
echo "Admin user: $WP_ADMIN_USER"
