# SalahOS Research Baseline

**Author:** privacyOG

This document records research assumptions and the current evidence boundary. Calculation parameters are not treated as authoritative merely because they are common in secondary implementations.

## Prayer-time calculation model

Prayer calculations are based on the Sun's apparent position for a geographic coordinate, civil date, and IANA timezone.

### Core events

- **Dhuhr:** local solar noon, normally with a small configurable safety offset only where a selected method requires it.
- **Sunrise / Sunset:** solar altitude crossing that includes the conventional apparent solar radius and atmospheric refraction correction.
- **Fajr:** morning solar depression angle selected by calculation method.
- **Isha:** evening solar depression angle or fixed interval after Maghrib where the selected method specifies an interval.
- **Asr:** determined from the shadow-length factor. Standard uses factor 1; Hanafi uses factor 2.
- **Maghrib:** normally sunset unless a calculation method explicitly defines an additional angle/interval rule.

## Astronomical assumptions

The implemented engine keeps explicit documentation/provenance for:

- Julian date convention and UTC conversion;
- solar declination and equation-of-time model;
- apparent sunrise/sunset depression;
- observer-elevation treatment;
- atmospheric refraction assumptions;
- numerical precision and deterministic display rounding.

Raw astronomical results remain distinct from fallback/base values, manual adjustments and display rounding.

## Calculation-method registry

The registry currently contains profiles for:

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

Current reference status is recorded in `docs/PRAYER_METHOD_REFERENCES.md`. MWL, Umm al-Qura, Egyptian, Karachi, ISNA, MUIS, Kuwait and Qatar parameters have cross-checked reference evidence. Diyanet/Turkey remains pending institutional equivalence because the official production system includes policy beyond a simple fixed-angle profile. Dubai now models the pinned Adhan JS 4.4.4 provider offsets and has frozen output parity against a fixture whose upstream source cites UAE Awqaf, while still avoiding the stronger claim that the authority internally uses the same simplified parameterization.

Umm al-Qura/Makkah, MUIS/Singapore, Qatar/Doha, Kuwait City and Dubai have frozen published/reference timetable parity fixtures. The direct canonical suite additionally covers ISNA/North America, Muslim World League, Egyptian, Turkey interoperability and Karachi. Karachi expected output was generated independently from exact `adhan@4.4.4` on EVO-X2 before being frozen into SalahOS. Direct canonical comparison is complete for the defined v1 reference set and remains conceptually separate from institutional certification.

## Madhhab and Asr

Internally SalahOS uses the mathematically precise names:

- `standard` — shadow factor 1; associated with Shafi'i, Maliki, and Hanbali conventions;
- `hanafi` — shadow factor 2.

The initial user-facing default is Standard/Shafi'i while preserving explicit user selection.

## High-latitude behaviour

Implemented night-fraction strategies are:

- Middle of the Night;
- One-Seventh of the Night;
- Angle-Based portion of night.

Nearest-location/latitude and nearest-valid-day polar strategies have been researched in `docs/POLAR_RESOLUTION_RESEARCH.md`. They are not silently applied. When the astronomical prerequisites needed for an implemented fallback do not exist, the affected event remains unavailable. A fallback result is never presented as if the astronomical event occurred normally; provenance identifies the strategy actually applied.

## Timezones

Longitude is never converted directly into a fixed timezone. Coordinates are resolved locally to an IANA timezone and civil-time calculations use that timezone's historical/seasonal rules. The IANA mapping data is bundled for local operation, and persisted locations retain a validated timezone for offline reuse.

## Local mosque timetables

A mosque timetable is an independent prayer source, not a hidden adjustment to calculated times. SalahOS models:

- prayer start/Adhan time;
- Iqamah/Jama'ah time;
- one or more Jumu'ah sessions;
- source identity and import provenance.

Manual entry and validated CSV/JSON import/export are implemented. Timetables are preserved locally. Optional provider integration research is documented in `docs/MOSQUE_INTEGRATION_RESEARCH.md`; no remote provider is required by core prayer operation.

## Hijri calendar

Hijri presentation can differ by convention and local moon-sighting practice. SalahOS identifies the runtime Umm al-Qura convention where available and permits an explicit small manual day correction rather than presenting a calculated date as universally authoritative.

## Platform research and implementation boundary

### Android

The native shell implements foreground current-location access, native persistence, local prayer notifications, exact-alarm fallback policy, reboot restoration and explicit background-delivery limitations. Android operating-system and manufacturer power policy can still delay delivery, so physical target timing remains an acceptance concern rather than a guaranteed property.

### iOS / iPadOS

The native shell implements foreground location, native persistence and bounded local prayer notifications. Background/terminated delivery relies on scheduled system notifications; unrestricted full-recording auto-play is not claimed. The current permission design uses foreground location only. Xcode Simulator compilation is recorded, while interactive/physical-device acceptance remains separately open.

### Raspberry Pi Touch Display 2

The Pi target is a browser-based kiosk using the shared production application. Target viewport fixtures, deployment tooling and offline/runtime continuity are repository-validated. Physical display rendering, touch ergonomics, boot/power-loss behavior and long-duration acceptance still require target hardware.

### TV/kiosk

The primary target is a standards-compliant browser in full-screen/kiosk mode. Smart-display runtime behavior is implemented and repository-tested. Physical viewing-distance readability, remote/HDMI-CEC mappings and long-duration panel behavior remain target-specific validation work.

## Network/provider research boundary

Core prayer calculation does not require a remote prayer-time or mosque API. Optional and managed network features are allowed when they provide documented product capability, but each integration must define its transmitted data, authentication/credential handling, TLS expectations, response validation, caching/offline degradation and failure isolation. New remote hosts/capabilities remain subject to the repository network-policy review rather than being prohibited by a local-first product objective.

Client-visible service identifiers must be distinguished from private credentials. For example, a Maps Static API key embedded by Vite is observable in the client and therefore requires provider-side API/application restrictions, quota controls and deployment testing; private URL-signing material must remain in a trusted service and never be embedded in the application. See `docs/QIBLA_GOOGLE_MAPS.md`.

## Validation policy

No single online calculator is treated as absolute ground truth. Verification uses:

1. a pinned/canonical reference implementation;
2. an independent calculator/API or frozen reference dataset;
3. authoritative published timetables where practical;
4. documented comparison tolerances that distinguish algorithm, method, timezone, adjustment, and rounding differences.
