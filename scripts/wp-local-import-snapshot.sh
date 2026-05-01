#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=0
SKIP_DB=0
SNAPSHOT_DIR="${MYBROWORLD_PROD_SNAPSHOT_DIR:-}"
DB_DUMP=""

usage() {
  cat >&2 <<'USAGE'
Usage: scripts/wp-local-import-snapshot.sh [--snapshot-dir PATH] [--db-dump PATH] [--skip-db] [--dry-run]

Imports an already-downloaded production snapshot into the local Docker WordPress runtime.
This script does not connect to production.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --snapshot-dir)
      SNAPSHOT_DIR="${2:-}"
      shift 2
      ;;
    --db-dump)
      DB_DUMP="${2:-}"
      shift 2
      ;;
    --skip-db)
      SKIP_DB=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done

if [ -z "$SNAPSHOT_DIR" ] && [ -f /tmp/mybroworld-last-prod-snapshot-dir ]; then
  SNAPSHOT_DIR="$(sed -n '1p' /tmp/mybroworld-last-prod-snapshot-dir)"
fi

if [ -z "$SNAPSHOT_DIR" ]; then
  echo "No snapshot directory configured. Pass --snapshot-dir or set MYBROWORLD_PROD_SNAPSHOT_DIR." >&2
  exit 1
fi

case "$SNAPSHOT_DIR" in
  /*) ;;
  *) SNAPSHOT_DIR="$REPO_ROOT/$SNAPSHOT_DIR" ;;
esac

if [ ! -d "$SNAPSHOT_DIR/wp-content" ]; then
  echo "Snapshot directory must contain wp-content: $SNAPSHOT_DIR" >&2
  exit 1
fi

ENV_FILE="${WORDPRESS_ENV_FILE:-wordpress/.env}"
ENV_EXAMPLE="wordpress/.env.example"
COMPOSE_FILE="${WORDPRESS_COMPOSE_FILE:-wordpress/docker-compose.yml}"
LOCAL_SQL_PATH="/tmp/mybroworld-local-import.sql"
PRODUCTION_URL="${WORDPRESS_PRODUCTION_URL:-https://www.luciastuy.com}"

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

detect_table_prefix() {
  local wp_config="$1"

  if [ ! -f "$wp_config" ]; then
    return 0
  fi

  sed -n "s/^[[:space:]]*\\\$table_prefix[[:space:]]*=[[:space:]]*['\"]\\([^'\"]*\\)['\"].*/\\1/p" "$wp_config" | sed -n '1p'
}

copy_wp_content_dir() {
  local name="$1"
  local source_dir="$SNAPSHOT_DIR/wp-content/$name"
  local target_dir="/var/www/html/wp-content/$name"

  if [ ! -d "$source_dir" ]; then
    echo "Skipping missing snapshot directory: wp-content/$name"
    return 0
  fi

  run docker cp "$source_dir/." "luciastuy-wordpress:$target_dir/"
}

if [ ! -f "$ENV_FILE" ]; then
  run cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

if [ -f "$ENV_FILE" ]; then
  load_env_file "$ENV_FILE"
else
  load_env_file "$ENV_EXAMPLE"
fi

if [ "$SKIP_DB" -eq 0 ] && [ -z "$DB_DUMP" ]; then
  for candidate in "$SNAPSHOT_DIR/wordpress-db.sql" "$SNAPSHOT_DIR/wordpress.sql"; do
    if [ -f "$candidate" ]; then
      DB_DUMP="$candidate"
      break
    fi
  done
fi

if [ "$SKIP_DB" -eq 0 ] && [ -n "$DB_DUMP" ]; then
  case "$DB_DUMP" in
    /*) ;;
    *) DB_DUMP="$REPO_ROOT/$DB_DUMP" ;;
  esac
fi

IMPORT_DB=0
if [ "$SKIP_DB" -eq 0 ] && [ -n "$DB_DUMP" ] && [ -s "$DB_DUMP" ]; then
  IMPORT_DB=1
fi

SNAPSHOT_TABLE_PREFIX="$(detect_table_prefix "$SNAPSHOT_DIR/wp-config.php")"
if [ "$IMPORT_DB" -eq 1 ] && [ -n "$SNAPSHOT_TABLE_PREFIX" ]; then
  export WORDPRESS_TABLE_PREFIX="$SNAPSHOT_TABLE_PREFIX"
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
WP_URL="${WORDPRESS_INSTALL_URL:-http://localhost:${WORDPRESS_PORT:-8080}}"

wp_cli() {
  run "${COMPOSE[@]}" run --rm wpcli "$@"
}

wp_cli_root() {
  run "${COMPOSE[@]}" run --rm --user 0 wpcli --allow-root "$@"
}

run "${COMPOSE[@]}" up -d

copy_wp_content_dir plugins
copy_wp_content_dir themes
copy_wp_content_dir uploads
copy_wp_content_dir languages
copy_wp_content_dir fonts

if [ "$IMPORT_DB" -eq 1 ] && [ -n "$SNAPSHOT_TABLE_PREFIX" ]; then
  wp_cli_root config set table_prefix "$SNAPSHOT_TABLE_PREFIX" --type=variable
fi

if [ "$SKIP_DB" -eq 1 ]; then
  echo "Skipping database import because --skip-db was provided."
elif [ -z "$DB_DUMP" ]; then
  echo "No database dump found in snapshot; imported wp-content only."
elif [ ! -s "$DB_DUMP" ]; then
  echo "Database dump is empty; imported wp-content only: $DB_DUMP"
fi

if [ "$IMPORT_DB" -eq 1 ]; then
  run "${COMPOSE[@]}" run --rm --volume "$DB_DUMP:$LOCAL_SQL_PATH:ro" wpcli db import "$LOCAL_SQL_PATH"
  wp_cli --skip-themes --skip-plugins search-replace "$PRODUCTION_URL" "$WP_URL" --all-tables-with-prefix --skip-columns=guid
  wp_cli --skip-themes --skip-plugins rewrite flush
fi

echo "Local snapshot import finished for $WP_URL"
