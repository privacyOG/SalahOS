#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.privacyog.salahos"
ACTIVITY="${PACKAGE}/.MainActivity"

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
sleep 2

pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [[ -z "$pid" ]]; then
  echo "SalahOS process is not running after offline cold start" >&2
  exit 1
fi

echo "Offline cold start succeeded for $PACKAGE with pid $pid while airplane mode was enabled."
adb shell am force-stop "$PACKAGE"

(
  cd android
  ./gradlew connectedDebugAndroidTest
)

echo "Android emulator orientation and instrumentation acceptance passed."
