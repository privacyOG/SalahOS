#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAUNCHER="${SALAHOS_KIOSK_LAUNCHER:-${ROOT_DIR}/scripts/kiosk/run-salahos-kiosk.sh}"
AUTOSTART="${SALAHOS_LABWC_AUTOSTART:-${HOME}/.config/labwc/autostart}"
BEGIN_MARKER="# >>> SalahOS kiosk >>>"
END_MARKER="# <<< SalahOS kiosk <<<"
MODE="install"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: install-labwc-autostart.sh [--dry-run] [--remove]

Installs an idempotent SalahOS launcher block in the current user's labwc
autostart file. This starts the kiosk after the Raspberry Pi desktop session loads.

Environment overrides:
  SALAHOS_KIOSK_LAUNCHER   Launcher path
  SALAHOS_LABWC_AUTOSTART  labwc autostart path
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --remove) MODE="remove" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$MODE" == "install" && ! -f "$LAUNCHER" ]]; then
  echo "Kiosk launcher not found: $LAUNCHER" >&2
  exit 1
fi

render_without_managed_block() {
  local source_file="$1"
  if [[ ! -f "$source_file" ]]; then
    return 0
  fi
  awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
    $0 == begin { managed=1; next }
    $0 == end { managed=0; next }
    !managed { print }
  ' "$source_file"
}

TEMP_FILE="$(mktemp)"
trap 'rm -f "$TEMP_FILE"' EXIT
render_without_managed_block "$AUTOSTART" > "$TEMP_FILE"

if [[ "$MODE" == "install" ]]; then
  if [[ -s "$TEMP_FILE" ]]; then
    printf '\n' >> "$TEMP_FILE"
  fi
  {
    printf '%s\n' "$BEGIN_MARKER"
    printf 'bash %q &\n' "$LAUNCHER"
    printf '%s\n' "$END_MARKER"
  } >> "$TEMP_FILE"
fi

if (( DRY_RUN )); then
  cat "$TEMP_FILE"
  exit 0
fi

mkdir -p "$(dirname "$AUTOSTART")"
cp "$TEMP_FILE" "$AUTOSTART"
printf '%s: %s\n' "SalahOS labwc autostart ${MODE}" "$AUTOSTART"
