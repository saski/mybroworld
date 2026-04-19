#!/bin/sh
set -eu

# Creates a local DB dump for the remote WordPress database.
# Modes:
# 1) Automated mysqldump (if WP_MYSQL_* are set)
# 2) Staging mode: user passes a pre-exported SQL file (--db-file)

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REMOTE_CONFIG_FILE="${WP_REMOTE_CONFIG_FILE:-$SCRIPT_DIR/wp-remote.env}"

if [ -f "$REMOTE_CONFIG_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$REMOTE_CONFIG_FILE"
  set +a
fi

DB_FILE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --db-file)
      DB_FILE="${2:-}"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--db-file /path/to/export.sql]" >&2
      exit 1
      ;;
  esac
done

TS="${WP_BACKUP_TIMESTAMP:-$(date -u +%Y%m%d-%H%M%S)}"
BACKUP_BASE_DIR="${WP_BACKUP_BASE_DIR:-backups}"
OUT_DIR="${WP_BACKUP_OUT_DIR:-$BACKUP_BASE_DIR/$TS}"
mkdir -p "$OUT_DIR"

SQL_PATH="$OUT_DIR/wordpress-db.sql"

if [ -n "$DB_FILE" ]; then
  if [ ! -f "$DB_FILE" ]; then
    echo "DB dump not found: $DB_FILE" >&2
    exit 1
  fi
  cp "$DB_FILE" "$SQL_PATH"
  echo "Staged DB dump to $SQL_PATH"
  exit 0
fi

if [ "${WP_MYSQL_HOST:-}" = "" ] || [ "${WP_MYSQL_USER:-}" = "" ] || [ "${WP_MYSQL_PASSWORD:-}" = "" ] || [ "${WP_MYSQL_DB:-}" = "" ]; then
  echo "No DB dump provided and mysqldump vars not set." >&2
  echo "Set WP_MYSQL_HOST, WP_MYSQL_USER, WP_MYSQL_PASSWORD, WP_MYSQL_DB in scripts/wp-remote.env" >&2
  echo "Or run with: $0 --db-file /path/to/export.sql" >&2
  exit 1
fi

MYSQL_PORT="${WP_MYSQL_PORT:-3306}"

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "mysqldump not found on this machine. Install MySQL client tools or pass --db-file." >&2
  exit 1
fi

umask 077

echo "Creating DB dump via mysqldump (this may take a while)..."
mysqldump \
  --host="$WP_MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$WP_MYSQL_USER" \
  --password="$WP_MYSQL_PASSWORD" \
  "$WP_MYSQL_DB" > "$SQL_PATH"

echo "Created $SQL_PATH"
