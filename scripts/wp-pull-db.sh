#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /absolute/path/to/export.sql" >&2
  exit 1
fi

SOURCE_SQL="$1"
TARGET_SQL="wordpress/wordpress.sql"

if [ ! -f "$SOURCE_SQL" ]; then
  echo "SQL dump not found: $SOURCE_SQL" >&2
  exit 1
fi

cp "$SOURCE_SQL" "$TARGET_SQL"
echo "Copied database dump to $TARGET_SQL"
echo "This script stages the dump only. Import it manually into the local runtime when needed."
