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

### 2026-08-16 — Device clock and resume recovery

- Added a small platform adapter that installs focus, restored-page and visibility-change refresh listeners without coupling the prayer domain to browser globals.
- The existing one-second clock now uses the same refresh callback, so system clock corrections are reflected from a newly sampled `Date` on the next tick.
- Focus, `pageshow` and `visibilitychange` trigger an immediate refresh after a suspended, backgrounded or restored display becomes active again.
- Unit tests verify all three event paths and confirm listener cleanup prevents refreshes after unmount.
- Implementation Quality Gate run `31908092487` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Notification and Adhan preference core

- Added a shared per-prayer preference model for Fajr, Dhuhr, Asr, Maghrib and Isha; Sunrise is intentionally excluded from obligatory-prayer delivery preferences.
- Notifications are opt-in by default, with optional 1–180 minute reminders, prayer-time alerts, default/silent sound, vibration and per-prayer Adhan enable flags.
- Preference parsing rejects invalid reminder ranges and safely defaults missing prayer entries.
- Settings persistence advanced from schema v1 to v2 with an explicit migration that preserves existing location, calculation, adjustment, source and mosque data while adding safe notification defaults.
- Settings export/import includes the new validated notification configuration.
- The shared settings UI exposes all current preference fields and explicitly states that actual delivery depends on a later platform scheduler and permission/background constraints.
- The duplicated mosque-library settings panel discovered during this integration was removed.
- Read-only Quality Gate run `31908401807` passed the domain/persistence core; implementation Quality Gate run `31908480344` passed formatting, typed lint, strict typecheck, all tests and production build after UI integration.
- Platform permission flows, notification scheduling, exact-alarm/reboot handling, duplicate suppression, DST rescheduling and actual Adhan audio delivery remain open.

### 2026-08-16 — Duplicate-safe notification schedule core

- Added deterministic notification intents with stable ids scoped by prayer date, prayer and delivery kind.
- Reminder intents can normalize into the previous civil date without losing the original prayer date identity.
- Repeated prayer inputs collapse to one intent id, preventing duplicate jobs at the domain boundary.
- Reconciliation compares installed and desired intents and emits explicit cancellation plus scheduling sets when recalculated prayer times change.
- Date rollover replaces prior-date jobs with next-date ids, while an already-correct schedule produces a no-op reconciliation.
- Tests cover reminder/prayer-time/Adhan intent generation, prior-day reminder normalization, duplicate input, recalculation replacement, date rollover and no-op reconciliation.
- Implementation Quality Gate run `31908783069` passed formatting, typed lint, strict typecheck, all tests and production build.
- Timezone-to-instant conversion, DST delivery tests, platform scheduling, permission handling, reboot recovery and actual delivery remain open.

### 2026-08-16 — Notification IANA/DST instant resolution

- Added wall-clock civil-time resolution against IANA timezone rules without deriving offsets from longitude or assuming one fixed offset for a date.
- Ordinary local times resolve to one exact instant and the offset used for that instant is retained.
- Repeated DST-end local times return both chronological candidates; notification scheduling selects and marks the earlier occurrence deterministically.
- Nonexistent DST-start wall-clock times return an explicit skipped result rather than being silently shifted or fabricated.
- Tests cover exact Sydney resolution, London repeated/skipped hours, Sydney repeated/skipped hours, invalid civil input and notification intent resolution policy.
- Read-only Quality Gate run `31910410104` passed formatting, typed lint, strict typecheck, all tests and production build.
- End-to-end Android/iOS/web delivery, permission/background behaviour and real platform DST scheduling remain open.

### 2026-08-16 — Platform-neutral notification scheduler adapter

- Added an asynchronous scheduler adapter contract with list, schedule and cancel operations that can be implemented by Android, iOS or another supported runtime.
- Exact notification records retain stable id, prayer, delivery kind, epoch instant, IANA timezone, resolved offset, DST ambiguity policy, sound and vibration metadata.
- The executor reconciles installed records against desired exact-instant resolutions and cancels stale records before scheduling replacements.
- Reapplying an identical desired schedule is a no-op, which prevents repeated duplicate scheduling at the adapter boundary.
- Notifications that resolve to nonexistent DST-gap local times cancel any previously installed record and are not rescheduled.
- Conflicting desired or installed records sharing one stable id are rejected rather than silently choosing one.
- An in-memory conformance adapter verifies initial scheduling, idempotence, recalculation replacement, DST-gap cancellation, metadata replacement and conflicting-id rejection.
- Read-only Quality Gate run `31910761615` passed formatting, typed lint, strict typecheck, all tests and production build.
- Native platform scheduling, notification permissions, reboot restoration and background/exact-delivery constraints remain open.

### 2026-08-16 — Manual prayer adjustment indicators and reset

- Added pure helpers for detecting non-zero prayer offsets, resetting only the adjustment set and deciding whether an applied adjustment belongs to the currently displayed source.
- Prayer cards use the calculation provenance value rather than merely echoing persisted settings, so the signed badge reflects the adjustment that was actually applied by the prayer engine.
- Local-mosque obligatory start times suppress calculated adjustment badges because the mosque timetable replaces those displayed values; Sunrise remains calculated and can still show its own applied offset.
- Added a dedicated reset-to-method-default action that clears only manual prayer offsets while preserving calculation method, Asr convention, high-latitude rule, location, mosque, notifications and other settings.
- English and Arabic labels plus responsive badge/reset styling were added to the shared settings/dashboard shell.
- Tests cover positive and negative offsets, zero/missing offsets, source-aware display, the Sunrise/local-mosque exception, active-adjustment detection and non-mutating reset behaviour.
- Implementation Quality Gate run `31911208279` passed formatting, typed lint, strict typecheck, all tests and production build.
- The combined Stage 7 high-latitude/manual-adjustment indicator remains partial until the high-latitude visual indicator is completed and verified.

