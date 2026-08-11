#!/usr/bin/env bash
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

case "${1:-}" in
  inspect)
    shift
    exec python3 tools/pnglab-shell.py inspect "$@"
    ;;
  help|"")
    cat <<'EOF'
PNG Security Lab local shell

Usage:
  tools/pnglab-shell.sh inspect FILE
  tools/pnglab-shell.sh inspect FILE --json

This launcher intentionally exposes only the local PNG inspection CLI.
EOF
    ;;
  *)
    echo "Unknown command: $1" >&2
    exit 2
    ;;
esac
