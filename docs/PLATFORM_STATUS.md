# SalahOS platform status

This document is the tested platform/build matrix for the current repository state. A successful build is not treated as proof of physical-device, visual or distribution acceptance. `TODO.md` remains the authoritative implementation/release tracker.

## Status legend

- **Automated** — exercised by a permanent repository gate in a clean hosted environment.
- **Repository-validated path** — runtime/deployment logic, fixtures or scripts are implemented and tested, but physical target-device acceptance may remain open.
- **Physical acceptance open** — a native/browser path exists but the applicable real-device checks are not yet complete.

## Current matrix

### Web / PWA — Automated

Verified on previously validated heads:

- clean lockfile install and repository security/license/documentation gates;
- strict typecheck and complete automated test suite;
- Vite production build and deploy-artifact verification;
- service-worker offline reload/cache lifecycle;
- persisted local configuration and local prayer calculation.

The current release candidate additionally contains deterministic browser visual-regression infrastructure and screenshot artifact capture, which must pass on the candidate's own exact head before those visual items are promoted to verified status.

Still open: final English/Arabic visual artifact inspection, phone/tablet acceptance across the required target matrix and final release review.

### Android — Automated native build + emulator acceptance

Verified on previously validated heads:

- committed Capacitor Android project using the shared application;
- native foreground geolocation bridge and explicit permission flow;
- Preferences-backed native application storage;
- local prayer-notification scheduling adapter and reboot-restoration contract;
- Gradle debug builds in the permanent Android gate;
- repository release-signing configuration with fail-closed partial-secret handling;
- Android 35 x86_64 Pixel-class emulator install/cold-launch evidence, airplane-mode execution, orientation recreation and native instrumentation acceptance.

The current release candidate additionally enforces:

- an explicit app-owned Android permission allowlist;
- effective merged-manifest permission verification for debug and release builds;
- application backup disabled with explicit legacy cloud-backup and Android 12+ cloud/device-transfer exclusions;
- `usesCleartextTraffic=false` for the packaged application.

Those candidate additions require fresh exact-head Android validation before being recorded as verified release evidence.

Still open: broad physical-device matrix, real battery/OEM background behavior, physical notification timing/Adhan acceptance and store distribution/release publication.

See `docs/ANDROID.md` for the build/install path and explicit platform boundaries.

### iOS / iPadOS — Automated native Simulator build; physical acceptance open

Verified on previously validated heads:

- committed Capacitor/Xcode native project with Swift Package Manager integration;
- native foreground geolocation path using the shared location boundary;
- native Preferences-backed storage path;
- bounded local prayer-notification scheduling through the iOS native adapter;
- explicit background/terminated notification policy that does not claim unrestricted full-Adhan playback;
- permanent `macos-15` Xcode Simulator build gate with signing disabled;
- successful Simulator installation/launch evidence from the native acceptance work.

The current release candidate retains one-shot foreground location behaviour and documents/enforces the two iOS location usage-description keys required by pinned Capacitor Geolocation 8.2.0. The dependency-mandated `NSLocationAlwaysAndWhenInUseUsageDescription` key is not a claim that SalahOS requests background location: the app does not use `watchPosition()` or declare location `UIBackgroundModes`.

The candidate also adds safe-area verification and stricter native permission/transport checks; those changes require fresh exact-head iOS validation.

Still open: final iPhone safe-area/phone-layout acceptance on the candidate, iPad visual acceptance, enforced offline cold-start acceptance, physical iPhone/iPad testing, signing/distribution and real native notification-delivery acceptance.

See `docs/IOS.md` for build/install instructions and the exact validation boundary.

### Raspberry Pi / Touch Display 2 — Repository-validated path

Verified:

- Raspberry Pi OS/Touch Display 2 setup documentation;
- Chromium kiosk launcher and installer contract;
- smart-display route;
- deterministic Touch Display 2 viewport fixtures;
- persisted-settings/offline/suspend/date-rollover kiosk lifecycle tests.

Still open: physical Raspberry Pi graphical boot/login and power-loss behavior, actual Touch Display 2 rendering/touch acceptance and long-duration hardware testing.

