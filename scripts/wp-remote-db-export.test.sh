#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SCRIPT="$PROJECT_ROOT/scripts/wp-remote-db-export.sh"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  case "$haystack" in
    *"$needle"*) ;;
    *) fail "$label" ;;
  esac
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"

  case "$haystack" in
    *"$needle"*) fail "$label" ;;
    *) ;;
  esac
}

cd "$PROJECT_ROOT"

CONFIG_FILE="$TMP_DIR/wp-remote.env"
cat > "$CONFIG_FILE" <<'ENV'
WP_FTP_HOST=ftp.luciastuy.test
WP_FTP_USER=ftp-user
WP_FTP_PASSWORD=secret-value
WP_REMOTE_PATH=/public
WP_PRODUCTION_URL=https://www.luciastuy.test
ENV

DRY_RUN_OUTPUT=$(WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" WP_BACKUP_OUT_DIR="$TMP_DIR/out" "$SCRIPT" --dry-run)

assert_contains "$DRY_RUN_OUTPUT" "Dry run only. Nothing will be uploaded." "dry-run should be explicit"
assert_contains "$DRY_RUN_OUTPUT" "Remote exporter target: <redacted>@ftp.luciastuy.test:/public/" "dry-run should show a redacted remote target"
assert_contains "$DRY_RUN_OUTPUT" "Production URL: https://www.luciastuy.test/" "dry-run should show the public host"
assert_contains "$DRY_RUN_OUTPUT" "token=<redacted>" "dry-run should redact the token"
assert_not_contains "$DRY_RUN_OUTPUT" "ftp-user" "dry-run should not leak ftp user"
assert_not_contains "$DRY_RUN_OUTPUT" "secret-value" "dry-run should not leak ftp password"

LFTP_CAPTURE="$TMP_DIR/lftp.commands"
mkdir -p "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/lftp" <<SH
#!/bin/sh
cat >> "$LFTP_CAPTURE"
SH
chmod +x "$TMP_DIR/bin/lftp"

cat > "$TMP_DIR/bin/curl" <<'SH'
#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      out="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
printf '%s\n' '-- MyBroworld WordPress production DB export' > "$out"
SH
chmod +x "$TMP_DIR/bin/curl"

PATH="$TMP_DIR/bin:$PATH" WP_REMOTE_CONFIG_FILE="$CONFIG_FILE" WP_BACKUP_OUT_DIR="$TMP_DIR/out" "$SCRIPT" >/dev/null
LFTP_COMMANDS=$(cat "$LFTP_CAPTURE")

assert_contains "$LFTP_COMMANDS" "open --user \"ftp-user\" --password \"secret-value\" \"ftp://ftp.luciastuy.test\"" "execute should authenticate through lftp stdin"
assert_contains "$LFTP_COMMANDS" "put " "execute should upload the temporary exporter"
assert_contains "$LFTP_COMMANDS" "rm \"/public/" "cleanup should remove the temporary exporter"
assert_contains "$(cat "$TMP_DIR/out/wordpress-db.sql")" "-- MyBroworld WordPress production DB export" "execute should save the downloaded SQL"

echo "ok test scripts/wp-remote-db-export.test.sh"
