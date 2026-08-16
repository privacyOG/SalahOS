# Diyanet / Turkey prayer-time research

**Author:** privacyOG

## Status

The SalahOS `diyanet` calculation profile remains `pending-authoritative-source`. The existing 18° Fajr / 17° Isha parameters are useful interoperability values used by open reference implementations, but an angle-only profile does not reproduce the full Diyanet timetable policy.

This document records primary-source requirements that must be modelled before SalahOS can describe the Diyanet profile as verified.

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

## Current SalahOS gap

The current built-in method registry models:

- Fajr twilight angle;
- Isha angle or interval;
- Maghrib as sunset;
- Asr convention independently;
- user-controlled manual prayer adjustments separately.

It does **not** currently provide a first-class, method-owned institutional offset policy for Sunrise, Dhuhr, Asr and Maghrib. Copying Diyanet's offsets into user manual adjustments would destroy provenance and make reset/customization semantics ambiguous.

The current `diyanet` profile therefore stays pending even though its interoperability angles are available.

## Required implementation before verification

A verified Diyanet profile should:

1. add method-owned default offsets as a distinct layer from astronomical results and user adjustments;
2. encode the official 7 / 5 / 4 / 7 minute Sunrise, Dhuhr, Asr and Maghrib policy with explicit provenance;
3. retain zero method-level temkin for Imsak/Fajr and Isha unless a primary Diyanet source establishes a separate twilight calculation correction;
4. identify the authoritative Fajr/Imsak and Isha astronomical criteria rather than assuming that an interoperability library's 18°/17° values are institutional certification;
5. compare output against frozen Diyanet published timetable fixtures for multiple Turkish locations and seasons;
6. keep any residual local/timetable differences visible rather than widening tolerances until they disappear.

## Verification boundary

This research is sufficient to reject an angle-only profile as a complete Diyanet implementation. It is not sufficient to mark the method verified. SalahOS should continue exposing the current profile as approximate/pending until the method-owned offsets and authoritative twilight criteria are implemented and output parity is demonstrated.
