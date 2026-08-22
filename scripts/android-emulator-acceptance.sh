#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.privacyog.salahos"
ACTIVITY="${PACKAGE}/.MainActivity"
PREFERENCES_NAME="CapacitorStorage"
THEME_KEY="salahos.mobilePrayerBoardDisplayConfig"
THEME_JSON='{"version":1,"templateId":"scenic-spiritual","primaryLocale":"en","languageMode":"single","timeFormat":"h23","accentPreset":"jewel","moduleVisibility":{"current-time":true,"dates":true,"next-prayer":true,"countdown":true,"prayer-timetable":true,"jumuah":true,"sunrise-sunset":true,"mosque-branding":true,"announcements":true,"weather":false},"branding":{"mosqueName":null,"logo":null},"background":{"kind":"builtin","artworkId":"scenic-gradient"}}'

adb wait-for-device
adb shell cmd connectivity airplane-mode enable >/dev/null 2>&1 || {
  adb shell settings put global airplane_mode_on 1
  adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true >/dev/null
}
adb shell svc wifi disable >/dev/null 2>&1 || true
adb shell svc data disable >/dev/null 2>&1 || true

if [[ "$(adb shell settings get global airplane_mode_on | tr -d '\r')" != "1" ]]; then
  echo "Android emulator did not enter airplane mode" >&2
  exit 1
fi

(
  cd android
  ./gradlew installDebug
)

app_data_dir="$(adb shell run-as "$PACKAGE" pwd | tr -d '\r')"
if [[ -z "$app_data_dir" ]]; then
  echo "Unable to resolve SalahOS application data directory" >&2
  exit 1
fi

prefs_dir="$app_data_dir/shared_prefs"
prefs_path="$prefs_dir/$PREFERENCES_NAME.xml"
temporary_prefs="$(mktemp)"
python3 - "$THEME_KEY" "$THEME_JSON" >"$temporary_prefs" <<'PY'
import sys
import xml.etree.ElementTree as ET

key, value = sys.argv[1:3]
root = ET.Element('map')
entry = ET.SubElement(root, 'string', {'name': key})
entry.text = value
ET.ElementTree(root).write(sys.stdout.buffer, encoding='utf-8', xml_declaration=True)
PY

remote_prefs="/data/local/tmp/salahos-$PREFERENCES_NAME.xml"
adb push "$temporary_prefs" "$remote_prefs" >/dev/null
rm -f "$temporary_prefs"
adb shell run-as "$PACKAGE" mkdir -p "$prefs_dir"
adb shell run-as "$PACKAGE" cp "$remote_prefs" "$prefs_path"
adb shell run-as "$PACKAGE" chmod 600 "$prefs_path"
adb shell rm -f "$remote_prefs"

read_native_theme() {
  adb exec-out run-as "$PACKAGE" cat "$prefs_path" | python3 -c '
import sys
import xml.etree.ElementTree as ET
key = sys.argv[1]
root = ET.fromstring(sys.stdin.buffer.read())
for child in root.findall("string"):
    if child.attrib.get("name") == key:
        sys.stdout.write(child.text or "")
        raise SystemExit(0)
raise SystemExit(1)
' "$THEME_KEY"
}

assert_native_theme() {
  local phase="$1"
  local observed
  observed="$(read_native_theme)"
  if [[ "$observed" != "$THEME_JSON" ]]; then
    echo "Phone/Home theme value changed during Android $phase" >&2
    echo "Expected: $THEME_JSON" >&2
    echo "Observed: $observed" >&2
    exit 1
  fi
  echo "Phone/Home native theme persistence verified after Android $phase."
}

adb shell am force-stop "$PACKAGE"
start_output="$(adb shell am start -W -n "$ACTIVITY")"
printf '%s\n' "$start_output"
grep -q "Status: ok" <<<"$start_output"
sleep 2

pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [[ -z "$pid" ]]; then
  echo "SalahOS process is not running after offline cold start" >&2
  exit 1
fi
assert_native_theme "cold start"

echo "Offline cold start succeeded for $PACKAGE with pid $pid while airplane mode was enabled."
adb shell am force-stop "$PACKAGE"

relaunch_output="$(adb shell am start -W -n "$ACTIVITY")"
printf '%s\n' "$relaunch_output"
grep -q "Status: ok" <<<"$relaunch_output"
sleep 2

relaunch_pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [[ -z "$relaunch_pid" ]]; then
  echo "SalahOS process is not running after Android relaunch" >&2
  exit 1
fi
assert_native_theme "process relaunch"
adb shell am force-stop "$PACKAGE"

(
  cd android
  ./gradlew :app:connectedDebugAndroidTest
)

echo "Android emulator orientation, offline restart and Phone/Home theme persistence acceptance passed."
