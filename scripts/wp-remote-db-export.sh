#!/usr/bin/env bash
set -euo pipefail

export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$REPO_ROOT"

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

REMOTE_CONFIG_FILE="${WP_REMOTE_CONFIG_FILE:-scripts/wp-remote.env}"

if [ -f "$REMOTE_CONFIG_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$REMOTE_CONFIG_FILE"
  set +a
fi

: "${WP_FTP_HOST:?Set WP_FTP_HOST in scripts/wp-remote.env}"
: "${WP_FTP_USER:?Set WP_FTP_USER in scripts/wp-remote.env}"
: "${WP_FTP_PASSWORD:?Set WP_FTP_PASSWORD in scripts/wp-remote.env}"
: "${WP_REMOTE_PATH:?Set WP_REMOTE_PATH in scripts/wp-remote.env}"
: "${WP_PRODUCTION_URL:=https://www.luciastuy.com}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "lftp is required." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required." >&2
  exit 1
fi

TS="${WP_BACKUP_TIMESTAMP:-$(date -u +%Y%m%d-%H%M%S)}"
BACKUP_BASE_DIR="${WP_BACKUP_BASE_DIR:-backups}"
OUT_DIR="${WP_BACKUP_OUT_DIR:-$BACKUP_BASE_DIR/production-db-export-$TS}"
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

TOKEN="$(openssl rand -hex 24)"
EXPORTER_BASENAME="mbw-db-export-$(openssl rand -hex 12).php"
LOCAL_EXPORTER="$(mktemp "${TMPDIR:-/tmp}/$EXPORTER_BASENAME.XXXXXX")"
REMOTE_EXPORTER="$WP_REMOTE_PATH/$EXPORTER_BASENAME"
EXPORT_URL="${WP_PRODUCTION_URL%/}/$EXPORTER_BASENAME?token=$TOKEN"
SQL_PATH="$OUT_DIR/wordpress-db.sql"

cleanup() {
  rm -f "$LOCAL_EXPORTER"

  if [ "${UPLOADED:-0}" -eq 1 ]; then
    lftp >/dev/null 2>&1 <<LFTP || true
set cmd:fail-exit false
set ftp:ssl-allow true
set ssl:verify-certificate no
open --user "$WP_FTP_USER" --password "$WP_FTP_PASSWORD" "ftp://$WP_FTP_HOST"
rm "$REMOTE_EXPORTER"
bye
LFTP
  fi
}

trap cleanup EXIT

cat > "$LOCAL_EXPORTER" <<'PHP'
<?php
declare(strict_types=1);

$expectedToken = '__EXPORT_TOKEN__';

if (!hash_equals($expectedToken, (string) ($_GET['token'] ?? ''))) {
    http_response_code(404);
    exit;
}

ignore_user_abort(true);
set_time_limit(0);

require __DIR__ . '/wp-config.php';

if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASSWORD') || !defined('DB_NAME')) {
    http_response_code(500);
    echo "Missing WordPress DB constants\\n";
    exit;
}

$mysqli = mysqli_init();
$host = DB_HOST;
$port = 3306;

if (str_contains($host, ':')) {
    [$hostOnly, $portValue] = explode(':', $host, 2);
    $host = $hostOnly;
    $port = (int) $portValue;
}

if (!$mysqli->real_connect($host, DB_USER, DB_PASSWORD, DB_NAME, $port)) {
    http_response_code(500);
    echo "Database connection failed\\n";
    exit;
}

$mysqli->set_charset('utf8mb4');

header('Content-Type: application/sql; charset=utf-8');
header('Content-Disposition: attachment; filename="wordpress-db.sql"');
header('X-Accel-Buffering: no');

function dump_line(string $line = ''): void
{
    echo $line . "\n";
    flush();
}

function quote_identifier(string $identifier): string
{
    return '`' . str_replace('`', '``', $identifier) . '`';
}

