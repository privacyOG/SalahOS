# Localisation, Arabic and RTL

**Author:** privacyOG

## Locales

The initial supported locales are:

- `en` — English, using Australian English formatting defaults where a regional locale is needed;
- `ar` — Arabic, with right-to-left document direction.

All current shared-shell user-facing text is stored in the translation catalogue rather than embedded as prose in React components. Translation keys are statically typed so English and Arabic share the same key set.

## Prayer names

The Arabic prayer names used by the shared UI are:

- Fajr — الفجر
- Dhuhr — الظهر
- Asr — العصر
- Maghrib — المغرب
- Isha — العشاء

Sunrise remains supplementary information and is not represented as one of the five obligatory prayers.

## Direction

Selecting Arabic sets both the application direction and the document root to `dir="rtl"`; English uses `dir="ltr"`. The document language is also updated to `ar` or `en`.

Layout styles use logical block properties where direction matters, and Arabic removes Latin-oriented uppercase/letter-spacing treatments. This prevents the application from treating RTL as a simple text-alignment toggle.

## Date and time formatting

Locale helpers use `Intl.DateTimeFormat`. Local prayer times are formatted from already-resolved local minutes and do not derive timezone information from the host environment. Gregorian dates are formatted from the resolved civil date in UTC so formatting cannot move the intended local date across a boundary.

The time formatter supports explicit 12-hour or 24-hour output. The current shell does not yet expose that setting; it belongs to the persistent settings stage.

## Mixed-script content

Brand names and platform names may remain Latin inside Arabic text. The surrounding document remains RTL while normal Unicode bidirectional handling preserves embedded Latin runs. Components should avoid hard-coded directional CSS and use logical layout properties.

## Validation boundary

Automated tests verify translation lookup, Arabic prayer names, locale direction, document language/direction application, English/Arabic time formatting, Gregorian date formatting and invalid-time rejection.

Full visual regression across phone, tablet, Raspberry Pi and 1080p kiosk breakpoints remains open and must be completed with the responsive UI validation stage before RTL is declared visually complete across every target.
