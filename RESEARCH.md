# SalahOS Research Baseline

**Author:** privacyOG

This document records research assumptions, verified reference relationships and intentionally unresolved authority-specific questions. Parameter agreement with a reference implementation is not the same thing as institutional certification.

## Prayer-time calculation model

Prayer calculations are based on the Sun's apparent position for a geographic coordinate, civil date and IANA timezone.

### Core events

- **Dhuhr:** local solar noon, with an authority-specific correction only where the selected method explicitly requires it.
- **Sunrise / Sunset:** solar-altitude crossing that includes the conventional apparent solar radius and atmospheric-refraction correction.
- **Fajr:** morning solar depression angle selected by calculation method.
- **Isha:** evening solar depression angle or fixed interval after Maghrib where the selected method specifies an interval.
- **Asr:** determined from the shadow-length factor. Standard uses factor 1; Hanafi uses factor 2.
- **Maghrib:** apparent sunset unless a selected method carries a separate reviewed adjustment.

Raw astronomical results remain distinct from presentation rounding, named-method institutional adjustments and user/manual offsets.

## Astronomical assumptions recorded by the engine

The implementation documents and tests:

- Julian date convention and UTC conversion;
- solar declination and equation-of-time model;
- apparent sunrise/sunset depression;
- observer-elevation assumption;
- atmospheric-refraction assumption;
- numerical precision and deterministic display rounding;
- explicit unavailability when a required event cannot be resolved safely.

## Calculation-method registry

The registry currently contains:

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

Each entry carries provenance and a verification state.

`cross-checked-reference` means the stored parameters agree with the documented reference set and applicable parity fixtures. It does **not** mean the named institution has certified SalahOS or that every local timetable will be identical after authority-specific operational adjustments.

Diyanet/Turkey and Dubai remain `pending-authoritative-source` where the exact authority formula/parity has not been established. Their dedicated research notes record what is known and what must not be overstated.

### Umm al-Qura seasonal Isha policy

The Umm al-Qura/Makkah profile uses:

- Fajr at 18.5°;
- Isha 90 minutes after Maghrib outside Ramadan;
- Isha 120 minutes after Maghrib during Ramadan.

The seasonal decision uses the runtime Umm al-Qura calendar without the user's optional ±Hijri display correction. Display correction is a presentation/local-observance feature and must never silently modify a named calculation method.

A runtime that cannot provide the required Umm al-Qura calendar must fail explicitly rather than quietly applying the wrong seasonal interval.

## Madhhab and Asr

Internally SalahOS uses the mathematically precise names:

- `standard` — shadow factor 1; associated with Shafi'i, Maliki and Hanbali conventions;
- `hanafi` — shadow factor 2.

The initial user-facing default is Standard/Shafi'i while preserving explicit user selection.

## High-latitude behaviour

Implemented fallback strategies include:

- Middle of the Night;
- One-Seventh of the Night;
- Angle-Based portion of night.

Nearest-location/latitude and nearest-valid-day approaches are researched separately for true polar edge cases. SalahOS keeps unresolved polar events unavailable unless a future explicit estimator is selected and its borrowed reference location/date is recorded in provenance.

A fallback result is never presented as though the astronomical event occurred normally at the observer's coordinates.

## Timezones

Longitude is not converted directly into a timezone. Coordinates resolve through bundled/offline location data to an IANA timezone, and civil-time calculations use that timezone's historical/seasonal offset rules.

Persisted/saved timezone identifiers are validated before reuse. Fresh raw coordinates deliberately invalidate a cached zone so the local resolver can recompute it.

## Local mosque timetables

A mosque timetable is an independent prayer source, not a hidden adjustment to calculated times. SalahOS models:

- prayer start/Adhan time;
- Iqamah/Jama'ah time;
- one or more Jumu'ah sessions;
- source identity and import provenance.

CSV/JSON imports are schema-validated before activation. Local-mosque values remain distinguishable from calculated values and calculated Sunrise remains supplementary rather than being silently replaced.

## Hijri calendar

Hijri presentation can differ by convention and local moon-sighting practice. SalahOS identifies the Umm al-Qura runtime calendar and permits a bounded manual day correction for display.

That correction is intentionally separate from calculation-method policy, including the Umm al-Qura Ramadan Isha interval.

## Platform research baseline

### Android

Android exact-alarm, notification permission, reboot restoration, Doze/Battery Saver and manufacturer background policies can affect delivery. The implementation therefore uses explicit native scheduling/reconciliation and documents limitations instead of guaranteeing timing the operating system may delay.

Application backup/cloud-device-transfer of SalahOS local data is explicitly disabled/excluded. Effective merged permissions are reviewed in addition to the app-owned source manifest.

### iOS / iPadOS

iOS background execution and notification behaviour differ materially from Android. SalahOS uses native local notifications and one-shot foreground location acquisition. The pinned geolocation dependency requires both documented iOS location usage-description keys even though SalahOS does not enable background location or continuous location watching.

Simulator build success does not substitute for physical-device, signing/distribution or lifecycle acceptance.

### Local Adhan audio

A user may select a local recording which remains device-local. Full recording playback is supported only while the application is open/visible and platform autoplay policy permits it. Background or terminated delivery remains a native notification alert subject to operating-system restrictions.

SalahOS does not bundle an unlicensed recording and does not treat a user-selected recording as exportable settings data.

### Raspberry Pi Touch Display 2

The Pi target is a browser-based kiosk shell using the shared production application. Repository viewport/kiosk tests cover software behaviour, while display resolution/orientation, touch ergonomics, auto-start, sleep/wake recovery and offline cold-start acceptance still require applicable physical validation.

### TV/kiosk

The primary target is a standards-compliant browser in full-screen/kiosk mode. Native TV packaging is not assumed unless separately implemented and tested. TV overscan, remote/CEC behaviour and viewing-distance usability require applicable target evidence.

## Optional remote integrations

Core prayer functionality does not require a remote API. A future optional integration must use the reviewed remote-request boundary, an explicitly allowed HTTPS origin and a privacy review for any sensitive field transmitted.

No remote provider is enabled merely because the generic security boundary exists.

## Validation policy

No single online calculator is treated as absolute ground truth. Verification uses:

1. a pinned/canonical reference implementation;
2. an independent calculator/API or independently maintained method set;
3. authoritative published timetables/material where practical;
4. documented comparison tolerances that distinguish algorithm, method, timezone, authority adjustment and rounding differences;
5. explicit verification-state labels when authority formula parity remains unresolved.

The tracker marks a task complete only after the applicable implementation, test and documentation evidence exists; research notes alone do not close a runtime or physical-device acceptance item.
