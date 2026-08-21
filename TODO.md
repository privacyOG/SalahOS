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
- [x] Calculate and display Sunrise separately from the five obligatory prayers

**Sunrise supplementary verification note (2026-08-16):** read-only Quality Gate run `31912253750` passed formatting, typed lint, strict typecheck, all tests and production build after formalising the presentation role. The shared dashboard already calculates and exposes Sunrise as a sixth row between Fajr and Dhuhr, while next/current prayer selection remains restricted to the five obligatory prayers. The shared UI now derives supplementary styling from the tested presentation role rather than a component-local string check.

- [x] Add optional Imsak/Suhur cutoff support
- [x] Add optional Duha/Ishraq support
- [x] Add optional Islamic midnight calculation
- [x] Add optional last-third-of-the-night calculation

### 1.3 Calculation-method registry

- [x] Build an extensible calculation-method registry rather than hard-coding method logic throughout the engine
- [~] Record each method's Fajr angle, Isha angle/interval, Maghrib rule where applicable and authoritative source
- [x] Implement and verify Muslim World League method
- [x] Implement and verify Umm al-Qura / Makkah method
- [x] Implement and verify Egyptian method
- [x] Implement and verify University of Islamic Sciences, Karachi method
- [x] Implement and verify ISNA method
- [~] Research and add other reputable regional methods where appropriate, including Diyanet/Turkey, MUIS/Singapore, Dubai, Kuwait and Qatar
- [x] Provide custom calculation parameters for advanced users where safe and clearly labelled
- [x] Never silently change an explicitly selected calculation method

**Method-registry reconciliation note (2026-08-17):** built-in numerical parameters remain centralized and cross-checked against pinned/reference sources. Exact canonical Adhan JS 4.4.4 output fixtures now verify MWL, Egyptian, ISNA, MUIS, Dubai and Karachi within the fixed two-minute model/rounding tolerance. The Turkey interoperability profile models the pinned canonical per-event offsets (Sunrise -7, Dhuhr +5, Asr +4, Maghrib +7) and passes its Istanbul fixture. Dubai now models its pinned canonical offsets (Sunrise -3, Dhuhr +3, Asr +3, Maghrib +3) and passes the frozen Dubai fixture whose upstream source cites the UAE Awqaf published timetable. Karachi now has a fixed six-event output captured independently from exact `adhan@4.4.4` and frozen into the suite. Diyanet remains `pending-authoritative-source` because canonical-library parity is not official institutional timetable certification; Dubai output parity likewise does not establish that the authority internally uses the same simplified parameter model.

### 1.4 Madhhab / Asr calculation

