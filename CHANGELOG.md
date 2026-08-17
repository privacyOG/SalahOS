# Changelog

All notable SalahOS changes are recorded here.

## Unreleased

No changes recorded after v1.0.0 yet.

## 1.0.0 — 2026-08-18

### Added

- Local-first five-prayer calculation engine with Sunrise, supplementary night/day times, selectable calculation methods, Standard/Shafi'i-family and Hanafi Asr conventions, high-latitude handling and explicit manual adjustments.
- Gregorian and Hijri/Umm al-Qura date presentation with local civil-date, DST and rollover handling.
- Browser and native foreground location, manual coordinates, offline city search, saved locations and offline IANA timezone resolution.
- Calculated, adjusted and local-mosque timetable modes with validated CSV/JSON import/export, Iqamah rules and multiple Jumu'ah sessions.
- English and Arabic localisation, RTL/bidirectional handling, light/dark/system themes, scalable text, keyboard navigation and touch-oriented layouts.
- Android and iOS/iPadOS native shells with local persistence, prayer-notification scheduling and documented lifecycle/platform limits.
- Private user-selected local Adhan audio with foreground playback attempts and notification-based background/terminated delivery.
- PWA offline shell, Raspberry Pi Touch Display 2 deployment/fixtures and browser-based smart-display mode for TV/kiosk use.
- Permanent security, dependency, documentation, Android, iOS and 14-scenario visual-regression quality gates.

### Fixed

- iPhone safe-area handling for status-bar/Dynamic-Island insets, with a source-contract regression test.
- Responsive overflow cases found by the automated Arabic/RTL and scalable-text visual matrix.

### Release validation boundary

- v1.0.0 is a production repository/source release. It does not claim App Store/Play Store publication or signed store binaries.
- Physical iPhone/iPad, Android OEM, Raspberry Pi Touch Display 2 and TV/panel acceptance remains explicitly unperformed where recorded in TODO.md and platform documentation.
- Emulator, Simulator and browser evidence is not represented as physical-hardware evidence.

---

**Author:** privacyOG
