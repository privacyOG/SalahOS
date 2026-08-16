#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST_DIR="${SALAHOS_DIST_DIR:-${ROOT_DIR}/dist}"
HOST="${SALAHOS_KIOSK_HOST:-127.0.0.1}"
PORT="${SALAHOS_KIOSK_PORT:-4173}"
URL="${SALAHOS_KIOSK_URL:-http://${HOST}:${PORT}/}"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: run-salahos-kiosk.sh [--dry-run]

Environment overrides:
  SALAHOS_DIST_DIR    Built Web/PWA directory (default: <repo>/dist)
  SALAHOS_KIOSK_HOST  Local bind host (default: 127.0.0.1)
  SALAHOS_KIOSK_PORT  Local HTTP port (default: 4173)
  SALAHOS_KIOSK_URL   Chromium URL (default: local server root)
  SALAHOS_BROWSER     Explicit Chromium executable
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || {
  echo "SALAHOS_KIOSK_PORT must be an integer from 1 to 65535" >&2
  exit 2
}

if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "Missing built Web/PWA artifact: ${DIST_DIR}/index.html" >&2
  echo "Run npm ci --ignore-scripts && npm run build first." >&2
  exit 1
fi

command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required to serve the local Web/PWA build" >&2
  exit 1
}

resolve_browser() {
  if [[ -n "${SALAHOS_BROWSER:-}" ]]; then
    command -v "$SALAHOS_BROWSER" 2>/dev/null || true
    return
  fi
  command -v chromium 2>/dev/null || command -v chromium-browser 2>/dev/null || true
}

BROWSER="$(resolve_browser)"
if [[ -z "$BROWSER" ]]; then
  if (( DRY_RUN )); then
    BROWSER="chromium"
  else
    echo "Chromium was not found. Install/use Raspberry Pi OS Desktop Chromium or set SALAHOS_BROWSER." >&2
    exit 1
  fi
fi

SERVER=(python3 -m http.server "$PORT" --bind "$HOST" --directory "$DIST_DIR")
BROWSER_ARGS=(
  "$URL"
  --kiosk
  --noerrdialogs
  --disable-infobars
  --no-first-run
  --start-maximized
  --enable-features=OverlayScrollbar
)

if (( DRY_RUN )); then
  printf 'server:'
  printf ' %q' "${SERVER[@]}"
  printf '\n'
  printf 'browser:'
  printf ' %q' "$BROWSER" "${BROWSER_ARGS[@]}"
  printf '\n'
  exit 0
fi

"${SERVER[@]}" &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

python3 - "$URL" <<'PY'
import sys
import time
import urllib.request

url = sys.argv[1]
last_error = None
for _ in range(50):
    try:
        with urllib.request.urlopen(url, timeout=1) as response:
            if 200 <= response.status < 400:
                raise SystemExit(0)
    except Exception as exc:
        last_error = exc
        time.sleep(0.1)
raise SystemExit(f'Local SalahOS kiosk server did not become ready: {last_error}')
PY

"$BROWSER" "${BROWSER_ARGS[@]}"
