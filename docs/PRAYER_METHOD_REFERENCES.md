# Prayer calculation method references

**Author:** privacyOG

## Purpose

SalahOS does not treat a method label as proof that its numerical parameters are authoritative. This document records the reference sources used to cross-check method parameters and distinguishes canonical/open reference implementations from official institutional timetables.

## Pinned / versioned references

### Adhan JS

- Repository: `https://github.com/batoulapps/adhan-js`
- Version inspected: `4.4.4`
- Commit: `a6f1a5c4a00105103f310ef18200b95f7184d2e7`
- Method guide: `METHODS.md`
- Canonical output fixture source: `test/adhan.test.ts`
- Role: independent, well-tested calculation-library reference.

### PrayTimes

- Project: `https://praytimes.org`
- Calculation method table: `https://praytimes.org/docs/methods`
- Algorithm generation: PrayTimes 2.3 lineage.
- Role: canonical open prayer-time algorithm/reference used widely by other calculators.

### AlAdhan / Islamic Network

- Method registry: `https://api.aladhan.com/v1/methods`
- Calculation-method documentation: `https://aladhan.com/calculation-methods`
- Snapshot checked: 2026-08-16.
- Role: independent API/reference cross-check. AlAdhan documents that its core calculation lineage is based substantially on PrayTimes, so it is useful corroboration but not a fully independent astronomical algorithm.

### Diyanet İşleri Başkanlığı

- Calculation research: `https://vakithesaplama.diyanet.gov.tr/`
- Temkin policy: `https://vakithesaplama.diyanet.gov.tr/temkin.php`
- Istanbul official timetable: `https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti`
- Sydney official timetable: `https://namazvakitleri.diyanet.gov.tr/tr-TR/22182/sydney-namaz-vakitleri`
- Snapshot checked: 2026-08-16.
- Role: primary institutional source for Diyanet timetable policy and authoritative published output.

## Parameter consensus

| SalahOS method                          |  Fajr | Isha                                     | Cross-check status                                                                                                                        |
| --------------------------------------- | ----: | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Muslim World League                     |   18° | 17°                                      | PrayTimes + Adhan JS + AlAdhan agree                                                                                                      |
| ISNA / North America                    |   15° | 15°                                      | PrayTimes + Adhan JS + AlAdhan agree                                                                                                      |
| Egyptian General Authority of Survey    | 19.5° | 17.5°                                    | PrayTimes + Adhan JS + AlAdhan agree                                                                                                      |
| Umm al-Qura / Makkah                    | 18.5° | 90 min; 120 min during Ramadan           | PrayTimes + current Adhan JS + AlAdhan agree on the fixed interval policy                                                                 |
| University of Islamic Sciences, Karachi |   18° | 18°                                      | PrayTimes + Adhan JS + AlAdhan agree                                                                                                      |
| MUIS / Singapore                        |   20° | 18°                                      | PrayTimes + Adhan JS + AlAdhan agree                                                                                                      |
| Kuwait                                  |   18° | 17.5°                                    | Adhan JS + AlAdhan agree                                                                                                                  |
| Qatar                                   |   18° | 90 min after Maghrib                     | Adhan JS + AlAdhan agree                                                                                                                  |
| Dubai                                   | 18.2° | 18.2°                                    | Batoul Apps-derived approximation; IACAD official output parity remains pending                                                           |
| Diyanet / Turkey                        |   18° | 17° in interoperability references       | Official Diyanet output matches the current profile in pinned Istanbul summer/winter and Sydney fixtures once official temkin is applied |

## Direct canonical-output parity

