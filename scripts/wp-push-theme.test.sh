#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SCRIPT="$PROJECT_ROOT/scripts/wp-push-theme.sh"
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

DRY_RUN_OUTPUT=$(WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" "$SCRIPT" --dry-run)

assert_contains "$DRY_RUN_OUTPUT" "Transport: ftp" "dry-run should show ftp transport"
assert_contains "$DRY_RUN_OUTPUT" "<configured WP_FTP_USER>@ftp.luciastuy.test:/public/wp-content/themes/luciastuy" "dry-run should show redacted ftp theme target"
assert_contains "$DRY_RUN_OUTPUT" "<configured WP_FTP_USER>@ftp.luciastuy.test:/public/wp-content/mu-plugins" "dry-run should show redacted ftp mu-plugin target"
assert_not_contains "$DRY_RUN_OUTPUT" "ftp-user" "dry-run should not leak ftp user"
assert_not_contains "$DRY_RUN_OUTPUT" "secret-value" "dry-run should not leak ftp password"

LFTP_CAPTURE="$TMP_DIR/lftp.commands"
mkdir -p "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/lftp" <<SH
#!/bin/sh
cat > "$LFTP_CAPTURE"
SH
chmod +x "$TMP_DIR/bin/lftp"

PATH="$TMP_DIR/bin:$PATH" WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" "$SCRIPT" >/dev/null
LFTP_COMMANDS=$(cat "$LFTP_CAPTURE")

assert_contains "$LFTP_COMMANDS" "open --user \"ftp-user\" --password \"secret-value\" \"ftp://ftp.luciastuy.test\"" "lftp should authenticate through stdin commands"
assert_contains "$LFTP_COMMANDS" "mirror -R --verbose --exclude-glob .DS_Store \"wordpress/wp-content/themes/luciastuy\" \"/public/wp-content/themes/luciastuy\"" "lftp should upload owned theme"
assert_contains "$LFTP_COMMANDS" "mirror -R --verbose --exclude-glob .DS_Store \"wordpress/wp-content/mu-plugins\" \"/public/wp-content/mu-plugins\"" "lftp should upload mu-plugins"
assert_not_contains "$LFTP_COMMANDS" "--delete" "ftp upload should not delete remote files by default"

echo "ok test scripts/wp-push-theme.test.sh"
