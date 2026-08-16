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

Android local prayer notifications, display-permission handling and the exact-alarm capability/fallback strategy are implemented. Reboot recovery, battery/idle/vendor-background handling, native Adhan lifecycle policy and physical/emulator timing acceptance remain separately tracked in `TODO.md`.

## Signing and release builds

The repository currently proves a debug APK build only. A release-ready Android configuration still requires deliberate signing and distribution work. Keep signing keys and credentials outside the repository and inject them through local secure configuration or encrypted CI/release secrets when that stage is implemented.

## Local prayer notifications

The Android shell uses the first-party Capacitor Local Notifications plugin for on-device prayer alerts. When at least one notification or reminder preference is enabled, SalahOS checks Android notification permission and requests it when needed. A denial is respected and no remote push service is used.

The app reconciles its pending native notifications against the shared prayer scheduler whenever the local civil date, timezone, calculation/source settings, mosque timetable or notification preferences change. It schedules both today and tomorrow where the selected source provides prayer starts, ignores already-past deliveries, and removes stale SalahOS-owned pending jobs. Native identifiers are deterministic 32-bit values and the full scheduler record is retained in notification metadata so unrelated app notifications are never adopted or cancelled.

Silent notifications use dedicated Android channels, including a silent-with-vibration channel. Default-sound behavior uses the platform default channel. Android 8+ channel behavior means sound/vibration combinations are partly channel-controlled and remain subject to user notification settings.

The manifest declares `android.permission.SCHEDULE_EXACT_ALARM`. On supported Android versions this is user-managed special access: SalahOS checks the current exact-alarm setting, never opens the system settings screen automatically, and exposes a user-initiated settings action when precise access is off. With access granted, the Local Notifications plugin can use exact alarms for scheduled `at` notifications. Without access, SalahOS continues scheduling the same prayer alerts as an inexact fallback and explicitly tells the user that Android may delay delivery.

A capability change detected after returning to the app triggers scheduler reconciliation so current jobs are rebuilt under the new precision state. The same tested focus, restored-page and visibility recovery path also reconciles prayer notifications whenever the app returns to the foreground.

SalahOS does not request an unrestricted battery-optimisation exemption. Doze, Battery Saver, manufacturer background controls, notification-channel settings and device power state can still delay or suppress presentation even when precise-alarm access is granted. The settings UI states this explicitly in English and Arabic rather than promising guaranteed background delivery. Reboot recovery and physical/emulator timing evidence remain separately tracked.

## Adhan lifecycle policy

The current Android Adhan preference schedules an Adhan-labelled local notification at prayer time. The executable platform policy records that scheduled delivery as a notification alert and disables full-recording auto-play for foreground, background and terminated lifecycle states. This avoids treating a local-notification sound as equivalent to reliable full Adhan playback. User-selected/local Adhan audio, audio focus, interruption policy and any future foreground playback implementation remain separate Stage 10 work.

## Notification restoration after reboot

The pinned Capacitor Local Notifications Android dependency stores pending local notifications and declares its restore receiver for locked boot, normal boot and supported quick-boot broadcasts. SalahOS does not add a duplicate receiver. Instead, every Android build runs `scripts/verify-android-notification-reboot.mjs`, which verifies the pinned dependency source contract and confirms that `LocalNotificationRestoreReceiver` plus `RECEIVE_BOOT_COMPLETED` are present in a Gradle merged application manifest.

This is repository/build evidence that saved scheduled notifications are restored through the dependency's native reboot path. It is not physical-device evidence for manufacturer-specific boot timing, power-management behavior or notification presentation.

## Release signing

Repository validation can assemble the release variant without a signing key. A distributable signed build requires all four values through the local environment or an encrypted CI secret store: `SALAHOS_ANDROID_KEYSTORE_PATH`, `SALAHOS_ANDROID_KEYSTORE_PASSWORD`, `SALAHOS_ANDROID_KEY_ALIAS`, and `SALAHOS_ANDROID_KEY_PASSWORD`. Partial signing configuration fails closed. Keystores and credentials must remain outside the repository. Run `npm run android:release-check` to synchronize the shared application and assemble the release variant.

## Emulator acceptance

Validation run `31941025342` enabled airplane mode, performed a force-stop/cold launch of the real SalahOS activity, confirmed the process was alive, and passed app-only landscape/portrait instrumentation. The committed script and instrumentation test preserve this repeatable acceptance path; manufacturer-specific physical-device behavior remains device-dependent.
