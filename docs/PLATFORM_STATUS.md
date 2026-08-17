# SalahOS platform status

This document is the tested platform/build matrix for the current repository state. A successful shared, emulator or Simulator build is not treated as proof of physical-device acceptance. `TODO.md` remains the authoritative tracker for open implementation and release gates.

## Status legend

- **Automated evidence** — exercised by a repeatable repository workflow or deterministic repository test.
- **Emulator/Simulator evidence** — exercised on a software-emulated target; useful runtime evidence but not physical-device proof.
- **Repository-validated path** — deployment/runtime logic, fixtures and/or scripts are implemented and covered by repository tests while physical target-device acceptance may remain open.
- **Physical acceptance open** — implementation exists, but hardware-specific interactive, notification, audio, timing or display behavior still requires a target device.

## Current matrix

### Web / PWA — automated evidence

Verified: clean lockfile installation; security/license/documentation gates; strict typecheck; complete unit/integration/component suite; Vite production build; deploy-artifact verification; service-worker offline reload/cache lifecycle; persisted local configuration; fully local prayer calculation; and the permanent 14-scenario production-browser visual regression matrix covering phone, tablet, 1080p/4K display and Raspberry Pi Touch Display 2 viewport fixtures in English/Arabic and light/dark combinations.

The visual workflow verifies render completion, direction/theme state, viewport sizing, horizontal overflow/clipping and scalable-text scenarios and saves screenshots plus machine-readable evidence. Human aesthetic judgement and physical display behavior are separate from that automated gate.

### Android — automated evidence + emulator evidence

Verified: committed Capacitor native project; shared-app sync; first-party native foreground geolocation; native Preferences persistence; local prayer-notification adapter; notification permission handling; exact-alarm fallback policy; reboot-restoration contract; battery/background limitation handling; release-signing configuration without committed credentials; Gradle debug/release configuration; offline cold launch and portrait/landscape activity survival on an Android 35 emulator; and private user-selected local Adhan audio with foreground playback attempts while background/terminated delivery remains notification-based.

Physical acceptance open: OEM notification timing/Doze behavior, notification delivery across a real DST transition, vibration/channel behavior, real-device GPS lifecycle, audio focus/interruption behavior, broad physical-device visual/touch acceptance and production distribution signing with the maintainer's external credentials.

### iOS / iPadOS — automated build + Simulator runtime evidence path

Verified implementation: committed Capacitor native project; shared-app sync; foreground native geolocation; native Preferences persistence; bounded local prayer-notification scheduling; explicit foreground/background/terminated delivery policy; foreground-only location privacy metadata; and the shared private local-Adhan feature with foreground-only playback attempts.

The permanent `macos-15` workflow performs the complete repository quality gate and Xcode Simulator build, dynamically creates fresh iPhone and iPad Simulators, installs the newly built application, verifies its application container, launches it, captures a valid screenshot, explicitly terminates it, relaunches it and captures a second valid screenshot. Runtime artifacts are retained for inspection. This is Simulator acceptance, not physical-device acceptance.

Physical acceptance open: real GPS/location permission behavior, locked/terminated local-notification delivery including DST timing, real audio-session/focus/interruption behavior, vibration/haptics, reboot/device lifecycle behavior, physical orientation/safe-area/Dynamic Type/touch ergonomics, and signed archive/TestFlight/App Store distribution. The Simulator runtime gate does not disable networking, so iOS offline cold-start remains a separate explicit acceptance item.

See `IOS_BUILD_SIGNING.md` and `IOS_VALIDATION_STATUS.md` for the exact boundary.

### Raspberry Pi / Touch Display 2 — repository-validated path

Verified: Raspberry Pi OS/Touch Display 2 setup documentation; Chromium kiosk launcher and managed labwc autostart contract; smart-display route; deterministic Touch Display 2 viewport fixtures; persisted-settings/offline/network-loss/suspend/date-rollover kiosk lifecycle tests; and shared touch-oriented presentation components. The permanent browser visual matrix covers the documented 5/7/10-inch fixture dimensions in portrait/landscape combinations.

