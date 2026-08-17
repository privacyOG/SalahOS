# Prayer calculation method references

**Author:** privacyOG

## Purpose

SalahOS does not treat a method label as proof that its numerical parameters are authoritative. This document records the reference sources used to cross-check method parameters and distinguishes canonical/open reference implementations from official institutional timetables and calculation services.

## Pinned / versioned references

### Adhan JS

- Repository: `https://github.com/batoulapps/adhan-js`
- Version inspected: `4.4.4`
- Commit: `a6f1a5c4a00105103f310ef18200b95f7184d2e7`
- Method guide: `METHODS.md`
- Role: independent, well-tested calculation-library reference.

The pinned repository also contains frozen comparison fixtures for Ankara/Turkey, Dubai/Gulf, Doha/Qatar, Kuwait City/Kuwait, Makkah/Umm al-Qura and Singapore. These are useful reference fixtures, but their upstream source must still be considered when deciding whether they constitute institutional evidence.

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

### Diyanet / Presidency of Religious Affairs of Türkiye

- High Board prayer-time/timetable activity: `https://fetva.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/namaz-vakitleri-takvim-calismalari`
- High-latitude work and official global platform/API: `https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri`
- Official global prayer-time platform: `https://www.awqatsalah.com/`
- Official API service entry point: `https://awqatsalah.diyanet.gov.tr/`
- Official sample API project: `https://github.com/DinIsleriYuksekKurulu/AwqatSalah`
- Role: primary institutional source for Diyanet-published prayer times and policy boundaries.

Diyanet states that its prayer-time calculation unit derives times from the Sun's apparent motion, geographic coordinates and jurisprudential criteria. Its High Board also states that the program algorithm/database used for the global Awqat Salah platform is developed and maintained by Diyanet astronomers. The institution publishes explicit special handling for high latitudes rather than presenting its production timetable as a universal two-angle formula.

This is stronger primary evidence than third-party `Turkey` profiles. However, the public institutional material reviewed here does not establish that SalahOS's current simple `18° Fajr / 17° Isha` profile, by itself, reproduces the complete Diyanet production algorithm. The profile therefore remains pending institutional parity instead of being promoted to verified.

## Parameter consensus

| SalahOS method                          |  Fajr | Isha                               | Cross-check status                                                                                                          |
| --------------------------------------- | ----: | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Muslim World League                     |   18° | 17°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                        |
| ISNA / North America                    |   15° | 15°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                        |
| Egyptian General Authority of Survey    | 19.5° | 17.5°                              | PrayTimes + Adhan JS + AlAdhan agree                                                                                        |
| Umm al-Qura / Makkah                    | 18.5° | 90 min after Maghrib               | PrayTimes + current Adhan JS + AlAdhan agree; Ramadan interval requires separate Hijri-aware handling                       |
| University of Islamic Sciences, Karachi |   18° | 18°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                        |
| MUIS / Singapore                        |   20° | 18°                                | PrayTimes + Adhan JS + AlAdhan agree                                                                                        |
| Kuwait                                  |   18° | 17.5°                              | Adhan JS + AlAdhan agree                                                                                                    |
| Qatar                                   |   18° | 90 min after Maghrib               | Adhan JS + AlAdhan agree                                                                                                    |
| Dubai                                   | 18.2° | 18.2°                              | Adhan JS 4.4.4 parameters plus Sunrise -3 / Dhuhr +3 / Asr +3 / Maghrib +3; frozen Dubai fixture cites UAE Awqaf output     |
| Diyanet / Turkey                        |   18° | 17° in interoperability references | Third-party approximation only; primary Diyanet sources document a maintained institutional algorithm and timetable service |

## Frozen direct-output evidence added on 2026-08-17

The canonical parity suite now includes direct six-event fixtures for ISNA/North America, Muslim World League, Egyptian, Turkey interoperability, MUIS/Singapore, Dubai and Karachi. Dubai uses the pinned `Shared/Times/Dubai-Gulf.json` fixture, whose upstream source cites UAE Awqaf published prayer times. Karachi did not have a six-event fixture in the pinned repository, so exact `adhan@4.4.4` was installed independently in a temporary EVO-X2 runner directory and evaluated for Karachi coordinates `24.8607, 67.0011` on 2020-01-01 using Shafi/Standard Asr. The captured Asia/Karachi output was Fajr 05:55, Sunrise 07:17, Dhuhr 12:36, Asr 15:34, Maghrib 17:54 and Isha 19:15; those values are now frozen in SalahOS.

All direct fixtures retain the same two-minute algorithm/rounding tolerance. A fixture passing against a canonical library is evidence of implementation parity, not institutional certification.

## Verification policy

`cross-checked-reference` means the numerical parameters agree across the listed canonical/reference sources. It does **not** mean that an institution has formally certified SalahOS or that a simple angle model reproduces every official timetable.

`pending-authoritative-source` remains in use when the available method is explicitly experimental/approximate, when an official authority applies additional corrections that have not yet been modelled and validated, or when primary institutional material does not establish equivalence between the institution's production algorithm and SalahOS's simplified profile.

An official timetable/API is suitable for frozen output parity even when the institution does not publish every internal algorithm parameter. In that case SalahOS must describe the evidence as timetable/output parity, not parameter certification.

Method verification is separate from prayer-time parity. Geographic/date fixtures must still compare actual calculated output against independent calculators and, where practical, official published timetables.

## Known caveats

- Umm al-Qura Isha uses a longer Ramadan interval in widely used references; SalahOS must not silently apply that until the Hijri calendar subsystem can determine Ramadan reliably.
- Adhan JS documents Dubai offsets in addition to the 18.2° angles. SalahOS now models Sunrise -3, Dhuhr +3, Asr +3 and Maghrib +3 minutes and passes the pinned Dubai/Gulf fixture at the unchanged two-minute tolerance. That fixture cites UAE Awqaf published timetable output, which is valid output-parity evidence but does not prove that the authority internally uses the same 18.2°/18.2° plus-offset parameterization; institutional parameter equivalence therefore remains pending.
- Adhan JS calls its Turkey method an approximation of Diyanet and warns that it is less accurate outside Turkey. AlAdhan also labels Turkey experimental. Primary Diyanet material confirms that the institution operates and maintains its own calculation/timetable system, including special high-latitude rules. SalahOS therefore keeps Diyanet pending until output parity is demonstrated against Diyanet's own published service/timetables and any material systematic differences are modelled.
- The pinned Adhan JS Ankara fixture uses a third-party published timetable as its upstream source. It is useful canonical-library test data but must not be relabelled as direct Diyanet institutional evidence.
- Official timetables may incorporate safety margins, elevation/refraction conventions, local policy or non-angle rules that differ from generic library defaults.
