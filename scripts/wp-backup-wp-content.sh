#!/bin/sh
set -eu

# Downloads selected subdirectories from remote wp-content using FTP,
# then creates a local tar.gz archive.

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REMOTE_CONFIG_FILE="${WP_REMOTE_CONFIG_FILE:-$SCRIPT_DIR/wp-remote.env}"

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

TS="${WP_BACKUP_TIMESTAMP:-$(date -u +%Y%m%d-%H%M%S)}"
BACKUP_BASE_DIR="${WP_BACKUP_BASE_DIR:-backups}"
OUT_DIR="${WP_BACKUP_OUT_DIR:-$BACKUP_BASE_DIR/$TS}"

WP_CONTENT_ROOT="${WP_REMOTE_CONTENT_PATH:-$WP_REMOTE_PATH/wp-content}"
SUBDIRS="${WP_BACKUP_WP_CONTENT_SUBDIRS:-plugins mu-plugins themes}"

mkdir -p "$OUT_DIR"

TMP_DIR="$OUT_DIR/wp-content-staging"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

WP_CONTENT_ROOT="$WP_CONTENT_ROOT" \
SUBDIRS="$SUBDIRS" \
TMP_DIR="$TMP_DIR" \
FTP_HOST="$WP_FTP_HOST" \
FTP_USER="$WP_FTP_USER" \
FTP_PASSWORD="$WP_FTP_PASSWORD" \
python3 - <<'PY'
from ftplib import FTP
from pathlib import Path
import os

host = os.environ["FTP_HOST"]
user = os.environ["FTP_USER"]
password = os.environ["FTP_PASSWORD"]
content_root = os.environ["WP_CONTENT_ROOT"].rstrip("/")
subdirs = os.environ["SUBDIRS"].split()
tmp_dir = Path(os.environ["TMP_DIR"])

ftp = FTP(host, timeout=30)
ftp.login(user, password)

def download_tree(remote_root: str, local_root: Path) -> int:
    count = 0

    def collect(path: str):
        nonlocal count
        for name, facts in ftp.mlsd(path):
            if name in {".", ".."}:
                continue
            full = f"{path}/{name}" if path != "/" else f"/{name}"
            item_type = facts.get("type")
            if item_type == "dir":
                collect(full)
            elif item_type == "file":
                rel = full.removeprefix(remote_root).lstrip("/")
                local_file = local_root / rel
                local_file.parent.mkdir(parents=True, exist_ok=True)
                with local_file.open("wb") as fh:
                    ftp.retrbinary(f"RETR {full}", fh.write)
                count += 1

    local_root.mkdir(parents=True, exist_ok=True)
    collect(remote_root)
    return count

total_files = 0
for subdir in subdirs:
    remote_dir = f"{content_root}/{subdir}"
    local_dir = tmp_dir / subdir
    total_files += download_tree(remote_dir, local_dir)

ftp.quit()
print(f"Downloaded {total_files} files into {tmp_dir}")
PY

ARCHIVE_PATH="$OUT_DIR/wp-content.tar.gz"
tar -C "$TMP_DIR" -czf "$ARCHIVE_PATH" .

rm -rf "$TMP_DIR"

echo "Created $ARCHIVE_PATH"