### 2026-08-16 — Source-aware high-latitude fallback indicators

- Added a pure display helper that decides whether a high-latitude fallback belongs to the currently displayed prayer source.
- Prayer cards now show a fallback badge only when the displayed calculated time actually used the configured high-latitude rule.
- The badge names the active rule using the existing localised Angle Based, Middle of the Night or One Seventh labels.
- Local-mosque obligatory start times suppress calculated fallback indicators because the timetable replaces those displayed values; Sunrise remains calculated and is still eligible.
- The shared provenance note now uses the same source-aware decision and names the configured rule instead of reporting a hidden calculated fallback.
- Tests cover calculated and calculated-adjustment sources, no-fallback cases, local-mosque obligatory suppression and the Sunrise/local-mosque exception.
- Read-only Quality Gate run `31911591791` passed formatting, typed lint, strict typecheck, all tests and production build.
- Nearest-latitude and nearest-valid-day strategies for extreme polar conditions remain open research and are not implied by this UI completion.

### 2026-08-16 — Current and next prayer highlighting

- Added selected-source current-prayer state alongside the existing next-prayer state.
- Current prayer is the latest available obligatory start at or before the current local time; Sunrise remains supplementary and is never treated as the current obligatory prayer.
- Before the first available obligatory prayer of the civil day, current prayer is null rather than fabricating a previous-day state.
- After Isha, Isha remains current while next prayer rolls to tomorrow Fajr using the existing tomorrow-source schedule.
- Today's next-prayer comparison is strict, so at an exact prayer start the new prayer is current and the following obligatory prayer is next rather than one card being both.
- Current and next prayer cards use distinct classes; the current card also carries a localised English/Arabic current-prayer badge.
- Source-domain tests cover local-mosque current selection, Sunrise exclusion, post-Isha rollover and the pre-Fajr no-current case.
- Read-only Quality Gate run `31911967092` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Sunrise supplementary presentation

- Formalised prayer presentation roles so Sunrise is the sole supplementary row and Fajr, Dhuhr, Asr, Maghrib and Isha remain obligatory.
- The shared dashboard already exposes Sunrise separately in the six-row daily sequence, and selected-source current/next state excludes Sunrise from obligatory prayer selection.
- The shared prayer-card UI now applies supplementary styling through the tested presentation role instead of a component-local prayer-name comparison.
- Tests verify Sunrise's supplementary role and the obligatory role of all five daily prayers.
- Read-only Quality Gate run `31912253750` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Asr convention terminology and explanation

- Preserved `standard` and `hanafi` as the internal mathematical Asr conventions.
- Added a typed presentation model proving Standard uses shadow factor 1 and Hanafi uses shadow factor 2.
- Recorded the Standard association with Shafi'i, Maliki and Hanbali practice and the Hanafi association separately.
- Added English and Arabic settings guidance that explains the two shadow factors and notes that both include the noon shadow.
- Linked the selector to its explanatory text with `aria-describedby`.
- Read-only Quality Gate run `31912659728` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Runtime light, dark and system themes

- Added a runtime theme adapter used by the shared application shell.
- Explicit Light and Dark preferences apply their effective theme directly without a system listener.
- Follow-system resolves the operating-system color-scheme preference and reacts to later preference changes.
- Listener cleanup is verified so changing theme mode or unmounting does not retain stale handlers.
- Existing persisted theme selection and CSS variables remain the shared styling source across form factors.
- Read-only Quality Gate run `31912934726` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Notification platform limitations

- Added `docs/NOTIFICATION_LIMITATIONS.md` as the shared product contract for notification and Adhan delivery claims.
- Distinguished deterministic local scheduling intent from operating-system or browser delivery guarantees.
- Documented Web/PWA limits around permissions, closed/suspended pages, event-driven service workers and kiosk process lifetime.
- Documented Android constraints around permission policy, exact scheduling restrictions, battery/background controls, reboot reconstruction and audio lifecycle.
- Documented iOS/iPadOS constraints around user-controlled permission, operating-system presentation, background execution and notification/audio policy.
- Documented Raspberry Pi/desktop/kiosk behaviour across active sessions, sleep, termination, power loss and startup recalculation.
- Read-only Quality Gate run `31913144213` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Adhan audio redistribution rights policy

- Added `src/domain/adhanAudioRights.ts` with a minimum completeness rule for any future project-bundled Adhan recording.
- Accepted rights bases are public domain, permissive licence or direct permission; each record still requires identified rights evidence.
- Tests reject missing recording identity, title, rights holder/source authority, evidence reference and invalid blank attribution.
- Added `docs/ADHAN_AUDIO_RIGHTS.md` clarifying that public availability does not imply redistribution rights and that uncertain recordings are not eligible for bundling.
- Kept future user-selected local audio separate from project-bundled assets; this batch does not claim local audio selection or playback is implemented.
- Read-only Quality Gate run `31913475048` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — iOS and iPadOS validation evidence boundary

- Added `docs/IOS_VALIDATION_STATUS.md` to distinguish shared application CI from native Apple-platform validation.
- Recorded which checks require macOS/Xcode and which require a physical iPhone or iPad.
- Kept native shell, notification delivery, audio lifecycle, reboot recovery and signing/distribution items open until exercised in the required environment.
- Explicitly prohibited committing signing certificates, private keys, provisioning profiles or distribution credentials.
- Read-only Quality Gate run `31914072847` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — iOS build and signing documentation

- Added `docs/IOS_BUILD_SIGNING.md` with repository-safe local development, Release archive and CI signing procedures.
- Documented capability/entitlement review and required evidence without pre-claiming native support.
- Explicitly prohibited committing signing private keys, certificate bundles, account credentials, distribution API keys and CI secret values.
- Kept actual Xcode build, archive, simulator/device and distribution validation open until executed in the required Apple environment.
- Read-only Quality Gate run `31914265959` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Gregorian leap year, year boundary and local midnight

