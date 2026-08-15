# SalahOS Testing and Validation Strategy

**Author:** privacyOG

## Completion rule

A TODO item is marked `[x]` only after implementation, relevant automated/manual checks, and documentation/evidence are present. Code existence alone is insufficient.

## Automated quality gate

Every change must be suitable for the following gate:

1. formatting check;
2. lint;
3. strict TypeScript typecheck;
4. unit/integration tests;
5. production build.

CI uses a read-only checkout and installs dependencies with `npm ci` from the committed lockfile before running the quality gate.

## Prayer engine testing

The domain engine requires deterministic unit tests for:

- Julian date conversion;
- solar declination and equation of time;
- solar noon;
- sunrise and sunset;
- Fajr and Isha angle calculations;
- Standard versus Hanafi Asr shadow factors;
- high-latitude fallback rules;
- deterministic rounding;
- manual offsets kept separate from raw results;
- next-prayer rollover after Isha;
- supplementary Imsak/Ishraq and night-division calculations;
- method registry/reference parameters;
- frozen external timetable parity fixtures;
- provenance metadata.

## Geographic reference matrix

At minimum, reference fixtures cover Makkah, Madinah, Sydney, Melbourne, Cairo, Istanbul, Karachi, Jakarta, Singapore, London, New York, Oslo, Tromsø, an equatorial location, northern/southern hemisphere cases, and extreme high-latitude summer/winter cases.

## Date/time edge matrix

Fixtures include:

- DST start/end;
- leap year;
- Gregorian year boundary;
- local midnight rollover;
- timezone offset changes;
- southern-hemisphere DST;
- significant device clock correction;
- suspend/resume recovery.

## Reference parity

Comparisons must record method inputs, coordinates, IANA timezone, date, raw times, rounded times, adjustments, reference source, observed difference, and an explanation where known. Differences are not hidden by arbitrary offsets merely to force parity.

Reference metadata and caveats are maintained in `docs/PRAYER_METHOD_REFERENCES.md`. External fixtures must be frozen/version-pinned so CI does not depend on a live prayer-time API.

## UI validation

Visual and interaction checks cover phone portrait/landscape, tablet, Raspberry Pi Touch Display 2 target viewport, 1920x1080 display, larger-format display, English LTR, Arabic RTL, light/dark themes, keyboard/touch operation, reduced motion, and large-distance legibility.

## Platform validation

### Android

Record emulator/device, OS/API level, permissions tested, offline cold start, background/resume behaviour, notification evidence, and release build status.

### iOS/iPadOS

Record simulator/device and OS version when a macOS/Xcode environment is available. Any item not physically/simulator tested remains explicitly unverified.

### Raspberry Pi

Record Pi model, Raspberry Pi OS version, display orientation/resolution, kiosk startup, offline restart, sleep/wake/network-loss recovery, and daily rollover.

## Evidence format

When a milestone is verified, add a dated entry under `Validation log` including commit/PR, commands or manual procedure, result, and any known discrepancy.

## Validation log

### 2026-08-16 — Foundation and solar primitives

- Repository scope and MVP acceptance criteria documented in `DESIGN.md`.
- Research, privacy and validation policies documented.
- Dependency lockfile committed; the clean CI install reported zero dependency vulnerabilities.
- Quality Gate run `31891071518` completed successfully using a read-only checkout and `npm ci`.
- Formatting, typed lint, strict TypeScript typecheck, current unit tests and production Vite build all passed.
- Solar primitive tests cover J2000 Julian Day, equinox declination, equation-of-time sanity, Sydney event ordering, polar unavailability and coordinate validation.

### 2026-08-16 — Five-prayer domain engine

- Quality Gate run `31891402804` completed successfully using the committed lockfile and read-only workflow.
- The pure domain engine calculates Fajr, Dhuhr, Asr, Maghrib, Isha and sunrise without UI, DOM, storage or network dependencies.
- Tests verify chronological prayer ordering for Sydney, Standard versus Hanafi Asr divergence, fixed-interval Isha, deterministic rounding, adjustment separation and calculation provenance.
- Raw astronomical times, high-latitude fallback/base times, manual-adjusted times and rounded display times remain distinct fields.
- Polar-day handling returns unavailable events instead of fabricating sunrise, Maghrib, Fajr or Isha.

