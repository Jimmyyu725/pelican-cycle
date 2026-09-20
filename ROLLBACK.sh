#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET=${1:-"$ROOT/index.html"}
EXPECTED="b1cf4c41ef556570ca75c56ccdb488b280c39d99debf3fd0e9a5b089967d7558"
ACTUAL=$(shasum -a 256 "$ROOT/.checkpoints/baseline.html" | awk '{print $1}')
[ "$ACTUAL" = "$EXPECTED" ] || { echo 'Baseline hash mismatch' >&2; exit 1; }
[ "$TARGET" != "$ROOT/.checkpoints/baseline.html" ] || { echo 'Baseline is immutable' >&2; exit 1; }
if [ -f "$TARGET" ]; then
  BACKUP=$(mktemp "${TARGET}.before-rollback.XXXXXX")
  cp -p "$TARGET" "$BACKUP"
fi
cp "$ROOT/.checkpoints/baseline.html" "$TARGET"
cmp -s "$ROOT/.checkpoints/baseline.html" "$TARGET"
echo 'PASS rollback: baseline restored'
