# Prayer-board template engine

Stage 23 introduces a presentation-only prayer-board contract. The template engine must never become a second prayer calculation or mosque-source engine.

## Architecture boundary

`src/domain/sourcedDashboard.ts` remains the authoritative resolved prayer model. It already applies the selected calculated/local-mosque source, Iqamah rules, current/next prayer state and Jumu'ah data. `src/domain/prayerBoardTemplate.ts` consumes that resolved model and copies it into a deterministic display contract. Template selection and template configuration are deliberately absent from `buildPrayerBoardData()`, so changing a prayer-board design cannot change prayer times, source provenance, Iqamah values or next-prayer semantics.

The prayer-board layer performs no network access, geolocation, storage reads or prayer calculations. Optional remote content is passed in through an isolated nullable weather snapshot. Missing, stale or failed weather must not alter the authoritative prayer data.

## Stable template registry

Version 1 reserves six stable identifiers for the required SalahOS designs:

- `heritage-classic`
- `minimal-modern`
- `bold-countdown-focus`
- `structured-split-board`
- `scenic-spiritual`
- `family-classroom`

Each registry entry has a template version, the four supported primary locales (`en`, `ar`, `tr`, `id`), English/Arabic bilingual capability, supported modules, default-visible modules and a first-party built-in artwork fallback. Later visual stages implement the designs against these identifiers rather than creating independent data models.

## Modules

The shared module vocabulary is current time, dates, next prayer, countdown, prayer timetable, Jumu'ah, sunrise/sunset, mosque branding, announcements and optional weather.

Current time, next prayer, countdown and the prayer timetable are core modules. Configuration parsing always restores them to visible even if an invalid or hand-edited payload attempts to hide them. Optional modules can be enabled or disabled when supported by the selected template.

The display data contract provides raw local clock parts, Gregorian/Hijri date structures, resolved prayer and Iqamah minutes, current/next state, astronomical sunrise/sunset values, Jumu'ah sessions, source/timezone provenance, local runtime state and isolated announcement/weather slots. Templates are responsible only for presentation and locale-aware formatting.

## Versioned configuration

`PrayerBoardTemplateConfig` version 1 controls only presentation:

- stable template id;
- primary locale and optional English/Arabic bilingual mode;
- 12-hour (`h12`) or 24-hour (`h23`) presentation;
- controlled accent preset;
- validated module visibility;
- optional localized mosque name and validated logo asset metadata;
- built-in artwork or a validated local image background with cover crop, normalized focal point and mandatory automatic contrast scrim.

Unknown or unsupported configuration falls back deterministically to the Heritage Classic version-1 defaults. Custom image configuration stores a local asset identifier and validated metadata, not a remote URL. The background contract always retains a built-in first-party fallback so a board remains usable with imagery disabled or unavailable.

## Offline and failure behaviour

Given the same resolved dashboard and optional content inputs, `buildPrayerBoardData()` returns the same presentation contract and performs no external I/O. Core prayer information therefore remains usable offline. Optional announcement and weather content is structurally separated from prayer calculations and source resolution; a weather error or stale snapshot cannot block or modify prayer information.

Future Stage 23 work may add visual templates, preview/configuration UI and managed-display assignment, but those layers must consume this contract rather than weakening the boundary above.
