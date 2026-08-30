# Changelog

All notable SalahOS changes are recorded here.

## Unreleased

## 1.5.2 — 2026-08-30

### Australian mosque directory

- Expand the bundled Australian mosque catalogue from the former 106-record OpenStreetMap-only runtime to a 254-record deduplicated combined directory using reviewed OpenStreetMap and Australian Mosque Finder factual source snapshots.
- Preserve source provenance through the combined catalogue and deployable country/regional packs, with audited/automatic cross-source identity matching, coordinate quarantine for unsafe geospatial records and explicit protection against known false merges.
- Wire the combined catalogue into the shared directory service, harden near-duplicate detection so proximity alone is insufficient, and enforce source/combined/pack reproducibility plus the 254-record visual acceptance contract in CI.
- Make the visible Australian directory consume the combined catalogue, use a selected directory mosque as Today prayer-location context, and surface explicitly published mosque congregation times as Iqamah/Jama‘ah without inventing missing values.
- Show Sunrise permanently in the Today schedule as the non-prayer boundary where Fajr ends, and prevent Fajr from remaining falsely marked current after sunrise.

### Release packaging

- Synchronise npm, package-lock, Android and iOS marketing versions at 1.5.2 and advance Android/iOS native build numbers together to 9.
- Publish the persistently signed Android APK and AAB together with the Web/PWA ZIP, Raspberry Pi kiosk bundle, Windows x64 executable and portable SHA-256 manifest.
- Preserve exact-current-main release preflight, persistent Android signing verification, archive-integrity checks, bundle budgets and exact-final-file-set validation before publication.
- Keep consumer iOS/iPadOS IPA publication gated on Apple distribution signing/provisioning; Simulator acceptance remains release evidence rather than a consumer installer.

## 1.5.0 — 2026-08-26

### Product UX refinement

- Strengthen Today around the current and next prayer, prayer times, weather and local context while moving secondary explanatory material behind progressive disclosure.
- Simplify phone navigation and reorganise Settings around Location, Prayer, Adhan, Display, Mosques, Privacy/Data and Advanced, while preserving legacy deep-link aliases.
- Improve location-confidence feedback, Arabic/RTL theme-preview resilience and responsive presentation without changing the established SalahOS visual identity.

### Real-world verification

- Expand automated location acceptance across fresh GPS, stale-fix rejection, permission denial, unavailable providers, saved-location fallback and manual recovery.
- Expand weather failure/cache acceptance and mosque timetable/data-quality coverage, including authoritative timetable precedence, provenance/freshness boundaries and directory action contracts.
- Add representative Android, iPhone and iPad semantic/accessibility acceptance for large text and reduced motion, while preserving fresh native emulator/Simulator lifecycle coverage.
- Document the verification boundary for physical Android/iPhone/iPad, Raspberry Pi and TV/panel hardware so browser, emulator and Simulator evidence is never represented as physical-device evidence.

### Release reconciliation

- Synchronise npm, package-lock, Android and iOS marketing versions at 1.5.0 and advance Android/iOS native build numbers together to 7.
- Reconcile v1.5 release notes, platform/device evidence and release documentation around one exact final candidate revision.
- Preserve the permanent Quality, Visual Regression, Android emulator lifecycle and fresh iPhone/iPad Simulator gates as mandatory exact-head release checks.
- Keep consumer iOS/iPadOS IPA publication gated on Apple distribution signing/provisioning and keep physical-device acceptance separate from automated release evidence.

## 1.4.0 — 2026-08-25

### Mobile, accessibility and Qiblah

- Harden phone layouts at 360×780 and 390×844 so prayer rows and trailing content remain reachable above navigation and safe areas, with improved contrast, RTL and scalable-text acceptance.
- Add automatic best-available OS location and true-heading acquisition when Qiblah opens, while preserving saved/manual fallback and first-run permission education.
- Add manual and poor-accuracy-triggered compass recalibration with guided reassessment, denied-permission handling and unsupported-device fallback.
- Make Google Maps the primary interactive Qiblah provider with Map, Satellite and Hybrid modes, user/Kaaba markers, geodesic direction styling, click-to-pin fallback and provider-error recovery.

### Mosques, Adhan and Islamic Knowledge

- Add a reproducibly generated, bundled offline-first Australian mosque catalogue with OpenStreetMap/ODbL provenance, nearby ordering, search, selection and deduplication.
- Add shared/community mosque directory models and flows for text/geographical lookup, submissions, duplicate detection, moderation/edit suggestions, verification/claim state and offline cache resilience.
- Add a rights-verified packaged Adhan audio library with default/per-prayer selection, preview, volume and notification-only controls while keeping private local uploads device-local.
- Add the Islamic Knowledge destination with offline-first Qur'an, Hadith and Q&A starter modules, local search/filtering, explicit source/reference metadata, Hadith grading authority and scholar/juristic attribution.

### Performance and verification

