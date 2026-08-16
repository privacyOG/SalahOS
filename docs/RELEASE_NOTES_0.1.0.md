# SalahOS 0.1.0 release notes

Status: release-candidate notes. Do not tag or publish 0.1.0 until the applicable release-readiness gates in `TODO.md` are satisfied.

## What SalahOS 0.1.0 contains

SalahOS 0.1.0 is the first local-first prayer-time and smart-display release candidate. The shared prayer engine and settings model are used across Web/PWA, Android, iOS/iPadOS and browser-hosted kiosk/display targets so calculation behaviour does not diverge by platform.

### Prayer calculation

- five obligatory prayer times plus sunrise;
- Muslim World League, Umm al-Qura/Makkah, Egyptian, Karachi, ISNA, Diyanet/Turkey, MUIS/Singapore, Dubai, Kuwait and Qatar method entries;
- standard and Hanafi Asr conventions;
- selectable high-latitude rules;
- per-prayer manual minute adjustments;
- named-method provenance and verification state;
- authority-specific Diyanet institutional adjustments kept separate from user offsets;
- Umm al-Qura 90-minute Isha outside Ramadan and 120-minute Isha during Ramadan using the uncorrected Umm al-Qura calendar policy;
- explicit fail-safe handling when a required astronomical/calendar result is unavailable rather than inventing a prayer time.

Diyanet twilight-angle parity and Dubai authority-formula parity remain explicitly pending authoritative-source verification. Their documentation must not be read as institutional certification.

### Location, timezone and calendar

- explicit one-shot current-location acquisition;
- manual coordinates and offline location search;
- local timezone lookup and IANA timezone handling;
- DST/date-rollover recalculation;
- Gregorian and Umm al-Qura Hijri presentation;
- user Hijri correction of ±2 days for display without changing named calculation-method policy;
- saved locations and local persistence.

### Mosque timetable and Iqamah

- local mosque timetable selection;
- validated CSV/JSON timetable import;
- saved mosque library;
- manual mosque/day entry;
- fixed-time or offset-based Iqamah rules;
- calculation-only, calculation-plus-adjustments and local-mosque source modes.

### Notifications and Adhan

- per-prayer notification enable/disable;
- reminder-before-prayer scheduling;
- prayer-time notifications;
- default/silent notification sound selection;
- vibration preference where supported;
- per-prayer Adhan alert preference;
- Android and iOS native local-notification scheduling adapters;
- schedule reconciliation after relevant settings/runtime changes;
- Android reboot/exact-alarm handling documented and verified at repository/emulator level;
- user-selectable local Adhan recording stored only on the device;
- foreground full-recording playback while the application is visible;
- background/terminated delivery remains subject to native platform notification restrictions.

SalahOS does not bundle an unlicensed Adhan recording and does not upload a user-selected local recording.

### Web/PWA and smart displays

- production Vite build and deploy-artifact verification;
- installable PWA manifest and first-party icons;
- service-worker shell caching and offline navigation fallback;
- versioned cache cleanup;
- Raspberry Pi/Chromium kiosk launcher and deployment documentation;
- smart-display mode for kiosk/TV browser use;
- responsive phone/tablet/kiosk styling;
- deterministic browser visual-regression matrix with English/light, Arabic/RTL/dark, phone portrait/landscape, tablet, 1080p kiosk and increased-text-size captures;
- CI screenshot artifact upload for visual review.

Physical Raspberry Pi Touch Display 2, television/CEC/remote and final real-device visual acceptance remain separate release gates.

### Android

- committed Capacitor Android project;
- reproducible debug/release build commands;
- emulator acceptance coverage;
- release signing configuration through environment-provided credentials;
- reviewed source and merged-manifest permission contracts;
- cleartext network traffic disabled;
- application backup disabled with explicit cloud/device-transfer exclusion rules;
- local notification and reboot scheduling paths.

A successful Android build/emulator run does not represent broad physical-device or store-distribution acceptance.

### iOS / iPadOS

- committed Capacitor/Xcode project;
- automated unsigned iOS Simulator build path;
- current-location and local-notification native adapters;
- safe-area viewport/CSS handling;
- documented Xcode and physical-development-device workflow;
- foreground-only SalahOS location behaviour while retaining the usage-description keys required by the pinned geolocation dependency.

iPhone/iPad physical acceptance, distribution signing and native notification validation in supported environments remain release gates.

### Privacy and security

- local-first prayer calculation and timezone resolution;
- no mandatory account for core prayer-time use;
- no unnecessary analytics/telemetry;
- privacy-safe structured error logging;
- sensitive-file and dependency-vulnerability gates;
- dependency-license policy;
- Web/PWA Content Security Policy baseline;
- optional remote API boundary using explicit HTTPS origins, no browser credentials, no redirect following, no referrer disclosure and no cache reuse;
- direct unreviewed production networking primitives rejected by repository policy;
- native permission/backup/transport review gates;
- documented privacy/threat model and secrets policy.

No optional remote provider is enabled by default.

### Localization and persistence

- English and Arabic interface strings;
- Arabic RTL direction and document-language handling;
- system/light/dark theme preference;
- 12/24-hour time formats;
- versioned settings persistence and migration;
- settings import/export/reset;
- offline startup from stored configuration.

## Validation boundary before tagging

The repository already contains extensive unit, integration, component, offline, calculation-parity and native-build evidence from earlier validated heads. The consolidated release candidate must still pass its own exact-head Quality, Android and iOS workflow gates before merge.

The following evidence remains separate and must not be inferred from automated repository checks:

- physical Raspberry Pi Touch Display 2 acceptance;
- physical TV/remote/CEC/viewing-distance acceptance;
- final physical Android/iPhone/iPad acceptance where required by `TODO.md`;
- native notification behaviour across platform-specific lifecycle/power-management conditions not covered by the available environment;
- final visual artifact inspection and accessibility review;
- any items explicitly marked blocked or partial in `TODO.md`.

The first release tag must be created only after the applicable gates are satisfied and the tracker reflects the final evidence state.

---

**Author:** privacyOG
