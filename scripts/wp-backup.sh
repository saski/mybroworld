#!/bin/sh
set -eu

# Wrapper for repeatable WordPress backups:
# - DB dump (automated mysqldump or staged SQL file)
# - wp-content archive (plugins/mu-plugins/themes) via FTP
#
# Output:
#   backups/<timestamp>/
#     wordpress-db.sql
#     wp-content.tar.gz
#     backup-manifest.md

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REMOTE_CONFIG_FILE="${WP_REMOTE_CONFIG_FILE:-$SCRIPT_DIR/wp-remote.env}"

if [ -f "$REMOTE_CONFIG_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$REMOTE_CONFIG_FILE"
  set +a
fi

DB_FILE=""
SKIP_DB=0
SKIP_CONTENT=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --db-file)
      DB_FILE="${2:-}"
      shift 2
      ;;
    --skip-db)
      SKIP_DB=1
      shift
      ;;
    --skip-content)
      SKIP_CONTENT=1
      shift
      ;;
    *)
      echo "Usage: $0 [--db-file /path/to/export.sql] [--skip-db] [--skip-content]" >&2
      exit 1
      ;;
  esac
done

TS="${WP_BACKUP_TIMESTAMP:-$(date -u +%Y%m%d-%H%M%S)}"
BACKUP_BASE_DIR="${WP_BACKUP_BASE_DIR:-backups}"
OUT_DIR="${WP_BACKUP_OUT_DIR:-$BACKUP_BASE_DIR/$TS}"

mkdir -p "$OUT_DIR"

echo "Backup timestamp: $TS"
echo "Backup output: $OUT_DIR"

if [ "$SKIP_DB" -eq 0 ]; then
  if [ -n "$DB_FILE" ]; then
    sh "$SCRIPT_DIR/wp-backup-db.sh" --db-file "$DB_FILE"
  else
    sh "$SCRIPT_DIR/wp-backup-db.sh"
  fi
fi

if [ "$SKIP_CONTENT" -eq 0 ]; then
  sh "$SCRIPT_DIR/wp-backup-wp-content.sh"
fi

MANIFEST_PATH="$OUT_DIR/backup-manifest.md"
{
  echo "# WP Backup Manifest"
  echo
  echo "- Timestamp (UTC): $TS"
  echo "- Host: ${WP_REMOTE_HOST:-unknown}"
  echo "- Remote path: ${WP_REMOTE_PATH:-unknown}"
  echo
  echo "## Artifacts"
  echo
  if [ -f "$OUT_DIR/wordpress-db.sql" ]; then
    DB_SUM="$(shasum -a 256 "$OUT_DIR/wordpress-db.sql" | awk '{print $1}')"
    DB_SIZE="$(wc -c < "$OUT_DIR/wordpress-db.sql" | tr -d ' ')"
    echo "- `wordpress-db.sql` (sha256: $DB_SUM, bytes: $DB_SIZE)"
  else
    echo "- `wordpress-db.sql` (skipped)"
  fi

  if [ -f "$OUT_DIR/wp-content.tar.gz" ]; then
    CONTENT_SUM="$(shasum -a 256 "$OUT_DIR/wp-content.tar.gz" | awk '{print $1}')"
    CONTENT_SIZE="$(wc -c < "$OUT_DIR/wp-content.tar.gz" | tr -d ' ')"
    echo "- `wp-content.tar.gz` (sha256: $CONTENT_SUM, bytes: $CONTENT_SIZE)"
  else
    echo "- `wp-content.tar.gz` (skipped)"
  fi
} > "$MANIFEST_PATH"

echo "Wrote manifest: $MANIFEST_PATH"
echo "Backup complete."