### TV / generic kiosk — Repository-validated browser path

Verified:

- browser smart-display mode;
- Chromium kiosk URL path;
- responsive large-screen presentation rules;
- practical keyboard/back exit mapping;
- bounded burn-in-conscious pixel shifting;
- TV/kiosk deployment documentation and browser-host acceptance criteria.

The release candidate's 1920×1080 browser visual fixture now exercises the real `?mode=smart-display` route rather than the ordinary settings shell, but it remains candidate evidence until the exact-head browser gate executes and its screenshot is inspected.

Still open: physical TV/browser full-screen behavior, actual remote mappings, HDMI-CEC, viewing-distance/readability acceptance and long-duration panel testing.

## Automated repository baseline

The Quality Gate uses a clean GitHub-hosted workspace with Node.js 22, installs the committed lockfile and executes repository policies, documentation checks, formatting, lint, strict typecheck, automated tests, the production Web/PWA build and deploy-artifact verification.

The release candidate extends that workflow with deterministic headless browser visual regression and screenshot artifact upload. A visual screenshot is evidence only after that exact candidate workflow actually executes and passes; workflow configuration alone is not evidence.

Permanent native workflows add target-specific integration:

- Android runs the native build/synchronisation path on a hosted Linux/Android toolchain;
- iOS runs repository validation, Capacitor synchronisation and an unsigned Xcode Simulator build on `macos-15`.

A platform-specific workflow proves only the capabilities it actually executes.

## Android boundary

Android uses the committed Capacitor project rather than a separate prayer application. Prayer calculations, timezone handling, settings and scheduling intent remain shared.

The native location path asks for a single foreground fix. The application does not require continuous location tracking or Android background-location permission.

The notification path reconciles a bounded desired schedule into native local notifications and includes repository verification for reboot restoration. Exact timing remains subject to Android permissions, Doze/Battery Saver and manufacturer policy; repository build/emulator evidence does not remove those platform constraints.

The candidate reviews both app-owned and dependency-contributed effective permissions. Backup/data-transfer and cleartext-network restrictions are explicit native policy rather than platform-default assumptions.

Release signing support is configuration infrastructure, not evidence that a public release has been distributed.

## iOS / iPadOS boundary

iOS/iPadOS has a real native project and automated Simulator build path. It uses the same shared prayer application and native bridges rather than a parallel implementation.

SalahOS itself requests a one-shot foreground location fix and does not enable continuous/background location. Pinned Capacitor Geolocation 8.2.0 nevertheless requires both `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` because of its underlying iOS dependency. The second description is therefore treated as a dependency compatibility declaration while background modes and continuous location APIs remain forbidden by the candidate permission verifier.

Local notifications are scheduled for a bounded future horizon and are expected to be delivered by the operating system according to user permission and platform scheduling behavior. Background or terminated delivery must not be described as unrestricted application execution. Full user-selected Adhan recording playback is a separate capability from a system notification sound.

Simulator compilation/launch is not equivalent to physical-device signing, App Store readiness or all-form-factor visual acceptance.

## Raspberry Pi boundary

The Raspberry Pi path intentionally reuses the Web/PWA application. Repository tests validate launcher/deployment behavior and runtime continuity. Touch Display 2 fixtures provide deterministic target dimensions/orientations but do not substitute for physical rendering/touch evidence.

## TV/kiosk boundary

The supported TV path is browser-hosted: a compatible TV browser or an HDMI-attached browser-capable host such as a Raspberry Pi or small computer.

SalahOS does not currently claim native packages for Android TV/Google TV, tvOS, Tizen, webOS, Fire TV or other television platforms that are not implemented in the repository.

Remote-control behavior remains device/browser-specific. Common browser back-style inputs are supported where those events reach the page, but this is not proof of a particular remote or HDMI-CEC stack.

## Release rule

Only capability explicitly recorded as verified should be treated as validated. Candidate-only changes remain unverified until their own exact-head workflow executes successfully. Open physical, visual, notification-delivery, signing/distribution or release-review work remains open even when a shared or native build succeeds.