`src/domain/canonicalAdhanParity.test.ts` freezes output examples copied from the pinned Adhan JS `test/adhan.test.ts` at commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`. These are direct implementation-output comparisons rather than method-parameter comparisons.

The matrix currently covers:

- North America / ISNA with Hanafi Asr in Raleigh, North Carolina on 2015-07-12;
- Muslim World League with Standard/Shafi-family Asr in Raleigh, North Carolina on 2015-12-01;
- Egyptian in Cairo on 2020-01-01;
- Singapore/MUIS on 2021-06-14.

All six daily values used by the shared SalahOS dashboard—Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha—are compared. The bound is two minutes per event. This is intentionally narrow: it allows second-level astronomical/rounding differences and known preset-policy differences without treating a materially different calculation as parity.

Adhan JS method presets are not angle-only profiles. At the pinned commit, its North America and Egyptian presets add one minute to Dhuhr; its Singapore preset also adds one minute to Dhuhr and uses upward rounding. SalahOS keeps raw astronomical results, named-method parameters, manual adjustments and presentation rounding as separate concepts. The canonical-output test therefore records those upstream preset differences instead of silently copying them into the SalahOS method registry.

Direct canonical-output parity is separate from official timetable parity. A passing canonical fixture does not mean an institution has certified SalahOS, and a published timetable may include local policy offsets not present in either calculation engine.

## Umm al-Qura Ramadan Isha policy

The pinned Adhan JS method guide states that Umm al-Qura uses a 90-minute Isha interval after Maghrib and requires an additional 30 minutes during Ramadan. SalahOS records that as a method-owned seasonal policy: 90 minutes normally and 120 minutes in Ramadan.

`src/domain/methodCalendarPolicy.ts` resolves the seasonal interval from the uncorrected `islamic-umalqura` civil-date calendar. The user's optional Hijri display correction is deliberately excluded from this decision so changing a displayed Hijri date cannot silently change an explicitly selected calculation method.

The production dashboard resolves the method separately for today and tomorrow. Regression coverage includes the 1447 AH Ramadan/Shawwal boundary: 2026-03-19 resolves to Ramadan and a 120-minute Isha interval, while 2026-03-20 resolves to Shawwal and returns to 90 minutes. A separate fixture applies a +2-day Hijri display correction and verifies that the displayed month can be Shawwal while the underlying named-method policy still uses the uncorrected Ramadan interval.

This implementation remains staged until the exact repository validation gate executes successfully; the documentation records the intended and tested contract, not a CI-completion claim.

## Diyanet institutional policy and timetable parity

Diyanet's primary temkin documentation states that its published timetable uses:

- Sunrise: 7 minutes before astronomical sunrise;
- Dhuhr: 5 minutes after solar meridian/zenith;
- Asr: +4 minutes;
- Maghrib: 7 minutes after astronomical sunset;
- Imsak/Fajr: no separate temkin correction;
- Isha: no separate temkin correction.

SalahOS records these values in `CalculationMethod.institutionalAdjustments` and applies them through `src/domain/institutionalAdjustments.ts`. Raw astronomical times remain unchanged, method-default/base times receive the institutional correction, and user/manual offsets remain separately recorded in provenance. The layer is idempotent so a schedule cannot receive the same authority correction twice.

`src/domain/diyanetReferenceParity.test.ts` pins three official Diyanet timetable fixtures with a maximum two-minute tolerance per event:

- Istanbul, 2026-01-01: 06:50 / 08:22 / 13:12 / 15:32 / 17:53 / 19:19;
- Istanbul, 2026-08-16: 04:31 / 06:08 / 13:14 / 17:02 / 20:10 / 21:40;
- Sydney, 2026-07-28: 05:24 / 06:44 / 12:07 / 14:56 / 17:20 / 18:34.

The Sydney source also publishes astronomical sunrise 06:51 and sunset 17:13, directly exposing the documented seven-minute corrections. Independent local astronomical cross-checks reproduce all three fixture profiles to roughly the published minute with the current 18°/17° twilight profile plus Diyanet's authority corrections.

This is substantially stronger evidence than the earlier third-party approximation label. The `diyanet` verification flag remains pending only until the staged repository test suite executes successfully and the resulting exact-head evidence is recorded; it must not be promoted solely because the fixture code was written.

## Verification policy

`cross-checked-reference` means the numerical parameters agree across the listed canonical/reference sources. It does **not** mean that an institution has formally certified SalahOS or that a simple angle model reproduces every official timetable.

`pending-authoritative-source` remains in use when the available method is explicitly experimental/approximate, an authority applies unmodelled corrections, or newly added authoritative parity evidence has not yet passed the repository validation gate.

Method verification is separate from prayer-time parity. Geographic/date fixtures must still compare actual calculated output against independent calculators and, where practical, official published timetables.

## Known caveats

- The staged Umm al-Qura Ramadan interval is now modelled from the uncorrected Umm al-Qura Hijri calendar, but it must pass the exact-head repository validation gate before being recorded as completed evidence in the tracker.
- IACAD describes Dubai/Dulook as using government-issued astronomical Sharia criteria under International Astronomical Center supervision, but the reviewed official material does not establish the current 18.2°/18.2° approximation as the institutional formula. Dubai therefore remains pending until official output parity is demonstrated.
- Diyanet's institutional correction layer and three official timetable fixtures are now implemented on the staging branch. The method remains pending until exact-head repository validation succeeds and the evidence is recorded.
- Official timetables may incorporate safety margins, elevation/refraction conventions, local policy or non-angle rules that differ from generic library defaults.
