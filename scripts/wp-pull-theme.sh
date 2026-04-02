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

: "${WP_FTP_HOST:?Set WP_FTP_HOST}"
: "${WP_FTP_USER:?Set WP_FTP_USER}"
: "${WP_FTP_PASSWORD:?Set WP_FTP_PASSWORD}"
: "${WP_REMOTE_THEME_PATH:?Set WP_REMOTE_THEME_PATH}"
: "${WP_LOCAL_THEME_PATH:?Set WP_LOCAL_THEME_PATH}"

python3 - <<'PY'
from ftplib import FTP
from pathlib import Path
import os

host = os.environ['WP_FTP_HOST']
user = os.environ['WP_FTP_USER']
password = os.environ['WP_FTP_PASSWORD']
remote_root = os.environ['WP_REMOTE_THEME_PATH']
local_root = Path(os.environ['WP_LOCAL_THEME_PATH'])

ftp = FTP(host, timeout=30)
ftp.login(user, password)
files = []

def collect(path: str) -> None:
    for name, facts in ftp.mlsd(path):
        if name in {'.', '..'}:
            continue
        full = f"{path}/{name}" if path != '/' else f"/{name}"
        item_type = facts.get('type')
        if item_type == 'dir':
            collect(full)
        elif item_type == 'file':
            files.append(full)

collect(remote_root)
local_root.mkdir(parents=True, exist_ok=True)
for remote_file in files:
    rel = remote_file.removeprefix(remote_root).lstrip('/')
    local_file = local_root / rel
    local_file.parent.mkdir(parents=True, exist_ok=True)
    with local_file.open('wb') as fh:
        ftp.retrbinary(f'RETR {remote_file}', fh.write)

ftp.quit()
print(f'Downloaded {len(files)} files to {local_root}')
PY
