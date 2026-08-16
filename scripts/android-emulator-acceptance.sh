#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.privacyog.salahos"
ACTIVITY="${PACKAGE}/.MainActivity"
EVIDENCE_DIR="${ANDROID_EMULATOR_EVIDENCE_DIR:-artifacts/android-emulator}"

mkdir -p "$EVIDENCE_DIR"

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

adb shell am force-stop "$PACKAGE"
start_output="$(adb shell am start -W -n "$ACTIVITY")"
printf '%s\n' "$start_output"
grep -q "Status: ok" <<<"$start_output"
sleep 5

pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [[ -z "$pid" ]]; then
  echo "SalahOS process is not running after offline cold start" >&2
  exit 1
fi

adb exec-out screencap -p > "$EVIDENCE_DIR/android-portrait-cold-start.png"
test -s "$EVIDENCE_DIR/android-portrait-cold-start.png"

echo "Offline cold start succeeded for $PACKAGE with pid $pid while airplane mode was enabled."

adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1
sleep 3
adb exec-out screencap -p > "$EVIDENCE_DIR/android-landscape.png"
test -s "$EVIDENCE_DIR/android-landscape.png"

adb shell settings put system user_rotation 0
sleep 3
adb exec-out screencap -p > "$EVIDENCE_DIR/android-portrait-restored.png"
test -s "$EVIDENCE_DIR/android-portrait-restored.png"

adb shell am force-stop "$PACKAGE"

(
  cd android
  ./gradlew :app:connectedDebugAndroidTest
)

echo "Android emulator offline cold-start, orientation, screenshot, and instrumentation acceptance passed."
