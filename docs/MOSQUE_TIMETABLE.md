# Local mosque timetable model

**Author:** privacyOG

## Source modes

SalahOS models the active prayer source explicitly:

- `calculated` — use the selected astronomical calculation method;
- `local-mosque` — use the configured mosque timetable for that civil date;
- `calculated-adjustments` — use the calculated schedule with the engine's explicit per-prayer adjustments.

When `local-mosque` is selected, a missing mosque prayer is reported as unavailable. SalahOS does not silently substitute a calculated time and misrepresent its provenance.

## Prayer start and Iqamah/Jama'ah

Prayer start and Iqamah/Jama'ah are separate values. A mosque timetable may specify:

- no Iqamah value;
- a fixed local clock time; or
- an offset such as prayer start + 20 minutes.

Offsets are validated and may not roll into the next civil day. The source model preserves the distinction so later UI work can label Adhan/start and Iqamah separately.

## CSV schema

The supported CSV format is intentionally strict and simple:

```text
date,fajr,fajr_iqamah,dhuhr,dhuhr_iqamah,asr,asr_iqamah,maghrib,maghrib_iqamah,isha,isha_iqamah
2026-08-21,05:25,+20,12:05,12:30,15:10,,17:35,+10,19:00,19:20
```

Rules:

- `date` is Gregorian `YYYY-MM-DD`;
- prayer start values use 24-hour `HH:MM`;
- an Iqamah field may be empty, fixed `HH:MM`, or `+N` minutes after prayer start;
- an Iqamah value cannot exist without its prayer-start value;
- unexpected columns or malformed rows are rejected before activation;
- duplicate civil dates are rejected.

A sample file is provided at `examples/mosque-timetable.csv`.

## JSON import/export

JSON import uses runtime structural validation before the domain timetable validator runs. The importer rejects malformed nested prayer objects, unsupported prayer keys, malformed Iqamah rules, malformed Jumu'ah data, invalid dates/times, duplicate dates and an empty mosque name.

Exported JSON preserves the typed timetable structure and can be re-imported without changing the timetable data.

## Jumu'ah

Friday is detected from the timetable civil date. A mosque day may store one or multiple Jumu'ah sessions independently of astronomical Dhuhr. Each session contains:

- a mosque-defined label;
- Khutbah local time;
- Salah local time.

Salah may not precede the associated Khutbah. Jumu'ah sessions are returned only for Friday.

## Offline and trust model

The timetable domain, CSV parser and JSON parser have no network dependency. No arbitrary website scraping is part of the authoritative timetable path. Persistent local storage and optional vetted remote integrations are separate open tasks and must not be implied by the existence of the offline parser.
