#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  kill 0 2>/dev/null || true
}

trap cleanup EXIT INT TERM

(
  cd "$ROOT_DIR/backend"
  if [[ -f .env ]]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
  fi
  echo "[backend] http://localhost:${PORT:-8080}"
  make run
) &

(
  cd "$ROOT_DIR/frontend"
  if [[ -f .env.local ]]; then
    set -a
    # shellcheck source=/dev/null
    source .env.local
    set +a
  elif [[ -f .env ]]; then
    set -a
    # shellcheck source=/dev/null
    source .env
    set +a
  fi
  unset PORT
  echo "[frontend] http://localhost:3000"
  npm run dev
) &

wait
