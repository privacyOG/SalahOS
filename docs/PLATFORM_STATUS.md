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

The permanent `macos-15` workflow performs the complete repository quality gate and Xcode Simulator build, dynamically creates fresh iPhone and iPad Simulators, installs the newly built application, verifies its application container, launches it, captures a valid screenshot, explicitly terminates it, relaunches it and captures a second valid screenshot. PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` passed this path in iOS Build `32032477111` using fresh iPhone 17 Pro and iPad Pro 13-inch (M5) Simulators on iOS 26.2; artifact `9289927972` retains the runtime evidence. Manual artifact inspection caught and drove correction of an iPhone status-bar/Dynamic-Island overlap before the passing run. This is Simulator acceptance, not physical-device acceptance.

Gate semantics (2026-08-18): the blocking part of `iOS Build` is the deterministic repository quality gate plus the unsigned Xcode Simulator compilation and built-bundle verification. The Simulator runtime stage is bounded by its own budget, retried on a second device profile and always reported to the run summary and evidence artifact, but it no longer fails the check, because a shared hosted-runner CoreSimulator service is infrastructure state rather than repository state. A run summary that does not record `PASSED` means Simulator runtime behaviour is unverified for that revision and must not be counted as runtime evidence.

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

The iOS workflow correctly remains on standard GitHub-hosted macOS because Xcode/iOS Simulator builds cannot run on the Linux runner. Earlier private-repository jobs were rejected before checkout because of account billing/spending state. After the repository became public, standard hosted macOS runners executed successfully again. On PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f`, the complete release-candidate gate set passed together: Quality Gate `32032477140`, Android Build `32032477112`, Visual Regression `32032477113` and iOS Build `32032477111`. Runner availability is infrastructure state and is not represented as a permanent guarantee.

SalahOS v1.0.0 is tagged at exact commit `b03482d06d989bfa42dd1dfd55bcc2e2994d97b8`. Before tagging, that revision passed Quality Gate `32061495596`, Android Build `32061495556`, Visual Regression `32061495626` and iOS Build `32061495534`; the iOS run completed fresh iPhone/iPad Simulator install, launch, terminate/relaunch and evidence upload. Physical-only acceptance items remain explicit follow-up validation and are not inferred from automated execution.

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

The v1.0.0 production repository/source release requires one exact revision with fresh passing Quality Gate, Android Build, Visual Regression and iOS Build/Simulator acceptance results. Physical target-notification, target-audio, target-display, signing and store-distribution acceptance remains open where identified above and is not inferred from automated, emulator, Simulator or browser execution.

Shipping v1.0.0 does not change any **Physical acceptance open** entry to verified. Those items remain follow-up validation and must be recorded separately when target hardware becomes available.

## UI/UX v2 runtime ownership

The congregation application now mounts destination-specific v2 screens directly. Settings categories no longer embed the retired single-page renderer or rely on CSS destination hiding. TV/kiosk mode runs through the dedicated `SmartDisplayApplication`, while administration remains isolated under `AdminShell`. Root compatibility colour aliases were retired; application and administration surfaces consume `--salah-*` semantic tokens, with template-specific palette variables limited to their locally scoped display surfaces.

Quality Gate enforcement is provided by `npm run ui:v2-retirement`. Visual Regression includes the Stage 27 runtime ownership matrix so migrated Settings routes and smart-display mode are validated on the production build.
