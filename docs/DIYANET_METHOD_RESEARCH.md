# Diyanet / Turkey prayer-time research

**Author:** privacyOG

## Status

The SalahOS `diyanet` calculation profile remains `pending-authoritative-source`. The existing 18° Fajr / 17° Isha parameters are useful interoperability values used by open reference implementations, but an angle-only profile does not establish full Diyanet timetable parity.

SalahOS now records and applies Diyanet's published institutional timetable corrections as a distinct method-policy layer. The remaining blocker is authoritative twilight-criteria/output parity for Imsak/Fajr and Isha.

## Primary source

Diyanet İşleri Başkanlığı, Vakit Hesaplama:

- `https://vakithesaplama.diyanet.gov.tr/imsak.php`
- `https://vakithesaplama.diyanet.gov.tr/temkin.php`
- `https://vakithesaplama.diyanet.gov.tr/vakit_kiyaslamalari.php`
- checked 2026-08-16

Diyanet describes prayer times as being determined from astronomical observations/calculation together with fiqh criteria. Its Imsak explanation identifies the first appearance of true dawn as the adopted boundary rather than presenting Imsak as an arbitrary safety offset.

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

The built-in method registry now records Diyanet's authority-published correction set separately from user adjustments:

- Sunrise: `-7` minutes;
- Dhuhr: `+5` minutes;
- Asr: `+4` minutes;
- Maghrib: `+7` minutes;
- Fajr/Imsak: no institutional temkin correction;
- Isha: no institutional temkin correction.

`src/domain/institutionalAdjustments.ts` applies these corrections after the raw astronomical event is calculated and before product presentation. The implementation preserves the raw astronomical value, moves the institutional correction into the method-default/base time, and leaves `manualAdjustmentMinutes` reserved for user-controlled offsets. The provenance formula identifies when an institutional correction was applied.

The production dashboard path applies this layer before next-prayer selection, countdown and downstream notification inputs are built. Methods with no institutional correction remain unchanged.

## Remaining verification gap

The current `diyanet` profile still uses 18° Fajr / 17° Isha interoperability angles. The reviewed Diyanet primary material establishes the temkin policy above, but SalahOS has not yet demonstrated that those twilight angles reproduce official Diyanet Imsak and Isha output across the required location/season matrix.

A fully verified Diyanet profile still requires:

1. authoritative identification or defensible derivation of the Diyanet Fajr/Imsak and Isha astronomical criteria;
2. frozen published Diyanet timetable fixtures for multiple Turkish locations and seasons;
3. direct parity testing of the complete method policy against those fixtures;
4. explicit documentation of any remaining methodology or rounding differences rather than widening tolerances until they disappear.

## Verification boundary

The official institutional corrections are now modelled with separate provenance and must not be represented as user adjustments. This materially improves the Diyanet implementation, but it is **not** sufficient to mark the method verified. SalahOS should continue exposing Diyanet as approximate/pending until authoritative twilight criteria and published-output parity are demonstrated.
