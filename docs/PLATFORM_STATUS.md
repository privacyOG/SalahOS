# SalahOS platform status

This document is the tested platform/build matrix for the current repository state. A shared browser-capable code path is not treated as proof of a native package or physical-device acceptance. `TODO.md` remains the authoritative tracker for open implementation and release gates.

## Status legend

- **Automated** — exercised on every Quality Gate in a clean hosted environment.
- **Repository-validated path** — deployment/runtime logic, fixtures and/or scripts are implemented and covered by repository tests, but physical target-device acceptance may still be open.
- **Planned** — architecture or documentation may describe the target, but the native shell/build path is not implemented and validated.

## Current matrix

| Target                         | Status                        | What is actually verified                                                                                                                                                                                                                                              | Still open                                                                                                                                                             |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web / PWA                      | **Automated**                 | Clean lockfile install; security/license/documentation gates; strict typecheck; complete Vitest suite; Vite production build; deploy-artifact verification; service-worker offline reload/cache lifecycle; persisted local configuration and local prayer calculation. | Real-browser visual regression, phone/tablet viewport acceptance and final release review remain open.                                                                 |
| Raspberry Pi / Touch Display 2 | **Repository-validated path** | Raspberry Pi OS/Touch Display 2 setup documentation; Chromium kiosk launcher and installer contract; smart-display route; deterministic Touch Display 2 viewport fixture; persisted-settings/offline/suspend/date-rollover kiosk lifecycle tests.                      | Physical Raspberry Pi boot/login/power-loss validation, actual Touch Display 2 rendering/touch acceptance and long-duration hardware testing remain open.              |
| TV / generic kiosk             | **Repository-validated path** | Browser smart-display mode; Chromium kiosk URL path; 1080p-capable responsive presentation rules; practical keyboard/back exit mapping; bounded burn-in-conscious pixel shifting; TV/kiosk deployment documentation and browser-host acceptance criteria.              | Physical TV/browser full-screen behavior, remote key mapping, HDMI-CEC, viewing-distance/layout acceptance and long-duration panel testing remain open.                |
| Android                        | **Planned**                   | Shared TypeScript/React prayer logic and browser/PWA behavior only.                                                                                                                                                                                                    | Android native shell/project, native location/permission adapter, notification/Adhan delivery, build/install path and device validation are not implemented/validated. |
| iOS / iPadOS                   | **Planned**                   | Shared TypeScript/React prayer logic and browser/PWA behavior only.                                                                                                                                                                                                    | iOS native shell/project, native location/permission adapter, notification/Adhan delivery, build/install path and device validation are not implemented/validated.     |

## Automated Web/PWA baseline

The repository Quality Gate uses a clean GitHub-hosted Ubuntu workspace and Node.js 22 for the project toolchain. A successful gate performs the committed lockfile install and then executes the repository policies, formatting, lint, strict typecheck, complete automated test suite, production Web/PWA build and deploy-artifact verification.

The latest core release-verification evidence is recorded in `TESTING.md`. That evidence is a repository/build result, not a statement that every browser/device combination has passed visual acceptance.

## Raspberry Pi boundary

The Raspberry Pi path intentionally reuses the Web/PWA application instead of claiming a separate native Raspberry Pi application. Repository tests validate the launcher/deployment contract and runtime continuity. The Touch Display 2 fixture gives deterministic target viewport dimensions and orientation coverage, but it does not substitute for the still-open physical rendering and touch test.

## TV/kiosk boundary

The supported TV path is a browser-hosted deployment: a TV browser where compatible, or an HDMI-attached browser-capable host such as a Raspberry Pi or small computer. SalahOS does not currently ship native Android TV, Google TV, Apple tvOS, Samsung Tizen, LG webOS, Fire TV or other television-platform packages.

Remote-control behavior varies by browser and hardware. The application recognises common browser/keyboard back-style inputs where they reach the page, but this is not evidence that a specific television remote or HDMI-CEC stack has been validated.

## Native mobile boundary

Android and iOS/iPadOS remain planned native targets. The shared application architecture is intended to support native shells without duplicating the prayer engine, but no native build must be represented as available until its project, permissions, adapters, build/install path and device validation exist and pass their applicable gates.

## Release rule

Only the capability stated in the **What is actually verified** column should be treated as validated. Open physical, visual or native-platform work remains open even when the shared Web/PWA application can technically load on that class of device.