- Added Gregorian leap-day coverage for 2024-02-29 and its transition to 2024-03-01.
- Added consecutive Gregorian year-boundary coverage for 2026-12-31 and 2027-01-01.
- Added production IANA location-context coverage across Sydney local midnight from 23:59:59 to 00:00:00.
- Verified the local civil date advances exactly at midnight while retaining the resolved Australia/Sydney timezone and expected UTC offset for the fixture.
- Read-only Quality Gate run `31914501854` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — geographic integration matrix

- Expanded the production location → IANA timezone → prayer-calculation integration matrix on the March equinox.
- Verified Sydney, Melbourne, Cairo, Istanbul, Karachi, Jakarta, London, New York, Oslo and Quito resolve through the offline timezone lookup with their expected UTC offsets.
- Verified each ordinary-location fixture produces available Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha values in strict chronological order.
- Explicitly covered northern, southern and equatorial latitude bands while keeping Tromsø and extreme-polar seasonal validation separate.
- Read-only Quality Gate run `31914980103` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — Madinah and Tromsø polar-season validation

- Added Madinah to the ordinary-location equinox matrix and verified `Asia/Riyadh`, UTC+03 and strict prayer/sunrise ordering.
- Verified Tromsø resolves to `Europe/Oslo`, using UTC+02 for the June fixture and UTC+01 for the December fixture.
- Verified polar summer does not fabricate Fajr, Sunrise, Maghrib or Isha when the required astronomical events/night bounds are unavailable.
- Verified polar winter keeps unavailable Sunrise and sunset-based Maghrib explicit and does not falsely claim a high-latitude fallback.
- Read-only Quality Gate run `31915190467` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — polar-resolution strategy research

- Added `docs/POLAR_RESOLUTION_RESEARCH.md` separating ordinary high-latitude night-fraction adjustments from true polar-circle estimation.
- Documented nearest-location/latitude (Aqrab al-Bilad) and nearest-valid-day (Aqrab al-Ayyam) approaches against the pinned calculation reference and published prayer-time guidance.
- Retained unresolved polar events as the default and specified that future estimated values must be explicit opt-in choices with reference latitude/date provenance.
- Defined deterministic acceptance criteria for bounded nearest-latitude and nearest-valid-day searches without implementing either strategy prematurely.
- Read-only Quality Gate run `31915439365` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — manual mosque timetable entry

- Added strict manual `HH:MM` parsing for all five obligatory prayer starts with optional fixed Iqamah times.
- Added deterministic manual-day creation and same-date replacement within the existing validated `MosqueTimetable` model.
- Added English/Arabic settings UI for mosque name, Gregorian date, five prayer starts and optional Iqamah values.
- Reused the existing offline mosque library so manually entered days persist, remain selectable, and activate local-mosque mode without a second storage format.
- Added tests for clock parsing, complete day creation, invalid/missing values, deterministic replacement and mosque-name mismatch protection.
- Repaired the sourced-dashboard presentation contract exposed by strict typechecking, keeping calculation metadata under the base dashboard and computing source-aware aggregate high-latitude fallback state.
- Read-only Quality Gate run `31916508659` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `3d50f0204b7a2162ab92af891467852364ff1f48`.

### 2026-08-16 — mosque integration research

- Added `docs/MOSQUE_INTEGRATION_RESEARCH.md` with provider-selection and failure-handling requirements for optional remote mosque sources.
- Recorded MAWAQIT as a vetted future direct-integration candidate while requiring a documented or explicitly authorized provider interface before implementation.
- Recorded Masjidbox's provider-supported iCal and CSV/Excel portability paths and its explicit lack of a public prayer-times API.
- Required future provider adapters to terminate at the existing validated `MosqueTimetable` model, retain offline last-known-good data, preserve provider/mosque provenance and surface stale/error state without silent calculated fallback.
- Kept all direct remote provider adapters unimplemented; this milestone closes research only.
- Read-only Quality Gate run `31916720065` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — mixed-direction text isolation

- Added a reusable semantic `BidiText` renderer using `<bdi dir="auto">` for dynamic values embedded in localized UI text.
- Isolated rendered calculation-method names, IANA timezone identifiers, mosque names and Jumu'ah session labels from the surrounding document direction.
- Added `dir="auto"` to dynamic saved-location, calculation-method and mosque option/input values so user-entered Arabic/Latin content can determine its own direction.
- Added static-render tests proving mixed Arabic/Latin content and an IANA timezone identifier produce bidirectionally isolated markup without changing the parent page direction.
- Kept the separate RTL-at-every-breakpoint tracker item partial because deterministic markup tests do not replace visual browser validation.
- Read-only Quality Gate run `31917001417` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `11a0459595e36c7981ccbe72c133b92ec5d3ce67`.

### 2026-08-16 — high-contrast readable typography

- Increased small supporting labels and prayer-time captions to readable minimum sizes with explicit line heights and stronger weight where appropriate.
- Replaced late stylesheet dark-theme hard-codes with semantic theme variables so secondary text, borders and subtle backgrounds remain valid in light/dark/system themes.
- Added `prefers-contrast: more` handling that strengthens secondary text and structural borders and removes supplementary-card opacity reduction.
- Added `forced-colors: active` system-color mappings so operating-system high-contrast modes can control canvas, text, borders, highlights and focus treatment.
- Read-only Quality Gate run `31917294038` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `c23c76db4ac07b5da9b3c3406b4d63c2cebb0c91`.

### 2026-08-16 — privacy and threat model

