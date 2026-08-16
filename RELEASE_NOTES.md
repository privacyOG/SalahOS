# SalahOS v1 release notes

> Draft release notes. Do not create or advertise a release tag until the applicable release-readiness blockers in `TODO.md` are cleared.

## Overview

SalahOS is a local-first Islamic prayer-time application and smart-display ecosystem. The v1 implementation shares one prayer/time model across Web/PWA, Android, iOS/iPadOS, Raspberry Pi and browser-based TV/kiosk presentation paths.

## Prayer and calendar functionality

- Five obligatory prayer calculations plus Sunrise.
- Standard/Shafi'i-family and Hanafi Asr conventions.
- Multiple recognised calculation-method profiles plus explicit manual prayer adjustments.
- Three implemented high-latitude night-fraction strategies, with unavailable polar astronomical events left unavailable rather than silently fabricated.
- Gregorian and Hijri/Umm al-Qura presentation with optional manual Hijri correction.
- Next/current prayer state, tomorrow-Fajr rollover and live countdown.
- Optional Imsak/Ishraq, Islamic midnight and last-third calculations in the shared domain model.

## Location and timezone

- User-initiated one-shot current-location acquisition on browser and native shells.
- Manual latitude/longitude entry.
- Offline local city/location search backed by the bundled IANA timezone catalogue.
- Saved favourite locations.
- Offline coordinate-to-IANA timezone resolution and persisted timezone reuse.
- IANA daylight-saving and local-date handling rather than longitude-derived fixed offsets.

## Local mosque support

- Calculated, calculated-with-adjustments and local-mosque source modes.
- Manual timetable entry.
- Validated CSV and JSON import/export.
- Multiple locally saved mosque timetables.
- Fixed or prayer-start-plus-offset Iqamah rules.
- One or multiple mosque-specific Jumu'ah sessions independent of astronomical Dhuhr.
- Fully local/offline timetable operation after configuration.

## Notifications

- Per-prayer enable/disable.
- Optional reminder before prayer.
- Prayer-time alert.
- Default or silent alert selection.
- Vibration preference where the target notification platform can represent it.
- Adhan-alert enable/disable.
- Deterministic notification ownership, cancellation, replacement, date-rollover reconciliation and DST wall-clock resolution.
- Android exact-alarm fallback policy and reboot restoration contract.
- Explicit Android/iOS lifecycle limitations rather than guarantees that the operating system cannot provide.

User-selected local Adhan recordings and target-device delivery validation remain release blockers and are not claimed by this draft.

## Display and accessibility

- English and Arabic localisation.
- RTL document direction and bidirectional isolation for mixed user/provider values.
- Light, dark and follow-system themes.
- High-contrast, scalable, keyboard-accessible and touch-oriented shared UI.
- Dedicated smart-display mode with large clock/countdown, prayer timetable, Iqamah, Jumu'ah and current/next highlighting.
- Raspberry Pi Touch Display 2 fixtures and Chromium kiosk launcher/autostart tooling.
- Burn-in-conscious smart-display position shifting and practical keyboard/remote exit handling.

Physical multi-device visual acceptance remains separately tracked.

## Offline and persistence

- Local prayer calculation with no mandatory remote service or account.
- Versioned local settings persistence.
- Native Preferences-backed storage bridge on mobile shells.
- PWA service-worker application-shell cache and offline reload support.
- Persisted mosque timetables and saved locations.
- Runtime recovery for date rollover, clock correction, suspend/resume and network loss.

## Privacy and security

- Local-first privacy/threat model.
- Precise location is acquired only after an explicit user action and only latitude/longitude is retained by the location boundary.
- No background/always-location capability in the current native design.
- Repository policy gates for sensitive files, native permissions, unreviewed remote application networking, dependency vulnerabilities and dependency licences.
- Web Content Security Policy baseline.
- Strict validation for imported settings and timetable data.
- No signing credentials or distribution secrets committed to the repository.

## Build and deployment status

- Production Web/PWA build and deploy-artifact verification are implemented.
- Android debug/release-configuration paths and emulator acceptance have existing recorded evidence.
- iOS Simulator compilation has existing recorded Xcode evidence, and the repository documents simulator/device installation and signing boundaries.
- Raspberry Pi browser-kiosk and smart-display deployment tooling is implemented and repository-tested.

The exact current main revision still requires a fresh complete quality-gate run before a release tag because hosted workflow runners are presently blocked by the account's Actions billing/spending state. Physical Raspberry Pi/TV acceptance, interactive iPhone/iPad acceptance, native notification delivery checks, visual regression, user-selected local Adhan audio and the remaining method/reference work are also still tracked in `TODO.md`.
