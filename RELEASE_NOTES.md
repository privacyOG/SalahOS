# SalahOS v1.0.0 release notes

**Release date:** 2026-08-18

SalahOS v1.0.0 is the first production repository/source release of the local-first Islamic prayer-time application and smart-display ecosystem. One shared prayer/time model is used across Web/PWA, Android, iOS/iPadOS, Raspberry Pi and browser-based TV/kiosk presentation paths.

## Prayer and calendar functionality

- Five obligatory prayer calculations plus Sunrise.
- Standard/Shafi'i-family and Hanafi Asr conventions.
- Multiple recognised calculation-method profiles plus explicit manual prayer adjustments.
- Middle-of-the-Night, One-Seventh and Angle-Based high-latitude strategies, with unavailable polar astronomical events left unavailable rather than silently fabricated.
- Gregorian and Hijri/Umm al-Qura presentation with optional manual Hijri correction.
- Current/next prayer state, live countdown and tomorrow-Fajr rollover.
- Optional Imsak/Ishraq, Islamic midnight and last-third calculations in the shared domain model.

## Location and timezone

- User-initiated one-shot current-location acquisition on browser and native shells.
- Manual latitude/longitude entry and offline local city/location search.
- Saved favourite locations.
- Offline coordinate-to-IANA timezone resolution and persisted timezone reuse.
- IANA daylight-saving and local-date handling rather than longitude-derived fixed offsets.

## Local mosque support

- Calculated, calculated-with-adjustments and local-mosque source modes.
- Manual timetable entry and validated CSV/JSON import/export.
- Multiple locally saved mosque timetables.
- Fixed or prayer-start-plus-offset Iqamah rules.
- One or multiple mosque-specific Jumu'ah sessions independent of astronomical Dhuhr.
- Fully local/offline timetable operation after configuration.

## Notifications and Adhan

- Per-prayer enable/disable, optional reminder, prayer-time alert and Adhan-alert controls.
- Default or silent alert selection and vibration preference where the platform can represent it.
- Deterministic notification ownership, cancellation, replacement, date-rollover reconciliation and DST wall-clock resolution.
- Android exact-alarm fallback policy and reboot-restoration contract.
- Native Android/iOS scheduling adapters with explicit lifecycle/platform limitations.
- Private user-selected local Adhan recording stored locally, with foreground playback attempts only; background/terminated delivery remains notification-based.
- No bundled copyrighted Adhan recording.

## Display, localisation and accessibility

- English and Arabic localisation with RTL document direction and bidirectional isolation.
- Light, dark and follow-system themes.
- High-contrast, scalable, keyboard-accessible and touch-oriented shared UI.
- Dedicated smart-display mode with large clock/countdown, prayer timetable, Iqamah, Jumu'ah and current/next highlighting.
- Raspberry Pi Touch Display 2 fixtures and Chromium kiosk launcher/autostart tooling.
- Burn-in-conscious smart-display position shifting and practical keyboard/remote exit handling.
- Permanent 14-scenario browser visual regression across phone, tablet, Raspberry Pi fixtures, 1080p/4K display, English/Arabic and scalable-text cases.

## Offline, privacy and security

- Local prayer calculation with no mandatory remote service or account.
- Versioned local settings persistence and native Preferences-backed storage on mobile shells.
- PWA application-shell cache and offline reload support.
- Persisted mosque timetables and saved locations.
- Runtime recovery for date rollover, clock correction, suspend/resume and network loss.
- Local-first privacy/threat model, least-privilege native permissions and no background/always-location capability.
- Repository gates for sensitive files, native permissions, unreviewed remote application networking, dependency vulnerabilities and dependency licences.
- Web Content Security Policy baseline and strict validation of imported settings/timetable data.
- No signing credentials or distribution secrets committed to the repository.

## Automated release evidence

The production release revision must pass all four permanent gates before tagging:

- Quality Gate — security/policy checks, dependency audit/licences, docs, formatting, lint, strict typecheck, complete tests, production build and deploy-artifact verification.
- Android Build — clean dependency install, Android SDK setup, Capacitor sync and Gradle debug assembly.
- Visual Regression — the permanent 14-scenario production-browser matrix with retained evidence.
- iOS Build — macOS repository quality gate, production build/Capacitor sync, Xcode Simulator compilation, then fresh iPhone and iPad Simulator install/launch/terminate/relaunch with retained screenshots/evidence.

## Explicitly unperformed physical/target acceptance

The following are not claimed as tested by v1.0.0 and remain documented follow-up validation:

- physical iPhone/iPad GPS, notification timing while locked/terminated, haptics, audio-session/focus/interruption, reboot lifecycle, signed archive, TestFlight and App Store acceptance;
- network-isolated iOS Simulator/device cold-start acceptance;
- physical Android OEM notification timing/Doze behaviour, real-device GPS lifecycle, vibration/channel behaviour, audio focus/interruption and production distribution signing;
- physical Raspberry Pi Touch Display 2 boot/autostart, touch, rotation, power-loss and long-duration operation;
- physical TV/panel viewing-distance readability, real remote/HDMI-CEC behaviour and long-duration panel testing;
- human aesthetic sign-off beyond the automated English/Arabic/RTL geometry and visual-regression checks;
- institutional certification of calculation profiles where the documentation explicitly distinguishes interoperability/reference parity from an authority's own unpublished internal model.

These open items are limitations of validation evidence, not assertions that the corresponding hardware behaviour has passed. See TODO.md, TESTING.md and docs/PLATFORM_STATUS.md for the exact boundary.

## Author

privacyOG