- Added `docs/PRIVACY_THREAT_MODEL.md` covering privacy-relevant data, trust boundaries, local-first defaults, permission/data-minimisation expectations and abuse/failure scenarios.
- Defined safeguards for precise location, saved locations, mosque selections, timetable/settings imports, notification schedules, optional remote integrations, logs, caches and information visible on shared displays.
- Added explicit review gates for future networked and native functionality without claiming those controls are implemented yet.
- Kept separate security tracker items open for remote-call security, committed-secret prevention, dependency review, CSP and native-permission review.
- Read-only Quality Gate run `31917509097` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — web Content Security Policy baseline

- Added an in-document Content Security Policy baseline to `index.html` that defaults resources to the same origin and denies plugins/frames.
- Kept only narrowly required exceptions for inline styles, development websocket connections, local/data images and local/blob media.
- Added `docs/WEB_SECURITY_HEADERS.md` documenting production response-header hardening and the boundary between repository controls and host/CDN configuration.
- Read-only Quality Gate run `31918434190` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — background resume refresh

- Tightened runtime refresh listeners so hidden document transitions do not trigger work and becoming visible refreshes immediately.
- Focus and page-restore events continue to refresh the application clock immediately.
- The application refresh callback replaces wall-clock `now`, forcing prayer state and countdown recomputation from current time after a background pause.
- Added regression coverage for hidden-to-visible resume behavior and listener cleanup.
- Kept system sleep/wake recovery and significant system-clock change detection as separate open reliability items.
- Read-only Quality Gate run `31918624386` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — significant system-clock change detection

- Added a platform-neutral detector that compares wall-clock elapsed time with monotonic elapsed time using a configurable threshold.
- Added deterministic coverage for normal progression, forward corrections, backward corrections, sub-threshold corrections, monotonic resets, explicit baseline reset and invalid input.
- Integrated detector sampling into the live one-second runtime clock loop while resetting its baseline on explicit focus/page-restore/visible-resume refreshes.
- Kept system sleep/wake recovery open because browser monotonic-clock behavior across operating-system sleep is platform-dependent and has not been physically verified.
- Read-only Quality Gate run `31919019029` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — system sleep/wake recovery

- Added a platform-neutral elapsed-gap detector for runtime timer gaps representative of operating-system sleep/wake suspension.
- Integrated the detector with the live one-second clock loop so a resumed runtime re-baselines clock-discontinuity detection and immediately recomputes state from fresh wall time.
- Explicit focus, page-restore and visible-resume refreshes reset both runtime baselines, keeping those recovery paths deterministic and separate from clock-correction classification.
- Added deterministic coverage for ordinary progression, configurable threshold behavior, long gaps, backward wall-clock corrections, explicit reset and invalid input.
- Read-only Quality Gate run `31919909102` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.

### 2026-08-16 — invalid system time recovery

- Added validated wall-clock conversion that returns `null` rather than constructing an invalid `Date` for non-finite or out-of-range values.
- Runtime clock state is nullable; invalid reads suspend prayer/date/time computation, clear clock-discontinuity baselines and show a localized corrective alert instead of throwing downstream.
- The first subsequent valid sample re-establishes sleep/wake and clock-change detector baselines and resumes live calculation automatically.
- Added deterministic coverage for valid current/pre-epoch values, non-finite values, JavaScript Date-range overflow and injected wall-clock readers.
- Read-only Quality Gate run `31920144935` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.

### 2026-08-16 — unavailable calculation results

- Added an explicit dashboard calculation-result boundary that distinguishes successful schedules from calculation failure.
- Successful schedules report prayer rows whose astronomical result remains unavailable; the UI keeps the neutral dash and shows localized guidance instead of inventing a time.
- Calculation exceptions degrade to a localized non-crashing state that directs the user to verify location and calculation settings.
- Added deterministic coverage for a normal Sydney schedule, polar-day partial unavailability and conversion of a rejected calculation input into the safe unavailable result.
- Read-only Quality Gate run `31920344383` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.

### 2026-08-16 — privacy-safe structured error logging

- Added a fixed structured error schema for runtime-clock and prayer-calculation failure events.
- The logger accepts only fixed error codes and emits only component, code and severity; it exposes no arbitrary metadata path that could capture coordinates, location labels, mosque names, exception messages, stacks or URLs.
- Invalid-system-time logging is deduplicated until the runtime clock recovers; calculation-unavailable logging follows availability-state transitions.
- Unit tests lock the exact serialized schema and verify location/error-detail fields are absent.
- Read-only Quality Gate run `31920530983` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.

### 2026-08-16 — precise location data minimisation

- Browser location acquisition remains explicit and one-shot; no continuous location watch is started.
- Default browser geolocation uses low-accuracy mode and permits reuse of a recent fix for five minutes rather than forcing a fresh precise sensor fix.
- The adapter retains only latitude/longitude needed for local timezone and prayer calculations plus the source marker; accuracy, altitude, heading, speed and browser capture timestamp are discarded immediately.
- High-accuracy acquisition requires an explicit caller opt-in.
- Read-only Quality Gate run `31920709447` passed formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — secrets and credential policy

- Added a root `.gitignore` covering local environment files, private keys/certificates, signing stores and platform-local configuration.
- Added `scripts/check-sensitive-files.mjs` and wired it into both `npm run check` and the read-only Quality Gate before the existing verification steps.
- Added `docs/SECRETS_POLICY.md` requiring encrypted CI/platform secret stores, prohibiting committed credentials/API keys and documenting revocation/rotation after accidental exposure.
- The repository-side guard intentionally rejects high-risk file classes without claiming filename checks can detect every possible inline secret; future network integrations still require diff review and hosting-platform secret scanning.
- Read-only Quality Gate run `31921396802` passed the sensitive-file policy, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — dependency vulnerability review

