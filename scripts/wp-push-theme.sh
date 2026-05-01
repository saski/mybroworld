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

LOCAL_THEME_DIR="wordpress/wp-content/themes/luciastuy"
LOCAL_MU_PLUGIN_DIR="wordpress/wp-content/mu-plugins"

if [ ! -d "$LOCAL_THEME_DIR" ]; then
  echo "Owned theme directory not found: $LOCAL_THEME_DIR" >&2
  exit 1
fi

if [ ! -d "$LOCAL_MU_PLUGIN_DIR" ]; then
  echo "mu-plugin directory not found: $LOCAL_MU_PLUGIN_DIR" >&2
  exit 1
fi

REMOTE_HOST="${WP_REMOTE_HOST:-<set WP_REMOTE_HOST>}"
REMOTE_USER="${WP_REMOTE_USER:-<set WP_REMOTE_USER>}"
REMOTE_PATH="${WP_REMOTE_PATH:-<set WP_REMOTE_PATH>}"
REMOTE_THEME_DIR="${WP_REMOTE_THEME_DIR:-$REMOTE_PATH/wp-content/themes/luciastuy}"
REMOTE_MU_PLUGIN_DIR="${WP_REMOTE_MU_PLUGIN_DIR:-$REMOTE_PATH/wp-content/mu-plugins}"
FTP_HOST="${WP_FTP_HOST:-$REMOTE_HOST}"
FTP_USER="${WP_FTP_USER:-${WP_REMOTE_USER:-}}"
FTP_PASSWORD="${WP_FTP_PASSWORD:-${WP_REMOTE_PASSWORD:-}}"
DEPLOY_TRANSPORT="${WP_DEPLOY_TRANSPORT:-auto}"

if [ "$DEPLOY_TRANSPORT" = "auto" ]; then
  if [ -n "${WP_FTP_USER:-}" ] && [ -n "${WP_FTP_PASSWORD:-}" ]; then
    DEPLOY_TRANSPORT="ftp"
  else
    DEPLOY_TRANSPORT="rsync"
  fi
fi

case "$DEPLOY_TRANSPORT" in
  ftp|rsync) ;;
  *)
    echo "Unsupported WP_DEPLOY_TRANSPORT: $DEPLOY_TRANSPORT" >&2
    exit 1
    ;;
esac

REMOTE_USER_LABEL="$REMOTE_USER"
FTP_USER_LABEL="$FTP_USER"

if [ "$REMOTE_USER_LABEL" != "<set WP_REMOTE_USER>" ]; then
  REMOTE_USER_LABEL="<configured WP_REMOTE_USER>"
fi

if [ -n "$FTP_USER_LABEL" ]; then
  FTP_USER_LABEL="<configured WP_FTP_USER>"
else
  FTP_USER_LABEL="<set WP_FTP_USER>"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  if [ "$DEPLOY_TRANSPORT" = "ftp" ]; then
    cat <<MSG
Dry run only. Nothing will be uploaded.
Transport: ftp
Local theme source: $LOCAL_THEME_DIR
Remote theme target: $FTP_USER_LABEL@$FTP_HOST:$REMOTE_THEME_DIR
Local mu-plugin source: $LOCAL_MU_PLUGIN_DIR
Remote mu-plugin target: $FTP_USER_LABEL@$FTP_HOST:$REMOTE_MU_PLUGIN_DIR
MSG
  else
    cat <<MSG
Dry run only. Nothing will be uploaded.
Transport: rsync
Local theme source: $LOCAL_THEME_DIR
Remote theme target: $REMOTE_USER_LABEL@$REMOTE_HOST:$REMOTE_THEME_DIR
Local mu-plugin source: $LOCAL_MU_PLUGIN_DIR
Remote mu-plugin target: $REMOTE_USER_LABEL@$REMOTE_HOST:$REMOTE_MU_PLUGIN_DIR
MSG
  fi
  exit 0
fi

: "${WP_REMOTE_PATH:?Set WP_REMOTE_PATH}"

if [ "$DEPLOY_TRANSPORT" = "ftp" ]; then
  : "${FTP_HOST:?Set WP_FTP_HOST or WP_REMOTE_HOST}"
  : "${FTP_USER:?Set WP_FTP_USER}"
  : "${FTP_PASSWORD:?Set WP_FTP_PASSWORD}"

  if ! command -v lftp >/dev/null 2>&1; then
    echo "lftp is required for FTP deployment. Install it or set WP_DEPLOY_TRANSPORT=rsync." >&2
    exit 1
  fi

  echo "Uploading owned theme via FTP..."
  lftp <<LFTP
set cmd:fail-exit true
set ftp:ssl-allow true
open --user "$FTP_USER" --password "$FTP_PASSWORD" "ftp://$FTP_HOST"
mkdir -p "$REMOTE_THEME_DIR"
mkdir -p "$REMOTE_MU_PLUGIN_DIR"
mirror -R --verbose --exclude-glob .DS_Store "$LOCAL_THEME_DIR" "$REMOTE_THEME_DIR"
mirror -R --verbose --exclude-glob .DS_Store "$LOCAL_MU_PLUGIN_DIR" "$REMOTE_MU_PLUGIN_DIR"
bye
LFTP
  exit 0
fi

: "${WP_REMOTE_HOST:?Set WP_REMOTE_HOST}"
: "${WP_REMOTE_USER:?Set WP_REMOTE_USER}"

if command -v rsync >/dev/null 2>&1; then
  echo "Uploading owned theme via rsync..."
  rsync -av "$LOCAL_THEME_DIR/" "$WP_REMOTE_USER@$WP_REMOTE_HOST:$REMOTE_THEME_DIR/"
  echo "Uploading mu-plugins via rsync..."
  rsync -av "$LOCAL_MU_PLUGIN_DIR/" "$WP_REMOTE_USER@$WP_REMOTE_HOST:$REMOTE_MU_PLUGIN_DIR/"
  exit 0
fi

cat <<MSG
rsync is not available. Use FTP/SFTP manually for now.
Source directories:
- $LOCAL_THEME_DIR
- $LOCAL_MU_PLUGIN_DIR
Remote directories:
- $REMOTE_THEME_DIR
- $REMOTE_MU_PLUGIN_DIR
MSG
