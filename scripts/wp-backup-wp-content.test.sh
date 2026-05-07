#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SCRIPT="$PROJECT_ROOT/scripts/wp-backup-wp-content.sh"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  haystack="$1"
  needle="$2"
  label="$3"

  case "$haystack" in
    *"$needle"*) ;;
    *) fail "$label" ;;
  esac
}

cd "$PROJECT_ROOT"

CONFIG_FILE="$TMP_DIR/wp-remote.env"
cat > "$CONFIG_FILE" <<'ENV'
WP_FTP_HOST=ftp.luciastuy.test
WP_FTP_USER=ftp-user
WP_FTP_PASSWORD=secret-value
WP_REMOTE_PATH=/public
ENV

mkdir -p "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/python3" <<'SH'
#!/bin/sh
set -eu

case "$WP_CONTENT_ROOT" in
  /public/wp-content) ;;
  *) echo "unexpected WP_CONTENT_ROOT=$WP_CONTENT_ROOT" >&2; exit 1 ;;
esac

case "$SUBDIRS" in
  "mu-plugins themes/luciastuy") ;;
  *) echo "unexpected SUBDIRS=$SUBDIRS" >&2; exit 1 ;;
esac

mkdir -p "$TMP_DIR/mu-plugins" "$TMP_DIR/themes/luciastuy"
printf 'previous mu plugin\n' > "$TMP_DIR/mu-plugins/lucia-bootstrap.php"
printf 'previous theme\n' > "$TMP_DIR/themes/luciastuy/style.css"
printf 'Downloaded 2 files into %s\n' "$TMP_DIR"
SH
chmod +x "$TMP_DIR/bin/python3"

BACKUP_OUT_DIR="$TMP_DIR/backup"
OUTPUT=$(
  PATH="$TMP_DIR/bin:$PATH" \
  WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" \
  WP_BACKUP_OUT_DIR="$BACKUP_OUT_DIR" \
  WP_BACKUP_WP_CONTENT_SUBDIRS="mu-plugins themes/luciastuy" \
  sh "$SCRIPT"
)

assert_contains "$OUTPUT" "Downloaded 2 files" "backup should call the downloader"
assert_contains "$OUTPUT" "Created $BACKUP_OUT_DIR/wp-content.tar.gz" "backup should create the archive"

ARCHIVE_LIST=$(tar -tzf "$BACKUP_OUT_DIR/wp-content.tar.gz")
assert_contains "$ARCHIVE_LIST" "./mu-plugins/lucia-bootstrap.php" "archive should contain backed-up mu-plugins at restore-compatible path"
assert_contains "$ARCHIVE_LIST" "./themes/luciastuy/style.css" "archive should contain backed-up owned theme at restore-compatible path"

echo "ok test scripts/wp-backup-wp-content.test.sh"
