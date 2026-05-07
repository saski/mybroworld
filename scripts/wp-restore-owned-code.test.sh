#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SCRIPT="$PROJECT_ROOT/scripts/wp-restore-owned-code.sh"
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

assert_not_contains() {
  haystack="$1"
  needle="$2"
  label="$3"

  case "$haystack" in
    *"$needle"*) fail "$label" ;;
    *) ;;
  esac
}

cd "$PROJECT_ROOT"

BACKUP_DIR="$TMP_DIR/backup"
ARCHIVE_ROOT="$TMP_DIR/archive-root"
mkdir -p "$BACKUP_DIR" "$ARCHIVE_ROOT/themes/luciastuy" "$ARCHIVE_ROOT/mu-plugins"
printf 'previous theme\n' > "$ARCHIVE_ROOT/themes/luciastuy/style.css"
printf 'previous mu plugin\n' > "$ARCHIVE_ROOT/mu-plugins/lucia-bootstrap.php"
tar -C "$ARCHIVE_ROOT" -czf "$BACKUP_DIR/wp-content.tar.gz" .

CONFIG_FILE="$TMP_DIR/wp-remote.env"
cat > "$CONFIG_FILE" <<'ENV'
WP_DEPLOY_TRANSPORT=ftp
WP_FTP_HOST=ftp.luciastuy.test
WP_FTP_USER=ftp-user
WP_FTP_PASSWORD=secret-value
WP_REMOTE_PATH=/public
WP_REMOTE_THEME_DIR=/public/wp-content/themes/luciastuy
WP_REMOTE_MU_PLUGIN_DIR=/public/wp-content/mu-plugins
ENV

DRY_RUN_OUTPUT=$(WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" "$SCRIPT" --backup-dir "$BACKUP_DIR" --dry-run)

assert_contains "$DRY_RUN_OUTPUT" "Dry run only. Nothing will be restored." "dry-run should not restore"
assert_contains "$DRY_RUN_OUTPUT" "Archive: $BACKUP_DIR/wp-content.tar.gz" "dry-run should show archive path"
assert_contains "$DRY_RUN_OUTPUT" "<configured WP_FTP_USER>@ftp.luciastuy.test:/public/wp-content/themes/luciastuy" "dry-run should show redacted ftp theme target"
assert_contains "$DRY_RUN_OUTPUT" "<configured WP_FTP_USER>@ftp.luciastuy.test:/public/wp-content/mu-plugins" "dry-run should show redacted ftp mu-plugin target"
assert_not_contains "$DRY_RUN_OUTPUT" "ftp-user" "dry-run should not leak ftp user"
assert_not_contains "$DRY_RUN_OUTPUT" "secret-value" "dry-run should not leak ftp password"

if WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" "$SCRIPT" --backup-dir "$BACKUP_DIR" >"$TMP_DIR/missing-allow-delete.out" 2>&1; then
  fail "restore should require --allow-delete"
fi
assert_contains "$(cat "$TMP_DIR/missing-allow-delete.out")" "--allow-delete" "restore should explain the explicit deletion guard"

LFTP_CAPTURE="$TMP_DIR/lftp.commands"
RESTORE_TMP_DIR="$TMP_DIR/restore"
mkdir -p "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/lftp" <<SH
#!/bin/sh
cat > "$LFTP_CAPTURE"
SH
chmod +x "$TMP_DIR/bin/lftp"

PATH="$TMP_DIR/bin:$PATH" \
WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" \
WP_RESTORE_TMP_DIR="$RESTORE_TMP_DIR" \
"$SCRIPT" --backup-dir "$BACKUP_DIR" --allow-delete >/dev/null

LFTP_COMMANDS=$(cat "$LFTP_CAPTURE")

assert_contains "$LFTP_COMMANDS" "open --user \"ftp-user\" --password \"secret-value\" \"ftp://ftp.luciastuy.test\"" "lftp should authenticate through stdin commands"
assert_contains "$LFTP_COMMANDS" "mirror -R --verbose --delete --exclude-glob .DS_Store \"$RESTORE_TMP_DIR/themes/luciastuy\" \"/public/wp-content/themes/luciastuy\"" "lftp should restore backed-up theme with delete"
assert_contains "$LFTP_COMMANDS" "mirror -R --verbose --delete --exclude-glob .DS_Store \"$RESTORE_TMP_DIR/mu-plugins\" \"/public/wp-content/mu-plugins\"" "lftp should restore backed-up mu-plugins with delete"

echo "ok test scripts/wp-restore-owned-code.test.sh"