- Added `npm run security:audit` using `npm audit --audit-level=moderate` and wired it into both local `npm run check` and the read-only Quality Gate.
- CI continues to install the committed lockfile with `npm ci --ignore-scripts` before auditing the resolved dependency graph.
- Added `docs/DEPENDENCY_SECURITY.md` documenting the minimal direct runtime dependency surface, exact-version/lockfile review policy and release-time re-audit requirement.
- The audit result is treated as point-in-time advisory evidence rather than a permanent guarantee; the threshold must not be weakened merely to make CI pass.
- Read-only Quality Gate run `31921578803` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — settings to recalculation integration

- Added `src/integration/settingsRecalculation.test.ts` to exercise persisted settings through the production dashboard calculation path.
- The integration saves and reloads a Sydney configuration, recalculates, persists changed method/Asr/high-latitude/Hijri/adjustment settings, reloads again and verifies the production dashboard reflects the new configuration.
- The test verifies both provenance/configuration fields and changed Asr/Fajr local prayer times, proving a real recalculation rather than serialization alone.
- Read-only Quality Gate run `31921801532` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — date rollover integration

- Added `src/integration/dateRollover.test.ts` around the exact Sydney local-midnight boundary.
- At 23:59:59 the production dashboard keeps August 16 as today and identifies tomorrow Fajr; at 00:00:01 it advances today/tomorrow to August 17/18 and re-bases Fajr to the current civil day.
- The fixture verifies local clock, Gregorian date, today/tomorrow schedules, next-prayer day offset and the six-row dashboard prayer presentation move together.
- Read-only Quality Gate run `31921977275` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — notification scheduling integration

- Added `src/integration/notificationScheduling.test.ts` across dashboard prayer calculation, notification preferences, intent generation, IANA civil-time resolution and the scheduler adapter.
- The fixture schedules Fajr reminder/prayer-time jobs, changes the calculated Fajr time by +5 minutes, and verifies stale jobs are cancelled before replacement at the new exact instants.
- A third application of the same resolved schedule performs no operations, proving scheduler reconciliation is idempotent and does not duplicate jobs.
- Read-only Quality Gate run `31923105355` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — offline startup integration

- Added `src/integration/offlineStartup.test.ts` for a previously configured device starting without network access.
- The fixture persists Sydney location/calculation settings, makes `fetch` fail, reloads the stored state, and builds the production prayer dashboard locally without issuing a network request.
- It verifies the restored method, Hijri correction, manual prayer adjustment, Sydney timezone, civil date and six prayer rows.
- This fixture covers the application startup/data path; browser service-worker cache/offline reload validation remains a separate PWA verification item.
- Read-only Quality Gate run `31923333276` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — offline manual city/location search

- Added a vendored IANA tzdb 2026c principal-location catalogue generated from public-domain `zone1970.tab`; runtime search requires no geocoding service or network request.
- Added `src/domain/locationSearch.ts` with normalized/ranked search across city, country names, ISO country codes, timezone paths and IANA comments, capped to a small result set for the UI.
- Added English/Arabic location-search UI, privacy guidance, responsive result controls and immediate selection into the existing coordinate/prayer-calculation path.
- Added domain coverage for catalogue size, Sydney coordinates/timezone, country-name/code queries, accent/separator normalization and limits, plus `src/integration/manualLocationSearch.test.ts` to verify search result → production dashboard resolution.
- Read-only Quality Gate run `31924790649` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 231 tests and production build.

### 2026-08-16 — persisted timezone cache

- Extended the location prayer context/dashboard input to consume an already-resolved persisted IANA timezone while retaining the bundled coordinate lookup as the fallback.
- The app restores cached timezone data on startup, settings import, saved-location selection and offline city/location selection; fresh GPS or raw coordinate changes clear the cache and trigger local resolution.
- Persisted settings and saved favourites now validate timezone identifiers before they are accepted for runtime use.
- Added `src/integration/timezoneCache.test.ts` to prove a restored cached timezone is consumed by the production dashboard and an invalid cached timezone is rejected.
- Read-only Quality Gate run `31925162040` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.

### 2026-08-16 — PWA offline reload and cache migration

- Added deterministic lifecycle coverage that evaluates the committed `public/sw.js` directly in a controlled worker-like runtime rather than duplicating its caching logic in a test helper.
- Verified install pre-caches the root shell, manifest and first-party icon assets and requests immediate activation.
- Verified a same-origin navigation reload falls back to cached root HTML when the network request rejects.
- Bumped the application shell cache to `salahos-shell-v2` and verified activation removes stale SalahOS shell versions while leaving unrelated origin caches untouched before claiming clients.
- Together with the existing offline-startup integration, this verifies the configured application remains useful with network access unavailable after its shell and settings have been established.
- Read-only Quality Gate run `31926514357` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build.

### 2026-08-16 — Iqamah settings controls

- Extended manual mosque prayer drafts with an explicit Iqamah mode: unconfigured, fixed local clock time, or offset minutes after prayer start.
- Fixed times continue to use strict 24-hour `HH:MM` parsing; offsets accept integer values from 0 through 180 minutes and reuse the existing timetable validation that rejects next-day rollover.
- Added English/Arabic per-prayer controls that conditionally show the fixed-time or offset input and write directly into the existing mosque-timetable Iqamah rule schema.
- Added domain coverage for fixed, offset and disabled modes plus invalid offsets/fixed times, and `src/integration/iqamahSettings.test.ts` to verify offset persistence and production local-mosque resolution.
- Read-only Quality Gate run `31926961935` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build.

### 2026-08-16 — verified Web/PWA build and deployment contract

- Added root `BUILD.md` with the currently verified Web/PWA clean-install, quality, build, preview, static-host deployment, cache/update, offline smoke-check and release-boundary procedures.
- Added `npm run verify:web-build` and made it part of `npm run check` plus the read-only Quality Gate immediately after `npm run build`.
- The verifier requires non-empty built HTML, manifest, service-worker and first-party icon artifacts; validates root/standalone manifest expectations and declared icons; and confirms the deployed `dist/sw.js` is byte-for-byte identical to the `public/sw.js` source exercised by the service-worker lifecycle tests.
- The documented platform matrix deliberately leaves Android, iOS, Raspberry Pi and TV/kiosk build/deployment paths unverified until their real platform-specific gates exist.
- Read-only Quality Gate run `31927318102` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 238 tests, production build and deploy-artifact verification.