- [x] Implement Standard Asr shadow factor (Shafi'i, Maliki and Hanbali convention)
- [x] Implement Hanafi Asr shadow factor
- [x] Set Shafi'i/Standard as initial default while allowing user selection
- [x] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI

**Asr convention explanation verification note (2026-08-16):** read-only Quality Gate run `31912659728` passed formatting, typed lint, strict typecheck, all tests and production build after adding bilingual explanatory copy while retaining the engine's precise Standard/Hanafi terminology. The presentation model records Standard as shadow factor 1 with Shafi'i, Maliki and Hanbali association, and Hanafi as shadow factor 2. The settings UI explains both factors and that each includes the noon shadow.

- [x] Add unit tests proving both shadow-factor branches differ correctly

### 1.5 High-latitude handling

- [x] Implement Middle of the Night rule
- [x] Implement One-Seventh of the Night rule
- [x] Implement Angle-Based portion-of-night rule
- [x] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions

**Polar-resolution research note (2026-08-16):** read-only Quality Gate run `31915439365` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/POLAR_RESOLUTION_RESEARCH.md`. The research separates high-latitude night-fraction rules from true polar-circle resolution, documents Aqrab al-Bilad (nearest location/latitude) and Aqrab al-Ayyam (nearest valid day), and retains `unresolved` as the safe default. Any future polar estimation must be explicit, preserve the actual observer location/date, record the borrowed reference latitude or date in provenance, and never silently claim that an estimated event was astronomical at the observer's location.

- [x] Define behaviour for polar day and polar night when normal astronomical events are unavailable
- [x] Never fabricate an astronomical event without identifying the applied fallback rule
- [x] Surface active high-latitude rule in calculation provenance/settings

**High-latitude indicator verification note (2026-08-16):** read-only Quality Gate run `31911591791` passed formatting, typed lint, strict typecheck, all tests and production build after adding source-aware fallback indicators. Prayer cards now identify when the displayed calculated time actually used a high-latitude fallback and name the active rule (Angle Based, Middle of the Night or One Seventh). Mosque-provided obligatory start times suppress calculated fallback badges because those values are replaced by the timetable, while calculated Sunrise remains eligible. The shared provenance note uses the same source-aware rule. Nearest-latitude/nearest-valid-day research was still open at this verification point.

### 1.6 Manual adjustments

- [x] Support per-prayer minute offsets
- [x] Keep adjustments separate from the underlying astronomical result
- [x] Show when a displayed time contains a manual adjustment
- [x] Allow reset-to-method-default

**Manual-adjustment verification note (2026-08-16):** implementation Quality Gate run `31911208279` passed formatting, typed lint, strict typecheck, all tests and production build after integrating source-aware adjustment indicators and reset controls. Prayer cards now show the signed offset only when the displayed calculated time actually contains that adjustment; mosque-provided obligatory start times do not inherit a false badge, while calculated Sunrise remains correctly eligible in local-mosque mode. The dedicated reset clears only prayer offsets, returning displayed calculated times to the selected method defaults without resetting the selected method, location, mosque or other settings.

**Stage 1 engine verification note (2026-08-16):** read-only Quality Gate run `31891501691` completed successfully after the expanded engine tests. The suite verifies five-prayer ordering, Standard/Hanafi Asr divergence, raw/base/adjusted/rounded separation, fixed-interval Isha, all three implemented high-latitude strategies, polar unavailability without fabricated events, and adjustment-range validation. Read-only Quality Gate run `31899800537` additionally verified explicit Imsak/Ishraq offsets, Islamic midnight, last-third calculations, next-obligatory-prayer selection and Isha → tomorrow Fajr rollover. Reference-parity evidence is recorded separately below.

---

## 2. Prayer-calculation validation and reference parity

- [x] Archive or pin the canonical reference implementation used for algorithm comparison
- [x] Create independent cross-check dataset instead of treating one online API as absolute ground truth
- [x] Compare against canonical calculation implementation
- [x] Compare against AlAdhan or another reputable independent calculator as a secondary cross-check
- [x] Compare against authoritative published timetables where practical
- [x] Record rounding, offsets and methodology differences instead of forcing false parity

**Stage 2 reconciliation note (2026-08-17):** Adhan JS `4.4.4` remains pinned at commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`; PrayTimes and AlAdhan remain independent cross-checks in `docs/PRAYER_METHOD_REFERENCES.md`. PR #93 added frozen direct canonical output fixtures for ISNA/North America, Muslim World League, Egyptian, Turkey interoperability and MUIS/Singapore. PR #95 added Dubai output parity using the pinned fixture whose upstream source cites UAE Awqaf, and PR #96 added a Karachi six-event fixture generated independently from exact `adhan@4.4.4`. All direct fixtures compare all six displayed daily events at the unchanged two-minute tolerance. Exact PR heads passed EVO-X2 Quality Gate and Android Build: #93 `c41a845dc38d6c604045abdf2588be16081b95b5` (`31992557611`, `31992557906`), #95 `d1468ea5448659cad1d68075db94b8eb5283741c` (`31993099243`, `31993099235`), and #96 `cc1d6e785f4607e718c5eb73ceee61e1f917b0a7` (`31993328375`, `31993328633`). Earlier external timetable parity fixtures remain valid for Makkah/Umm al-Qura, Singapore/MUIS, Doha/Qatar and Kuwait City/Kuwait. Direct canonical implementation comparison is complete for the defined frozen v1 reference set; institutional certification remains separately tracked where applicable.

### Geographic test matrix

- [x] Makkah
- [x] Madinah
- [x] Sydney
- [x] Melbourne
- [x] Cairo
- [x] Istanbul
- [x] Karachi
- [x] Jakarta
- [x] Singapore
- [x] London
- [x] New York
- [x] Oslo
- [x] Tromsø
- [x] Equatorial location
- [x] Northern-hemisphere location
- [x] Southern-hemisphere location

**Geographic matrix verification note (2026-08-16):** read-only Quality Gate run `31914980103` passed formatting, typed lint, strict typecheck, all tests and production build after expanding the production location → IANA timezone → prayer-calculation integration matrix. March-equinox fixtures now cover Sydney, Melbourne, Cairo, Istanbul, Karachi, Jakarta, London, New York, Oslo and Quito, assert the expected offline-resolved IANA timezone and UTC offset, and verify all six displayed prayer/sunrise times are available and strictly ordered. The matrix also explicitly covers northern, southern and equatorial latitude bands. Madinah, Tromsø and the extreme high-latitude seasonal cases remain open.

- [x] Extreme high-latitude summer case
- [x] Extreme high-latitude winter case

**Madinah/Tromsø geographic verification note (2026-08-16):** read-only Quality Gate run `31915190467` passed formatting, typed lint, strict typecheck, all tests and production build. Madinah resolves through the offline IANA lookup to `Asia/Riyadh` at UTC+03 and produces an ordered equinox prayer schedule. Tromsø resolves to `Europe/Oslo` with UTC+02 in summer and UTC+01 in winter. The polar-summer fixture deliberately leaves Fajr, Sunrise, Maghrib and Isha unavailable rather than fabricating events, while the polar-winter fixture leaves unavailable Sunrise and sunset-based Maghrib explicitly unavailable; neither case falsely reports a high-latitude fallback when the prerequisite night bounds do not exist.

### Date/time edge cases

- [x] DST start transition
- [x] DST end transition
- [x] Leap year
- [x] Gregorian year boundary
- [x] Local midnight rollover

**Calendar edge-case verification note (2026-08-16):** read-only Quality Gate run `31914501854` passed formatting, typed lint, strict typecheck, all tests and production build. Gregorian calendar tests now verify 2024-02-29 and the following March 1 civil date, plus consecutive 2026-12-31/2027-01-01 year-boundary dates. The production IANA location context is also tested across Sydney local midnight, proving the resolved civil date changes from 2026-08-16 to 2026-08-17 exactly between 23:59:59 and 00:00:00 local time.

- [x] Next-prayer calculation after Isha → tomorrow's Fajr
- [x] Timezone-offset changes
- [x] Southern-hemisphere DST direction
- [x] Device clock correction while app is running
- [x] System suspend/resume recovery

**Runtime-refresh verification note (2026-08-16):** implementation Quality Gate run `31908092487` passed formatting, typed lint, strict typecheck, all tests and production build after adding the runtime refresh adapter. The shared shell continues to sample a fresh system `Date` every second, so a device-clock correction is absorbed on the next tick, and it now also refreshes immediately on window focus, restored-page (`pageshow`) and document visibility changes. Unit tests verify all three recovery events and complete listener cleanup.

---

## 3. Location and timezone subsystem

- [x] Implement browser geolocation adapter
- [x] Implement native Android/iOS location adapter

**Native mobile location reconciliation note (2026-08-17):** `src/platform/currentLocation.ts` routes every Capacitor native platform through the first-party native geolocation bridge with explicit foreground permission checks/requests and coordinate-only retention. Android native-foundation validation passed Quality Gate `31935517985` and Android Build `31935517977`; the later iOS native consolidation passed Xcode Simulator builds including `31942088604`. The previous partial marker predated the completed iOS shell and is corrected here without claiming physical-device GPS acceptance.

- [x] Support manual latitude/longitude entry
- [x] Support manual city/location search

**Manual location-search verification note (2026-08-16):** read-only Quality Gate run `31924790649` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 231 tests and production build after adding a fully local city/location search path. The app vendors the IANA tzdb 2026c `zone1970.tab` principal-location catalogue at development time, searches more than 300 representative locations locally by city, country, ISO country code, timezone and comments, and never sends the user's query to a remote service. Selecting a result supplies validated representative coordinates to the existing local timezone/prayer-calculation pipeline; integration coverage verifies a Sydney search resolves through the production dashboard as `Australia/Sydney`. English and Arabic UI text explicitly identifies the catalogue as offline/local. Native mobile location adapters and persistent timezone-cache work remain separately open.

- [x] Support saved/favourite locations
- [x] Support current-location refresh
- [x] Handle denied-location-permission flow gracefully
- [x] Handle unavailable GPS/location services gracefully
- [x] Fall back to saved/manual location without breaking prayer calculations
- [x] Resolve coordinates to an IANA timezone
- [x] Cache timezone data for offline use

**Timezone-cache verification note (2026-08-16):** read-only Quality Gate run `31925162040` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after completing the persisted timezone path. Resolved IANA timezone identifiers are already stored with the local persisted location and saved favourites; the production dashboard now consumes that validated cached timezone on startup, imported settings, saved-location selection and offline city/location selection instead of discarding it and re-resolving coordinates. Fresh browser GPS and raw manual-coordinate changes deliberately clear the cache so the bundled offline coordinate resolver recalculates the timezone. Persisted and saved timezone strings are validated through the IANA timezone assertion before runtime use, and integration coverage proves the restored cached zone controls production dashboard civil time/offset.

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

- [x] Support manual mosque timetable entry

**Manual mosque-entry verification note (2026-08-16):** read-only Quality Gate run `31916508659` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `3d50f0204b7a2162ab92af891467852364ff1f48`. The settings UI now supports bilingual manual entry of one Gregorian timetable day with all five obligatory prayer start times and optional fixed Iqamah times. Inputs use strict 24-hour `HH:MM` validation, saved days are upserted into the existing validated offline mosque library, replacing only the same mosque/date when edited, and the saved timetable is immediately selected as the local-mosque source. The implementation reuses the existing persisted timetable format rather than introducing a parallel manual-only storage model.

- [x] Support CSV timetable import
- [x] Define and document CSV schema
- [x] Ship sample timetable file
- [x] Support JSON import/export
- [x] Validate imported timetable data before activation
- [x] Preserve mosque timetable offline
- [x] Research optional reputable mosque APIs/integrations

**Mosque-integration research note (2026-08-16):** read-only Quality Gate run `31916720065` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/MOSQUE_INTEGRATION_RESEARCH.md`. MAWAQIT is recorded as a vetted future direct-integration candidate because its provider-maintained ecosystem exposes account-based nearby-mosque selection plus prayer, Iqamah, Shuruq and Jumu'ah data, but direct SalahOS network support remains gated on a documented or explicitly authorized provider contract. Masjidbox explicitly provides no public prayer-times API, so its approved integration paths are its provider-supported iCal and CSV/Excel portability mechanisms rather than scraping or private-endpoint dependencies. No remote provider adapter is marked implemented by this research.

- [x] Do not rely on fragile arbitrary website scraping as an authoritative source

**Mosque-library verification note (2026-08-16):** implementation Quality Gate run `31905789616` passed formatting, typed lint, strict typecheck, all tests and production build for the local mosque manager. Read-only Quality Gate run `31907837879` then passed after duplicate-state cleanup, duplicate-translation cleanup and restoration of the stricter persisted-timetable parser. The settings panel now stores multiple validated mosque timetables locally, imports documented CSV or JSON data through the existing strict parser, lets the user select or remove a mosque, and automatically activates the selected timetable as the local-mosque prayer source. Persisted library entries are revalidated through the strict timetable parser before use. Manual per-day timetable editing was still open at this verification point; optional vetted remote integrations remain open.

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
- [x] Verify mixed Arabic/Latin text rendering

**Mixed-direction text verification note (2026-08-16):** read-only Quality Gate run `31917001417` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `11a0459595e36c7981ccbe72c133b92ec5d3ce67`. Dynamic user/provider values that can contain Arabic, Latin text, identifiers or numerals now use automatic bidirectional isolation: rendered method names, timezone identifiers, mosque names and Jumu'ah labels are wrapped in semantic `<bdi dir="auto">`, while editable/selectable saved-location, method and mosque values use `dir="auto"`. Static-render tests verify mixed Arabic/Latin text and `Australia/Sydney` identifiers produce isolated markup without forcing the surrounding page direction. Full visual RTL verification across every major breakpoint remains a separate partial item.

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
- [x] Highlight current/next prayer

**Current/next prayer verification note (2026-08-16):** read-only Quality Gate run `31911967092` passed formatting, typed lint, strict typecheck, all tests and production build after adding selected-source current-prayer state. The dashboard now marks the latest entered obligatory prayer as current, keeps Sunrise supplementary, preserves Isha as current after Isha while next rolls to tomorrow Fajr, and reports no current prayer before the first available obligatory start of the civil day. Current and next use distinct visual labels/styles, and exact prayer-start boundaries advance next to the following obligatory prayer instead of marking one prayer as both current and next.

- [x] Calculation method/source indicator
- [x] Iqamah time where configured
- [x] High-latitude/manual-adjustment indicator when applicable

### 7.2 Responsive layouts

- [~] Phone portrait layout
- [~] Phone landscape layout
- [~] Tablet layout
- [~] Raspberry Pi Touch Display 2 first-class layout
- [~] 1920×1080 TV/kiosk layout
- [~] Large-format display layout
- [x] Avoid separate duplicated application logic for each form factor

### 7.3 Themes and accessibility

- [x] Light theme
- [x] Dark theme
- [x] Follow-system theme

**Runtime theme verification note (2026-08-16):** read-only Quality Gate run `31912934726` passed formatting, typed lint, strict typecheck, all tests and production build after adding a runtime theme adapter. Explicit Light and Dark preferences apply immediately. Follow-system resolves the current operating-system color-scheme preference, listens for later changes, updates the effective document theme, and removes the listener when the mode changes or the application unmounts.

- [x] High-contrast readable typography

**Readable-typography verification note (2026-08-16):** read-only Quality Gate run `31917294038` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `c23c76db4ac07b5da9b3c3406b4d63c2cebb0c91`. Supporting labels, prayer-time captions, settings notes, notification labels and adjustment badges now use larger minimum text sizes with explicit readable line heights. Theme-specific hard-coded secondary text/border colors were replaced with semantic variables so light, dark and system themes remain consistent. `prefers-contrast: more` increases secondary-text contrast, structural border weight and removes supplementary-card fading, while `forced-colors: active` maps the interface to system colors instead of defeating operating-system high-contrast modes.

- [x] Scalable text
- [x] Keyboard navigation
- [x] Touch-friendly controls
- [x] Appropriate semantic/ARIA roles on web targets
- [x] Visible focus state
- [x] Respect reduced-motion preference where applicable

**Stage 7 dashboard verification note (2026-08-16):** read-only Quality Gate run `31903663678` passed formatting, typed lint, strict typecheck, the expanded dashboard/localisation tests and production build. The shared web shell now accepts one-shot browser location or validated manual coordinates, resolves the IANA timezone locally, refreshes the live clock every second, recomputes Gregorian/Hijri dates and today/tomorrow prayer schedules from shared domain logic, shows the five prayers plus Sunrise, identifies the next prayer, runs a live countdown and exposes calculation source/method. The responsive CSS uses one shared application model across phone/tablet/display widths with keyboard focus, touch-sized controls, ARIA status/error regions and reduced-motion handling. Mosque selection/Iqamah presentation, current-prayer highlighting, persistent saved locations, themes and visual regression on physical target displays remain open.

- [!] Validate TV readability from several metres away — requires physical display/viewing-distance acceptance

---

## 8. Android application

- [x] Configure Android project/shell
- [x] Implement native location permissions

**Android native-foundation verification note (2026-08-16):** the committed Capacitor Android project reuses the shared SalahOS application and prayer engine rather than duplicating prayer logic. The application location action now crosses a native-aware platform boundary: browser builds retain the existing one-shot browser adapter, while Android uses the first-party Capacitor geolocation bridge, explicitly checks/requests foreground permission, defaults to non-high-accuracy acquisition with a five-minute reusable-fix window, and discards native accuracy/altitude/heading/speed/timestamp metadata before retaining latitude/longitude. The Android manifest declares foreground `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` plus the generated Internet permission and does not request background location. Cleaned read-only Quality Gate run `31935517985` passed security, dependency/license, documentation, formatting, lint, strict typecheck, 59 test files / 273 tests, production Web/PWA build and artifact verification. Independent permanent Android Build run `31935517977` installed the committed lockfile on Ubuntu with Node 22 and Java 21, ran `npm run android:build`, synchronised the shared app into the native project and passed Gradle `assembleDebug`. `docs/ANDROID.md` records the local build/install path and explicit boundaries. Emulator/physical-device acceptance, persistent-storage device lifecycle, orientation acceptance, native notifications/Adhan, battery/background restrictions, release signing/distribution and all iOS native work remain open.

- [x] Implement persistent settings/storage
- [x] Implement local prayer notifications
- [x] Implement Android exact-alarm strategy where permitted and required

**Android exact-alarm verification note (2026-08-16):** the Android manifest declares user-managed `SCHEDULE_EXACT_ALARM` access. The native notification adapter checks the current exact-alarm setting without opening system settings automatically, reports exact versus inexact scheduling capability, and continues with an explicit inexact fallback when access is unavailable. The notification settings UI explains that Android may delay alerts while precise access is off and offers a user-initiated path to the system exact-alarm settings. Capability changes on return trigger notification reconciliation so current prayer jobs are rescheduled under the new precision state. Validation run `31938706626` passed the complete repository quality gate and Capacitor/Gradle Android debug assembly. Tests cover granted, denied/fallback, unsupported-target, explicit-settings-action and display-permission ordering behavior. Doze/idle delivery, battery optimisation, vendor restrictions, reboot recovery and physical/emulator timing evidence remain separately open.

- [x] Handle Android battery optimisation/background restrictions honestly

**Android background-restriction verification note (2026-08-16):** SalahOS now treats Android background delivery as conditional rather than guaranteed. Focus, restored-page and visible-document recovery use the existing tested runtime-refresh path to force native prayer-notification reconciliation after the app returns to the foreground. English and Arabic settings copy explicitly warns that Doze, Battery Saver and manufacturer background restrictions can delay alerts even when precise alarms are allowed, and states that SalahOS does not request an unrestricted battery-optimisation exemption. Validation run `31939465371` passed the complete repository quality gate and Capacitor/Gradle Android debug assembly. Physical-device Doze/vendor timing evidence remains part of the separate emulator/device acceptance item and is not claimed here.

- [x] Implement Adhan playback policy compatible with Android lifecycle constraints

**Android Adhan lifecycle-policy verification note (2026-08-16):** the Android runtime now has an executable Adhan delivery policy that distinguishes foreground, background and terminated lifecycle states. Scheduled Adhan jobs are explicitly notification alerts and persist that policy in SalahOS-owned native notification metadata; unrestricted full-recording auto-play is disabled in every state until a separate supported local-audio implementation exists. English and Arabic settings text now says "Adhan alert" rather than promising playback and explains that background/terminated full audio is not implemented. Validation run `31939789143` passed the complete repository quality gate and Capacitor/Gradle Android debug assembly. User-selectable/local Adhan audio remains open in Stage 10 and is not claimed by this item.

- [x] Handle notification permission versions correctly

**Android local-notification verification note (2026-08-16):** the committed Android shell now consumes the shared notification scheduling core through the first-party Capacitor Local Notifications bridge. The runtime builds obligatory-prayer inputs for today and tomorrow from the selected calculated or local-mosque source, resolves civil times through the selected IANA timezone, filters already-past deliveries, and reconciles pending native jobs whenever location coordinates, timezone/date, calculation settings, mosque timetable, prayer source, locale or notification preferences change. Android display permission is checked and requested only when future configured alerts require delivery; denial fails closed. SalahOS-owned pending jobs use deterministic positive 32-bit identifiers plus namespaced scheduler metadata, allowing stale jobs to be replaced or cancelled without adopting unrelated notifications. Silent and silent-with-vibration Android channels are configured explicitly; default-sound alerts retain platform-default channel behavior. Cleaned exact-head Quality Gate run `31936818278` passed the sensitive-file, vulnerability, license, documentation, icon, formatting, lint and strict-type gates, 61 test files / 280 tests, production Web/PWA build and deploy-artifact verification. Matching Android Build run `31936818319` passed lockfile install, Capacitor sync and Gradle `assembleDebug` on Node 22/Java 21. Exact-alarm permission/strategy, reboot rescheduling, battery/background acceptance, Adhan playback and emulator/physical-device delivery remain open and are not claimed by this item.

**Android persistent-storage verification note (2026-08-16):** Android now hydrates the existing versioned settings, saved-location and mosque-library stores from native preferences before the React application mounts, then preserves the existing synchronous validated storage contracts through an ordered write-through cache. Browser/PWA targets continue to use browser local storage. Native writes are requested to flush when the document is hidden or the page is being left, while the cached value is updated immediately for same-session reads. Validation run `31938112622` passed the complete repository quality gate, 62 test files / 284 tests, production Web/PWA build verification and a Capacitor Android sync plus Gradle `assembleDebug` with the native preferences plugin present. The repository tests cover hydration, ordered writes, removal and isolation from unrelated preference keys. Uninstall/app-data clearing, backup/restore and physical/emulator cold-start lifecycle evidence remain open and are not claimed by this item.

- [x] Test offline cold start
- [x] Test orientation changes
- [x] Build signed/release-ready configuration without committing secrets

**Android release-configuration verification note (2026-08-16):** validation run `31941241775` passed the complete repository quality gate, Android debug assembly with reboot-restoration verification, unsigned `assembleRelease`, and the negative test proving partial signing configuration is rejected. Release signing activates only when all four external `SALAHOS_ANDROID_KEYSTORE_PATH`, `SALAHOS_ANDROID_KEYSTORE_PASSWORD`, `SALAHOS_ANDROID_KEY_ALIAS` and `SALAHOS_ANDROID_KEY_PASSWORD` values are supplied; no keystore or signing credential is committed. This validates the release-ready signing path without claiming a production distribution key was present in CI.

- [x] Run on real Android device or emulator and record evidence

**Android emulator acceptance note (2026-08-16):** validation run `31941025342` executed SalahOS on an Android 35 x86_64 Pixel-class emulator. Airplane mode was enabled before installing, force-stopping and cold-launching `com.privacyog.salahos/.MainActivity`; Android Activity Manager reported `Status: ok`, `LaunchState: COLD`, and a live SalahOS process. The app-only instrumentation task completed 1/1 tests with zero failures while verifying the real application id, airplane mode, landscape recreation, portrait recreation and activity survival. The stale generated `com.getcapacitor.app` test was removed. This is emulator evidence, not a claim about every physical OEM device.

---

## 9. iOS / iPadOS application

- [x] Configure iOS project/shell
- [x] Implement location permission descriptions and flow
- [x] Implement persistent settings/storage
- [x] Implement local prayer notifications within iOS scheduling limits
- [x] Implement Adhan/notification audio within Apple platform restrictions
- [x] Handle background execution limitations explicitly

**iOS native implementation verification note (2026-08-16):** foundation run `31941296351`, local-notification run `31941790069`, lifecycle-policy run `31941980679`, and latest-main consolidation run `31942088604` passed their repository gates and Xcode iOS Simulator builds. The committed shell uses foreground location privacy metadata, native Preferences persistence, bounded today/tomorrow local prayer scheduling with owned-request reconciliation, silent/default notification audio, and an explicit foreground/background/terminated system-notification policy that does not claim full Adhan-recording auto-play or require application background execution at delivery time. Interactive iPhone/iPad layout, offline cold-start, and simulator/device acceptance remain separately tracked.

- [x] Test iPhone responsive layout in a fresh iOS Simulator
- [x] Test iPad responsive layout in a fresh iPadOS Simulator
- [!] Test offline cold start — the current Simulator gate does not isolate networking; network-isolated iOS acceptance remains required
- [x] Prepare signing/build documentation without committing credentials

**iOS build/signing documentation note (2026-08-16):** read-only Quality Gate run `31914265959` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/IOS_BUILD_SIGNING.md`. The guide covers local development signing, capability/entitlement review, Release archives, CI secret injection, credential cleanup and distribution-path separation while explicitly prohibiting committed signing keys, certificates, account passwords and distribution secrets. Native Xcode build/archive/device execution remains open until performed on the required Apple environment.

- [x] Run on fresh iPhone and iPad Simulators in hosted macOS/Xcode and record evidence
- [x] Document untested iOS items honestly when unavailable on development host

**iOS validation-status note (2026-08-16):** read-only Quality Gate run `31914072847` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/IOS_VALIDATION_STATUS.md`. The document separates shared CI evidence from macOS/Xcode simulator checks and physical iPhone/iPad checks, and requires native-specific tracker items to remain open until the corresponding evidence is recorded. Signing credentials and private keys are explicitly excluded from the repository.

**iOS Simulator release-candidate acceptance note (2026-08-17):** PR #101 code-bearing head `b0699274ef41980d03f0321346eabe5ae758758f` passed Quality Gate `32032477140`, Android Build `32032477112`, Visual Regression `32032477113` and permanent iOS Build `32032477111`. The iOS job used iOS 26.2 with fresh iPhone 17 Pro and iPad Pro 13-inch (M5) Simulators, installed `com.privacyog.salahos`, resolved the application container, launched, captured screenshots, terminated, relaunched and captured second screenshots. Artifact `9289927972` records both profiles. Manual artifact review exposed an earlier iPhone status-bar/Dynamic-Island overlap; `viewport-fit=cover`, four-edge safe-area inset padding and a source-contract regression test were added before the final passing run, whose launch/relaunch screenshots were visually clear of the status bar. These items complete automated Simulator responsive-layout/runtime acceptance only. Physical-device GPS, notifications, audio-session/focus, touch/Dynamic Type, signed distribution and network-isolated iOS cold start remain explicitly open.

---

## 10. Notifications and Adhan

- [x] Per-prayer notification enable/disable
- [x] Reminder N minutes before prayer
- [x] Prayer-time notification
- [x] Per-prayer sound choice
- [~] Vibration option where supported
- [x] Adhan enable/disable
- [x] User-selectable/local Adhan audio

**Local Adhan audio verification note (2026-08-17):** the shared application now lets the user select one non-empty local audio file up to 25 MB, stores it only in the SalahOS IndexedDB media store, provides Preview and Remove controls in English and Arabic, and never uploads or embeds the recording in settings export or release assets. Foreground playback uses a stable per-date/per-prayer key and is attempted only for a prayer with `adhanEnabled` while the page/WebView is visible; browser/WebView autoplay policy can still block playback and the UI reports that limitation. The Android lifecycle policy now permits the dedicated local-audio path only in foreground with a configured recording, while background and terminated states remain notification-only. Unit coverage verifies file validation, per-prayer trigger semantics, ordinary-notification/Adhan independence and lifecycle policy; component coverage verifies the bilingual audio chooser and lifecycle wording. The implementation branch also exposed and fixed a pre-existing remote-URL literal in smart-display navigation so the aggregate local-first security gate passes. Physical mobile media-policy/audio-focus acceptance and background notification timing remain separate target-environment validation and are not claimed here.

**Notification delivery integration verification note (2026-08-16):** PR #81 merged at `2f99d7e7c04b26b23ab9c45df8db5e14b257e653` after exact-head Quality Gate run `31943984379`, Android Build run `31943984406`, and iOS Build run `31943984481` all passed. The production application rebuilds notification intents from the selected location/timezone, calculation method, prayer source, adjustments and per-prayer preferences, then feeds the same resolved schedule into the merged Android and iOS adapters. Integration coverage verifies reminder/prayer-time/Adhan preference propagation, owned-job cancellation when a prayer is disabled, a second identical reconciliation as a no-op, civil-date rollover replacement without duplicate jobs, and removal of a previously installed notification if recalculation lands in a nonexistent DST wall-clock time. This closes deterministic scheduling/rescheduling and duplicate-prevention behavior through both native adapter entry points. Independent vibration control remains partial where platform notification-channel semantics prevent an exact mapping, actual native delivery across a DST transition remains partial until exercised, and user-selected local Adhan recordings remain a separate open feature.

- [x] Do not bundle copyrighted Adhan recordings without suitable rights

**Adhan audio-rights verification note (2026-08-16):** read-only Quality Gate run `31913475048` passed formatting, typed lint, strict typecheck, all tests and production build after adding an executable bundled-audio rights policy and `docs/ADHAN_AUDIO_RIGHTS.md`. Bundled recordings require a stable id, title, rights basis, rights holder/source authority, evidence reference and attribution where required. Public availability is not treated as redistribution permission. Future user-selected local audio remains a separate open feature and must not silently become a bundled project asset.

- [x] Reschedule notifications after timezone/location/method changes
- [x] Reschedule notifications after device reboot where platform requires it

**Android notification reboot-restoration verification note (2026-08-16):** SalahOS pins `@capacitor/local-notifications` and verifies its Android reboot-restoration contract during every `npm run android:build`. The verifier requires the installed version to equal the repository dependency, requires the plugin manifest to register `LocalNotificationRestoreReceiver` for locked/normal boot with `RECEIVE_BOOT_COMPLETED`, requires the receiver source to reload saved notification IDs and reschedule them, and scans Gradle build intermediates to prove the receiver and permission survive manifest merging into the application. Clean validation run `31940265725` passed the full repository quality gate, Android debug assembly and the permanent reboot verifier on the post-Adhan mainline. Physical-device reboot timing remains part of separate device acceptance and is not claimed here.

- [x] Reschedule future prayer notifications at date rollover
- [x] Prevent duplicate notifications
- [~] Test notification behaviour across DST transition
- [x] Document platform-specific limitations instead of promising impossible exact behaviour

**Notification platform-limitations verification note (2026-08-16):** read-only Quality Gate run `31913144213` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/NOTIFICATION_LIMITATIONS.md`. The document separates deterministic scheduling intent from final delivery and records Web/PWA, Android, iOS/iPadOS and Raspberry Pi/desktop/kiosk constraints around permissions, background execution, suspend/reboot, exact scheduling and Adhan playback. Product wording must not promise exact delivery until a target-platform adapter is implemented and verified.

**Notification scheduler-adapter verification note (2026-08-16):** read-only Quality Gate run `31910761615` passed formatting, typed lint, strict typecheck, all tests and production build for the platform-neutral scheduling contract. The shared executor now lists installed notification records, reconciles them against exact resolved intents, cancels stale records before replacement, applies new records, treats a second identical application as a no-op, and removes installed jobs that become invalid because their local wall-clock time falls in a DST gap. Conflicting records sharing one stable id are rejected. Real platform adapters, permission/background constraints and reboot persistence remain open, so delivery-related tracker statuses remain partial.

**Notification-DST verification note (2026-08-16):** read-only Quality Gate run `31910410104` passed formatting, typed lint, strict typecheck, all tests and production build for IANA wall-clock-to-instant resolution. The scheduling domain now resolves notification civil times against the selected IANA timezone, including Sydney and London DST transitions. Repeated wall-clock times are represented explicitly and notification scheduling chooses the earlier occurrence deterministically; nonexistent spring-forward times are skipped rather than silently shifted or fabricated. Actual platform notification delivery across DST has not yet been exercised, so the delivery-level DST tracker item remains partial.

**Notification-schedule verification note (2026-08-16):** implementation Quality Gate run `31908783069` passed formatting, typed lint, strict typecheck, all tests and production build for the deterministic scheduling core. The domain now builds stable per-date/per-prayer reminder, prayer-time and Adhan intents; normalizes reminders that fall on the prior civil date; deduplicates repeated inputs; and reconciles an installed schedule against recalculated desired jobs with explicit cancellation and replacement sets. Tests cover changed prayer times, date rollover, duplicate input and no-op reconciliation. No platform scheduler consumes these intents yet, so rescheduling and duplicate prevention remain partial. Reboot recovery, timezone-to-instant/DST delivery validation and permission/background handling remain open.

**Notification-preferences verification note (2026-08-16):** read-only Quality Gate run `31908401807` passed the notification preference domain and settings-schema v2 migration, and implementation Quality Gate run `31908480344` passed formatting, typed lint, strict typecheck, all tests and production build after the settings UI integration. Each obligatory prayer now has locally persisted enable, 1–180 minute reminder, prayer-time alert, default/silent sound, vibration and Adhan-enable preferences. Existing v1 settings migrate to v2 without losing location, calculation or mosque configuration. No platform notification scheduler, permission request or Adhan audio delivery is implemented yet, so delivery-related tracker items remain partial rather than complete.

---

## 11. Raspberry Pi Touch Display 2

- [x] Research and document Raspberry Pi Touch Display 2 resolution/orientation constraints
- [x] Build touch-first layout fixture for the display

**Touch Display 2 layout-fixture verification note (2026-08-16):** read-only Quality Gate run `31931801626` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 53 test files / 253 tests, production build and deploy-artifact verification. The explicit `touch-display-2` browser fixture reuses the production `NextPrayerBlock` and `PrayerCard` presentation components, exposes deterministic 5-inch/7-inch 720×1280 and 10-inch 1200×1920 portrait profiles plus their landscape dimensions, supports English and Arabic/RTL, and provides fixed prayer, Iqamah and current/next state for repeatable inspection. Six fixture tests verify query activation/defaults, invalid-option fallback, exact viewport contracts, production component state and Arabic RTL output. This closes the repository-side touch-first fixture only; Stage 17 visual clipping/alignment/screenshot checks and physical Touch Display 2 rendering/touch acceptance remain open.

- [x] Provide Raspberry Pi OS installation instructions

**Raspberry Pi Touch Display 2 documentation verification note (2026-08-16):** read-only Quality Gate run `31931305063` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification after adding `docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md`. The guide documents the current 5-inch and 7-inch 720×1280 variants plus the 10-inch 1200×1920 variant, portrait-native orientation, Raspberry Pi OS Desktop rotation through Control Centre, supported Raspberry Pi generations/cabling boundaries, Raspberry Pi Imager installation, touch/on-screen-keyboard behavior, brightness controls, and the existing SalahOS Chromium/labwc kiosk deployment path. The document keeps physical Touch Display 2 rendering, touch ergonomics, rotation acceptance, boot/autostart behavior and long-duration device testing explicitly open. The touch-first layout fixture remains a separate implementation item.

- [x] Provide one-command or simple launcher script
- [~] Provide optional automatic launch on boot
- [x] Implement Chromium/full-screen kiosk mode where applicable

**Raspberry Pi kiosk deployment verification note (2026-08-16):** read-only Quality Gate run `31929984829` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 28 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 52 test files / 247 tests, production build and deploy-artifact verification. The repository now provides a simple local launcher that serves the built Web/PWA bundle on loopback, validates configuration, waits for local readiness and starts Chromium in kiosk mode, plus an idempotent labwc desktop-session autostart installer that preserves unrelated entries and can remove only its managed block. Five deterministic deployment tests verify shell syntax, kiosk command construction, invalid-port rejection, autostart idempotence/preservation and managed-block removal. Optional automatic launch remains partial because repository CI cannot prove Raspberry Pi graphical boot/login policy or physical power-on behavior. Touch Display 2 resolution/orientation, physical boot/autostart, device rendering, power-loss/reboot and long-duration hardware acceptance remain open.

- [x] Persist settings across restart
- [x] Operate without internet after initial configuration
- [x] Recover gracefully when network disappears
- [x] Recover after system suspend/reboot
- [x] Prevent display from getting stuck on yesterday's prayer schedule

**Raspberry Pi/kiosk continuity verification note (2026-08-16):** read-only Quality Gate run `31933758199` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 30 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification. The dedicated kiosk lifecycle integration persists a configured Sydney location/timezone, calculation method, locale, Hijri correction and prayer adjustments, cold-loads the stored settings, forces network access unavailable and still builds the complete local prayer dashboard without any fetch. A detected multi-hour suspend-style gap rebuilds from fresh wall time with a changed countdown, and a simulated cold restart immediately after Sydney local midnight loads the same persisted configuration while generating the 2026-08-17 schedule instead of retaining 2026-08-16. This closes repository-side restart/offline/network-loss/suspend/date-rollover continuity for the shared Raspberry Pi kiosk runtime. Actual Raspberry Pi graphical boot/login, power-loss behaviour, physical Touch Display 2 rendering/touch and long-duration hardware acceptance remain separate physical-device evidence.

- [!] Test on physical Raspberry Pi / Touch Display 2 when available — target hardware is not available in the current work environment

---

## 12. TV and kiosk display mode

- [x] Create dedicated smart-display mode using shared app logic
- [x] Large current clock
- [x] Large next-prayer countdown
- [x] Five-prayer timetable visible at a glance
- [x] Iqamah/Jama'ah display where configured
- [x] Jumu'ah display on Fridays
- [x] Current/next-prayer highlighting
- [x] Full-screen/kiosk operation

**Smart-display mode verification note (2026-08-16):** read-only Quality Gate run `31932489699` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 54 test files / 258 tests, production build and deploy-artifact verification. The live `?mode=smart-display` presentation is rendered inside the normal application runtime and consumes the shared sourced prayer dashboard rather than duplicating prayer calculations. It presents a large live clock and next-prayer countdown, the five obligatory prayers at a glance, configured Iqamah, current/next highlighting, and configured date-scoped Jumu'ah sessions, with English/Arabic presentation and offline/unconfigured/error states. The existing Chromium launcher accepts `SALAHOS_KIOSK_URL`; the Raspberry Pi kiosk guide now documents launching the smart-display URL directly under the validated full-screen kiosk flags. Automatic daily rollover, timezone/DST update, sleep/wake recovery, burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain separate Stage 12 verification items.

- [x] Automatic daily schedule rollover
- [x] Automatic timezone/DST update
- [x] Sleep/wake recovery

**Smart-display runtime-continuity verification note (2026-08-16):** read-only Quality Gate run `31932809636` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 55 test files / 261 tests, production build and deploy-artifact verification. Three display-specific integration tests render the production `SmartDisplay` from the shared sourced dashboard before and after runtime transitions: Sydney local midnight from 2026-08-16 to 2026-08-17, the 2026-10-04 daylight-saving jump from UTC+10 to UTC+11 with the local clock advancing from 01:59 to 03:00, and a simulated multi-hour sleep/wake gap detected by the existing sleep/wake detector followed by a fresh wall-time dashboard/render. This proves repository-side display continuity through those transitions without duplicating prayer logic. Physical Raspberry Pi/TV suspend, reboot and long-duration acceptance remain separate hardware evidence; burn-in-conscious behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.

- [x] Burn-in-conscious layout behaviour where practical
- [x] Remote-control/keyboard navigation where practical
- [x] Document supported TV deployment paths rather than claiming unsupported native platforms

**Smart-display TV usability verification note (2026-08-16):** read-only Quality Gate run `31933200746` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 30 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 57 test files / 266 tests, production build and deploy-artifact verification. The live smart-display now recognises Escape, Backspace, BrowserBack and GoBack as practical exit inputs and returns to the standard configuration route while preserving unrelated query/hash state; three unit tests lock that mapping. The long-running display applies a bounded four-pixel stepped position shift on a 60-minute cycle to major static display regions, with a reduced-motion override; two stylesheet contract tests lock both behaviours. `docs/TV_KIOSK_DEPLOYMENT.md` documents the validated Linux/Raspberry Pi Chromium kiosk path, HDMI-attached browser hosts, target-specific TV-browser acceptance checks, casting/mirroring boundaries, remote-key limitations and an explicit list of native TV packages this repository does not claim to ship. Physical TV remote mappings, HDMI-CEC, panel burn-in characteristics and long-duration device acceptance remain hardware-specific validation work.

---

## 13. Offline-first / PWA capability

- [x] Create web app manifest
- [x] Add installable PWA icons/assets

**PWA raster-icon verification note (2026-08-16):** read-only Quality Gate run `31929295284` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, deterministic raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification. The manifest now declares first-party 192×192 and 512×512 PNG install icons for both normal and maskable purposes while retaining the vector sources. `scripts/generate_pwa_icons.py` reproduces all four committed PNGs using only the Python standard library and `--check` fails CI if any committed raster bytes drift. The production artifact verifier requires the raster files in `dist/`, validates PNG signatures/dimensions and checks manifest size/type/purpose metadata. Physical browser/device install UX remains a separate release/platform validation concern.

- [x] Implement service worker/static application shell caching
- [x] Keep prayer calculation engine fully local/offline
- [x] Persist selected location/timezone/calculation settings locally
- [x] Persist mosque timetable locally
- [x] Provide clear online/offline state only where relevant
- [x] Verify app remains useful with internet disabled
- [x] Test offline page reload
- [x] Test cache/version migration after app upgrade

**PWA offline-lifecycle verification note (2026-08-16):** read-only Quality Gate run `31926514357` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build after exercising the committed `public/sw.js` in a controlled worker/cache environment. The production service worker now uses `salahos-shell-v2`, pre-caches the application shell, serves cached root HTML when a same-origin navigation reload fails because the network is unavailable, and during activation deletes only stale `salahos-shell-*` versions while preserving unrelated origin caches. This combines with the existing offline-startup integration, which proves persisted settings and prayer calculations operate without network access. These deterministic lifecycle tests close offline usefulness, offline reload and cache-version migration behavior; physical browser/device install UX remains a separate release/platform validation concern.

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
- [x] Per-prayer notifications
- [x] Adhan settings
- [x] Iqamah settings

**Notification-settings reconciliation note (2026-08-17):** the Stage 10 preference and native-delivery work already provides persisted per-prayer enable/disable, reminder, prayer-time alert, sound, vibration preference and Adhan-alert controls. The Stage 14 per-prayer notification-settings marker is therefore complete. Adhan settings are complete at the repository/UI level: per-prayer Adhan enablement plus a private user-selected local recording are implemented. Native background/terminated full-recording delivery remains outside this settings marker and is tracked separately.

**Iqamah-settings verification note (2026-08-16):** read-only Quality Gate run `31926961935` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build after completing the manual local-mosque Iqamah settings surface. Each obligatory prayer can now leave Iqamah unconfigured, use a fixed 24-hour clock time, or use a validated 0–180 minute offset after prayer start. The UI is available in English and Arabic and writes directly into the existing validated mosque-timetable `IqamahRule` model, so local persistence and settings/timetable import-export continue to use the same schema rather than a parallel configuration store. Validation rejects malformed fixed times, out-of-range offsets and offsets that cross into the next civil day. Integration coverage proves an offset rule survives persisted settings reload and resolves to the exact Iqamah minute through the production local-mosque source path.

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
- [x] Re-sync clock/countdown after app resumes from background

**Background-resume verification note (2026-08-16):** read-only Quality Gate run `31918624386` passed formatting, typed lint, strict typecheck, all tests and production build after tightening the runtime refresh contract. Focus and page-restore events refresh immediately, while `visibilitychange` refreshes only when the document becomes visible. The `App` refresh callback replaces its wall-clock `now` value, which recomputes the dashboard, current/next prayer and countdown from current time instead of replaying missed interval ticks. Unit coverage verifies hidden visibility changes do not refresh, visible resume does refresh, and listener cleanup still removes every runtime hook. System sleep/wake and significant system-clock change detection remain separate open items.

- [x] Recover correctly after system sleep/wake

**System sleep/wake verification note (2026-08-16):** read-only Quality Gate run `31919909102` passed formatting, typed lint, strict typecheck, all tests and production build after adding a platform-neutral elapsed-gap detector and integrating it with the live runtime clock loop. A wall-clock timer gap of five seconds or more is treated as a suspended/resumed runtime boundary: the system-clock discontinuity detector is re-baselined before the fresh wall time is applied, and the dashboard, local date, current/next prayer and countdown recompute from that current instant rather than replaying missed interval ticks. Explicit focus, page-restore and visible-resume refreshes reset both runtime baselines. Unit coverage verifies ordinary progression, threshold behavior, long gaps representative of sleep/wake, backward clock corrections, explicit re-baselining and invalid samples.

- [x] Detect significant system-clock changes

**System-clock change verification note (2026-08-16):** read-only Quality Gate run `31919019029` passed formatting, typed lint, strict typecheck, all tests and production build after adding a wall-clock discontinuity detector and integrating it into the live runtime clock loop. The detector compares elapsed `Date.now()` time with monotonic `performance.now()` time using a 30-second threshold, detects significant forward/backward corrections and monotonic resets, and rejects invalid samples. Explicit focus/page-restore/visible-resume refreshes reset the detector baseline before updating `now`, so ordinary background resume is handled by the separate resume path rather than intentionally classified as a clock correction. System sleep/wake recovery remains a separate open item because monotonic-clock behavior across sleep varies by platform.

- [x] Avoid countdown drift from long-running intervals
- [x] Handle invalid system time gracefully

**Invalid-system-time verification note (2026-08-16):** read-only Quality Gate run `31920144935` passed formatting, typed lint, strict typecheck, all tests and production build after making runtime wall-clock state explicitly nullable. Non-finite or out-of-range wall-clock reads no longer enter dashboard/date/time formatters or prayer calculations; both runtime discontinuity detectors are cleared, the live clock renders a neutral placeholder, and a localized English/Arabic alert asks the user to correct the device date/time. The next valid wall-clock sample automatically re-establishes both runtime baselines and resumes normal calculation. Unit coverage verifies valid current and pre-epoch times, non-finite values, JavaScript Date-range overflow and injected wall-clock readers.

- [x] Handle unavailable calculation results gracefully

**Unavailable-calculation verification note (2026-08-16):** read-only Quality Gate run `31920344383` passed formatting, typed lint, strict typecheck, all tests and production build after introducing an explicit dashboard calculation result boundary. Successful schedules report any prayer rows that remain astronomically unavailable; those rows continue to display a neutral dash and now carry localized English/Arabic guidance rather than silent ambiguity. Calculation exceptions are converted into an explicit unavailable state, so the interface remains running and asks the user to verify location/calculation settings without displaying guessed prayer times. Deterministic coverage verifies an ordinary Sydney schedule, polar-day partial unavailability and conversion of a rejected calculation input into the safe unavailable result.

- [x] Add structured error logging without exposing private location unnecessarily

**Privacy-safe error-logging verification note (2026-08-16):** read-only Quality Gate run `31920530983` passed formatting, typed lint, strict typecheck, all tests and production build after adding a deliberately constrained structured error schema and wiring it to invalid-system-time and prayer-calculation failure transitions. Events contain only a fixed component, fixed code and severity; the API accepts no coordinates, location labels, mosque names, arbitrary context, raw exception messages, stacks or URLs. Invalid-clock logging is transition-deduplicated until valid time returns, while calculation failure logs only on availability-state changes. Unit coverage locks the emitted schema and asserts the absence of private-location/error-detail fields.

---

## 16. Privacy and security

- [x] Document threat/privacy model

**Privacy/threat-model verification note (2026-08-16):** read-only Quality Gate run `31917509097` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/PRIVACY_THREAT_MODEL.md`. The model identifies precise location, saved places, mosque choices, notification schedules and imported timetable/settings data as privacy-relevant; defines local-first trust boundaries; requires explicit location permission and data minimisation; constrains optional remote integrations, logging, service-worker caching and screen exposure; and records security review gates for future networked/native functionality. This closes documentation only: remote-call security, secrets policy enforcement, dependency review, CSP and native permission review remain separate open items.

- [x] Minimise collection of precise location data

**Location-data minimisation verification note (2026-08-16):** read-only Quality Gate run `31920709447` passed formatting, typed lint, strict typecheck, all tests and production build after tightening the browser geolocation adapter. Location acquisition remains explicit and one-shot, defaults to low-accuracy mode with a five-minute reusable fix window, and never starts a continuous watch. The adapter now discards browser accuracy, altitude, altitude accuracy, heading, speed and capture timestamp immediately, retaining only latitude/longitude required for local timezone and prayer calculations plus the source marker. High-accuracy acquisition remains available only through explicit caller opt-in. Tests lock the retained data shape, default request options, one-shot behaviour and explicit opt-in path.

- [x] Keep prayer calculations local by default
- [x] No mandatory account for core prayer-time functionality
- [x] No unnecessary analytics/telemetry
- [x] Obtain explicit permission before using location
- [x] Secure any optional remote API calls

**Remote-network policy verification note (2026-08-17):** core v1 ships no optional remote API dependency. PR #88 added a fail-closed application-source policy that rejects newly introduced remote `fetch`, XHR, WebSocket/EventSource capability or remote HTTP URL literals until an explicit reviewed change widens that boundary. The policy passed an isolated local-only case and correctly rejected a representative remote-fetch negative case. Hosted workflow jobs for the PR could not start because the account's Actions billing/spending state blocked runners; that infrastructure blocker is tracked separately and is not represented as test evidence.

- [x] Do not commit secrets/API keys

**Secrets-policy verification note (2026-08-16):** read-only Quality Gate run `31921396802` passed the sensitive-file policy, formatting, typed lint, strict typecheck, all tests and production build. A root `.gitignore` now excludes local environment files, private keys/certificates, signing stores and platform-local configuration; `scripts/check-sensitive-files.mjs` fails CI when blocked secret-bearing file classes are present in the checkout; and `docs/SECRETS_POLICY.md` prohibits committed credentials/API keys, requires encrypted CI/platform secret stores and documents credential-rotation response. The repository-side filename guard is deliberately not represented as proof that arbitrary source text can never contain a secret, so diff review and hosting-platform secret scanning remain required for future networked integrations.

- [x] Dependency vulnerability review

**Dependency-vulnerability verification note (2026-08-16):** read-only Quality Gate run `31921578803` passed the sensitive-file policy, `npm audit --audit-level=moderate`, formatting, typed lint, strict typecheck, all tests and production build from the committed lockfile. The audit is now an explicit CI and local `npm run check` gate rather than incidental install output. `docs/DEPENDENCY_SECURITY.md` records the intentionally small direct runtime dependency surface, exact-version/lockfile review policy and the requirement not to weaken the audit threshold merely to make CI pass. A clean audit is treated as point-in-time advisory evidence rather than a permanent safety guarantee, so it must be re-run before release and after dependency changes.

- [x] Content Security Policy for web/PWA where applicable

**Web CSP verification note (2026-08-16):** read-only Quality Gate run `31918434190` passed formatting, typed lint, strict typecheck, all tests and production build after adding a same-origin Content Security Policy baseline to `index.html` and `docs/WEB_SECURITY_HEADERS.md`. The policy restricts scripts, fonts, workers and the manifest to the application origin; limits images/media to local/data/blob use where required; denies objects and frames; constrains base URLs and form submission; and leaves no wildcard remote HTTP origins. Development websocket schemes remain allowed for local tooling. The deployment guide records stronger response-header requirements such as `frame-ancestors`, nosniff, referrer, permissions and carefully enabled HSTS; those remain deployment-specific rather than falsely claimed as configured here.

- [x] Validate imported CSV/JSON data safely
- [x] Review native permissions and remove unnecessary ones

**Native-permission review verification note (2026-08-17):** PR #88 merged at `7c30b23cb2b630c0a26e257de37a1304709c9617`. The unused iOS always-location privacy declaration was removed, leaving foreground `NSLocationWhenInUseUsageDescription`; Android remains limited to documented foreground location, Internet and user-managed precise-alarm application permissions. `docs/NATIVE_PERMISSIONS.md` records the boundary and `npm run security:native-permissions` now fails on unreviewed permission expansion/background-location reintroduction. The policy script was independently executed against representative committed-manifest shapes and passed. Hosted PR jobs did not start because of the Actions billing/spending infrastructure blocker.

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
- [x] Settings → recalculation flow

**Settings-to-recalculation integration verification note (2026-08-16):** read-only Quality Gate run `31921801532` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration test that crosses the persisted-settings boundary. The test saves and reloads a Sydney configuration, builds the production dashboard from the loaded settings, then persists changed calculation method, Asr convention, high-latitude rule, Hijri correction and Fajr adjustment and proves the recalculated dashboard reflects those selections and changes the affected prayer times. This verifies persistence → reload → calculation rather than testing the storage and calculation modules only in isolation.

- [x] Date rollover flow

**Date-rollover integration verification note (2026-08-16):** read-only Quality Gate run `31921977275` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding a production-dashboard integration fixture across Sydney local midnight. At 23:59:59 on 2026-08-16 the dashboard reports today/tomorrow as August 16/17 and next Fajr as day offset 1; at 00:00:01 it reports August 17/18 and re-bases that next Fajr to day offset 0. Gregorian presentation and the six-row prayer schedule advance with the same civil-date boundary, proving the runtime model does not remain stuck on yesterday's schedule.

- [x] Notification scheduling flow

**Notification-scheduling integration verification note (2026-08-16):** read-only Quality Gate run `31923105355` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration fixture across the production notification pipeline. The fixture derives Sydney prayer rows from the production dashboard, creates Fajr reminder and prayer-time intents from user preferences, resolves those civil times through the IANA timezone layer, applies them through the scheduler adapter, then changes the Fajr prayer adjustment by +5 minutes and proves the stable jobs are cancelled and replaced at the new exact instants. Re-applying the same resolved schedule is verified as idempotent with no duplicate scheduling operations.

- [x] Offline startup flow

**Offline-startup integration verification note (2026-08-16):** read-only Quality Gate run `31923333276` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration fixture for a previously configured device starting with network access unavailable. The fixture persists Sydney location and calculation settings, replaces network fetch with a failing stub, reloads the stored configuration, and successfully builds the production prayer dashboard locally with the saved method, Hijri correction and prayer adjustment while proving the startup calculation path makes no network request. This verifies the application startup/data path only; browser service-worker cache/offline reload validation remains separately tracked in the PWA stage and is not claimed by this item.

### UI / visual regression

- [x] Phone portrait — English/light
- [x] Phone portrait — Arabic/RTL/dark
- [x] Phone landscape
- [x] Tablet
- [x] Raspberry Pi Touch Display 2
- [x] 1080p kiosk
- [x] Verify no clipping/overflow
- [~] Verify Arabic/RTL alignment
- [x] Verify scalable text/accessibility
- [x] Save screenshots/artifacts in CI where practical

**Automated visual-regression verification note (2026-08-17):** PR #98 added a deterministic production-build browser matrix on the self-hosted EVO-X2 using an isolated, audited `playwright@1.62.0`/Chromium harness rather than adding browser tooling to the SalahOS dependency graph. Exact PR head `501e5ab64af9c2c1cd7e0137aa398bb8e20307dd` passed Visual Regression run `32004488336`, Android Build `32004488397` and Quality Gate `32004488438`. The visual gate renders 14 scenarios covering 390×844 English/light and Arabic/RTL/dark phone portrait, 844×390 phone landscape, English/Arabic 1024×1366 tablets, English/Arabic 1920×1080 kiosk, 3840×2160 large display, 125% Arabic/RTL phone text with settings expanded, and 5/7/10-inch Touch Display 2 portrait/landscape fixtures. It fails on page errors, locale/direction/theme or viewport mismatches, document/page horizontal overflow, actual viewport escape and explicit clipping, and saves full-page screenshots plus machine-readable results. The first matrix exposed a real 411px-wide Arabic settings overflow at 125% text; responsive containment was corrected before the exact final head passed all 14 scenarios. Exact visual artifact `9279673293` (`visual-regression-7d6e82d7f88309cf4ae197e1686988608c134a8b`) is retained for 30 days. This is automated browser-render evidence only: physical Raspberry Pi Touch Display, TV/panel viewing-distance/remote behaviour and interactive native iPhone/iPad acceptance remain separately blocked. Arabic/RTL alignment stays partial because direction and geometry are automated, while human aesthetic review of the screenshots is not represented as performed.

---

## 18. Quality gates

- [x] Formatter clean
- [x] Linter clean
- [x] Strict typecheck clean
- [x] Unit tests green
- [x] Integration tests green
- [x] UI/component tests green

**UI/component-test verification note (2026-08-16):** read-only Quality Gate run `31929598905` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 51 test files / 242 tests, production build and deploy-artifact verification. The production next-prayer block and prayer-card presentation were extracted from `App` into `NextPrayerBlock` and `PrayerCard` without moving prayer-domain logic. Server-rendered component tests cover configured/unconfigured next-prayer states, tomorrow/countdown presentation, current/next prayer badges, Iqamah display, high-latitude/manual-adjustment indicators and supplementary-prayer Iqamah suppression; existing bidirectional-text component tests remain green. No new test dependency was added. Stage 17 viewport, screenshot, RTL visual-alignment and scalable-text/accessibility regression work remains separately open.

- [x] Production web build succeeds
- [x] Android build succeeds where SDK is available
- [x] iOS build succeeds where Xcode is available

**iOS build reconciliation note (2026-08-17):** iOS native foundation/consolidation runs including `31942088604` and the later notification integration iOS Build run `31943984481` successfully compiled the committed Xcode project for iOS Simulator. The previous open quality-gate marker was stale. Interactive Simulator/device acceptance and signed distribution remain separate Stage 9/20 items.

- [x] Raspberry Pi/kiosk deployment script validated
- [x] No unexplained widened test tolerances
- [x] No disabled failing tests without documented blocker
- [x] No placeholder implementation marked complete
- [x] Final dependency/license review

**Dependency-license verification note (2026-08-16):** read-only Quality Gate run `31928221970` passed the sensitive-file policy, dependency vulnerability audit, the new dependency-license policy, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification. The lockfile policy checks every non-root npm package entry and fails closed on missing or unreviewed license expressions. The verified graph contains 4 production packages using only MIT/CC0-1.0 and 157 development-only packages; 12 MPL-2.0 entries are confined to `lightningcss` build tooling and are explicitly documented as a development-only exception. A future MPL-2.0 production dependency, unknown license, restrictive/source-available license or unreviewed copyleft expression will fail CI until separately reviewed. `docs/DEPENDENCY_LICENSE_REVIEW.md` documents the scope and review boundary; native-platform and non-npm dependencies remain subject to review when introduced.

---

## 19. Documentation and deployment

- [~] Expand `README.md` with screenshots, features and platform status
- [x] Create `BUILD.md`
- [x] Document web/PWA build and deployment

**Web/PWA build-deployment verification note (2026-08-16):** read-only Quality Gate run `31927318102` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 238 tests, production build and deploy-artifact verification after adding `BUILD.md` and an executable Web/PWA deployment contract. `BUILD.md` documents the clean lockfile install, full quality gate, production Vite build, local preview, root static-host contract, service-worker/manifest caching requirements, offline smoke checks, upgrade procedure, secrets boundary and an explicit platform matrix that leaves Android, iOS, Raspberry Pi and TV/kiosk release paths unvalidated. CI now runs `npm run verify:web-build` after production build; that verifier requires the built HTML shell, manifest, service worker and first-party icons, validates manifest/start-up expectations and confirms the shipped `dist/sw.js` exactly matches the tested `public/sw.js` source. Native platform build/install documentation and final release-readiness checks remain separately open.

- [x] Document Android build/install
- [x] Document iOS build/install

**iOS documentation reconciliation note (2026-08-17):** PR #88 expanded `docs/IOS_BUILD_SIGNING.md` into a current build/install/signing guide for the committed native project, including deterministic prepare/sync commands, unsigned Simulator compilation, command-line Simulator install/launch, physical iPhone/iPad Xcode installation steps, release archive boundaries and credential handling. Target execution evidence remains tracked separately from documentation completion.

- [x] Document Raspberry Pi Touch Display 2 setup
- [x] Document TV/kiosk deployment
- [x] Document prayer calculation methods and references
- [x] Document privacy behaviour
- [x] Document mosque timetable import format
- [x] Document notification platform limitations
- [x] Add troubleshooting section

**Troubleshooting/documentation verification note (2026-08-16):** read-only Quality Gate run `31928551210` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across all 27 root/docs Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification after adding `docs/TROUBLESHOOTING.md`, a README documentation index and an executable local Markdown-link gate. The troubleshooting guide covers the currently implemented shared/Web/PWA install, build/deploy, prayer/location/timezone, DST/date rollover, offline reload, settings, mosque timetable/Iqamah, notification-intent, RTL, service-worker, security/license and bug-report workflows without representing native shells as release-validated. The Stage 19 notification-limitations marker is synchronized here because `docs/NOTIFICATION_LIMITATIONS.md` was already implemented and verified under Stage 10 by Quality Gate run `31913144213`; this tracker update does not claim new native notification delivery capability. README screenshots/platform-status work remains partial.

- [x] Add contributor/development setup instructions

**Documentation reconciliation note (2026-08-17):** README platform/feature status, `DESIGN.md`, `RESEARCH.md`, `docs/PLATFORM_STATUS.md`, native-permission documentation and draft release notes were synchronized with the implemented Android/iOS/PWA/Pi/TV state. README screenshot publication remains the only reason the top-level README-expansion item is partial.

---

## 20. Final verification / release readiness

- [x] Run clean install from lockfile
- [x] Run complete test suite from a clean checkout
- [x] Run lint + typecheck + production build
- [x] Run prayer-time parity/reference suite
- [x] Run DST/high-latitude regression suite
- [x] Run English + Arabic/RTL visual suite
- [x] Validate offline operation

**Core release-verification note (2026-08-16):** main-branch Quality Gate run `31934011315` checked out exact commit `49ac83379cdc357cd5ecb43d964291ec44793906` into a clean hosted workspace, installed the committed lockfile with `npm ci --ignore-scripts` (139 packages installed, 140 audited, zero vulnerabilities), passed repository security/license/documentation/icon-reproducibility policies, formatting, lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification. The passing suite includes `referenceParity.test.ts` and `methods.reference.test.ts` for prayer-time/reference parity; `timezone.test.ts`, `zonedCivilTime.test.ts`, `highLatitudeIndicators.test.ts`, prayer-engine coverage and smart-display DST integration for DST/high-latitude regression; and `offlineStartup.test.ts`, `service-worker-validation.test.mjs` plus `kioskContinuity.test.ts` for deterministic offline startup/cache/kiosk operation. Visual suites, physical phone/Raspberry Pi/TV layouts, native notification environments, final code review, blocker reconciliation, release notes and release tagging remain open and are not implied by this evidence.

- [x] Validate phone layout
- [!] Validate Raspberry Pi layout — physical Touch Display 2 acceptance requires target hardware
- [!] Validate TV/kiosk layout — viewing-distance, remote and panel acceptance require a physical display target
- [!] Validate Android notifications on supported test environment — physical/emulator delivery timing environment is not available in the current session
- [!] Validate iOS notifications on supported test environment — interactive iOS Simulator/device notification environment is not available in the current session
- [x] Perform fresh final code review
- [x] Review all `[!]` blocked items and document reasons
- [x] Ensure `TODO.md`, `DESIGN.md`, `RESEARCH.md` and `TESTING.md` reflect actual state
- [x] Create release notes
- [x] Tag first release only after applicable quality gates are satisfied

**Release-boundary reconciliation note (2026-08-18):** PR #101 merged the permanent iOS runtime gate, the reviewed iPhone safe-area correction and the final code/documentation review. The first production repository/source release is permitted to ship once the exact versioned release revision passes Quality Gate, Android Build, Visual Regression and iOS Build together. Current `[!]` items remain genuine unperformed physical/target-environment acceptance and are deliberately non-blocking for the source release only because they are explicitly disclosed; they must not be relabelled as tested. This release does not imply App Store/Play Store publication or signed store binaries.

**v1.0.0 release verification note (2026-08-18):** annotated tag `v1.0.0` was created by `privacyOG` and points exactly to `b03482d06d989bfa42dd1dfd55bcc2e2994d97b8` after that commit passed Quality Gate `32061495596`, Android Build `32061495556`, Visual Regression `32061495626` and iOS Build `32061495534`. The GitHub release is published as a non-draft, non-prerelease source release. Existing `[!]` and partial markers for physical mobile hardware, Raspberry Pi, TV/panel, native notification/audio timing, network-isolated iOS cold start and store-distribution acceptance remain intentionally open and are not changed by the source release.

---

## 21. Phase 2 / future roadmap

- [x] Qibla bearing from current coordinates
- [~] Device compass integration where supported
- [x] Ramadan mode
- [x] Suhur/Imsak and Iftar presentation
- [x] Taraweeh timetable support
- [x] Mosque announcements/events
- [x] Configurable smart-display themes
- [x] Multiple mosque profiles
- [x] Remote administration for managed mosque displays
- [x] Home Assistant integration
- [x] Optional local network API for smart-home/display integration
- [x] Calendar integrations
- [x] Wearable/watch companion exploration
- [x] Additional languages

---

## 22. UI/UX v2 architecture and visual redesign

- [~] Complete the UI/UX v2 architecture and visual redesign defined in `docs/UI_UX_V2_PLAN.md`
- [x] Separate congregation, managed administration, smart-display and Touch Display fixture surfaces
- [x] Provide reloadable Today, Mosques, Qiblah, Community and Settings destinations
- [x] Replace the legacy Today composition with a dedicated prayer-first Today screen
- [x] Provide five-item phone navigation, compact tablet navigation and readable desktop navigation with RTL support
- [x] Replace the legacy Settings monolith with category-based progressive disclosure
- [x] Complete dedicated Qiblah experience refinement (Stage 22.4)
- [x] Complete Mosques and Community experience refinements (Stage 22.5)
- [x] Complete Design System v2 consolidation and retire overlapping global layout rules

**Stage 22 progress note (2026-08-21):** PR #165 established explicit product surfaces, reloadable congregation destinations and the managed administration shell. PR #166 replaced the legacy Today composition with the dedicated prayer-first Today experience and corrected phone/tablet/desktop/RTL navigation. PR #167 introduced reloadable category-based Settings navigation while retaining progressively scoped legacy workflows that still require later extraction. PR #168 consolidated global design-system ownership, retired overlapping shell/theme rules and added ownership enforcement while the remaining detailed Design System v2 primitives stay open. PR #169 completed the dedicated Stage 22.4 Qiblah refinement with a dominant compass/bearing hierarchy, subordinate sensor and calibration detail, secondary saved/offline/manual location workflows, preserved local/offline bearing calculation and opt-in map networking, plus independent portrait-phone, landscape-phone, tablet/RTL and desktop visual-regression coverage. PR #170 completed Stage 22.5 with dedicated congregation Mosques discovery/profile UX, privacy-gated local nearby sorting, explicit prayer/Iqamah provenance/freshness, reader-only Community Announcements/Events tabs, compact content states and removal of administration/import controls from the congregation reading experience. PR #170 code-bearing head `9446b32fb34e66cf9de7fd94855b88f0f746693a` passed Quality Gate `32435976858`, Android Build `32435976877`, Visual Regression `32435976891` and iOS Build `32435976879`; populated English-phone and Arabic/RTL-tablet Stage 22.5 screenshots also received human review. PR #171 completed Stage 22.6 by preserving the eight reloadable Settings categories, moving manual mosque timetable authoring/import and prayer offsets into Advanced, keeping ordinary Mosque & Iqamah focused on timetable selection/use, preserving focused Notifications & Adhan and Data & Privacy ownership, and removing duplicated or stale explanatory copy. PR #171 code-bearing head `eba6340cfe22a21f7f112921156c6620a40cf1ac` passed Quality Gate `32440308947`, Android Build `32440308898`, Visual Regression `32440309003` and iOS Build `32440308865`; all 28 visual scenarios passed without horizontal-overflow offenders and English-phone Mosque plus Arabic/RTL-tablet Advanced screenshots received human review. PR #173 completed the remaining Stage 22.3 Today contextual/data-state work on code-bearing head `bd43257df4d6be16ed6ca9943c34b3285975b08b`, which passed Quality Gate `32444858881`, Android Build `32444858804`, Visual Regression `32444858884` and iOS Build `32444858880`; the three focused Today screenshots also received human review. PR #174 completed Stage 22.2 Design System v2 on code-bearing head `f0fd43594313b37a1a9882e595d764c75ef12eb7`: Quality Gate `32453061013`, Android Build `32453061003` and Visual Regression `32453060967` passed, and the deterministic Xcode Simulator compile gate in iOS Build `32453060996` passed before its separately bounded hosted-Simulator runtime acceptance completed. The authoritative semantic-token layer, reusable layout/typography/control/state/product primitives, ten-concept icon family, documented light/dark/accessibility rules and CI ownership enforcement are now in place, and duplicated global prayer/status/brand selectors are retired from `src/styles.css`. The Design System v2 item is complete; the broader UI/UX v2 programme remains partial because the Stage 23–27 theme-library, administration, device-specific, accessibility/visual-acceptance and legacy-migration work remains open.

---

## 23. Daily Prayer Display Theme Library

- [x] Build the shared prayer-board template/data contract
- [x] Implement Heritage Classic
- [x] Implement Minimal Modern
- [x] Implement Bold Countdown Focus
- [x] Implement Structured Split Board
- [ ] Implement Scenic Spiritual
- [ ] Implement Family & Classroom
- [ ] Add template preview, configuration, branding and managed-display assignment
- [ ] Complete mobile Today/home prayer-board template variants and visual Settings selector (Stage 23.13)

**Stage 23 progress note (2026-08-21):** PR #175 established the versioned six-template registry, shared prayer-board data contract, required/optional module policy, four-locale and bilingual presentation capabilities, controlled presentation configuration, validated local imagery/branding metadata, deterministic offline fallbacks and isolation of optional weather/announcement content. Code-bearing head `d154cf035e13282bfdc46e78ec7a7fa455914b0c` passed Quality Gate `32460157253`, Android Build `32460157312`, Visual Regression `32460157295` and iOS Build `32460157409`, including fresh iPhone/iPad Simulator runtime acceptance. Stage 23.1 is therefore complete. PR #176 completed Heritage Classic on code-bearing head `2f9535a059937bbd0ed06f8c2953e3c964f14255`, which passed Quality Gate `32471878090`, Android Build `32471878101`, Visual Regression `32471878106` and iOS Build `32471878114`, including fresh iPhone/iPad Simulator runtime acceptance. The Heritage board consumes the shared prayer-board data contract, preserves authoritative source/calculation/Iqamah semantics, distinguishes Athan/start from Iqamah, includes Jumu'ah and solar modules, supports legacy-compatible classic/emerald/midnight/sandstone presentation variants, and passed dedicated 1080p/4K English/Arabic/RTL long-mosque-name visual scenarios plus human screenshot review. Stage 23.2 is therefore complete. Stage 23.13 explicitly requires the mobile Today/home prayer surface to receive original phone-adapted variants of the prayer-board designs, retain one-tap bottom navigation including Qiblah and Settings, expose a visual Settings > Display Themes selector with previews/per-surface targeting, and pass phone/RTL/offline/visual/human acceptance before it may be marked complete. PR #177 completed Minimal Modern on code-bearing head `f20d73f6b3d76d371205508f43e930b50ea1ed84`, which passed Quality Gate `32478598067`, Android Build `32478597925`, Visual Regression `32478597889` and iOS Build `32478598033`, including fresh iPhone/iPad Simulator runtime acceptance. The Minimal Modern board consumes the shared prayer-board data contract, preserves authoritative calculation/source/Iqamah/next-prayer semantics, provides deliberate light/dark neutral variants, keeps current time and next-prayer/countdown prominent, presents five obligatory prayers with explicit Athan/start and Iqamah values, and includes restrained Jumu'ah and solar modules. Dedicated 1920×1080 and 3840×2160 English/Arabic/RTL long-mosque-name scenarios passed viewport/overflow assertions, and human screenshot review confirmed balanced full-height composition, clear hierarchy and composed RTL presentation. Stage 23.3 is therefore complete. PR #178 completed Bold Countdown Focus on code-bearing head `0de2c0123010cc05a261a4229040bc54416a25ca`, which passed Quality Gate `32485632660`, Android Build `32485632576`, Visual Regression `32485632537` and iOS Build `32485632581`, including fresh iPhone/iPad Simulator runtime acceptance. The Bold Countdown Focus board consumes the shared `PrayerBoardData` presentation contract, keeps current time and the active countdown dominant, preserves the full five-prayer Start/Iqamah timetable as a secondary band, and derives presentation-only next-prayer, pre-Iqamah and Iqamah-now focus states without changing calculation, source, Iqamah, notification or next-prayer semantics. Its permanent 1920×1080 and 3840×2160 English/Arabic/RTL scenarios enforce exact five-prayer rendering, no horizontal clipping, at least 90% viewport-height use and long-distance countdown sizing; human review confirmed balanced full-height composition, clear non-animation state transitions, composed RTL and an unwrapped 4K prayer label. Stage 23.4 is therefore complete. PR #179 completed Structured Split Board on code-bearing head `13ad0a56597bc37fc955a942f4db3d7f6c8a4bd1`, which passed Quality Gate `32489547751`, Android Build `32489547621`, Visual Regression `32489547618` and iOS Build `32489547663`, including fresh iPhone/iPad Simulator runtime acceptance. The Structured Split Board consumes the shared `PrayerBoardData` presentation contract, preserves authoritative calculation/source/Iqamah/notification/next-prayer semantics, presents five obligatory prayers in precisely aligned Start/Athan-versus-Iqamah columns, and keeps clock/date/next-prayer content in a separate information rail with compact Jumu'ah and sunrise/sunset modules. Permanent 1920×1080 and 3840×2160 English/Arabic/RTL scenarios enforce exact five-prayer rendering, split-region separation, Start/Iqamah column alignment, at least 90% viewport-height use and zero horizontal clipping; exact-head screenshots received human review and remained byte-identical after canonical formatting. Stage 23.5 is therefore complete. Two required visual templates and the mobile template work remain open.

---

## 24. Managed-masjid admin UX redesign

- [~] Continue the dedicated managed-masjid administration surface introduced in Stage 22
- [ ] Complete the administration information architecture and overview dashboard
- [ ] Complete display-theme management, assignment, publication and rollback UX

---

## 25. Device-specific UX refinement

- [~] Continue phone, tablet and desktop responsive refinement
- [ ] Complete Raspberry Pi Touch Display 2 close-range UX refinement
- [ ] Complete 1080p/4K TV and kiosk refinement for all required prayer-board templates

---

## 26. Accessibility, RTL and visual acceptance

- [~] Continue accessibility, RTL and human visual acceptance across redesigned surfaces
- [ ] Complete the full Stage 26 accessibility and internationalisation matrix
- [ ] Complete screenshot and golden-state coverage for all redesigned application/display surfaces

---

## 27. Legacy UI retirement and migration completion

- [ ] Remove legacy destination-hiding and superseded global CSS only after all consumers migrate
- [ ] Run the complete cross-platform regression suite after legacy retirement
- [ ] Update final design-system/platform documentation and screenshots
- [ ] Mark UI/UX v2 complete only after automated and human acceptance are complete

---

## Definition of Done for SalahOS v1

For the v1.0.0 repository/source release, completion means the implemented software and permanent automated acceptance gates are release-ready. Physical hardware and store-distribution acceptance may remain open only when the corresponding `[!]`/partial items stay explicitly documented and are not represented as tested:

- [x] Accurate five-prayer calculation engine is independently testable
- [~] Major recognised calculation methods are implemented and documented
- [x] Standard/Shafi'i-family and Hanafi Asr calculations are validated
- [x] High-latitude handling is implemented and transparent
- [x] Local mosque timetable mode works offline
- [x] Prayer-start and Iqamah/Jama'ah times are distinct
- [x] Jumu'ah timetable support is functional
- [x] GPS/manual location and timezone handling work correctly
- [x] DST/date rollover behaviour is tested
- [x] Gregorian and Hijri dates work
- [~] English and Arabic/RTL are production-ready
- [~] Mobile, Raspberry Pi and TV/kiosk layouts have automated/emulator/Simulator/browser validation; physical target acceptance remains open
- [x] Offline prayer calculation is fully functional
- [~] Notifications/Adhan are implemented within documented platform restrictions; physical delivery/audio-policy timing acceptance remains open
- [x] Permanent release-candidate gate set exists and has passed together on reviewed PR #101 revisions; the exact v1.0.0 release revision must pass the same four gates before tagging
- [x] Actual tested platform/build matrix is documented without overclaiming

**Tested platform/build matrix verification note (2026-08-16):** read-only Quality Gate run `31934421125` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete 58-file / 269-test suite, production build and deploy-artifact verification on the cleaned branch. `docs/PLATFORM_STATUS.md` is now the canonical tested matrix and distinguishes automated Web/PWA validation, repository-validated Raspberry Pi/Touch Display 2 and TV/browser-kiosk paths, and planned/unvalidated Android and iOS/iPadOS native paths. `README.md` and `BUILD.md` are synchronized to those boundaries rather than describing repository-validated Pi/TV browser paths as absent. Physical Raspberry Pi/Touch Display 2 and television acceptance, target-specific remote/full-screen behaviour, native Android/iOS projects and device validation, and visual regression remain open; this matrix does not imply those checks passed.

**v1 tracker reconciliation note (2026-08-17):** later Android/iOS native implementation, notification integration, offline/Pi continuity and documentation work supersede several partial markers that were left behind by historical verification notes. Those tracker markers are corrected above while the original dated notes are retained as a record of what was open at each earlier run. Current authoritative platform boundaries are in `docs/PLATFORM_STATUS.md`.

- [x] Final code review and regression pass are complete
- [x] v1.0.0 release policy explicitly preserves unperformed physical-hardware/store-distribution acceptance as documented follow-up rather than claiming it passed
