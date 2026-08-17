# SalahOS platform status

This document is the tested platform/build matrix for the current repository state. A successful shared or native build is not treated as proof of physical-device acceptance. `TODO.md` remains the authoritative tracker for open implementation and release gates.

## Status legend

- **Automated evidence** — previously exercised in a clean hosted environment and recorded in the repository tracker/testing evidence.
- **Repository-validated path** — deployment/runtime logic, fixtures and/or scripts are implemented and covered by repository tests, while physical target-device acceptance may remain open.
- **Target validation open** — implementation exists but a target-specific interactive, visual, timing or physical-device acceptance check is still required.

## Current matrix

### Web / PWA — Automated evidence

Verified: clean lockfile installation; security/license/documentation gates; strict typecheck; complete unit/integration/component suite; Vite production build; deploy-artifact verification; service-worker offline reload/cache lifecycle; persisted local configuration; and fully local prayer calculation.

Still open: real-browser visual regression across the required phone/tablet/display matrix and final release regression on the exact release revision.

### Android — Automated evidence + emulator evidence

Verified: committed Capacitor native project; shared-app sync; first-party native foreground geolocation; native Preferences persistence; local prayer-notification adapter; notification permission handling; exact-alarm fallback policy; reboot-restoration contract; battery/background limitation handling; release-signing configuration without committed credentials; Gradle debug/release configuration; offline cold launch and portrait/landscape activity survival on an Android 35 emulator.

Still open: physical OEM notification timing/Doze behavior, target-device notification acceptance across DST, user-selected local Adhan audio, broader physical-device visual acceptance and production distribution signing with the maintainer's external credentials.

### iOS / iPadOS — Automated Simulator build evidence; target validation open

Verified: committed Capacitor native project; shared-app sync; foreground native geolocation; native Preferences persistence; bounded local prayer-notification scheduling; explicit foreground/background/terminated delivery policy; foreground-only location privacy metadata; and successful Xcode iOS Simulator compilation in recorded hosted macOS runs.

Still open: interactive iPhone/iPad responsive-layout acceptance, simulator/device offline cold-start acceptance, target-device notification delivery including DST behavior, user-selected local Adhan audio, physical-device acceptance and signed archive/TestFlight/App Store release validation.

See `IOS_BUILD_SIGNING.md` for current simulator/device installation and signing procedures.

### Raspberry Pi / Touch Display 2 — Repository-validated path

Verified: Raspberry Pi OS/Touch Display 2 setup documentation; Chromium kiosk launcher and managed labwc autostart contract; smart-display route; deterministic Touch Display 2 viewport fixtures; persisted-settings/offline/network-loss/suspend/date-rollover kiosk lifecycle tests; and shared touch-oriented presentation components.

Still open: physical Raspberry Pi graphical boot/login/power-loss validation, actual Touch Display 2 rendering/touch acceptance and long-duration hardware testing.

### TV / generic kiosk — Repository-validated path

Verified: browser smart-display mode; Chromium kiosk URL path; responsive large-format presentation rules; practical keyboard/back exit mapping; bounded burn-in-conscious position shifting; TV/kiosk deployment documentation; daily rollover, DST and sleep/wake integration coverage.

Still open: physical TV/browser full-screen behavior, remote key mapping, HDMI-CEC, viewing-distance/readability acceptance and long-duration panel testing.

## Current quality-gate infrastructure status

The Linux Quality Gate and Android Build now target the repository's self-hosted Linux/x64 runner. The Android workflow bootstraps Android SDK API 36 and build-tools 36.0.0 so it does not depend on a user-specific SDK installation.

Exact main commit `3980a67ed13243d15438d5303ac2fdfd76db6d5f` passed Quality Gate run `31986937094` and Android Build run `31986937065` on the self-hosted EVO-X2. The complete Quality Gate passed lockfile installation, security policies, dependency audit/licensing, documentation links, raster-icon reproducibility, formatting, lint, strict typecheck, tests, production build and deploy-artifact verification.

The iOS workflow intentionally remains on macOS because Xcode/iOS Simulator builds cannot run on the Linux EVO-X2. The current exact-main macOS job was rejected before any step executed because the account billing/spending state requires attention. Historical successful Xcode Simulator evidence remains valid for the implementation it exercised, but a current exact-release iOS build still requires an available macOS runner.

Before a release tag is created, the exact release revision must retain a passing Quality Gate and applicable Android build, and the iOS build requirement must either pass on an available macOS runner or remain an explicit unresolved release blocker.

## Native permission boundary

Android declares only the application-level permissions documented in `NATIVE_PERMISSIONS.md`, including foreground coarse/fine location and the user-managed precise-alarm capability. The application does not request Android background location or an unrestricted battery-optimisation exemption.

iOS/iPadOS declares foreground `NSLocationWhenInUseUsageDescription` only for current-location acquisition. The unused always-location declaration has been removed, and the current application does not declare a background location mode.

The repository now includes a permanent native-permission policy check so expanded permission scope requires an explicit reviewed code change.

## Local-first network boundary

Core v1 application code has no optional remote API dependency. A fail-closed repository policy scans production source for newly introduced remote fetch/XHR/WebSocket/EventSource capabilities or remote HTTP URL literals. Any future reviewed provider integration must intentionally update that policy, document the privacy/security contract and add target-specific validation rather than silently widening the network surface.

## Raspberry Pi boundary

The Raspberry Pi path intentionally reuses the Web/PWA application instead of claiming a second native Raspberry Pi application. Repository tests validate the launcher/deployment contract and runtime continuity. The Touch Display 2 fixture provides deterministic target viewport dimensions and orientation coverage, but it does not substitute for physical rendering and touch acceptance.

## TV/kiosk boundary

The supported TV path is browser-hosted: a compatible TV browser or an HDMI-attached browser-capable host such as a Raspberry Pi or small computer. SalahOS does not currently claim separate native television packages.

Remote-control behavior varies by browser and hardware. The application recognises common browser/keyboard back-style inputs where they reach the page, but this is not evidence that a specific television remote or HDMI-CEC stack has been validated.

## Release rule

Only capabilities explicitly identified as verified above should be treated as validated. Physical, visual, target-notification and release-distribution work remains open until the corresponding evidence is recorded. A release tag must additionally use an exact revision with a fresh complete quality-gate result.