Physical acceptance open: actual Raspberry Pi graphical boot/login/power-loss behavior, Touch Display 2 rendering/touch ergonomics/rotation, unattended autostart after physical power-on and long-duration hardware testing.

### TV / generic kiosk — repository-validated path

Verified: browser smart-display mode; Chromium kiosk URL path; responsive large-format presentation rules; practical keyboard/back exit mapping; bounded burn-in-conscious position shifting; TV/kiosk deployment documentation; daily rollover, DST and sleep/wake integration coverage; and 1080p/4K browser visual scenarios.

Physical acceptance open: TV/browser full-screen behavior, real remote key mapping, HDMI-CEC, viewing-distance/readability acceptance and long-duration panel testing.

## Current quality-gate infrastructure status

The Linux Quality Gate, Android Build and Visual Regression workflows target the repository's self-hosted Linux/x64 runner. The Android workflow bootstraps Android SDK API 36 and build-tools 36.0.0 so it does not depend on a user-specific SDK installation.

Exact merged main commit `0901306a42f62f42bbf67724a4c82bf8036fe8d5` passed the post-local-Adhan Quality Gate (`32008491535`), Android Build (`32008491491`) and Visual Regression (`32008491515`). The visual run passed all 14 scenarios.

The iOS workflow correctly remains on standard GitHub-hosted macOS because Xcode/iOS Simulator builds cannot run on the Linux runner. Earlier private-repository jobs were rejected before checkout because of account billing/spending state. After the repository became public, standard hosted macOS runners executed successfully again, including the current-main iOS compile path. The permanent iOS workflow is now extended to build plus fresh iPhone/iPad Simulator install/launch/relaunch acceptance. Runner availability is infrastructure state and is not represented as a permanent guarantee.

Before a release tag is created, the exact release revision must retain passing Quality Gate, Android Build, Visual Regression and iOS Build/Simulator acceptance results. Physical-only acceptance items remain explicit test prerequisites rather than being inferred from automated execution.

## Native permission boundary

Android declares only the application-level permissions documented in `NATIVE_PERMISSIONS.md`, including foreground coarse/fine location and the user-managed precise-alarm capability. The application does not request Android background location or an unrestricted battery-optimisation exemption.

iOS/iPadOS declares foreground `NSLocationWhenInUseUsageDescription` only for current-location acquisition. The unused always-location declaration has been removed, and the current application does not declare a background location mode.

The repository includes a permanent native-permission policy check so expanded permission scope requires an explicit reviewed code change.

## Local-first network boundary

Core v1 application code has no optional remote API dependency. A fail-closed repository policy scans production source for newly introduced remote fetch/XHR/WebSocket/EventSource capabilities or remote HTTP URL literals. Any future reviewed provider integration must intentionally update that policy, document the privacy/security contract and add target-specific validation rather than silently widening the network surface.

## Raspberry Pi boundary

The Raspberry Pi path intentionally reuses the Web/PWA application instead of claiming a second native Raspberry Pi application. Repository tests validate the launcher/deployment contract and runtime continuity. The Touch Display 2 fixture and browser visual workflow provide deterministic target viewport evidence, but neither substitutes for physical rendering and touch acceptance.

## TV/kiosk boundary

The supported TV path is browser-hosted: a compatible TV browser or an HDMI-attached browser-capable host such as a Raspberry Pi or small computer. SalahOS does not claim separate native television packages.

Remote-control behavior varies by browser and hardware. The application recognises common browser/keyboard back-style inputs where they reach the page, but this is not evidence that a specific television remote or HDMI-CEC stack has been validated.

## Release rule

Only capabilities explicitly identified as verified above should be treated as validated. Physical target-notification, target-audio and hardware-specific acceptance remains open until the corresponding evidence is recorded. A release tag must additionally use an exact revision with fresh complete automated quality-gate results.
