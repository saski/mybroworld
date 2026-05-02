#!/bin/sh
set -eu

OUTPUT_FILE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:?Missing value for --output}"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--output PATH]" >&2
      exit 1
      ;;
  esac
done

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$PROJECT_ROOT"

hash_file() {
  file_path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{print $1}'
    return
  fi

  shasum -a 256 "$file_path" | awk '{print $1}'
}

MANIFEST=$(mktemp)
trap 'rm -f "$MANIFEST"' EXIT

find wordpress/wp-content/themes/luciastuy wordpress/wp-content/mu-plugins \
  -type f \
  ! -name '.DS_Store' \
  -print |
  LC_ALL=C sort |
  while IFS= read -r file_path; do
    printf 'sha256=%s path=%s\n' "$(hash_file "$file_path")" "$file_path"
  done > "$MANIFEST"

if [ -n "$OUTPUT_FILE" ]; then
  cp "$MANIFEST" "$OUTPUT_FILE"
fi

cat "$MANIFEST"
