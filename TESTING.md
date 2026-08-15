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
- Five-prayer calculations and external timetable/reference parity remain unverified and are not marked complete.
