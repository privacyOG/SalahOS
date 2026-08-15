# SalahOS — TODO / Implementation Tracker

> Cross-platform Islamic prayer time app and smart display ecosystem for Android, iOS, Raspberry Pi, TV and kiosk displays.

## Status convention

- [ ] Not started
- [~] In progress
- [x] Completed and verified
- [!] Blocked — reason must be documented

**Rule:** Do not mark an item complete merely because code was written. A task is complete only when implemented, tested, and documented where applicable.

---

## 0. Project foundation and research

- [x] Confirm project scope, supported platforms and MVP acceptance criteria
- [x] Create `DESIGN.md` for architecture and technical decisions
- [x] Create `RESEARCH.md` for prayer-calculation, platform and jurisprudential research
- [x] Create `TESTING.md` for test strategy, evidence and discrepancies
- [x] Create `CHANGELOG.md`
- [x] Choose and document the cross-platform framework and deployment strategy
- [x] Define repository structure and coding conventions
- [x] Configure formatter, linter, strict type checking and test runner
- [x] Add CI workflow for lint, typecheck, tests and production build
- [x] Pin dependencies and commit lockfile for reproducible builds
- [x] Define privacy principles: local-first operation, minimal telemetry, no unnecessary location transmission

**Stage 0 verification note (2026-08-16):** foundation documentation and tooling are committed. The read-only Quality Gate completed successfully from the committed lockfile on run `31891071518`, covering `npm ci`, formatting, lint, strict type checking, the current unit suite and the production web build. Dependency installation reported zero vulnerabilities.

---

## 1. Prayer-time domain model and calculation engine — CRITICAL PATH

### 1.1 Core astronomical engine

- [x] Implement pure prayer-calculation engine with no UI, DOM or network dependency
- [x] Implement Julian date / solar-position calculations
- [x] Implement equation of time and solar declination calculations
- [x] Implement solar noon calculation
- [x] Implement sunrise and sunset calculations
- [x] Document atmospheric refraction, sunrise/sunset depression and observer-elevation assumptions
- [x] Implement deterministic calculation rounding policy in a dedicated module
- [x] Keep raw calculated times separate from displayed/rounded times
- [x] Add provenance metadata to every calculated result

### 1.2 Five daily prayers and supplementary times

- [x] Calculate Fajr
- [x] Calculate Dhuhr
- [x] Calculate Asr
- [x] Calculate Maghrib
- [x] Calculate Isha
- [~] Calculate and display Sunrise separately from the five obligatory prayers
- [x] Add optional Imsak/Suhur cutoff support
- [x] Add optional Duha/Ishraq support
- [x] Add optional Islamic midnight calculation
- [x] Add optional last-third-of-the-night calculation

### 1.3 Calculation-method registry

- [x] Build an extensible calculation-method registry rather than hard-coding method logic throughout the engine
- [~] Record each method's Fajr angle, Isha angle/interval, Maghrib rule where applicable and authoritative source
- [~] Implement and verify Muslim World League method
- [x] Implement and verify Umm al-Qura / Makkah method
- [~] Implement and verify Egyptian method
- [~] Implement and verify University of Islamic Sciences, Karachi method
- [~] Implement and verify ISNA method
- [~] Research and add other reputable regional methods where appropriate, including Diyanet/Turkey, MUIS/Singapore, Dubai, Kuwait and Qatar
- [x] Provide custom calculation parameters for advanced users where safe and clearly labelled
- [x] Never silently change an explicitly selected calculation method

**Method-registry note (2026-08-16):** built-in numerical parameters are centralized and cross-checked against pinned/reference sources. MWL, Umm al-Qura, Egyptian, Karachi, ISNA, MUIS, Kuwait and Qatar are tagged `cross-checked-reference`; Diyanet/Turkey and Dubai remain `pending-authoritative-source` because the upstream references themselves describe those profiles as approximation/experimental or require unmodelled offsets. Institutional timetable parity remains a separate requirement from parameter agreement.

### 1.4 Madhhab / Asr calculation

