# SalahOS platform status

This document is the tested platform/build matrix for the current repository state. A shared browser-capable code path is not treated as proof of a native package or physical-device acceptance. `TODO.md` remains the authoritative tracker for open implementation and release gates.

## Status legend

- **Automated** — exercised on every applicable repository gate in a clean hosted environment.
- **Repository-validated path** — deployment/runtime logic, fixtures and/or scripts are implemented and covered by repository tests, but physical target-device acceptance may still be open.
- **Planned** — architecture or documentation may describe the target, but the native shell/build path is not implemented and validated.

## Current matrix

| Target                         | Status                        | What is actually verified                                                                                                                                                                                                                                              | Still open                                                                                                                                                             |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web / PWA                      | **Automated**                 | Clean lockfile install; security/license/documentation gates; strict typecheck; complete Vitest suite; Vite production build; deploy-artifact verification; service-worker offline reload/cache lifecycle; persisted local configuration and local prayer calculation. | Real-browser visual regression, phone/tablet viewport acceptance and final release review remain open.                                                                 |
| Android                        | **Automated build path**      | Committed Capacitor native project; shared-app sync; first-party native geolocation bridge with explicit foreground permission flow; coarse/fine foreground manifest permissions only; clean Gradle `assembleDebug` build in hosted CI.                                 | Emulator/physical-device acceptance, native notifications/Adhan, battery/background behavior, orientation acceptance, release signing and distribution remain open.    |
| Raspberry Pi / Touch Display 2 | **Repository-validated path** | Raspberry Pi OS/Touch Display 2 setup documentation; Chromium kiosk launcher and installer contract; smart-display route; deterministic Touch Display 2 viewport fixture; persisted-settings/offline/suspend/date-rollover kiosk lifecycle tests.                      | Physical Raspberry Pi boot/login/power-loss validation, actual Touch Display 2 rendering/touch acceptance and long-duration hardware testing remain open.              |
| TV / generic kiosk             | **Repository-validated path** | Browser smart-display mode; Chromium kiosk URL path; 1080p-capable responsive presentation rules; practical keyboard/back exit mapping; bounded burn-in-conscious pixel shifting; TV/kiosk deployment documentation and browser-host acceptance criteria.              | Physical TV/browser full-screen behavior, remote key mapping, HDMI-CEC, viewing-distance/layout acceptance and long-duration panel testing remain open.                |
| iOS / iPadOS                   | **Planned**                   | Shared TypeScript/React prayer logic and browser/PWA behavior only.                                                                                                                                                                                                    | iOS native shell/project, native location/permission adapter, notification/Adhan delivery, build/install path and device validation are not implemented/validated.     |

## Automated Web/PWA baseline

The repository Quality Gate uses a clean GitHub-hosted Ubuntu workspace and Node.js 22 for the project toolchain. A successful gate performs the committed lockfile install and then executes the repository policies, formatting, lint, strict typecheck, complete automated test suite, production Web/PWA build and deploy-artifact verification.

The latest core release-verification evidence is recorded in `TESTING.md`. That evidence is a repository/build result, not a statement that every browser/device combination has passed visual acceptance.

## Android boundary

Android uses a committed Capacitor project rather than a second prayer application. `npm run android:build` builds the shared web application, synchronises it into the native project and runs Gradle `assembleDebug`. The permanent Android workflow executes that path in a clean hosted environment.

Current native location handling uses the first-party Capacitor geolocation bridge through the same application location boundary used by browsers. Only foreground coarse/fine permissions are declared; the application does not request Android background-location permission. A successful CI debug build proves project/build integration, not emulator or physical-device behavior, release signing, Play distribution, notification delivery, lifecycle/background behavior or visual acceptance.

See `docs/ANDROID.md` for the build/install path and explicit remaining boundaries.

## Raspberry Pi boundary

The Raspberry Pi path intentionally reuses the Web/PWA application instead of claiming a separate native Raspberry Pi application. Repository tests validate the launcher/deployment contract and runtime continuity. The Touch Display 2 fixture gives deterministic target viewport dimensions and orientation coverage, but it does not substitute for the still-open physical rendering and touch test.

## TV/kiosk boundary

The supported TV path is a browser-hosted deployment: a TV browser where compatible, or an HDMI-attached browser-capable host such as a Raspberry Pi or small computer. SalahOS does not currently ship native Android TV, Google TV, Apple tvOS, Samsung Tizen, LG webOS, Fire TV or other television-platform packages.

Remote-control behavior varies by browser and hardware. The application recognises common browser/keyboard back-style inputs where they reach the page, but this is not evidence that a specific television remote or HDMI-CEC stack has been validated.

## Native mobile boundary

Android now has a repository-validated native shell and automated debug-build path. iOS/iPadOS remains a planned native target. Native-platform validation is tracked per capability: a working Android build must not be represented as proof of native notification/Adhan delivery, release signing or physical-device acceptance, and Android work does not imply the still-open iOS project/build path is complete.

## Release rule

Only the capability stated in the **What is actually verified** column should be treated as validated. Open physical, visual or native-platform work remains open even when a native or shared application build succeeds.
