# iOS / iPadOS build and install

SalahOS uses the same React/TypeScript prayer application inside a committed Capacitor iOS project. The repository has an automated iOS Simulator build path on macOS; physical-device signing and App Store distribution remain separate release acceptance work.

## Implemented native path

The repository contains:

- `ios/App/App.xcodeproj` — the Xcode project;
- `ios/App/CapApp-SPM` — Capacitor Swift Package Manager integration;
- `ios/App/App/Info.plist` — native application configuration and location privacy text;
- a native-aware location adapter using the Capacitor Geolocation plugin;
- local-notification scheduling through the Capacitor Local Notifications plugin;
- candidate Preferences-backed native application storage with migration from the earlier WebView Web Storage path;
- `.github/workflows/ios.yml` — the permanent macOS Simulator build and candidate visual-evidence gate.

The native shell does not duplicate prayer calculations. Web/PWA, Android and iOS consume the same shared prayer, timezone, settings and notification-intent logic.

## Prerequisites

For local iOS development/builds you need:

- macOS;
- Xcode with an installed iOS Simulator runtime;
- Xcode command-line tools selected with `xcode-select`;
- Node.js 22.13.0 or newer;
- npm.

A physical iPhone/iPad additionally requires normal Apple code-signing configuration for your developer account/team. SalahOS does not commit signing certificates, provisioning profiles or private keys.

## Clean repository validation

From the repository root:

```bash
npm ci --ignore-scripts
npm run check
```

Do not proceed with a release candidate if the repository quality gate fails.

## Synchronise the native project

Build the shared application and synchronise Capacitor plugins/assets into iOS:

```bash
npm run build
npx cap sync ios
npm run verify:capacitor-config
npm run verify:native-dependencies
```

The permanent iOS workflow performs the two verification commands after synchronization so generated configuration/dependency drift is checked in the native-build workspace. Run `npx cap sync ios` again after changing native Capacitor dependencies or after changing the web application that must be copied into the native shell.

## Application storage and migration

Earlier iOS builds used the Capacitor WebView's Web Storage path for persisted SalahOS settings. The current candidate uses `@capacitor/preferences` for all Capacitor native platforms, including iOS/iPadOS.

On native startup:

1. Preferences values are hydrated first;
2. an existing Preferences value is authoritative;
3. if one of the SalahOS persisted keys is missing in Preferences but exists in the legacy Web Storage copy, that value is copied to Preferences;
4. required native writes are flushed successfully;
5. only then is the corresponding legacy Web Storage copy removed.

The migrated keys are limited to SalahOS settings, saved locations and mosque-library state. Browser/PWA targets continue to use the provided Web Storage implementation. The user-selected local Adhan recording is stored separately in IndexedDB and is not part of this migration.

`npm run verify:native-storage` protects the cross-platform storage-selection and migration ordering contract, and unit tests cover native-authoritative values, one-time legacy migration and browser/PWA storage behavior.

The Preferences-backed iOS path and its migration remain candidate-only until the exact release-candidate Quality/iOS gates execute successfully.

## Reproduce the automated Simulator build

The permanent iOS workflow uses this unsigned Simulator build:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/SalahOSDerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

The CI workflow places DerivedData in the runner temporary directory so generated Xcode output is never treated as repository source.

Historical iOS workflow run `31942653233` executed the repository quality gate, Capacitor synchronisation and the Xcode Simulator build successfully. That evidence validates the previously merged native iOS build path; it does not pre-validate later release-candidate changes such as Preferences-backed iOS storage, current safe-area handling, synchronized config checks or the new screenshot gate.

A successful command proves the project compiles for the iOS Simulator. It does not prove physical-device signing, App Store submission, native notification delivery under every lifecycle state, or visual acceptance on every iPhone/iPad size.

## Permanent iPhone/iPad visual evidence

The release candidate extends `.github/workflows/ios.yml` after the successful generic Simulator build. The workflow locates the exact built `App.app`, dynamically selects one available iPhone Simulator and one available iPad Simulator, then for each target:

