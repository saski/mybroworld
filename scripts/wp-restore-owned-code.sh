#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REMOTE_CONFIG_FILE="${WP_REMOTE_CONFIG_FILE:-$SCRIPT_DIR/wp-remote.env}"

if [ -f "$REMOTE_CONFIG_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$REMOTE_CONFIG_FILE"
  set +a
fi

BACKUP_DIR=""
DRY_RUN=0
ALLOW_DELETE=0

usage() {
  echo "Usage: $0 --backup-dir backups/<timestamp> [--dry-run] [--allow-delete]" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --backup-dir)
      BACKUP_DIR="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --allow-delete)
      ALLOW_DELETE=1
      shift
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done

if [ -z "$BACKUP_DIR" ]; then
  usage
  exit 1
fi

ARCHIVE_PATH="$BACKUP_DIR/wp-content.tar.gz"

if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Backup archive not found: $ARCHIVE_PATH" >&2
  exit 1
fi

REMOTE_PATH="${WP_REMOTE_PATH:-<set WP_REMOTE_PATH>}"
REMOTE_THEME_DIR="${WP_REMOTE_THEME_DIR:-$REMOTE_PATH/wp-content/themes/luciastuy}"
REMOTE_MU_PLUGIN_DIR="${WP_REMOTE_MU_PLUGIN_DIR:-$REMOTE_PATH/wp-content/mu-plugins}"
FTP_HOST="${WP_FTP_HOST:-${WP_REMOTE_HOST:-}}"
FTP_USER="${WP_FTP_USER:-${WP_REMOTE_USER:-}}"
FTP_PASSWORD="${WP_FTP_PASSWORD:-${WP_REMOTE_PASSWORD:-}}"
DEPLOY_TRANSPORT="${WP_DEPLOY_TRANSPORT:-ftp}"

case "$DEPLOY_TRANSPORT" in
  ftp) ;;
  *)
    echo "Unsupported WP_DEPLOY_TRANSPORT for restore: $DEPLOY_TRANSPORT" >&2
    exit 1
    ;;
esac

FTP_USER_LABEL="$FTP_USER"
if [ -n "$FTP_USER_LABEL" ]; then
  FTP_USER_LABEL="<configured WP_FTP_USER>"
else
  FTP_USER_LABEL="<set WP_FTP_USER>"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  cat <<MSG
Dry run only. Nothing will be restored.
Transport: ftp
Archive: $ARCHIVE_PATH
Remote deletion: execution requires --allow-delete
Remote theme target: $FTP_USER_LABEL@$FTP_HOST:$REMOTE_THEME_DIR
Remote mu-plugin target: $FTP_USER_LABEL@$FTP_HOST:$REMOTE_MU_PLUGIN_DIR
MSG
  exit 0
fi

if [ "$ALLOW_DELETE" -ne 1 ]; then
  echo "Restore replaces remote owned-code directories and requires --allow-delete." >&2
  exit 1
fi

: "${WP_REMOTE_PATH:?Set WP_REMOTE_PATH}"
: "${FTP_HOST:?Set WP_FTP_HOST or WP_REMOTE_HOST}"
: "${FTP_USER:?Set WP_FTP_USER}"
: "${FTP_PASSWORD:?Set WP_FTP_PASSWORD}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "lftp is required for FTP restore." >&2
  exit 1
fi

if [ -n "${WP_RESTORE_TMP_DIR:-}" ]; then
  RESTORE_TMP_DIR="$WP_RESTORE_TMP_DIR"
  rm -rf "$RESTORE_TMP_DIR"
  mkdir -p "$RESTORE_TMP_DIR"
  CLEANUP_RESTORE_TMP=0
else
  RESTORE_TMP_DIR=$(mktemp -d)
  CLEANUP_RESTORE_TMP=1
fi

cleanup() {
  if [ "$CLEANUP_RESTORE_TMP" -eq 1 ]; then
    rm -rf "$RESTORE_TMP_DIR"
  fi
}
trap cleanup EXIT INT TERM

tar -xzf "$ARCHIVE_PATH" -C "$RESTORE_TMP_DIR"

RESTORE_THEME_SOURCE="$RESTORE_TMP_DIR/themes/luciastuy"
RESTORE_MU_PLUGIN_SOURCE="$RESTORE_TMP_DIR/mu-plugins"

if [ ! -d "$RESTORE_THEME_SOURCE" ]; then
  echo "Backup archive does not contain themes/luciastuy." >&2
  exit 1
fi

if [ ! -d "$RESTORE_MU_PLUGIN_SOURCE" ]; then
  echo "Backup archive does not contain mu-plugins." >&2
  exit 1
fi

echo "Restoring owned WordPress code via FTP..."
lftp <<LFTP
set cmd:fail-exit true
set ftp:ssl-allow true
open --user "$FTP_USER" --password "$FTP_PASSWORD" "ftp://$FTP_HOST"
mkdir -pf "$REMOTE_THEME_DIR"
mkdir -pf "$REMOTE_MU_PLUGIN_DIR"
mirror -R --verbose --delete --exclude-glob .DS_Store "$RESTORE_THEME_SOURCE" "$REMOTE_THEME_DIR"
mirror -R --verbose --delete --exclude-glob .DS_Store "$RESTORE_MU_PLUGIN_SOURCE" "$REMOTE_MU_PLUGIN_DIR"
bye
LFTP
