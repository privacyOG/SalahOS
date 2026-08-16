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

The current native shell reuses the shared local settings/storage path inside the app WebView. Device-level persistence across uninstall/reinstall, OS data clearing, storage migration and backup/restore is not implied by repository tests and should be validated separately before release claims are made.

## Notifications and Adhan

The Android shell in this stage does **not** complete native local prayer notifications, exact-alarm handling, notification permission-version logic, reboot rescheduling, battery-optimisation handling or native Adhan lifecycle policy. Those items remain open in `TODO.md` and must not be inferred from the existence of the native project.

## Signing and release builds

The repository currently proves a debug APK build only. A release-ready Android configuration still requires deliberate signing and distribution work. Keep signing keys and credentials outside the repository and inject them through local secure configuration or encrypted CI/release secrets when that stage is implemented.
