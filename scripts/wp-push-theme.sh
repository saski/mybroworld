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

if [ "$DRY_RUN" -eq 1 ]; then
  cat <<MSG
Dry run only. Nothing will be uploaded.
Local theme source: $LOCAL_THEME_DIR
Remote theme target: $REMOTE_USER@$REMOTE_HOST:$REMOTE_THEME_DIR
Local mu-plugin source: $LOCAL_MU_PLUGIN_DIR
Remote mu-plugin target: $REMOTE_USER@$REMOTE_HOST:$REMOTE_MU_PLUGIN_DIR
MSG
  exit 0
fi

: "${WP_REMOTE_HOST:?Set WP_REMOTE_HOST}"
: "${WP_REMOTE_USER:?Set WP_REMOTE_USER}"
: "${WP_REMOTE_PATH:?Set WP_REMOTE_PATH}"

if command -v rsync >/dev/null 2>&1; then
  echo "Uploading owned theme via rsync..."
  rsync -av --delete "$LOCAL_THEME_DIR/" "$WP_REMOTE_USER@$WP_REMOTE_HOST:$REMOTE_THEME_DIR/"
  echo "Uploading mu-plugins via rsync..."
  rsync -av --delete "$LOCAL_MU_PLUGIN_DIR/" "$WP_REMOTE_USER@$WP_REMOTE_HOST:$REMOTE_MU_PLUGIN_DIR/"
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