### 2026-08-16 — High-latitude strategy coverage

- Quality Gate run `31891501691` completed successfully: clean lockfile install, formatting, typed lint, strict typecheck, unit tests and production build.
- Middle of the Night, One-Seventh of the Night and Angle-Based strategies are each executed and verified by the unit suite for high-latitude twilight conditions.
- Active fallback strategy and whether it was applied are retained in provenance.
- Nearest-latitude / nearest-valid-day polar strategies remain separate open research and implementation work.
- Built-in regional calculation-method parameters remain explicitly pending authoritative-source/parity verification and are not recorded as independently verified.

### 2026-08-16 — Supplementary and next-prayer domain utilities

- Quality Gate run `31899800537` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, unit tests and production build.
- Optional Imsak/Suhur cutoff and Ishraq/Duha-after-sunrise helpers require explicit caller-selected minute offsets; no hidden jurisprudential default is imposed.
- Islamic midnight and final-third calculations support an explicit Fajr or sunrise night-end convention and retain provenance describing the selected convention.
- Next-prayer selection excludes sunrise from the obligatory sequence and correctly rolls from Isha to the following day's Fajr.
- Invalid supplementary offsets and unavailable prerequisite events are covered by unit tests.

### 2026-08-16 — Calculation-method references and frozen timetable parity

