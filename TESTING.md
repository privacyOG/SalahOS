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