### 2026-08-16 — dependency license policy gate

- Added `npm run security:licenses`, backed by `scripts/check-dependency-licenses.mjs`, and made it part of both `npm run check` and the read-only Quality Gate.
- The policy validates every non-root npm lockfile package, fails on missing/unreviewed license expressions, and keeps the production dependency allowlist permissive-only.
- Verified 4 production packages: 3 MIT and 1 CC0-1.0.
- Verified 157 development-only packages; 12 MPL-2.0 entries belong to `lightningcss` build tooling and are admitted only by the development-only policy after explicit review/documentation.
- Added `docs/DEPENDENCY_LICENSE_REVIEW.md` covering the policy, the development-only MPL-2.0 exception, dependency-change workflow, legal-review boundary and future native/non-npm review boundary.
- Read-only Quality Gate run `31928221970` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.

### 2026-08-16 — troubleshooting and documentation-link verification

- Added `docs/TROUBLESHOOTING.md` for the currently verified shared/Web/PWA install, deployment, prayer/location/timezone, offline, persistence, mosque/Iqamah, notification-intent, RTL, security/license and reproducible bug-report paths while keeping native platform validation explicitly separate.
- Added a README documentation index linking the build, troubleshooting, notification-limitations, dependency-license, privacy, architecture, research, verification and implementation-tracker documents.
- Added `npm run docs:links`, backed by `scripts/check-doc-links.mjs`, and made it part of both `npm run check` and the read-only Quality Gate.
- The documentation-link verifier successfully resolved local Markdown links across all 27 root/docs Markdown files on the verified branch.
- Synchronized the duplicate Stage 19 notification-platform-limitations marker to complete because `docs/NOTIFICATION_LIMITATIONS.md` was already implemented and verified under Stage 10 by Quality Gate run `31913144213`; no new native delivery capability is claimed by this tracker correction.
- Read-only Quality Gate run `31928551210` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.

### 2026-08-16 — PWA raster install icons

- Added first-party 192×192 and 512×512 PNG install icons for both normal and maskable PWA purposes while retaining the existing SVG source assets.
- Added `scripts/generate_pwa_icons.py`, a deterministic Python-standard-library renderer with a `--check` mode that byte-compares all four committed PNGs against regenerated output.
- Added the reproducibility check to the read-only Quality Gate so raster asset drift fails CI.
- Extended the Web/PWA artifact verifier to require the raster icons in `dist/`, validate PNG signatures/dimensions and require matching manifest `sizes`, `type` and `purpose` metadata.
- Read-only Quality Gate run `31929295284` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.

### 2026-08-16 — prayer presentation component coverage

- Extracted production `NextPrayerBlock` and `PrayerCard` presentation components from `App` while retaining prayer calculation, source selection, localization and formatting decisions in the application layer.
- Added server-rendered component tests for configured/unconfigured next-prayer state, countdown/tomorrow presentation, current/next prayer state, prayer start and Iqamah, high-latitude/manual-adjustment indicators, and supplementary-prayer Iqamah suppression.
- Retained the existing bidirectional-text component coverage and added no DOM/test-framework dependency.
- Read-only Quality Gate run `31929598905` passed all 51 test files / 242 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Stage 17 viewport, screenshot, RTL visual-alignment and scalable-text/accessibility regression items remain open and are not implied by this component-level gate.

### 2026-08-16 — Raspberry Pi kiosk deployment scripts

- Added `scripts/kiosk/run-salahos-kiosk.sh` to serve the built Web/PWA bundle on loopback and launch Chromium with kiosk/full-screen-oriented flags after the local page becomes reachable.
- Added `scripts/kiosk/install-labwc-autostart.sh` for idempotent user-session autostart management that preserves unrelated labwc entries and supports dry-run/removal.
- Added `docs/RASPBERRY_PI_KIOSK.md` covering the validated Raspberry Pi OS Desktop / Chromium / labwc deployment path and explicitly separating repository validation from physical Touch Display 2/device acceptance.
- Added five deterministic tests covering shell syntax, localhost/Chromium command construction, invalid-port rejection, autostart idempotence/preservation, and managed-block removal.
- Read-only Quality Gate run `31929984829` passed all 52 test files / 247 tests plus security, dependency, documentation, PWA raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi/Touch Display 2 boot, orientation, touch/rendering, power-loss/reboot and long-duration acceptance remain open; desktop-session autostart is therefore not treated as complete proof of unattended power-on launch.

### 2026-08-16 — Raspberry Pi Touch Display 2 setup documentation

- Added `docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md` covering current Touch Display 2 5-inch, 7-inch and 10-inch panel resolutions, portrait-native orientation and Raspberry Pi OS Desktop rotation controls.
- Documented supported Raspberry Pi generation/cabling boundaries, Raspberry Pi Imager installation, touch/on-screen-keyboard behavior, brightness controls and the existing local Chromium/labwc SalahOS kiosk deployment path.
- Added an explicit physical acceptance matrix for orientation, touch ergonomics, boot/autostart behavior, offline operation and long-duration use instead of treating documentation as hardware validation.
- Read-only Quality Gate run `31931305063` passed repository security/dependency/documentation policies, raster reproducibility, formatting, lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.
- Touch-first layout fixture work and all physical Raspberry Pi/Touch Display 2 validation remain open.

### 2026-08-16 — Touch Display 2 layout fixture

