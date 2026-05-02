#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)

SECRET_PATTERN='(gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{50,}|AIza[0-9A-Za-z_-]{30,}|ya29\.[0-9A-Za-z_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|-----BEGIN ([A-Z ]+)?PRIVATE KEY-----)'

if [ "$#" -gt 0 ]; then
  FILES="$*"
else
  FILES=$(git -C "$PROJECT_ROOT" ls-files)
fi

failed=0

for file_path in $FILES; do
  case "$file_path" in
    */wp-remote.env|wp-remote.env|*/.env|.env|*.sql|*oauth-token*.json|*credentials*.json|*client_secret*.json)
      echo "Forbidden secret-bearing file path: $file_path" >&2
      failed=1
      continue
      ;;
  esac

  if [ ! -f "$file_path" ]; then
    candidate="$PROJECT_ROOT/$file_path"
  else
    candidate="$file_path"
  fi

  [ -f "$candidate" ] || continue

  matches=$(LC_ALL=C grep -nE "$SECRET_PATTERN" "$candidate" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "Potential high-confidence secret in $file_path" >&2
    echo "$matches" | sed 's/:.*/:<redacted>/' >&2
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "Secret scan passed."