- Remove the timetable-import static edge and split Admin, smart-display, Mosques, Qiblah, Knowledge, Community and Settings behind route/surface-level lazy loading while keeping Today eager.
- Add a permanent bundle architecture budget; the validated v1.4 baseline emits 21 JavaScript chunks with a 469,196-byte largest chunk and 898,871 total JavaScript bytes.
- Add deterministic golden screenshot diffing, automated axe/WCAG/RTL/container-overflow acceptance and Chromium, Firefox and WebKit smoke journeys.
- Add locked V8 core coverage thresholds and preserve exact-head Quality, Visual, Android emulator lifecycle and fresh iPhone/iPad Simulator acceptance as release gates.

### Release packaging

- Synchronise npm, package-lock, Android and iOS marketing versions at 1.4.0 and advance native build numbers to 6.
- Publish the persistently signed Android APK and AAB together with the Web/PWA ZIP, Raspberry Pi kiosk bundle and portable SHA-256 manifest from the exact current `main` revision.
- Preserve fail-closed signing, version/build parity, archive-integrity and exact-final-file-set release preflights.
- Keep consumer iOS/iPadOS `.ipa` publication gated on Apple distribution signing/provisioning; Simulator acceptance remains test evidence rather than a consumer installer.

## 1.3.0 — 2026-08-23

### UI/UX v2 completion

- Complete the UI/UX v2 programme through Stage 27 across congregation, managed administration, Phone/Home, Raspberry Pi Touch Display and TV/kiosk surfaces.
- Complete six original prayer-board templates, Phone/Home variants, optional weather, announcement rotation and managed display-theme configuration.
- Complete device-specific UX refinement, WCAG-oriented accessibility, Arabic/RTL acceptance, text-expansion coverage and major-surface human visual review.
- Retire the legacy single-page application/Settings composition, destination-hiding CSS and root compatibility tokens in favour of direct v2 screen and smart-display ownership.

### Release packaging

- Synchronise npm, package-lock, Android and iOS versions at 1.3.0 and advance native build numbers to 5.
- Add signed Android App Bundle (`.aab`) publication alongside the signed release APK.
- Tighten exact-main release preflight with package-lock version and Android/iOS build-number parity checks.
- Preserve Web/PWA ZIP, Raspberry Pi kiosk tarball and portable SHA-256 manifest publication with exact-file preflight.

## 1.2.0 — 2026-08-20

### Managed masjid and congregation experience

- Add a modern prayer-first design system, responsive congregation navigation and separate Today/Settings views.
- Add managed mosque profiles, authoritative prayer/Iqamah/Jumu'ah publication revisions, mosque following/offline cache, multiple local mosque profiles and a congregation mosque-profile experience.
- Add role/permission, invitation/session and administrator-dashboard domain foundations while keeping core personal prayer functionality account-free.
- Add mosque announcements, events, congregation community feeds, managed community-notification policy and phone/web/TV publishing previews.
- Add mosque discovery/directory flows, monthly timetable presentation and CSV/JSON exports.

### Managed displays and integrations

- Add managed signage scenes, playlists, scheduling, display pairing/fleet state, TV/kiosk layouts and configurable display themes.
- Add optional remote administration for managed mosque displays with typed configuration, one-time display credentials, revision control, cached fail-soft operation and explicit network-policy review.
- Add public embed widgets and a versioned read-only mosque API surface.
- Add Home Assistant support, a loopback-default optional local-network API and RFC 5545 mosque-event calendar export/subscription.
- Add a privacy-minimised wearable companion snapshot contract and platform exploration for future watchOS/Wear OS targets.

### Qiblah, Ramadan and languages

- Add deterministic local Qiblah bearing and the full Qiblah Finder with true-north compass guidance, WMM2025 magnetic-declination correction, screen-orientation compensation, smoothing, calibration feedback, alignment haptics and saved/current/city/map-pin location flows.
- Add privacy-gated OpenStreetMap imagery for the Qiblah Finder with attribution, offline fallback and a narrowly reviewed network capability.
- Add automatic Ramadan mode, Suhur/Imsak/Iftar presentation and mosque-specific Taraweeh timetable support.
- Add complete bundled Turkish and Indonesian application localisation alongside English and Arabic/RTL.

### Release and quality

- Keep the v1.1.0 downloadable asset matrix: signed Android APK, Web/PWA ZIP, Raspberry Pi kiosk tarball and portable SHA-256 manifest.
- Extend release preflight to verify npm, Android and iOS version consistency.
- Add an exact-main `release/v*` publication path so release assets can be built and published only from the current `main` commit.

## 1.1.0 — 2026-08-18

- Adopt the project owner's canonical SalahOS logo and icon across Web/PWA, Android, iOS and smart-display surfaces.
- Add reproducible source/hash/dimension validation for the canonical platform icon set.
- Add GitHub release packaging for Web/PWA and Raspberry Pi/kiosk bundles.
- Add a signed Android release APK pipeline that refuses to publish unsigned or debug APKs.
- Add SHA-256 checksum publication for downloadable release assets.
- Document the current distribution boundary: iOS IPA awaits Apple distribution signing and macOS DMG awaits a real macOS application target.

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
