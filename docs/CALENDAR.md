# Gregorian and Hijri calendar subsystem

**Author:** privacyOG

## Separation of concerns

Prayer-time calculation and display-calendar selection are separate concerns. The prayer engine receives an already-resolved local civil date and does not depend on the selected Hijri convention.

## Gregorian date

The Gregorian value is derived directly from the resolved local civil date. The domain API requires that civil date to be represented as UTC midnight so the host device timezone cannot silently change the intended date.

## Hijri date

The initial supported Hijri convention is `islamic-umalqura` when the runtime exposes that calendar through `Intl.DateTimeFormat`.

Every Hijri result includes explicit provenance:

- calendar identifier: `islamic-umalqura`;
- source: `runtime-intl-calendar`;
- manual correction in days.

SalahOS checks the runtime's resolved calendar identifier before using the result. It does not silently fall back to a different Islamic calendar when Umm al-Qura is unavailable.

## Manual correction

Users may apply an explicit integer correction from -2 through +2 days. The correction shifts the local civil date before Hijri conversion and is retained in the result metadata. A zero correction is the default.

This adjustment exists because local moon-sighting practice or mosque announcements can differ from a calculated/runtime calendar convention. SalahOS does not present a corrected date as an unmodified calculated date.

## Validation

Automated tests cover:

- runtime Umm al-Qura support;
- host-timezone-independent Gregorian extraction;
- explicit Hijri provenance;
- positive and negative manual correction;
- correction-range validation;
- Hijri month transition;
- Hijri year transition;
- entry into Ramadan (month 9);
- rejection of non-civil-date instants.

UI presentation, locale-specific date formatting and automatic live date rollover remain separate application/runtime work.
