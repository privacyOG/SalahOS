# First-run prayer calculation setup

SalahOS v1.5.3 adds a second first-run step after location. It asks only for the calculation method and Asr convention, then stores those choices in the existing `salahos.settings` record.

## Calculation-method suggestion

The suggestion is completely offline. SalahOS first derives a conservative ISO 3166-1 alpha-2 country hint from a known IANA timezone when the relationship is unambiguous, then applies the explicit table below. Unknown countries and ambiguous/unknown timezones use **Muslim World League (MWL)** as the fallback.

| ISO country | Suggested method |
| --- | --- |
| AU, NZ | Muslim World League |
| SA | Umm al-Qura / Makkah |
| EG | Egyptian General Authority of Survey |
| PK, IN, BD, AF | University of Islamic Sciences, Karachi |
| US, CA | Islamic Society of North America |
| TR | Diyanet / Turkey |
| SG | MUIS / Singapore |
| AE | Dubai |
| KW | Kuwait |
| QA | Qatar |
| Any other/unknown country | Muslim World League |

This is a starter recommendation, not a claim that every mosque or authority in a country follows one method. Users can choose any built-in method during onboarding and change it later in Settings. A mosque timetable, where deliberately selected, remains a separate prayer-source choice.

## Asr convention preview

The onboarding screen calculates today's Asr twice at the user's saved location using the same production prayer engine and selected calculation method:

- **Standard** — shadow factor 1, associated in SalahOS presentation with Shafi‘i, Maliki and Hanbali practice.
- **Hanafi** — shadow factor 2.

The preview is informational and is unavailable until coordinates are available. It does not approximate a location when the user declines location access.

## Persistence and first-run sequencing

A dedicated completion record, `salahos.prayer-setup-onboarding`, is initialized before the location onboarding can create settings. This preserves the location → prayer setup sequence across a reload. Existing configured installations are migrated as completed so v1.5.3 does not unexpectedly interrupt them.

Selecting **Use defaults** stores the normal SalahOS defaults (MWL + Standard) through the same settings storage used by the Settings screen. Completing either path prevents the onboarding from appearing again.