function quote_value(mysqli $mysqli, mixed $value): string
{
    if ($value === null) {
        return 'NULL';
    }

    return "'" . $mysqli->real_escape_string((string) $value) . "'";
}

dump_line('-- MyBroworld WordPress production DB export');
dump_line('-- Generated: ' . gmdate('c'));
dump_line('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
dump_line('SET time_zone = "+00:00";');
dump_line('SET NAMES utf8mb4;');
dump_line('SET FOREIGN_KEY_CHECKS = 0;');
dump_line();

$tables = [];
$result = $mysqli->query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');

if (!$result) {
    http_response_code(500);
    echo "Could not list tables\\n";
    exit;
}

while ($row = $result->fetch_array(MYSQLI_NUM)) {
    $tables[] = $row[0];
}

foreach ($tables as $table) {
    $quotedTable = quote_identifier($table);

    dump_line();
    dump_line('-- Table structure for ' . $quotedTable);
    dump_line('DROP TABLE IF EXISTS ' . $quotedTable . ';');

    $createResult = $mysqli->query('SHOW CREATE TABLE ' . $quotedTable);
    if (!$createResult) {
        http_response_code(500);
        echo "Could not dump table schema\\n";
        exit;
    }

    $createRow = $createResult->fetch_array(MYSQLI_NUM);
    dump_line($createRow[1] . ';');

    $dataResult = $mysqli->query('SELECT * FROM ' . $quotedTable, MYSQLI_USE_RESULT);
    if (!$dataResult) {
        http_response_code(500);
        echo "Could not dump table data\\n";
        exit;
    }

    $fields = $dataResult->fetch_fields();
    $columns = array_map(static fn($field) => quote_identifier($field->name), $fields);
    $columnSql = implode(', ', $columns);

    while ($row = $dataResult->fetch_assoc()) {
        $values = [];
        foreach ($fields as $field) {
            $values[] = quote_value($mysqli, $row[$field->name]);
        }

        dump_line('INSERT INTO ' . $quotedTable . ' (' . $columnSql . ') VALUES (' . implode(', ', $values) . ');');
    }

    $dataResult->free();
}

dump_line();
dump_line('SET FOREIGN_KEY_CHECKS = 1;');
PHP

perl -0pi -e "s/__EXPORT_TOKEN__/$TOKEN/g" "$LOCAL_EXPORTER"

chmod 600 "$LOCAL_EXPORTER"

if [ "$DRY_RUN" -eq 1 ]; then
  cat <<MSG
Dry run only. Nothing will be uploaded.
Remote exporter target: <redacted>@$WP_FTP_HOST:$REMOTE_EXPORTER
Download target: $SQL_PATH
Production URL: ${WP_PRODUCTION_URL%/}/$EXPORTER_BASENAME?token=<redacted>
MSG
  exit 0
fi

echo "Uploading temporary DB exporter..."
lftp <<LFTP
set cmd:fail-exit true
set ftp:ssl-allow true
set ssl:verify-certificate no
open --user "$WP_FTP_USER" --password "$WP_FTP_PASSWORD" "ftp://$WP_FTP_HOST"
put "$LOCAL_EXPORTER" -o "$REMOTE_EXPORTER"
bye
LFTP
UPLOADED=1

echo "Downloading database export..."
curl --fail --location --silent --show-error --max-time 900 "$EXPORT_URL" --output "$SQL_PATH"
chmod 600 "$SQL_PATH"

if [ ! -s "$SQL_PATH" ]; then
  echo "Database export was empty." >&2
  exit 1
fi

if grep -q 'Database connection failed\|Missing WordPress DB constants\|Could not' "$SQL_PATH"; then
  echo "Database export contains an exporter error." >&2
  exit 1
fi

echo "Downloaded database export: $SQL_PATH"
shasum -a 256 "$SQL_PATH" | awk '{print "sha256=" $1}'
wc -c < "$SQL_PATH" | awk '{print "bytes=" $1}'
