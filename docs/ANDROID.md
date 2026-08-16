# Android build and install

SalahOS includes a Capacitor Android shell that embeds the same shared TypeScript/React application and prayer engine used by the Web/PWA build. The Android project does not duplicate prayer-calculation logic.

## Current validation status

The repository currently validates an unsigned/debug Android build on a GitHub-hosted Ubuntu runner with Node.js 22 and Java 21. The automated Android gate runs the committed lockfile install, builds the shared web application, synchronises it into the committed native project and runs Gradle `assembleDebug`.

This is build evidence, not physical-device acceptance. Release signing, Play distribution, notification/Adhan delivery, battery/background behaviour, orientation acceptance and real-device/emulator validation remain separately tracked in `TODO.md`.

## Native application identity

- Application id: `com.privacyog.salahos`
- Application name: `SalahOS`
- Web asset directory: `dist`
- Native project: `android/`

The configuration is defined in `capacitor.config.ts`.

## Requirements

For a local Android build, install:

- Node.js 22.13.0 or newer
- npm
- Java 21
- Android SDK / Android Studio with the SDK components required by the committed Gradle project

Do not put signing credentials, keystores, service-account credentials or passwords in the repository.

## Clean build

From a clean checkout:

```bash
npm ci --ignore-scripts
npm run android:build
```

`android:build` performs the production shared-app build, runs `cap sync android`, and then executes:

```bash
cd android
./gradlew assembleDebug
```

The resulting debug APK is expected at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Sync after shared application changes

When shared TypeScript, React, CSS or public assets change, synchronise them into the native project with:

```bash
npm run android:sync
```

The generated asset mirror under `android/app/src/main/assets/` is owned by Capacitor sync. Do not hand-edit generated web bundles there; edit the source application and sync again.

## Android Studio

After installing dependencies and syncing the project, it can be opened with:

```bash
npx cap open android
```

Use Android Studio for emulator/device execution, release build configuration and platform-specific diagnostics. A successful repository debug build does not imply that all emulator or physical-device acceptance items have passed.

## Location permission boundary

Android location uses the first-party Capacitor geolocation bridge through the shared `requestCurrentLocation` platform adapter. The manifest requests only foreground coarse and fine location permissions:

- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

SalahOS does not request Android background-location permission in the current project. The adapter asks for location only when the user requests a current-location fix, defaults to non-high-accuracy acquisition, accepts a recent fix window, and discards native accuracy/altitude/heading/speed/timestamp metadata before the coordinates enter shared application state.

Manual coordinates and offline saved-location operation remain available without granting location permission.

## Persistent settings

Android hydrates SalahOS settings, saved locations and the mosque library from the Capacitor Preferences bridge before the React application mounts. The bridge uses the existing validated/versioned storage schemas, exposes their synchronous key/value contract through an in-memory cache, and serializes native writes in order so application code does not need a second Android-specific settings model. Browser/PWA builds continue to use browser local storage.

A hide/page-leave lifecycle event requests completion of queued native writes. Clearing application data or uninstalling the app can remove locally stored preferences; backup/restore behavior and physical/emulator cold-start persistence remain device-level acceptance items and are not implied by repository tests.

## Notifications and Adhan

The Android shell in this stage does **not** complete native local prayer notifications, exact-alarm handling, notification permission-version logic, reboot rescheduling, battery-optimisation handling or native Adhan lifecycle policy. Those items remain open in `TODO.md` and must not be inferred from the existence of the native project.

## Signing and release builds

The repository currently proves a debug APK build only. A release-ready Android configuration still requires deliberate signing and distribution work. Keep signing keys and credentials outside the repository and inject them through local secure configuration or encrypted CI/release secrets when that stage is implemented.

## Local prayer notifications

The Android shell uses the first-party Capacitor Local Notifications plugin for on-device prayer alerts. When at least one notification or reminder preference is enabled, SalahOS checks Android notification permission and requests it when needed. A denial is respected and no remote push service is used.

The app reconciles its pending native notifications against the shared prayer scheduler whenever the local civil date, timezone, calculation/source settings, mosque timetable or notification preferences change. It schedules both today and tomorrow where the selected source provides prayer starts, ignores already-past deliveries, and removes stale SalahOS-owned pending jobs. Native identifiers are deterministic 32-bit values and the full scheduler record is retained in notification metadata so unrelated app notifications are never adopted or cancelled.

Silent notifications use dedicated Android channels, including a silent-with-vibration channel. Default-sound behavior uses the platform default channel. Android 8+ channel behavior means sound/vibration combinations are partly channel-controlled and remain subject to user notification settings.

This implementation deliberately does **not** request `SCHEDULE_EXACT_ALARM`. Android can therefore defer delivery under alarm, Doze, battery-optimisation or vendor background policies. Exact-alarm policy, reboot recovery, Adhan audio playback and physical/emulator delivery testing remain separate tracker items and must not be represented as complete.
