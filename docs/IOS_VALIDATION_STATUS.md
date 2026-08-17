# iOS and iPadOS validation status

SalahOS shares its prayer, calendar, localisation, persistence and notification-scheduling domain logic across platforms. Native iOS and iPadOS claims are separated into automated Simulator evidence and physical-device acceptance so a successful Simulator run is never represented as physical hardware validation.

## Current automated boundary

The repository has an active standard `macos-15` workflow that installs the exact lockfile, runs the complete repository quality gate, builds the production web assets, synchronises the committed Capacitor iOS project and builds the application for iOS Simulator with Xcode. The runtime acceptance stage dynamically selects the newest available iOS Simulator runtime, creates fresh iPhone and iPad Simulators, installs the newly built `App.app`, verifies the application container, launches the SalahOS bundle, captures a valid PNG screenshot, explicitly terminates the application, relaunches it and captures a second valid screenshot. The workflow uploads the runtime evidence as an artifact.

This establishes automated packaging/install/launch/relaunch evidence on fresh iPhone and iPad Simulator instances once the exact workflow revision passes. It is not a signed physical-device deployment, does not imply App Store acceptance and does not convert Simulator-only behavior into a physical-device claim.

## What Simulator acceptance validates

- clean dependency installation and the complete repository quality gate on the macOS runner;
- production web-asset generation and Capacitor synchronization into the committed native iOS project;
- Xcode compilation for iOS Simulator without signing credentials;
- availability of a current iOS Simulator runtime and compatible iPhone/iPad device profiles;
- installation of the freshly built application on newly created Simulator devices;
- application-container resolution for `com.privacyog.salahos`;
- successful process launch and explicit terminate/relaunch through `simctl`;
- non-empty, decodable launch/relaunch screenshots with valid pixel dimensions;
- cleanup of created Simulator devices after the run.

Screenshot capture proves that a renderable application surface exists after launch/relaunch. Human aesthetic review and physical touch/safe-area behavior remain separate acceptance activities.

## Items that still require a physical iPhone or iPad

Simulator success is not sufficient for the following. A real device is required before these behaviours can be described as verified:

- location permission and GPS-derived coordinates on device hardware;
- local notification presentation while the device is locked;
- notification behaviour after application termination and across real scheduling delays;
- real DST/timezone notification delivery rather than deterministic scheduling logic alone;
- battery/background restrictions that affect scheduling or playback;
- vibration/haptic behaviour where supported;
- local Adhan playback under real iOS audio-session, interruption and focus policies;
- daylight-saving and timezone transition behaviour across real device lifecycle events;
- recovery after device reboot;
- physical orientation, safe-area, Dynamic Type and touch ergonomics on target hardware;
- signed archive, provisioning, TestFlight and App Store distribution acceptance.

## Offline-start boundary

The shared application has deterministic offline-startup, service-worker and persisted-settings coverage, and Android emulator acceptance has separately exercised an offline cold launch. The current iOS Simulator runtime gate intentionally does not disable Simulator networking. It therefore records launch/relaunch acceptance, not an iOS offline cold-start claim. A future iOS offline acceptance run must explicitly isolate networking before that tracker item can be completed.

## Signing and credentials

Signing certificates, private keys, provisioning profiles, App Store Connect credentials and other secrets must not be committed. Repository documentation may describe the required signing workflow and configuration names, but secret material belongs in the developer keychain, secure CI secrets or the appropriate Apple-managed credential store.

## Completion rule

An iOS/iPadOS tracker item may move to complete only when its implementation exists and the required validation evidence is recorded in `TESTING.md`. Simulator-specific items may rely on the hosted runtime gate. Physical-device, real notification delivery, real audio-policy and distribution items remain open until their corresponding target evidence exists.

## Evidence chronology

Earlier 2026-08-16 native-foundation, notification and lifecycle runs proved Xcode Simulator compilation but did not exercise interactive runtime launch. A later private-repository period also produced hosted macOS jobs rejected before checkout because of account billing/spending state. After the repository became public, standard GitHub-hosted macOS execution became available again. The permanent workflow now uses that environment for current Simulator build/install/launch/relaunch acceptance while preserving the physical-device boundary above.