- Added an explicit `touch-display-2` browser fixture that reuses the production next-prayer and prayer-card presentation components instead of maintaining a parallel mock UI.
- Added deterministic 5-inch/7-inch 720×1280 and 10-inch 1200×1920 portrait profiles with landscape dimension swapping, enlarged touch-oriented presentation and English/Arabic RTL fixture modes.
- Added six tests covering fixture activation/defaults, invalid-option fallback, exact native viewport contracts, current/next prayer rendering and Arabic RTL output.
- Documented fixture URLs and the requirement that future visual automation set the browser viewport to the corresponding native dimensions.
- Read-only Quality Gate run `31931801626` passed all 53 test files / 253 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Touch Display 2 rendering/touch validation and Stage 17 screenshot, clipping, alignment and scalable-text checks remain open.

### 2026-08-16 — Smart-display mode

- Added a live `?mode=smart-display` presentation that remains inside the normal application runtime and consumes the shared sourced prayer dashboard.
- Added a large live clock, large next-prayer countdown, five obligatory prayer cards, configured Iqamah, current/next highlighting, configured Jumu'ah sessions and English/Arabic offline/error states.
- Added five component tests covering explicit mode activation, five-prayer/Iqamah/current-next rendering, Jumu'ah rendering, unconfigured location handling and Arabic/offline presentation.
- Documented direct Chromium kiosk launch through the existing `SALAHOS_KIOSK_URL` override using the smart-display query.
- Read-only Quality Gate run `31932489699` passed 54 test files / 258 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Automatic rollover/DST display verification, sleep/wake display verification, burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.

### 2026-08-16 — Smart-display runtime continuity

- Added three integration tests that render the production smart-display presentation from the shared sourced dashboard across local-date rollover, a real Sydney DST transition and a detected sleep/wake gap.
- Verified Sydney local midnight advances the displayed civil date and prayer schedule from 2026-08-16 to 2026-08-17.
- Verified the 2026-10-04 Sydney daylight-saving transition changes the dashboard offset from UTC+10 to UTC+11 and the rendered clock from 01:59 to 03:00 while preserving `Australia/Sydney`.
- Verified a simulated multi-hour sleep/wake gap is detected and the resumed display is rebuilt from fresh wall time with a new countdown/render.
- Read-only Quality Gate run `31932809636` passed 55 test files / 261 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi/TV suspend, reboot and long-duration acceptance remain hardware-only checks; burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.

### 2026-08-16 — Smart-display TV usability and deployment

- Added practical smart-display exit handling for Escape, Backspace, BrowserBack and GoBack while preserving unrelated URL parameters/hash state.
- Added three unit tests for display-mode exit key mapping and non-display/unrelated-key no-op behaviour.
- Added a bounded 60-minute stepped pixel-shift cycle for major long-lived smart-display regions plus a reduced-motion override, with two deterministic stylesheet contract tests.
- Added `docs/TV_KIOSK_DEPLOYMENT.md` covering the validated Linux/Raspberry Pi Chromium kiosk path, HDMI browser-host deployment, TV-browser acceptance criteria, remote-key limitations, casting/mirroring boundaries and unsupported native-TV-package claims.
- Read-only Quality Gate run `31933200746` passed 57 test files / 266 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical TV remote mappings, HDMI-CEC, panel-specific burn-in behaviour and long-duration target-device acceptance remain hardware checks.

### 2026-08-16 — Raspberry Pi/kiosk continuity lifecycle

- Added a dedicated integration suite for the shared Raspberry Pi/kiosk lifecycle using production persisted-settings, prayer-dashboard and sleep/wake code.
- Verified configured location/timezone, method, locale, Hijri correction and prayer adjustments survive a cold settings reload.
- Forced network access unavailable and verified the restored dashboard remains fully calculable without any fetch call.
- Verified a detected multi-hour suspend-style gap rebuilds from fresh wall time with a refreshed countdown.
- Verified a simulated cold restart just after Sydney local midnight generates 2026-08-17 rather than retaining the previous day's schedule.
- Read-only Quality Gate run `31933758199` passed 58 test files / 269 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi boot/login policy, power-loss/reboot behaviour, Touch Display 2 rendering/touch and long-duration hardware acceptance remain device-only checks.

### 2026-08-16 — Core release verification on main

- Quality Gate run `31934011315` checked out exact merged main commit `49ac83379cdc357cd5ecb43d964291ec44793906` in a clean hosted workspace.
- Clean lockfile installation used `npm ci --ignore-scripts`: 139 packages installed, 140 audited and zero vulnerabilities reported.
- Formatting, lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification all passed.
- Prayer parity/reference coverage passed through `referenceParity.test.ts` and `methods.reference.test.ts`.
- DST/high-latitude regression coverage passed through timezone/zoned-civil-time/high-latitude tests plus prayer-engine and smart-display runtime coverage.
- Deterministic offline verification passed through offline startup, service-worker lifecycle and Raspberry Pi/kiosk continuity suites.
- English/Arabic visual regression, physical layout/device acceptance, Android/iOS notification validation, final review, blocker reconciliation, release notes and release tagging remain open.

### 2026-08-16 — Tested platform/build matrix

- Added `docs/PLATFORM_STATUS.md` as the canonical capability matrix, with explicit Automated, Repository-validated path and Planned status definitions.
- Synchronized README platform status and the BUILD target table with currently verified Web/PWA, Raspberry Pi/browser-kiosk and TV/browser-host paths.
- Kept physical Raspberry Pi/Touch Display 2 and TV acceptance distinct from repository-side deployment verification.
- Kept Android and iOS/iPadOS native shells, native adapters, builds and device validation explicitly planned/unvalidated.
- Read-only Quality Gate run `31934421125` passed the complete 58-file / 269-test suite plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- README screenshots, visual regression, native mobile work and physical target-device acceptance remain separately open.

### 2026-08-16 — Android native foundation