- [x] Implement Standard Asr shadow factor (Shafi'i, Maliki and Hanbali convention)
- [x] Implement Hanafi Asr shadow factor
- [x] Set Shafi'i/Standard as initial default while allowing user selection
- [~] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI
- [x] Add unit tests proving both shadow-factor branches differ correctly

### 1.5 High-latitude handling

- [x] Implement Middle of the Night rule
- [x] Implement One-Seventh of the Night rule
- [x] Implement Angle-Based portion-of-night rule
- [ ] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions
- [x] Define behaviour for polar day and polar night when normal astronomical events are unavailable
- [x] Never fabricate an astronomical event without identifying the applied fallback rule
- [~] Surface active high-latitude rule in calculation provenance/settings

### 1.6 Manual adjustments

- [x] Support per-prayer minute offsets
- [x] Keep adjustments separate from the underlying astronomical result
- [ ] Show when a displayed time contains a manual adjustment
- [ ] Allow reset-to-method-default

**Stage 1 engine verification note (2026-08-16):** read-only Quality Gate run `31891501691` completed successfully after the expanded engine tests. The suite verifies five-prayer ordering, Standard/Hanafi Asr divergence, raw/base/adjusted/rounded separation, fixed-interval Isha, all three implemented high-latitude strategies, polar unavailability without fabricated events, and adjustment-range validation. Read-only Quality Gate run `31899800537` additionally verified explicit Imsak/Ishraq offsets, Islamic midnight, last-third calculations, next-obligatory-prayer selection and Isha → tomorrow Fajr rollover. Reference-parity evidence is recorded separately below.

---

## 2. Prayer-calculation validation and reference parity

- [x] Archive or pin the canonical reference implementation used for algorithm comparison
- [x] Create independent cross-check dataset instead of treating one online API as absolute ground truth
- [~] Compare against canonical calculation implementation
- [x] Compare against AlAdhan or another reputable independent calculator as a secondary cross-check
- [x] Compare against authoritative published timetables where practical
- [x] Record rounding, offsets and methodology differences instead of forcing false parity

**Stage 2 verification note (2026-08-16):** Adhan JS `4.4.4` is pinned at commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`; PrayTimes and AlAdhan method definitions are documented as additional cross-checks in `docs/PRAYER_METHOD_REFERENCES.md`. Read-only Quality Gate run `31900274451` passed frozen external timetable parity fixtures for Makkah/Umm al-Qura, Singapore/MUIS, Doha/Qatar and Kuwait City/Kuwait within the published/reference adjustment ranges. The broader geographic matrix and direct canonical-algorithm parity remain open.

### Geographic test matrix

- [x] Makkah
- [ ] Madinah
- [ ] Sydney
- [ ] Melbourne
- [ ] Cairo
- [ ] Istanbul
- [ ] Karachi
- [ ] Jakarta
- [x] Singapore
- [ ] London
- [ ] New York
- [ ] Oslo
- [ ] Tromsø
- [ ] Equatorial location
- [ ] Northern-hemisphere location
- [ ] Southern-hemisphere location
- [ ] Extreme high-latitude summer case
- [ ] Extreme high-latitude winter case

### Date/time edge cases

- [x] DST start transition
- [x] DST end transition
- [ ] Leap year
- [ ] Gregorian year boundary
- [ ] Local midnight rollover
- [x] Next-prayer calculation after Isha → tomorrow's Fajr
- [x] Timezone-offset changes
- [x] Southern-hemisphere DST direction
- [x] Device clock correction while app is running
- [x] System suspend/resume recovery

**Runtime-refresh verification note (2026-08-16):** implementation Quality Gate run `31908092487` passed formatting, typed lint, strict typecheck, all tests and production build after adding the runtime refresh adapter. The shared shell continues to sample a fresh system `Date` every second, so a device-clock correction is absorbed on the next tick, and it now also refreshes immediately on window focus, restored-page (`pageshow`) and document visibility changes. Unit tests verify all three recovery events and complete listener cleanup.

---

## 3. Location and timezone subsystem

- [x] Implement browser geolocation adapter
- [ ] Implement native Android/iOS location adapter
- [x] Support manual latitude/longitude entry
- [ ] Support manual city/location search
- [x] Support saved/favourite locations
- [x] Support current-location refresh
- [x] Handle denied-location-permission flow gracefully
- [x] Handle unavailable GPS/location services gracefully
- [x] Fall back to saved/manual location without breaking prayer calculations
- [x] Resolve coordinates to an IANA timezone
- [~] Cache timezone data for offline use
- [x] Use IANA timezone rules rather than deriving timezone from longitude
- [x] Correctly handle UTC offsets and daylight-saving changes
- [x] Avoid continuous GPS polling when not required
- [x] Avoid sending precise location to remote services unless required and explicitly disclosed

**Saved-location verification note (2026-08-16):** read-only Quality Gate run `31905379677` passed the versioned saved-location store and tests, and implementation Quality Gate run `31905467110` passed formatting, typed lint, strict typecheck, all tests and production build after the UI integration. The web shell now stores validated favourites locally in a separate versioned library, supports labelled save/update/remove operations, and lets a user select a favourite to immediately update coordinates and recompute timezone/prayer data. Corrupt saved location data fails closed to an empty library; no remote service is required. Manual city-name search and native mobile location adapters remain open.

**Stage 3 verification note (2026-08-16):** read-only Quality Gate run `31900763989` passed the location/timezone core with a clean lockfile install, formatting, typed lint, strict typecheck, unit/integration tests and production build. The verified core includes validated manual coordinates, one-shot browser geolocation with typed failure states, bundled offline coordinate-to-IANA lookup, IANA/`Intl` DST offset resolution, exact 2026 Sydney and London DST transition tests, local civil-date resolution and the location → timezone → prayer-engine integration path. Saved locations, city search, native mobile adapters, persistent timezone caching/override and UI permission/fallback flows remain open.

---

## 4. Gregorian and Hijri calendar subsystem

- [x] Display Gregorian date
- [x] Implement Hijri date support
- [x] Support Umm al-Qura / selected calculated Hijri calendar where platform/runtime permits
- [x] Clearly identify whether Hijri date is calculated or based on a selected calendar convention
- [x] Allow manual Hijri day correction (for example ±1/±2 days)
- [x] Test Hijri month boundaries
- [x] Test Hijri year boundaries
- [x] Test Ramadan boundary behaviour
- [x] Ensure date changes update without requiring app restart

**Stage 4 verification note (2026-08-16):** read-only Quality Gate run `31901367515` passed the Gregorian/Hijri domain core after canonical formatting, including typed lint, strict typecheck, calendar unit tests and production build. The verified core derives Gregorian parts from the already-resolved local civil date, supports runtime `islamic-umalqura` with explicit `runtime-intl-calendar` provenance, applies only explicit integer Hijri corrections from -2 through +2 days, and tests Hijri month/year transitions plus entry into Ramadan. UI rendering, locale-specific presentation and live date rollover remain open.

---

## 5. Local mosque timetable system

### 5.1 Source modes

- [x] Implement `Calculated` prayer-time source mode
- [x] Implement `Local Mosque` timetable source mode
- [x] Implement `Calculated + Adjustments` source mode
- [x] Show active source/provenance clearly in the UI

### 5.2 Timetable management

- [~] Support manual mosque timetable entry
- [x] Support CSV timetable import
- [x] Define and document CSV schema
- [x] Ship sample timetable file
- [x] Support JSON import/export
- [x] Validate imported timetable data before activation
- [x] Preserve mosque timetable offline
- [ ] Research optional reputable mosque APIs/integrations
- [x] Do not rely on fragile arbitrary website scraping as an authoritative source

**Mosque-library verification note (2026-08-16):** implementation Quality Gate run `31905789616` passed formatting, typed lint, strict typecheck, all tests and production build for the local mosque manager. Read-only Quality Gate run `31907837879` then passed after duplicate-state cleanup, duplicate-translation cleanup and restoration of the stricter persisted-timetable parser. The settings panel now stores multiple validated mosque timetables locally, imports documented CSV or JSON data through the existing strict parser, lets the user select or remove a mosque, and automatically activates the selected timetable as the local-mosque prayer source. Persisted library entries are revalidated through the strict timetable parser before use. Manual per-day timetable editing and optional vetted remote integrations remain open.

### 5.3 Salah start vs Iqamah/Jama'ah

- [x] Model prayer-start time separately from Iqamah/Jama'ah time
- [x] Support fixed Iqamah time
- [x] Support Iqamah as `prayer start + N minutes`
- [x] Support timetable-provided Iqamah times
- [x] Clearly distinguish Adhan/start and Iqamah on smart displays

### 5.4 Jumu'ah

- [x] Detect Friday and support Jumu'ah presentation
- [x] Support one or multiple Jumu'ah sessions
- [x] Store Khutbah/Jumu'ah times independently of astronomical Dhuhr
- [x] Allow mosque-specific Friday configuration

**Source-presentation verification note (2026-08-16):** Quality Gate run `31905085674` passed formatting, typed lint, strict typecheck, source-domain tests and production build after integrating selected prayer sources. The dashboard now resolves calculated, calculated-with-adjustments and local-mosque modes explicitly; local-mosque mode replaces obligatory start times without silent calculated fallback, recomputes next-prayer/countdown from mosque times, shows configured Iqamah separately from prayer start and presents Friday Jumu'ah sessions. The source selector is disabled for local-mosque mode until a validated persisted timetable exists. Multiple saved mosques and a dedicated mosque picker remain open, so the combined mosque/source settings item remains partial.

**Stage 5 verification note (2026-08-16):** read-only Quality Gate run `31901969127` passed formatting, typed lint, strict typecheck, the complete timetable/import suite and production build. The verified offline domain core implements explicit calculated/local-mosque/calculated-adjustments source modes, rejects silent source fallback, separates prayer start from fixed or +N Iqamah, supports one or multiple Friday Jumu'ah sessions independent of Dhuhr, and performs strict CSV plus runtime-structurally-validated JSON import/export. The CSV schema and sample are documented in `docs/MOSQUE_TIMETABLE.md` and `examples/mosque-timetable.csv`. Persistent local storage, UI entry/presentation and vetted optional remote integrations remain open.

---

## 6. Internationalisation, Arabic and RTL

- [x] Build localisation framework from the beginning
- [x] English translation complete
- [x] Arabic translation complete
- [x] Enable `dir="rtl"` correctly for Arabic
- [~] Verify mixed Arabic/Latin text rendering
- [x] Verify Arabic numerals/date/time formatting choices
- [x] Ensure prayer names have correct Arabic forms
- [x] Keep all user-facing text out of hard-coded components
- [x] Design translation structure for additional languages later
- [~] Test RTL at every major breakpoint

**Stage 6 verification note (2026-08-16):** read-only Quality Gate run `31902384992` passed formatting, typed lint, strict typecheck, the complete unit suite and production build. The current shared shell now uses a statically typed English/Arabic catalogue, runtime locale switching, Arabic prayer names, document `lang`/`dir` updates, RTL-safe logical CSS and locale-aware time/Gregorian-date helpers. All user-facing prose in the current `App` shell is catalogue-backed. Full visual RTL validation across phone, tablet, Raspberry Pi and kiosk breakpoints remains open until those responsive layouts and the visual suite exist.

---

## 7. Core UI / UX

### 7.1 Shared prayer dashboard

- [x] Current local time
- [x] Gregorian date
- [x] Hijri date
- [x] Current location / selected mosque
- [x] Today's five prayer times
- [x] Sunrise as supplementary information
- [x] Next-prayer indicator
- [x] Live next-prayer countdown
- [~] Highlight current/next prayer
- [x] Calculation method/source indicator
- [x] Iqamah time where configured
- [~] High-latitude/manual-adjustment indicator when applicable

### 7.2 Responsive layouts

- [~] Phone portrait layout
- [~] Phone landscape layout
- [~] Tablet layout
- [~] Raspberry Pi Touch Display 2 first-class layout
- [~] 1920×1080 TV/kiosk layout
- [~] Large-format display layout
- [x] Avoid separate duplicated application logic for each form factor

### 7.3 Themes and accessibility

- [~] Light theme
- [~] Dark theme
- [~] Follow-system theme
- [~] High-contrast readable typography
- [x] Scalable text
- [x] Keyboard navigation
- [x] Touch-friendly controls
- [x] Appropriate semantic/ARIA roles on web targets
- [x] Visible focus state
- [x] Respect reduced-motion preference where applicable

**Stage 7 dashboard verification note (2026-08-16):** read-only Quality Gate run `31903663678` passed formatting, typed lint, strict typecheck, the expanded dashboard/localisation tests and production build. The shared web shell now accepts one-shot browser location or validated manual coordinates, resolves the IANA timezone locally, refreshes the live clock every second, recomputes Gregorian/Hijri dates and today/tomorrow prayer schedules from shared domain logic, shows the five prayers plus Sunrise, identifies the next prayer, runs a live countdown and exposes calculation source/method. The responsive CSS uses one shared application model across phone/tablet/display widths with keyboard focus, touch-sized controls, ARIA status/error regions and reduced-motion handling. Mosque selection/Iqamah presentation, current-prayer highlighting, persistent saved locations, themes and visual regression on physical target displays remain open.

- [ ] Validate TV readability from several metres away

---

## 8. Android application

- [ ] Configure Android project/shell
- [ ] Implement native location permissions
- [ ] Implement persistent settings/storage
- [ ] Implement local prayer notifications
- [ ] Implement Android exact-alarm strategy where permitted and required
- [ ] Handle Android battery optimisation/background restrictions honestly
- [ ] Implement Adhan playback policy compatible with Android lifecycle constraints
- [ ] Handle notification permission versions correctly
- [ ] Test offline cold start
- [ ] Test orientation changes
- [ ] Build signed/release-ready configuration without committing secrets
- [ ] Run on real Android device or emulator and record evidence

---

## 9. iOS / iPadOS application

- [ ] Configure iOS project/shell
- [ ] Implement location permission descriptions and flow
- [ ] Implement persistent settings/storage
- [ ] Implement local prayer notifications within iOS scheduling limits
- [ ] Implement Adhan/notification audio within Apple platform restrictions
- [ ] Handle background execution limitations explicitly
- [ ] Test iPhone responsive layout
- [ ] Test iPad responsive layout
- [ ] Test offline cold start
- [ ] Prepare signing/build documentation without committing credentials
- [ ] Run on simulator/device when macOS/Xcode environment is available
- [ ] Document untested iOS items honestly when unavailable on development host

---

## 10. Notifications and Adhan

- [~] Per-prayer notification enable/disable
- [~] Reminder N minutes before prayer
- [~] Prayer-time notification
- [~] Per-prayer sound choice
- [~] Vibration option where supported
- [~] Adhan enable/disable
- [ ] User-selectable/local Adhan audio
- [ ] Do not bundle copyrighted Adhan recordings without suitable rights
- [~] Reschedule notifications after timezone/location/method changes
- [ ] Reschedule notifications after device reboot where platform requires it
- [~] Reschedule future prayer notifications at date rollover
- [~] Prevent duplicate notifications
- [~] Test notification behaviour across DST transition
- [ ] Document platform-specific limitations instead of promising impossible exact behaviour

**Notification scheduler-adapter verification note (2026-08-16):** read-only Quality Gate run `31910761615` passed formatting, typed lint, strict typecheck, all tests and production build for the platform-neutral scheduling contract. The shared executor now lists installed notification records, reconciles them against exact resolved intents, cancels stale records before replacement, applies new records, treats a second identical application as a no-op, and removes installed jobs that become invalid because their local wall-clock time falls in a DST gap. Conflicting records sharing one stable id are rejected. Real platform adapters, permission/background constraints and reboot persistence remain open, so delivery-related tracker statuses remain partial.

**Notification-DST verification note (2026-08-16):** read-only Quality Gate run `31910410104` passed formatting, typed lint, strict typecheck, all tests and production build for IANA wall-clock-to-instant resolution. The scheduling domain now resolves notification civil times against the selected IANA timezone, including Sydney and London DST transitions. Repeated wall-clock times are represented explicitly and notification scheduling chooses the earlier occurrence deterministically; nonexistent spring-forward times are skipped rather than silently shifted or fabricated. Actual platform notification delivery across DST has not yet been exercised, so the delivery-level DST tracker item remains partial.

**Notification-schedule verification note (2026-08-16):** implementation Quality Gate run `31908783069` passed formatting, typed lint, strict typecheck, all tests and production build for the deterministic scheduling core. The domain now builds stable per-date/per-prayer reminder, prayer-time and Adhan intents; normalizes reminders that fall on the prior civil date; deduplicates repeated inputs; and reconciles an installed schedule against recalculated desired jobs with explicit cancellation and replacement sets. Tests cover changed prayer times, date rollover, duplicate input and no-op reconciliation. No platform scheduler consumes these intents yet, so rescheduling and duplicate prevention remain partial. Reboot recovery, timezone-to-instant/DST delivery validation and permission/background handling remain open.

**Notification-preferences verification note (2026-08-16):** read-only Quality Gate run `31908401807` passed the notification preference domain and settings-schema v2 migration, and implementation Quality Gate run `31908480344` passed formatting, typed lint, strict typecheck, all tests and production build after the settings UI integration. Each obligatory prayer now has locally persisted enable, 1–180 minute reminder, prayer-time alert, default/silent sound, vibration and Adhan-enable preferences. Existing v1 settings migrate to v2 without losing location, calculation or mosque configuration. No platform notification scheduler, permission request or Adhan audio delivery is implemented yet, so delivery-related tracker items remain partial rather than complete.

---

## 11. Raspberry Pi Touch Display 2

- [ ] Research and document Raspberry Pi Touch Display 2 resolution/orientation constraints
- [ ] Build touch-first layout fixture for the display
- [ ] Provide Raspberry Pi OS installation instructions
- [ ] Provide one-command or simple launcher script
- [ ] Provide optional automatic launch on boot
- [ ] Implement Chromium/full-screen kiosk mode where applicable
- [ ] Persist settings across restart
- [ ] Operate without internet after initial configuration
- [ ] Recover gracefully when network disappears
- [ ] Recover after system suspend/reboot
- [ ] Prevent display from getting stuck on yesterday's prayer schedule
- [ ] Test on physical Raspberry Pi / Touch Display 2 when available

---

## 12. TV and kiosk display mode

- [ ] Create dedicated smart-display mode using shared app logic
- [ ] Large current clock
- [ ] Large next-prayer countdown
- [ ] Five-prayer timetable visible at a glance
- [ ] Iqamah/Jama'ah display where configured
- [ ] Jumu'ah display on Fridays
- [ ] Current/next-prayer highlighting
- [ ] Full-screen/kiosk operation
- [ ] Automatic daily schedule rollover
- [ ] Automatic timezone/DST update
- [ ] Sleep/wake recovery
- [ ] Burn-in-conscious layout behaviour where practical
- [ ] Remote-control/keyboard navigation where practical
- [ ] Document supported TV deployment paths rather than claiming unsupported native platforms

---

## 13. Offline-first / PWA capability

- [x] Create web app manifest
- [~] Add installable PWA icons/assets
- [x] Implement service worker/static application shell caching
- [x] Keep prayer calculation engine fully local/offline
- [x] Persist selected location/timezone/calculation settings locally
- [x] Persist mosque timetable locally
- [x] Provide clear online/offline state only where relevant
- [~] Verify app remains useful with internet disabled
- [~] Test offline page reload
- [~] Test cache/version migration after app upgrade

**Offline/persistence verification note (2026-08-16):** read-only Quality Gate run `31904178200` passed formatting, typed lint, strict typecheck, the complete unit/integration suite and production build. The web build now has a manifest, first-party SVG icon assets, a production-only same-origin service worker, a localised offline indicator and a versioned local settings envelope. The current UI restores/persists locale and selected coordinates; the same validated envelope stores timezone, calculation method, Asr convention, high-latitude rule, Hijri correction, time format, prayer adjustments, source mode and mosque timetable. Tests cover full settings round-trip, legacy migration, future-version rejection, corrupt-storage fallback, invalid nested location/timetable rejection and propagation of stored calculation choices into the dashboard. A real-browser install/disconnect/reload test and two-version cache-upgrade test remain open; SVG icons also remain partial until platform-specific raster install assets are added and validated.

---

## 14. Settings and persistent configuration

- [x] Calculation method selector
- [x] Asr method selector
- [x] High-latitude rule selector
- [x] Manual prayer offsets
- [x] Location selector
- [x] Mosque/source selector
- [x] Hijri correction
- [x] Language selector
- [x] Theme selector
- [x] Time format (12/24-hour)
- [~] Per-prayer notifications
- [~] Adhan settings
- [ ] Iqamah settings
- [x] Export settings
- [x] Import settings
- [x] Reset to defaults
- [x] Version/migration system for persisted configuration

**Settings-controls verification note (2026-08-16):** read-only Quality Gate run `31904751213` passed formatting, typed lint, strict typecheck, the complete unit/integration suite and production build. The settings panel now exposes calculation method, Asr convention, high-latitude rule, per-prayer minute offsets, Hijri correction, language, 12/24-hour time format and system/light/dark theme controls. Settings export, validated import and reset-to-defaults are wired to the versioned persistence core. Method/Asr changes feed the shared dashboard model immediately, and persistence no longer rewrites local storage on each one-second clock refresh. Theme controls are functional, while visual validation of light/dark/system appearance remains partial.

---

## 15. Runtime reliability

- [x] Recompute prayer schedule when local date changes
- [x] Recompute after location change
- [x] Recompute after calculation-method change
- [x] Recompute after Asr-method change
- [x] Recompute after timezone/DST change
- [ ] Re-sync clock/countdown after app resumes from background
- [ ] Recover correctly after system sleep/wake
- [ ] Detect significant system-clock changes
- [x] Avoid countdown drift from long-running intervals
- [ ] Handle invalid system time gracefully
- [ ] Handle unavailable calculation results gracefully
- [ ] Add structured error logging without exposing private location unnecessarily

---

## 16. Privacy and security

- [ ] Document threat/privacy model
- [ ] Minimise collection of precise location data
- [x] Keep prayer calculations local by default
- [x] No mandatory account for core prayer-time functionality
- [x] No unnecessary analytics/telemetry
- [x] Obtain explicit permission before using location
- [ ] Secure any optional remote API calls
- [ ] Do not commit secrets/API keys
- [ ] Dependency vulnerability review
- [ ] Content Security Policy for web/PWA where applicable
- [x] Validate imported CSV/JSON data safely
- [ ] Review native permissions and remove unnecessary ones

---

## 17. Automated test suite

### Unit tests

- [x] Solar/astronomical math tests
- [x] Prayer-engine tests
- [x] Calculation-method tests
- [x] Asr-method tests
- [x] High-latitude tests
- [x] Rounding tests
- [x] Adjustment tests
- [x] Next-prayer tests
- [x] Timezone/DST tests
- [x] Hijri-date tests
- [x] Mosque timetable tests
- [x] CSV/JSON import/export tests
- [x] Iqamah-rule tests
- [x] Settings persistence/migration tests

### Integration tests

- [x] Location → timezone → prayer calculation flow
- [x] Mosque source-selection isolation
- [ ] Settings → recalculation flow
- [ ] Date rollover flow
- [ ] Notification scheduling flow
- [ ] Offline startup flow

### UI / visual regression

- [ ] Phone portrait — English/light
- [~] Phone portrait — Arabic/RTL/dark
- [ ] Phone landscape
- [ ] Tablet
- [ ] Raspberry Pi Touch Display 2
- [ ] 1080p kiosk
- [ ] Verify no clipping/overflow
- [~] Verify Arabic/RTL alignment
- [ ] Verify scalable text/accessibility
- [ ] Save screenshots/artifacts in CI where practical

---

## 18. Quality gates

- [x] Formatter clean
- [x] Linter clean
- [x] Strict typecheck clean
- [x] Unit tests green
- [x] Integration tests green
- [ ] UI/component tests green
- [x] Production web build succeeds
- [ ] Android build succeeds where SDK is available
- [ ] iOS build succeeds where Xcode is available
- [ ] Raspberry Pi/kiosk deployment script validated
- [x] No unexplained widened test tolerances
- [x] No disabled failing tests without documented blocker
- [x] No placeholder implementation marked complete
- [ ] Final dependency/license review

---

## 19. Documentation and deployment

- [~] Expand `README.md` with screenshots, features and platform status
- [ ] Create `BUILD.md`
- [ ] Document web/PWA build and deployment
- [ ] Document Android build/install
- [ ] Document iOS build/install
- [ ] Document Raspberry Pi Touch Display 2 setup
- [ ] Document TV/kiosk deployment
- [x] Document prayer calculation methods and references
- [x] Document privacy behaviour
- [x] Document mosque timetable import format
- [ ] Document notification platform limitations
- [ ] Add troubleshooting section
- [x] Add contributor/development setup instructions

---

## 20. Final verification / release readiness

- [ ] Run clean install from lockfile
- [ ] Run complete test suite from a clean checkout
- [ ] Run lint + typecheck + production build
- [ ] Run prayer-time parity/reference suite
- [ ] Run DST/high-latitude regression suite
- [ ] Run English + Arabic/RTL visual suite
- [ ] Validate offline operation
- [ ] Validate phone layout
- [ ] Validate Raspberry Pi layout
- [ ] Validate TV/kiosk layout
- [ ] Validate Android notifications on supported test environment
- [ ] Validate iOS notifications on supported test environment
- [ ] Perform fresh final code review
- [ ] Review all `[!]` blocked items and document reasons
- [ ] Ensure `TODO.md`, `DESIGN.md`, `RESEARCH.md` and `TESTING.md` reflect actual state
- [ ] Create release notes
- [ ] Tag first release only after applicable quality gates are satisfied

---

## 21. Phase 2 / future roadmap

- [ ] Qibla bearing from current coordinates
- [ ] Device compass integration where supported
- [ ] Ramadan mode
- [ ] Suhur/Imsak and Iftar presentation
- [ ] Taraweeh timetable support
- [ ] Mosque announcements/events
- [ ] Configurable smart-display themes
- [ ] Multiple mosque profiles
- [ ] Remote administration for managed mosque displays
- [ ] Home Assistant integration
- [ ] Optional local network API for smart-home/display integration
- [ ] Calendar integrations
- [ ] Wearable/watch companion exploration
- [ ] Additional languages

---

## Definition of Done for SalahOS v1

SalahOS v1 must not be declared complete until the following are true:

- [x] Accurate five-prayer calculation engine is independently testable
- [~] Major recognised calculation methods are implemented and documented
- [x] Standard/Shafi'i-family and Hanafi Asr calculations are validated
- [~] High-latitude handling is implemented and transparent
- [~] Local mosque timetable mode works offline
- [x] Prayer-start and Iqamah/Jama'ah times are distinct
- [~] Jumu'ah timetable support is functional
- [~] GPS/manual location and timezone handling work correctly
- [~] DST/date rollover behaviour is tested
- [~] Gregorian and Hijri dates work
- [~] English and Arabic/RTL are production-ready
- [ ] Mobile, Raspberry Pi and TV/kiosk layouts are validated
- [ ] Offline prayer calculation is fully functional
- [ ] Notifications/Adhan work on supported platforms within platform restrictions
- [ ] Automated quality gates pass
- [ ] Actual tested platform/build matrix is documented without overclaiming
- [ ] Final code review and regression pass are complete