- Adhan JS version `4.4.4` is pinned at commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`; PrayTimes and AlAdhan method definitions are documented as corroborating references.
- Quality Gate run `31900180792` passed the frozen parameter-reference tests under the restored read-only workflow.
- MWL, Umm al-Qura, Egyptian, Karachi, ISNA, MUIS, Kuwait and Qatar parameters are recorded as `cross-checked-reference`; Diyanet/Turkey and Dubai remain `pending-authoritative-source` because their reference profiles are documented as approximation/experimental or require additional offsets.
- Quality Gate run `31900228992` passed frozen Makkah/Umm al-Qura and Singapore/MUIS timetable fixtures.
- Quality Gate run `31900274451` additionally passed Doha/Qatar and Kuwait City/Kuwait frozen timetable fixtures.
- The Makkah fixture traces to an Umm al-Qura source; Singapore traces to MUIS; Doha traces to Qatar's ministry source. Their reference adjustment ranges are preserved rather than widened merely to force parity.
- The broader geographic, DST, high-latitude and direct canonical-algorithm parity matrices remain open and are not claimed complete.

### 2026-08-16 — Local-first location and IANA timezone core

- `@photostructure/tz-lookup` is pinned in the dependency lockfile for offline coordinate-to-IANA resolution; boundary lookup is explicitly documented as approximate near timezone borders.
- Browser location uses a one-shot current-position request and returns typed `permission-denied`, `unavailable`, `timeout`, `unsupported` and `unknown` states instead of continuous tracking.
- Manual coordinates use the same validated coordinate model and are never converted to timezone by longitude arithmetic.
- IANA timezone offsets are resolved for the target instant with `Intl.DateTimeFormat`, including exact 2026 DST start/end transition coverage for Sydney and London.
- The integration suite proves Sydney coordinates → `Australia/Sydney` → correct civil date/UTC offset → local prayer schedule.
- Quality Gate run `31900763989` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, unit/integration tests and production build.
- Saved/favourite persistence, city search, native Android/iOS adapters, UI fallback flows and persistent/manual timezone override remain separate open work.

### 2026-08-16 — Gregorian and Umm al-Qura Hijri calendar core

- The calendar domain requires an already-resolved local civil date represented at UTC midnight, preventing the host device timezone from silently changing the intended date.
- Gregorian parts are derived directly from that civil date; prayer calculation remains independent of display-calendar convention.
- Hijri conversion initially supports the runtime `islamic-umalqura` calendar and verifies the resolved calendar identifier before accepting the result.
- Hijri results retain the selected calendar, `runtime-intl-calendar` provenance and the explicit manual correction value.
- Manual Hijri correction is constrained to integer values from -2 through +2 days and is tested in both directions.
- Automated tests cover Hijri month rollover, Hijri year rollover and entry into Ramadan (month 9), plus invalid correction/non-civil-date rejection.
- Read-only Quality Gate run `31901367515` passed formatting, typed lint, strict typecheck, the complete unit suite and production build after canonical test formatting.
- UI date presentation, locale-specific formatting and automatic live date rollover remain separate open work.

### 2026-08-16 — Local mosque timetable, Iqamah and Jumu'ah domain core

- Prayer source mode is explicit: `calculated`, `local-mosque` or `calculated-adjustments`; missing mosque entries remain unavailable instead of silently falling back to calculated values.
- Prayer start and Iqamah/Jama'ah are separate values. Fixed local-time and prayer-start-plus-offset Iqamah rules are validated, including prevention of next-day rollover.
- Friday detection supports one or multiple mosque-specific Jumu'ah sessions with Khutbah and Salah stored independently of astronomical Dhuhr.
- CSV import uses the documented fixed schema, 24-hour `HH:MM` prayer times and either fixed `HH:MM` or `+N` Iqamah values. A sample file is committed under `examples/`.
- JSON import reconstructs the domain structure through runtime guards before activation, rejecting malformed nested prayer, Iqamah and Jumu'ah objects and unknown prayer keys rather than trusting a TypeScript cast.
- CSV and JSON round-trip tests, invalid-schema/time tests, duplicate-date tests, source-isolation tests and Iqamah/Jumu'ah validation tests are included.
- Read-only Quality Gate run `31901969127` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, tests and production build.
- Persistence, UI editing/presentation and optional vetted remote integrations remain separate open work.

### 2026-08-16 — English/Arabic localisation and RTL core

- The current shared application shell uses a statically typed English/Arabic translation catalogue instead of hard-coded user-facing prose in `App.tsx`.
- Arabic prayer names are explicitly covered for Fajr, Dhuhr, Asr, Maghrib and Isha.
- Locale switching applies `lang` and `dir` to the document root while the shared shell also receives the matching direction.
- RTL layout uses logical block properties and removes Latin-specific uppercase/letter-spacing treatment for Arabic.
- Locale helpers cover explicit 12/24-hour-capable prayer-time formatting and host-timezone-independent Gregorian civil-date formatting through `Intl.DateTimeFormat`.
- Tests run without a browser-global dependency by targeting the minimal document-root locale contract.
- Read-only Quality Gate run `31902384992` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build.
- Full mixed-script and RTL visual regression across every target breakpoint remains open for the responsive UI test stage.

### 2026-08-16 — Live shared prayer dashboard

- A pure dashboard model composes coordinates, offline IANA timezone resolution, local clock extraction, Gregorian/Umm al-Qura dates, today/tomorrow prayer schedules and next-prayer selection without duplicating prayer formulas in React.
- The web shell supports one-shot browser location refresh and validated manual latitude/longitude entry; typed permission/unavailable/timeout/unsupported failures direct the user to the manual path.
- The dashboard displays live local time, Gregorian and Hijri dates, coordinates/timezone, calculation method/source, the five obligatory prayers, Sunrise, next-prayer highlighting and a per-second countdown.
- Tomorrow Fajr rollover after Isha and host-timezone-independent clock extraction are covered by dashboard tests.
- Responsive CSS uses one shared app/data model across phone, tablet and large-display widths, with visible keyboard focus, touch-sized controls, semantic status/error messaging and reduced-motion handling.
- Read-only Quality Gate run `31903663678` passed clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build after canonical formatting.
- Mosque selection/Iqamah presentation, persistent saved locations, theme controls, current-prayer highlighting and visual regression on physical target displays remain open.

### 2026-08-16 — Offline-first and versioned local persistence core

- Added a versioned `salahos.settings` storage envelope for selected coordinates/timezone, locale, theme/time-format preferences, built-in method, Asr convention, high-latitude rule, Hijri correction, prayer adjustments, source mode and a validated mosque timetable.
- The current dashboard restores and persists its exposed locale and selected-location state, and stored calculation choices are consumed by the shared dashboard model rather than ignored.
- Persistence tests cover complete round-trip, export/import primitives, reset, legacy unversioned migration, unsupported future versions, corrupt storage fallback, invalid coordinates and invalid mosque timetable rejection.
- Added an installable web manifest, first-party SVG icon assets and a production-only same-origin service worker that precaches the shell metadata, runtime-caches successful same-origin GET assets, falls back to the cached root for navigation and deletes obsolete named caches on activation.
- The web shell exposes a localised offline status only when the browser reports that networking is unavailable. No remote API is required for the prayer calculation pipeline.
- Read-only Quality Gate run `31904178200` passed clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build after the final persisted-calculation integration assertion.
- Real-browser offline reload, cache upgrade across two deployed versions and platform-specific raster install-icon validation remain open.

### 2026-08-16 — Persistent settings controls

- Added user-facing selectors for calculation method, Asr convention, high-latitude rule, Hijri correction, 12/24-hour time format and system/light/dark theme preference.
- Added per-prayer minute adjustment inputs and wired them directly into the shared prayer dashboard calculation model.
- Added functional settings export, validated import and reset-to-defaults controls backed by the versioned local persistence layer.
- Changing method, Asr convention, high-latitude rule, Hijri correction or prayer offsets recomputes the shared dashboard without duplicated calculation logic.
- Local persistence now depends on effective configuration/location changes rather than the per-second dashboard refresh, avoiding unnecessary storage writes.
- Read-only Quality Gate run `31904751213` passed clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build after the strict settings lint fixes.
- Visual validation of light/dark/system themes and full component-level interaction testing remain open.

### 2026-08-16 — Selected source, Iqamah and Jumu'ah presentation

- Added a source-aware dashboard projection over the existing calculation and mosque timetable domains rather than duplicating prayer calculations.
- Local-mosque mode uses only timetable-provided obligatory prayer starts; a missing mosque entry stays unavailable instead of silently falling back to a calculated time.
- Next-prayer and countdown selection are recomputed from the active source across today and tomorrow.
- Dashboard prayer cards display prayer start and configured Iqamah separately, while Sunrise remains supplementary information.
- Friday timetable sessions are presented with independent Khutbah and Salah times.
- Source-domain tests cover calculated mode, local mosque starts/Iqamah, missing-entry isolation and next-day mosque Fajr rollover.
- Quality Gate run `31905085674` passed formatting, typed lint, strict typecheck, all tests and production build for the implementation.
- Multiple saved mosques, dedicated mosque management and physical-display visual validation remain open.

### 2026-08-16 — Persistent saved locations

- Added a separate versioned local saved-location library so favourites can evolve without forcing a migration of the core settings envelope.
- Saved locations validate labels, stable ids and coordinates, reject duplicate ids, and fall back to an empty library when persisted data is corrupt.
- Unit tests cover storage round-trip, immutable upsert/remove behavior, duplicate-id rejection, invalid-coordinate rejection and corrupt-storage fallback.
- The location panel now supports saving the active coordinates under a user label, selecting a favourite to recalculate immediately, and removing a saved location.
- Saved favourites remain independent of reset-to-defaults for calculation preferences and require no remote service.
- Read-only Quality Gate run `31905379677` passed the storage/test core; implementation Quality Gate run `31905467110` passed formatting, typed lint, strict typecheck, all tests and production build after UI integration.
- Manual city/location search and native Android/iOS location adapters remain open.

### 2026-08-16 — Local mosque timetable library and picker

- Added a separate versioned local library for multiple mosque timetables.
- Library entries use a normalized mosque-name identifier and reject duplicate identifiers.
- Persisted entries are reconstructed through the same strict JSON timetable parser used by imports before they can be activated.
- Unit tests cover storage round-trip, upsert/remove behavior, duplicate ids, malformed timetable content, corrupt storage fallback and strict persistence validation.
- The settings panel imports documented JSON or CSV timetables, stores multiple mosques locally, selects a mosque for immediate local-mosque activation, and removes the selected mosque safely.
- Selecting or importing a mosque switches the prayer source to local-mosque; removing the active mosque returns local-mosque mode to calculated rather than leaving an unavailable source active.
- Implementation Quality Gate run `31905789616` passed formatting, typed lint, strict typecheck, all tests and production build for the manager integration.
- Read-only Quality Gate run `31907837879` passed after duplicate-state and translation cleanup with the strict persisted-timetable parser active.
- Manual per-day timetable editing, optional vetted remote integrations and physical-display visual validation remain open.
