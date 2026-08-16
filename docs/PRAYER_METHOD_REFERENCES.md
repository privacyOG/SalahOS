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

## Parameter consensus

| SalahOS method                          |  Fajr | Isha                               | Cross-check status                                                                                                            |
| --------------------------------------- | ----: | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Muslim World League                     |   18° | 17°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                          |
| ISNA / North America                    |   15° | 15°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                          |
| Egyptian General Authority of Survey    | 19.5° | 17.5°                              | PrayTimes + Adhan JS + AlAdhan agree                                                                                          |
| Umm al-Qura / Makkah                    | 18.5° | 90 min after Maghrib               | PrayTimes + current Adhan JS + AlAdhan agree; Ramadan interval requires separate Hijri-aware handling                         |
| University of Islamic Sciences, Karachi |   18° | 18°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                          |
| MUIS / Singapore                        |   20° | 18°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                          |
| Kuwait                                  |   18° | 17.5°                              | Adhan JS + AlAdhan agree                                                                                                      |
| Qatar                                   |   18° | 90 min after Maghrib               | Adhan JS + AlAdhan agree                                                                                                      |
| Dubai                                   | 18.2° | 18.2°                              | Batoul Apps-derived approximation; AlAdhan explicitly labels Dubai experimental                                               |
| Diyanet / Turkey                        |   18° | 17° in interoperability references | Adhan describes this as an approximation; AlAdhan labels it experimental; official Diyanet timetable parity is still required |

## Direct canonical-output parity

`src/domain/canonicalAdhanParity.test.ts` freezes output examples copied from the pinned Adhan JS `test/adhan.test.ts` at commit `a6f1a5c4a00105103f310ef18200b95f7184d2e7`. These are direct implementation-output comparisons rather than method-parameter comparisons.

The matrix currently covers:

- North America / ISNA with Hanafi Asr in Raleigh, North Carolina on 2015-07-12;
- Egyptian in Cairo on 2020-01-01;
- Singapore/MUIS on 2021-06-14.

All six daily values used by the shared SalahOS dashboard—Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha—are compared. The bound is two minutes per event. This is intentionally narrow: it allows second-level astronomical/rounding differences and known preset-policy differences without treating a materially different calculation as parity.

Adhan JS method presets are not angle-only profiles. At the pinned commit, its North America and Egyptian presets add one minute to Dhuhr; its Singapore preset also adds one minute to Dhuhr and uses upward rounding. SalahOS keeps raw astronomical results, named-method parameters, manual adjustments and presentation rounding as separate concepts. The canonical-output test therefore records those upstream preset differences instead of silently copying them into the SalahOS method registry.

Direct canonical-output parity is separate from official timetable parity. A passing canonical fixture does not mean an institution has certified SalahOS, and a published timetable may include local policy offsets not present in either calculation engine.

## Verification policy

`cross-checked-reference` means the numerical parameters agree across the listed canonical/reference sources. It does **not** mean that an institution has formally certified SalahOS or that a simple angle model reproduces every official timetable.

`pending-authoritative-source` remains in use when the available method is explicitly experimental/approximate or when an official authority applies additional corrections that have not yet been modelled and validated.

Method verification is separate from prayer-time parity. Geographic/date fixtures must still compare actual calculated output against independent calculators and, where practical, official published timetables.

## Known caveats

- Umm al-Qura Isha uses a longer Ramadan interval in widely used references; SalahOS must not silently apply that until the Hijri calendar subsystem can determine Ramadan reliably.
- Adhan JS documents Dubai offsets in addition to the 18.2° angles. SalahOS currently models the angles but not all Dubai-specific per-prayer offsets, so Dubai remains pending.
- Adhan JS calls its Turkey method an approximation of Diyanet and warns that it is less accurate outside Turkey. AlAdhan also labels Turkey experimental. SalahOS therefore keeps Diyanet pending until official timetable parity is demonstrated.
- Official timetables may incorporate safety margins, elevation/refraction conventions, local policy or non-angle rules that differ from generic library defaults.
