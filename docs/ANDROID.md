# Android build and install

SalahOS includes a Capacitor Android shell that embeds the same shared TypeScript/React application and prayer engine used by the Web/PWA build. The Android project does not duplicate prayer-calculation logic.

## Current validation status

Previously validated heads have passed the permanent Android debug build, release-signing configuration checks and Android 35 x86_64 emulator acceptance, including install/cold launch, airplane-mode execution and orientation instrumentation.

The current consolidated release candidate adds stricter native permission, backup/data-transfer, cleartext-transport and local-Adhan integration checks. Those candidate additions require their own exact-head Android workflow before they are promoted to verified release evidence.

Physical-device notification timing, manufacturer battery/background behaviour, broad device coverage and public store distribution remain separately tracked in `TODO.md`.

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

`android:build` performs the production shared-app build, runs `cap sync android`, executes Gradle `assembleDebug`, verifies the notification reboot contract, and checks the effective merged Android permission set.

The resulting debug APK is expected at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For the release variant and its effective permission check:

```bash
npm run android:release-check
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

Use Android Studio for emulator/device execution, release build configuration and platform-specific diagnostics. A successful repository build does not imply that all physical-device acceptance items have passed.

## Location permission boundary

Android location uses the first-party Capacitor geolocation bridge through the shared `requestCurrentLocation` platform adapter. The app-owned manifest declares the reviewed foreground location permissions:

- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

SalahOS does not request Android background-location permission. The adapter asks for a single location fix only when the user requests it, defaults to non-high-accuracy acquisition, accepts a bounded recent-fix window, and discards accuracy/altitude/heading/speed/timestamp metadata before coordinates enter shared application state.

Manual coordinates and offline saved-location operation remain available without granting location permission.

### Effective merged permissions

Android libraries can contribute permissions during Gradle manifest merging, so reviewing the app-owned source manifest alone is insufficient. The candidate runs `scripts/verify-android-merged-permissions.mjs` after both debug and release assembly and permits only the reviewed effective set:

- `ACCESS_COARSE_LOCATION`;
- `ACCESS_FINE_LOCATION`;
- `INTERNET`;
- `POST_NOTIFICATIONS`;
- `RECEIVE_BOOT_COMPLETED`;
- `SCHEDULE_EXACT_ALARM`;
- `WAKE_LOCK`.

The Local Notifications dependency contributes the notification/boot/wake permissions; the source manifest remains limited to the permissions SalahOS itself explicitly owns. Any new effective permission fails the build until intentionally reviewed.

## Persistent settings and backup boundary

Android hydrates SalahOS settings, saved locations and the mosque library from the Capacitor Preferences bridge before the React application mounts. The bridge uses the existing validated/versioned storage schemas, exposes their synchronous key/value contract through an in-memory cache, and serializes native writes in order so application code does not need a second Android-specific settings model. Browser/PWA builds continue to use browser local storage.

A hide/page-leave lifecycle event requests completion of queued native writes. Clearing application data or uninstalling the app can remove locally stored preferences.

The release candidate explicitly sets `android:allowBackup="false"` and supplies exclusion rules for legacy Android backup plus Android 12+ cloud-backup and device-transfer domains. This is the application-level policy for SalahOS-owned local state; it must not be weakened or replaced with an export/backup mechanism without a separate privacy/security review.

## Native transport boundary

The application manifest sets `android:usesCleartextTraffic="false"`. Core prayer calculation does not need a remote service, and any future optional network integration must also pass through the shared reviewed HTTPS-origin request boundary.

## Local prayer notifications

The Android shell uses the first-party Capacitor Local Notifications plugin for on-device prayer alerts. When at least one notification or reminder preference is enabled, SalahOS checks Android notification permission and requests it when needed. A denial is respected and no remote push service is used.

The app reconciles its pending native notifications against the shared prayer scheduler whenever the local civil date, timezone, calculation/source settings, mosque timetable or notification preferences change. It schedules both today and tomorrow where the selected source provides prayer starts, ignores already-past deliveries, and removes stale SalahOS-owned pending jobs. Native identifiers are deterministic 32-bit values and the full scheduler record is retained in notification metadata so unrelated app notifications are never adopted or cancelled.

Silent notifications use dedicated Android channels, including a silent-with-vibration channel. Default-sound behavior uses the platform default channel. Android 8+ channel behavior means sound/vibration combinations are partly channel-controlled and remain subject to user notification settings.

The manifest declares `android.permission.SCHEDULE_EXACT_ALARM`. On supported Android versions this is user-managed special access: SalahOS checks the current exact-alarm setting, never opens the system settings screen automatically, and exposes a user-initiated settings action when precise access is off. With access granted, the Local Notifications plugin can use exact alarms for scheduled `at` notifications. Without access, SalahOS continues scheduling the same prayer alerts as an inexact fallback and explicitly tells the user that Android may delay delivery.

A capability change detected after returning to the app triggers scheduler reconciliation so current jobs are rebuilt under the new precision state. The same tested focus, restored-page and visibility recovery path also reconciles prayer notifications whenever the app returns to the foreground.

SalahOS does not request an unrestricted battery-optimisation exemption. Doze, Battery Saver, manufacturer background controls, notification-channel settings and device power state can still delay or suppress presentation even when precise-alarm access is granted. The settings UI states this explicitly in English and Arabic rather than promising guaranteed background delivery. Physical-device timing evidence remains separately tracked.

## Local Adhan lifecycle policy

Prayer-time Adhan preference and user-selected local audio are separate from the platform notification sound.

When a user selects a local Adhan recording, SalahOS stores it in its device-local media store and can play the full recording automatically at the prayer minute **only while the application is open and visible**, subject to normal media/autoplay behaviour. The recording is not uploaded, bundled into the app or included in settings export.

When the app is backgrounded or terminated, scheduled prayer delivery remains an Adhan-labelled native local-notification alert. SalahOS does not claim that the operating system will execute the app to play an unrestricted full user recording in those states.

This distinction allows reliable local foreground playback without overstating Android background execution guarantees. Audio focus, manufacturer policies and physical-device presentation remain applicable acceptance concerns.

## Notification restoration after reboot

The pinned Capacitor Local Notifications Android dependency stores pending local notifications and declares its restore receiver for locked boot, normal boot and supported quick-boot broadcasts. SalahOS does not add a duplicate receiver. Every Android build runs `scripts/verify-android-notification-reboot.mjs`, which verifies the pinned dependency source contract and confirms that `LocalNotificationRestoreReceiver` plus `RECEIVE_BOOT_COMPLETED` are present in a Gradle merged application manifest.

This is repository/build evidence that saved scheduled notifications use the dependency's native reboot-restoration path. It is not physical-device evidence for manufacturer-specific boot timing, power-management behavior or notification presentation.

## Release signing

Release signing infrastructure is implemented and was validated on an earlier exact head. A distributable signed build requires all four values through the local environment or an encrypted CI secret store: `SALAHOS_ANDROID_KEYSTORE_PATH`, `SALAHOS_ANDROID_KEYSTORE_PASSWORD`, `SALAHOS_ANDROID_KEY_ALIAS`, and `SALAHOS_ANDROID_KEY_PASSWORD`. Partial signing configuration fails closed. Keystores and credentials must remain outside the repository.

`npm run android:release-check` synchronizes the shared application, assembles the release variant and validates its effective permission manifest. Public distribution/publication remains separate release work.

## Emulator acceptance

Validation run `31941025342` enabled airplane mode, performed a force-stop/cold launch of the real SalahOS activity, confirmed the process was alive, and passed app-only landscape/portrait instrumentation. The committed script and instrumentation test preserve this repeatable acceptance path; manufacturer-specific physical-device behavior remains device-dependent.
