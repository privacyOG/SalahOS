# iOS and iPadOS validation status

SalahOS shares its prayer, calendar, localisation, persistence and notification-scheduling domain logic across platforms. Native iOS and iPadOS claims are separated into automated Simulator evidence and physical-device acceptance so a successful Simulator run is never represented as physical hardware validation.

## Current automated boundary

The repository has an active standard `macos-15` workflow that installs the exact lockfile, runs the complete repository quality gate, builds the production web assets, synchronises the committed Capacitor iOS project and builds the application for iOS Simulator with Xcode. The runtime acceptance stage dynamically selects the newest available iOS Simulator runtime, creates fresh iPhone and iPad Simulators, installs the newly built `App.app`, verifies the application container, launches the SalahOS bundle, captures a valid PNG screenshot, explicitly terminates the application, relaunches it and captures a second valid screenshot. The workflow uploads the runtime evidence as an artifact.

The runtime acceptance stage runs from `scripts/ios_simulator_acceptance.py` under a single wall-clock budget, bounds every `simctl` invocation, retries once on an alternative device profile and always deletes the Simulator devices it created. It reports its real outcome to the workflow run summary. Since 2026-08-18 that stage is deliberately non-blocking: only the quality gate, the Xcode Simulator compilation and the built-bundle verification decide whether `iOS Build` passes. This separation exists because CoreSimulator availability on a shared hosted macOS runner is infrastructure state that a repository change cannot influence, and a check that mixes the two cannot distinguish a real regression from a runner fault. Simulator runtime behaviour therefore counts as validated for a revision only when that revision's run summary records `iOS Simulator runtime acceptance: PASSED`.

PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` passed iOS Build run `32032477111`. The run used iOS 26.2 with a fresh iPhone 17 Pro Simulator and fresh iPad Pro 13-inch (M5) Simulator, installed the newly built application, resolved its container, launched it, explicitly terminated/relaunched it and uploaded artifact `9289927972`. Both launch and relaunch screenshots were manually inspected. An earlier artifact exposed an iPhone status-bar/Dynamic-Island overlap; `viewport-fit=cover` plus safe-area inset padding and a source-contract regression test corrected that defect before this passing run. It is not a signed physical-device deployment, does not imply App Store acceptance and does not convert Simulator-only behavior into a physical-device claim.

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

The recorded launch/relaunch screenshots were manually inspected for gross layout failure and the iPhone safe-area regression. Automated Simulator responsive-layout acceptance is therefore recorded for the tested iPhone/iPad profiles. Physical touch ergonomics, device-specific safe-area variation, Dynamic Type and broader aesthetic acceptance remain separate physical-device activities.

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

Earlier 2026-08-16 native-foundation, notification and lifecycle runs proved Xcode Simulator compilation but did not exercise interactive runtime launch. A later private-repository period also produced hosted macOS jobs rejected before checkout because of account billing/spending state. After the repository became public, standard GitHub-hosted macOS execution became available again. PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` then passed the permanent fresh-device Simulator acceptance in iOS Build `32032477111` with artifact `9289927972`. The permanent workflow retains that build/install/launch/relaunch boundary while physical-device, notification-delivery, audio-policy, network-isolated offline-start and distribution acceptance remain open.