1. shuts down any previous instance;
2. boots the selected Simulator and waits for boot completion;
3. installs the exact application bundle produced by the build step;
4. terminates any existing SalahOS process;
5. cold-launches `com.privacyog.salahos` and requires a successful launch result;
6. captures screenshots at approximately 5 seconds and 20 seconds after launch;
7. validates PNG signature/IHDR/non-zero dimensions and stable dimensions across both captures;
8. confirms the application container exists;
9. shuts the Simulator down before moving to the next target.

The resulting candidate artifact is named `ios-simulator-visual-<commit>` and contains `iphone-5s.png`, `iphone-20s.png`, `ipad-5s.png` and `ipad-20s.png` when the step completes. These files are evidence only after the exact candidate workflow actually executes successfully and the images are inspected for safe-area overlap, clipping, startup state and other visible defects.

A Simulator screenshot is not physical-device acceptance. It does not establish real-device touch ergonomics, hardware-specific rendering, notification delivery, signing, App Store distribution or every supported iPhone/iPad size.

## Open in Xcode

After synchronisation:

```bash
open ios/App/App.xcodeproj
```

or:

```bash
npx cap open ios
```

In Xcode:

1. select the `App` scheme;
2. choose an installed iPhone or iPad Simulator;
3. build/run the project;
4. exercise location permission, orientation, settings persistence and notification behavior relevant to the target test;
5. inspect the UI for safe-area, clipping and RTL issues rather than treating process launch alone as visual acceptance.

## Physical iPhone/iPad install

For a development install on a physical device:

1. connect or pair the device with Xcode;
2. open `ios/App/App.xcodeproj`;
3. select the `App` target and configure **Signing & Capabilities** with your own Apple development team;
4. use a bundle identifier that your signing team can provision if the repository identifier is unavailable to that team;
5. select the physical device as the run destination;
6. build and run from Xcode;
7. approve any normal device/developer trust prompts required by your Apple development setup.

Do not commit generated provisioning profiles, certificates, signing private keys or account credentials.

Physical-device installation has not yet been claimed as repository-validated evidence. Record actual device model, OS version, orientation, permission state and relevant feature results in `TESTING.md` before promoting a device-specific TODO item to complete.

## Location permissions

SalahOS requests location only when the user chooses the current-location action. Its production adapter calls `Geolocation.getCurrentPosition()` for a single foreground fix, uses low-accuracy mode by default, and does not use continuous `watchPosition()` or declare `UIBackgroundModes` for location.

The pinned Capacitor Geolocation 8.2.0 dependency requires **both** `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` in `Info.plist` because of its underlying iOS geolocation implementation. The second description is therefore a dependency compatibility declaration; it is not evidence that SalahOS requests always-on/background location. The repository permission verifier requires both dependency-mandated keys while separately rejecting background location modes and continuous location watching.

If the geolocation dependency or native permission declarations change, re-review the upstream requirement and SalahOS runtime behaviour together against `docs/NATIVE_PERMISSION_REVIEW.md` and `docs/PRIVACY_THREAT_MODEL.md`. Do not add capabilities pre-emptively and do not remove a dependency-required declaration merely because SalahOS itself does not exercise that capability.

## Notifications and Adhan boundary

The iOS adapter schedules bounded local prayer notifications for today/tomorrow through the native notification plugin and reconciles owned notification IDs when the desired schedule changes.

Platform delivery remains subject to user permission and iOS scheduling behavior. SalahOS does not claim that a terminated/background app can automatically play an unrestricted full-length user-selected Adhan recording. Notification audio and full foreground audio are separate capabilities and must be represented as such.

## Offline operation

Core prayer calculation, saved settings and bundled timezone/location data are local. The native shell loads the synchronized bundled `dist` application; unreviewed remote Capacitor server/navigation/cleartext/origin overrides are rejected by `npm run verify:capacitor-config`. After native assets are synchronised, ordinary prayer calculation does not require a remote API. Physical offline cold-start acceptance remains a separate iOS device/Simulator test item in `TODO.md`.

## Release signing and distribution

The repository's automated iOS gate deliberately disables signing for Simulator builds. Distribution work requires an intentional Apple signing/release process outside committed secrets.

Before describing an iOS release as ready, the project still needs the applicable release-readiness items from `TODO.md`, including final visual/device validation, native notification acceptance, signing/distribution checks and final regression review.
