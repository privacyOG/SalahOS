# Dubai / IACAD prayer-time research

**Author:** privacyOG

## Status

The SalahOS `dubai` calculation profile remains `pending-authoritative-source`.

The current 18.2° Fajr / 18.2° Isha values come from open reference-library research and are useful as an interoperability approximation. They must not be described as an official Dubai/IACAD formula unless the responsible authority publishes or explicitly confirms those parameters.

## Primary authority

Islamic Affairs and Charitable Activities Department (IACAD), Dubai:

- prayer-time service: `https://iacad.gov.ae/en/prayer-times`
- prayer-time e-service: `https://eservices.iacad.gov.ae/prayer-time`
- Dulook DXB official prayer-time application and IACAD announcements
- checked 2026-08-16

IACAD describes Dulook DXB as a government-issued global prayer-time service using astronomical, Sharia-compliant criteria under the supervision/collaboration of the International Astronomical Center. IACAD also describes its official calendar work as combining Sharia, scientific and astronomical standards.

The primary material located during this review does not publish a simple Fajr/Isha angle pair or establish 18.2°/18.2° as the complete institutional calculation policy.

## Current SalahOS gap

The current built-in Dubai profile records:

- Fajr: 18.2°;
- Isha: 18.2°;
- Maghrib: astronomical sunset;
- no Dubai-specific method-owned per-prayer offset layer.

Open reference implementations additionally describe Dubai-specific adjustments around sunrise, Dhuhr, Asr and Maghrib. Those values are not currently represented as method-owned policy in SalahOS, and the primary IACAD material reviewed here does not provide enough detail to claim that the open-library preset is institutionally authoritative.

## Required verification path

Before the Dubai method is marked verified:

1. retain the current profile as explicitly approximate/pending;
2. obtain an official IACAD/International Astronomical Center calculation specification, or treat the official IACAD service itself as the authoritative output reference;
3. freeze official IACAD prayer-time fixtures for Dubai across multiple seasons, including all six displayed events;
4. compare the SalahOS engine against those fixtures without hiding systematic differences behind widened tolerances;
5. if recurring per-prayer differences reflect an institutional policy, model them as method-owned adjustments with provenance rather than as user manual offsets;
6. keep any geographic/global Dulook behavior separate from claims about the official Dubai-local timetable unless the authority documents them as identical.

## Verification boundary

IACAD is an authoritative source for Dubai prayer-time outputs and for the fact that its service uses government-reviewed astronomical/Sharia criteria. The source reviewed here is not sufficient to certify a specific 18.2°/18.2° formula. SalahOS therefore correctly keeps Dubai pending until direct official-output parity or a published calculation specification is available.
