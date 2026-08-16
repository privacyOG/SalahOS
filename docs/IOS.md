# iOS / iPadOS build and install

SalahOS uses the same React/TypeScript prayer application inside a committed Capacitor iOS project. The repository has an automated iOS Simulator build path on macOS; physical-device signing and App Store distribution remain separate release acceptance work.

## Implemented native path

The repository contains:

- `ios/App/App.xcodeproj` — the Xcode project;
- `ios/App/CapApp-SPM` — Capacitor Swift Package Manager integration;
- `ios/App/App/Info.plist` — native application configuration and location privacy text;
- a native-aware location adapter using the Capacitor Geolocation plugin;
- local-notification scheduling through the Capacitor Local Notifications plugin;
- native Preferences-backed application storage;
- `.github/workflows/ios.yml` — the permanent macOS Simulator build gate.

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
```

Run `npx cap sync ios` again after changing native Capacitor dependencies or after changing the web application that must be copied into the native shell.

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

A successful command proves the project compiles for the iOS Simulator. It does not prove physical-device signing, App Store submission, native notification delivery under every lifecycle state, or visual acceptance on every iPhone/iPad size.

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

SalahOS requests location only when the user chooses the current-location action. The current implementation is foreground/when-in-use location; it does not require continuous GPS tracking or a background-location capability.

If native permission declarations change, review them against `docs/PRIVACY_THREAT_MODEL.md` and the Stage 16 permission gate rather than adding capabilities pre-emptively.

## Notifications and Adhan boundary

The iOS adapter schedules bounded local prayer notifications for today/tomorrow through the native notification plugin and reconciles owned notification IDs when the desired schedule changes.

Platform delivery remains subject to user permission and iOS scheduling behavior. SalahOS does not claim that a terminated/background app can automatically play an unrestricted full-length user-selected Adhan recording. Notification audio and full foreground audio are separate capabilities and must be represented as such.

## Offline operation

Core prayer calculation, saved settings and bundled timezone/location data are local. After native assets are synchronised, ordinary prayer calculation does not require a remote API. Physical offline cold-start acceptance remains a separate iOS device/Simulator test item in `TODO.md`.

## Release signing and distribution

The repository's automated iOS gate deliberately disables signing for Simulator builds. Distribution work requires an intentional Apple signing/release process outside committed secrets.

Before describing an iOS release as ready, the project still needs the applicable release-readiness items from `TODO.md`, including final visual/device validation, native notification acceptance, signing/distribution checks and final regression review.
