# Changelog

All notable SalahOS changes are recorded here.

## Unreleased

Detailed candidate notes: `docs/RELEASE_NOTES_0.1.0.md`.

### Added

- Local-first prayer calculation for the five obligatory prayers plus Sunrise, supplementary times, high-latitude rules and manual adjustments.
- Built-in calculation-method registry with provenance/verification state, including Umm al-Qura Ramadan Isha handling and documented Diyanet/Dubai research boundaries.
- Standard and Hanafi Asr conventions.
- Offline coordinate-to-IANA-timezone resolution, saved locations and manual location search.
- Gregorian/Umm al-Qura Hijri presentation with bounded display correction.
- Local mosque timetable import/library/manual entry and Iqamah rules.
- English and Arabic/RTL UI, theme selection and 12/24-hour time formats.
- Versioned local settings persistence, migration, import/export/reset and offline startup.
- Per-prayer notifications, reminders, prayer-time alerts, native Android/iOS scheduling adapters and lifecycle reconciliation.
- User-selectable local Adhan audio stored only on the device, with foreground full-recording playback and documented platform limits.
- Web/PWA service-worker caching, offline reload support and first-party install assets.
- Android Capacitor project, build/release checks, emulator acceptance and release-signing boundary.
- iOS/iPadOS Capacitor/Xcode project, Simulator build gate, safe-area handling and native build/install documentation.
- Raspberry Pi Touch Display 2 and TV/kiosk deployment paths and smart-display mode.
- Browser visual-regression matrix with CI screenshot artifacts.
- Privacy/threat model, secrets policy, dependency/license gates, native permission review and optional remote API security boundary.
- Draft 0.1.0 release notes and release-blocker review.

### Changed

- Prayer-method institutional adjustments are applied separately from user/manual offsets.
- Dashboard method provenance now reflects calendar-dependent effective method rules for the active civil date.
- Native Android data backup/device-transfer is explicitly excluded and cleartext network traffic is disabled.
- iOS location usage descriptions match the pinned geolocation dependency while SalahOS runtime behaviour remains one-shot/foreground-only.
- Build/platform documentation now reflects the implemented Android and iOS native paths without claiming untested physical-device acceptance.

### Security

- Optional remote requests require an explicit HTTPS origin allowlist and hardened credential, redirect, referrer and cache behaviour.
- Unreviewed direct production networking primitives are rejected by repository policy.
- Android source and merged-manifest permissions are reviewed separately and release/debug builds verify the effective permission set.
- Generated validation artifacts are ignored by version control.

### Release boundary

- Do not create the first release tag until the applicable exact-head Quality/Android/iOS gates and final release-readiness checks in `TODO.md` pass.
- Physical Raspberry Pi, TV/remote/CEC, phone/tablet and native-notification acceptance remain separate evidence where required.

---

**Author:** privacyOG
