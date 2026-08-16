# Diyanet / Turkey prayer-time research

**Author:** privacyOG

## Status

The SalahOS `diyanet` calculation profile remains `pending-authoritative-source`. The existing 18° Fajr / 17° Isha parameters are useful interoperability values used by open reference implementations, but an angle-only profile does not establish full Diyanet timetable parity.

SalahOS records and applies Diyanet's published institutional timetable corrections as a distinct method-policy layer. It also has direct official-timetable output-parity fixtures for Sydney and Istanbul across summer/winter profiles. The remaining blocker is authoritative identification of the reusable twilight criteria/formula rather than output parity alone.

## Primary source

Diyanet İşleri Başkanlığı, Vakit Hesaplama and official Namaz Vakitleri service:

- `https://vakithesaplama.diyanet.gov.tr/imsak.php`
- `https://vakithesaplama.diyanet.gov.tr/temkin.php`
- `https://vakithesaplama.diyanet.gov.tr/vakit_kiyaslamalari.php`
- `https://namazvakitleri.diyanet.gov.tr/`
- current primary-source review refreshed 2026-08-17

Diyanet describes prayer times as being determined from astronomical calculation/observation together with fiqh criteria. Its Imsak explanation identifies the first appearance of true dawn as the adopted boundary rather than presenting Imsak as an arbitrary safety offset. The official Namaz Vakitleri service publishes first-party daily/monthly/annual timetable outputs and separately exposes astronomical sunrise/sunset values on applicable pages.

## Official timetable offsets / temkin

Diyanet's own temkin explanation states the following timetable policy:

| Event | Published policy |
| --- | --- |
| Sunrise / end of Fajr | 7 minutes before astronomical sunrise |
| Dhuhr | 5 minutes after the Sun is at the meridian / zenith boundary |
| Asr | 4-minute location-related temkin |
| Maghrib | 7 minutes after astronomical sunset |
| Imsak | no separate temkin adjustment |
| Isha | no separate temkin adjustment |

Diyanet explains that the sunrise/sunset, Dhuhr and Asr offsets account for settlement extent/elevation and the Dhuhr disliked-time boundary; it explicitly says there is no temkin application for Imsak and Isha.

These values also explain why open-library Turkey presets commonly contain non-angle adjustments. They must not be hidden inside an undocumented generic user adjustment.

## SalahOS implementation

The built-in method registry records Diyanet's authority-published correction set separately from user adjustments:

- Sunrise: `-7` minutes;
- Dhuhr: `+5` minutes;
- Asr: `+4` minutes;
- Maghrib: `+7` minutes;
- Fajr/Imsak: no institutional temkin correction;
- Isha: no institutional temkin correction.

`src/domain/institutionalAdjustments.ts` applies these corrections after the raw astronomical event is calculated and before product presentation. The implementation preserves the raw astronomical value, moves the institutional correction into the method-default/base time, and leaves `manualAdjustmentMinutes` reserved for user-controlled offsets. The provenance formula identifies when an institutional correction was applied.

The production dashboard path applies this layer before next-prayer selection, countdown and downstream notification inputs are built. Methods with no institutional correction remain unchanged.

## Official output-parity evidence

`src/domain/diyanetReferenceParity.test.ts` freezes first-party Diyanet timetable outputs for:

- Sydney, 2026-07-28;
- Istanbul, 2026-08-16;
- Istanbul, 2026-01-01.

The fixture compares all six displayed events after the institutional-correction layer and uses a tight ±2 minute tolerance. The Sydney source additionally publishes astronomical sunrise/sunset alongside timetable sunrise/Maghrib, directly exercising the documented 7-minute temkin relationship.

This is meaningful authority-output evidence, but it is intentionally not converted into a claim that Diyanet officially specifies 18° Fajr and 17° Isha. Output parity can validate the implemented profile for frozen cases without proving that an inferred angle pair is the institution's complete underlying algorithm.

## Remaining verification gap

The current `diyanet` profile still uses 18° Fajr / 17° Isha interoperability angles. The reviewed Diyanet primary material establishes the institutional temkin policy and the candidate now contains multi-season official-output parity, but the primary material surfaced through 2026-08-17 still does not publish a complete reusable twilight-angle/formula specification that certifies those two values as Diyanet's official underlying criteria.

A fully verified Diyanet profile still requires either:

1. authoritative identification/publication of the Diyanet Fajr/Imsak and Isha astronomical criteria; or
2. a deliberately documented decision that broad official-output parity, rather than a published formula, is the verification standard—supported by a wider multi-location/multi-season fixture matrix with no hidden tolerance widening.

Any remaining methodology or rounding differences must be documented rather than absorbed by arbitrary adjustments.

## Verification boundary

The official institutional corrections are modelled with separate provenance and the candidate has direct first-party timetable parity. This materially improves the Diyanet implementation, but SalahOS still does not claim institutional certification of the inferred 18°/17° formula. The method therefore remains approximate/pending until the project adopts and satisfies an explicit final verification standard.
