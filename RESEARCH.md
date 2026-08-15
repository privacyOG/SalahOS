# SalahOS Research Baseline

**Author:** privacyOG

This document records research assumptions that must be validated against authoritative references before a calculation rule is treated as final.

## Prayer-time calculation model

Prayer calculations are based on the Sun's apparent position for a geographic coordinate, civil date, and IANA timezone.

### Core events

- **Dhuhr:** local solar noon, normally with a small configurable safety offset only where a selected method requires it.
- **Sunrise / Sunset:** solar altitude crossing that includes the conventional apparent solar radius and atmospheric refraction correction.
- **Fajr:** morning solar depression angle selected by calculation method.
- **Isha:** evening solar depression angle or fixed interval after Maghrib where the selected method specifies an interval.
- **Asr:** determined from the shadow-length factor. Standard uses factor 1; Hanafi uses factor 2.
- **Maghrib:** normally sunset unless a calculation method explicitly defines an additional angle/interval rule.

## Astronomical assumptions to document in engine code

The implementation must explicitly identify:

- Julian date convention and UTC conversion;
- solar declination and equation-of-time model;
- apparent sunrise/sunset depression;
- treatment of observer elevation;
- atmospheric refraction assumptions;
- numerical precision and deterministic display rounding.

Raw astronomical results must remain distinct from presentation rounding and user/mosque adjustments.

## Calculation methods to support

The registry is designed for at least:

- Muslim World League;
- Umm al-Qura / Makkah;
- Egyptian General Authority of Survey;
- University of Islamic Sciences, Karachi;
- Islamic Society of North America;
- Diyanet/Turkey;
- MUIS/Singapore;
- Dubai;
- Kuwait;
- Qatar;
- explicit custom parameters.

Each registry entry must include source/provenance notes. Parameter values must be verified from authoritative or primary published material before being considered production-verified.

## Madhhab and Asr

Internally SalahOS uses the mathematically precise names:

- `standard` — shadow factor 1; associated with Shafi'i, Maliki, and Hanbali conventions;
- `hanafi` — shadow factor 2.

The initial user-facing default is Standard/Shafi'i while preserving explicit user selection.

## High-latitude behaviour

Required fallback strategies include:

- Middle of the Night;
- One-Seventh of the Night;
- Angle-Based portion of night;
- researched nearest-latitude / nearest-valid-day handling for polar edge cases.

A fallback result is never presented as if the astronomical event occurred normally. Provenance must identify the fallback used.

## Timezones

Longitude must not be converted directly into a timezone. Coordinates are resolved to an IANA timezone, and civil-time calculations use that timezone's historical/seasonal offset rules. Offline operation requires caching or bundling the required timezone mapping/data strategy.

## Local mosque timetables

A mosque timetable is an independent prayer source, not a hidden adjustment to calculated times. SalahOS models:

- prayer start/Adhan time;
- Iqamah/Jama'ah time;
- one or more Jumu'ah sessions;
- source identity and import provenance.

CSV/JSON imports must be schema-validated before activation.

## Hijri calendar

Hijri presentation can differ by convention and local moon-sighting practice. SalahOS must identify the selected convention and permit a small manual day correction rather than presenting a calculated date as universally authoritative.

## Platform research baseline

### Mobile

Android and iOS have materially different background execution, notification scheduling, exact-alarm, audio, and permission constraints. The UI must describe limitations instead of guaranteeing behaviour the operating system does not guarantee.

### Raspberry Pi Touch Display 2

The Pi target is a browser-based kiosk shell using the shared production application. Display resolution/orientation, touch ergonomics, auto-start, sleep/wake recovery, and offline cold start require physical validation.

### TV/kiosk

The primary target is a standards-compliant browser in full-screen/kiosk mode. Native TV packaging is not assumed unless separately implemented and tested.

## Validation policy

No single online calculator is treated as absolute ground truth. Verification uses:

1. a pinned/canonical reference implementation;
2. an independent calculator/API;
3. authoritative published timetables where practical;
4. documented comparison tolerances that distinguish algorithm, method, timezone, adjustment, and rounding differences.
