# iOS and iPadOS validation status

SalahOS shares its prayer, calendar, localisation, persistence and notification-scheduling domain logic across platforms. Native iOS and iPadOS behaviour must still be validated in Apple tooling before any native-specific tracker item is marked complete.

## Current evidence boundary

The current development and continuous-integration environment validates the shared TypeScript application, tests and production web build. It does not provide a macOS/Xcode simulator or a signed physical-device deployment path. Therefore no repository claim should imply that native iOS packaging, entitlement behaviour, background notification delivery, audio playback, lifecycle recovery or App Store distribution has been physically verified.

## Items that require macOS and Xcode

The following require a macOS host with a supported Xcode release and must remain open until exercised there:

- create and build the native iOS/iPadOS shell;
- verify deployment target and supported device families;
- compile the Release configuration without local-only changes;
- verify Info.plist usage descriptions and capabilities used by the final shell;
- verify notification permission flow and local-notification scheduling on Simulator where supported;
- verify application foreground/background transitions and cold launch;
- verify timezone and locale changes while the application is installed;
- verify the app returns to the correct prayer date after suspend or calendar rollover;
- verify any native audio session used for Adhan playback;
- archive the application and validate signing/export configuration without committing credentials.

## Items that require a physical iPhone or iPad

Simulator success is not sufficient for the following. A real device is required before these behaviours can be described as verified:

- location permission and GPS-derived coordinates;
- local notification presentation while the device is locked;
- notification behaviour after application termination;
- battery/background restrictions that affect scheduling or playback;
- vibration/haptic behaviour where supported;
- Adhan or other audio playback under the chosen audio-session policy;
- daylight-saving and timezone transition behaviour across real device lifecycle events;
- recovery after reboot;
- orientation, safe-area, Dynamic Type and touch behaviour on target screen sizes.

## Signing and credentials

Signing certificates, private keys, provisioning profiles, App Store Connect credentials and other secrets must not be committed. Repository documentation may describe the required signing workflow and configuration names, but secret material belongs in the developer keychain, secure CI secrets or the appropriate Apple-managed credential store.

## Completion rule

An iOS/iPadOS tracker item may move to complete only when its implementation exists and the required validation evidence is recorded in `TESTING.md`. If macOS/Xcode or physical hardware is unavailable, the item stays open or partial and this limitation is stated explicitly rather than inferred away from shared web-domain test coverage.

## Native foundation validation — 2026-08-16

The committed iOS shell is generated from the shared SalahOS web application and uses the same `com.privacyog.salahos` application identifier. The iOS target includes `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` as required by the installed geolocation bridge, does not enable background location, and builds for an iOS Simulator with code signing disabled. The shared native Preferences adapter provides the same versioned settings, saved-location and mosque-library storage contract used on Android. Simulator/device interaction remains separately tracked.

## Local notification scheduling

The iOS runtime uses the first-party Local Notifications bridge with the same deterministic shared prayer notification intents as Android. Scheduling is bounded to today and tomorrow, permission denial fails closed, and only SalahOS-namespaced pending requests are reconciled. This repository validation does not claim custom Adhan playback, unrestricted background execution, or exact wall-clock delivery under every Apple power/focus state.
