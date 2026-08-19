# Monthly timetable

Phase 2G.1 adds a monthly mosque timetable presentation and export contract built from the same authoritative daily prayer data used by the congregation experience.

## Model

`src/domain/monthlyTimetable.ts` represents one Gregorian month for one mosque. Each day contains:

- Gregorian civil date
- optional Hijri label
- Fajr, Dhuhr, Asr, Maghrib and Isha start times
- optional Iqamah time for each prayer
- zero or more Jumu'ah sessions

The month also records mosque identity, display name, source/provenance label and publication revision. Input rows are validated, sorted by date and frozen after creation.

The monthly layer does not recalculate prayer times independently. Callers must resolve the authoritative mosque prayer publication or local calculation source first and then provide the resulting daily rows. This prevents the monthly view from becoming a competing prayer-time source.

## Export

The domain exposes deterministic CSV and JSON exports for administrator use. CSV includes Salah starts, Iqamah, Hijri context and Jumu'ah summaries. JSON preserves the complete normalized timetable model.

## Presentation

`src/ui/MonthlyTimetable.tsx` provides a responsive table with source/revision provenance. Its stylesheet includes a dedicated print mode intended for browser print-to-PDF and paper output.

## Boundaries

This slice does not add hosted download endpoints, remote persistence, embed widgets or public API transport. Those belong to subsequent Phase 2G slices. It also does not alter the local prayer engine or the managed prayer publication rules.
