# Dubai / IACAD prayer-time research

**Author:** privacyOG

## Status

The SalahOS `dubai` calculation profile remains `pending-authoritative-source`.

The current 18.2° Fajr / 18.2° Isha values come from open reference-library research and are useful as an interoperability approximation. They must not be described as an official Dubai/IACAD formula unless the responsible authority publishes or explicitly confirms those parameters.

## Primary authority

Islamic Affairs and Charitable Activities Department (IACAD), Dubai:

- official prayer-time page: `https://iacad.gov.ae/ar/prayer-times`
- official prayer-time e-service: `https://eservices.iacad.gov.ae/prayer-time`
- Dulook DXB official government prayer-time application and IACAD announcements
- current primary-source review refreshed 2026-08-17

IACAD identifies Dulook DXB as its government-issued prayer-time application and provides a first-party prayer-time e-service for selecting country, city and date. Current IACAD announcements describe the application as a global prayer-time service and emphasize institutional religious/scientific accuracy. Earlier first-party material also records collaboration with the International Astronomical Center for global prayer-time services.

The primary material located during the 2026-08-17 review still does **not** publish a complete reusable Fajr/Isha angle pair plus institutional per-prayer adjustment policy, and it does not establish 18.2°/18.2° as the complete official Dubai calculation formula.

## Current SalahOS gap

The current built-in Dubai profile records:

- Fajr: 18.2°;
- Isha: 18.2°;
- Maghrib: astronomical sunset;
- no Dubai-specific method-owned per-prayer offset layer.

Open reference implementations additionally describe Dubai-specific adjustments around sunrise, Dhuhr, Asr and Maghrib. Those values are not currently represented as method-owned policy in SalahOS, and the primary IACAD material reviewed here does not provide enough detail to claim that the open-library preset is institutionally authoritative.

The official IACAD e-service is therefore treated as a preferred future **output-parity** source rather than reverse-engineered into an undocumented formula. A dynamic first-party timetable value should be frozen only when its requested location/date and returned values can be recorded reproducibly.

## Required verification path

Before the Dubai method is marked verified:

1. retain the current profile as explicitly approximate/pending;
2. obtain an official IACAD/International Astronomical Center calculation specification, or treat the official IACAD service itself as the authoritative output reference;
3. freeze official IACAD prayer-time fixtures for Dubai across multiple seasons, including all six displayed events and the exact location/date request used to obtain them;
4. compare the SalahOS engine against those fixtures without hiding systematic differences behind widened tolerances;
5. if recurring per-prayer differences reflect an institutional policy, model them as method-owned adjustments with provenance rather than as user manual offsets;
6. keep any geographic/global Dulook behavior separate from claims about the official Dubai-local timetable unless the authority documents them as identical;
7. preserve the raw institutional fixture values in repository tests/documentation so future authority changes are distinguishable from engine regressions.

## Verification boundary

IACAD is an authoritative source for Dubai prayer-time outputs and for the existence of its government-issued prayer-time service/application. The primary sources reviewed through 2026-08-17 are not sufficient to certify a specific 18.2°/18.2° formula or the open-reference offset preset as official IACAD policy. SalahOS therefore correctly keeps Dubai pending until direct official-output parity or a published calculation specification is available.