- Added the committed Capacitor Android project and app identity `com.privacyog.salahos`, reusing the shared React/prayer-domain implementation.
- Added a native-aware current-location adapter that keeps the browser path intact and uses the first-party Capacitor geolocation bridge on native Android.
- Verified foreground permission check/request, fail-closed denial, one-shot low-accuracy-default acquisition, timeout normalization and coordinate-only data retention with four deterministic tests.
- Android manifest permissions are limited to foreground coarse/fine location plus the generated Internet permission; no background-location permission is requested.
- Added `npm run android:sync` and `npm run android:build`, a permanent read-only Android Build workflow, and `docs/ANDROID.md` build/install documentation.
- Cleaned Quality Gate run `31935517985` passed 59 test files / 273 tests plus all repository security, dependency, documentation, formatting, lint, strict typecheck and Web/PWA build gates.
- Permanent Android Build run `31935517977` passed the committed lockfile install, shared-app build/sync and Gradle `assembleDebug` with Node 22 and Java 21.
- Emulator/physical-device execution, persistent-storage device lifecycle, orientation, notifications/Adhan, background/battery restrictions, release signing/distribution and iOS native work remain open.

### 2026-08-16 — Android local prayer notifications

- Added the first-party Capacitor Local Notifications 8.2.1 bridge to the committed Android shell while retaining the existing shared notification intent/reconciliation domain.
- Added today/tomorrow obligatory-prayer input derivation for calculated and local-mosque sources without introducing a parallel Android prayer engine.
- Added deterministic positive 32-bit native notification IDs and namespaced scheduler metadata so only SalahOS-owned pending jobs are reconciled or cancelled.
- Added Android display-permission check/request handling with fail-closed denial and no permission prompt when the desired schedule is empty and stale owned jobs only need cancellation.
- Added silent and silent-with-vibration Android channels, localized English/Arabic notification copy, past-delivery filtering and structured notification-scheduling error classification.
- Cleaned exact-head Quality Gate run `31936818278` passed 61 test files / 280 tests plus security, dependency/license, documentation, icon, formatting, lint, strict typecheck and production Web/PWA artifact verification.
- Matching Android Build run `31936818319` passed the committed lockfile install, Capacitor Android sync and Gradle `assembleDebug` with Node 22 and Java 21.
- Exact-alarm permission/strategy, reboot rescheduling, battery/background acceptance, Adhan playback and emulator/physical-device delivery remain open.

### 2026-08-16 — Android native persistent storage

- Validation run `31938112622` passed the complete quality gate, 62 test files / 284 tests, production build verification and Android debug assembly.
- Android startup hydrates versioned settings, saved locations and the mosque library from native preferences before the application renders.
- The native adapter retains the shared synchronous storage interface through a hydrated cache and ordered write-through queue; tests cover hydration, ordered writes, removal and isolation from unrelated preference keys.
- Browser/PWA storage behavior is unchanged. Android uninstall/app-data clearing, backup/restore and physical/emulator cold-start lifecycle validation remain open.

### 2026-08-16 — Android exact-alarm strategy

- Validation run `31938706626` passed the complete repository quality gate and Android debug assembly.
- The Android manifest declares user-managed `SCHEDULE_EXACT_ALARM` access; the application checks exact-alarm capability without automatically opening special-access settings.
- Unit coverage verifies granted exact capability, denied inexact fallback, unsupported targets, explicit settings navigation and display-permission ordering.
- The settings UI warns when precise access is off and capability changes trigger notification reconciliation.
- Doze/idle behavior, battery optimisation/vendor restrictions, reboot recovery and physical/emulator timing evidence remain open.

### 2026-08-16 — Android background restrictions

- Validation run `31939465371` passed the complete repository quality gate and Android debug assembly.
- Android notification reconciliation is now forced through the existing tested focus, pageshow and visible-document runtime recovery path when the app returns to the foreground.
- English and Arabic UI text explicitly names Doze, Battery Saver and manufacturer background restrictions and states that SalahOS does not request an unrestricted battery-optimisation exemption.
- Exact-alarm access is not represented as bypassing Android power policy. Physical-device Doze/vendor delivery timing and reboot recovery remain separate acceptance work.

### 2026-08-16 — Android Adhan lifecycle policy

- Validation run `31939789143` passed the complete repository quality gate and Android debug assembly.
- Unit coverage locks foreground, background and terminated policy decisions and prevents full-audio auto-play from being implied before a supported local-audio implementation exists.
- Android Adhan notification metadata records the notification-alert policy for Adhan jobs.
- English and Arabic settings text describes the current control as an Adhan alert, not full background playback.
- User-selectable/local audio and audio-focus/interruption behavior remain separate open work.

## iOS native foundation — 2026-08-16

The macOS validation workflow installs the pinned iOS runtime, generates/synchronises the native project, asserts both required location usage-description keys, rejects accidental background-location mode, runs the complete repository quality gate, and compiles the `App` scheme for a generic iOS Simulator with `CODE_SIGNING_ALLOWED=NO`. This validates project generation, privacy metadata and compilation only; interactive simulator/device acceptance remains separately open.

## iOS local notification adapter — 2026-08-16

The iOS adapter is tested with a fake native client for stable identifiers, permission prompt/grant, denied permission, silent delivery metadata, default audible fallback, cancellation of owned stale requests and unsupported-platform no-op behavior. The production App sends the same resolved today/tomorrow intents to Android and iOS adapters; each adapter self-selects its native platform. The macOS validation gate also synchronizes the iOS project and compiles the simulator target. Interactive notification delivery remains separately tracked.

## iOS notification/audio lifecycle policy — 2026-08-16

Policy tests cover foreground, background and terminated lifecycle states and lock the invariant that scheduled delivery uses the system local-notification path, never depends on SalahOS background execution, and never represents an Adhan alert as full-recording auto-play. Scheduler tests assert the policy metadata is embedded in owned pending requests. macOS CI then runs the complete repository gate, synchronizes the iOS shell and compiles the simulator target.
