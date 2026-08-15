# Offline and persistent configuration

**Author:** privacyOG

## Scope

SalahOS keeps prayer calculations local. The web application can persist selected configuration in browser storage and registers a production service worker so the installed application shell and same-origin runtime assets can be reused without a network connection after they have been cached.

## Persistent settings schema

The storage key is `salahos.settings`. The current schema version is `1`.

The versioned envelope can store:

- selected coordinates and the resolved IANA timezone;
- English or Arabic locale;
- light, dark or system theme preference;
- 12-hour or 24-hour time preference;
- built-in calculation method identifier;
- Standard/Shafi'i-family or Hanafi Asr convention;
- high-latitude rule;
- Hijri correction from -2 through +2 days;
- per-prayer minute adjustments;
- calculated, local-mosque or calculated-with-adjustments source mode;
- a validated local mosque timetable.

The current dashboard immediately restores and persists the settings it already exposes: locale and coordinates. Calculation settings stored through the same schema are consumed by the shared dashboard model, while their dedicated UI selectors remain separate work.

### Validation and migration

Stored JSON is treated as untrusted input. Coordinates are reconstructed through the shared coordinate validator. Mosque timetables are validated before activation. Unsupported future schema versions are rejected. A legacy unversioned locale/coordinates shape is migrated into schema version 1.

Corrupt browser-storage data falls back to safe defaults rather than preventing application startup.

The storage module also exposes validated import/export and reset primitives. User-facing import/export/reset controls remain separate settings UI work.

## PWA application shell

`public/manifest.webmanifest` defines the installable web application metadata and first-party icons.

`public/sw.js` is registered only by production builds. Its cache policy is intentionally limited to same-origin GET requests:

1. installation precaches the root shell, manifest and app icons;
2. successful same-origin runtime assets are cached as they are requested;
3. navigation requests prefer the network and fall back to the cached root shell;
4. activation removes caches whose names do not match the current cache version;
5. cross-origin requests are not inserted into the SalahOS application cache.

The current cache name is `salahos-shell-v1`. A release that intentionally changes cache compatibility must increment that cache identifier.

## Offline behaviour

When the browser reports an offline state, the application displays a localised status message. Prayer calculations do not require a remote API. A previously persisted location can therefore continue feeding the local timezone, calendar and prayer calculation pipeline while offline.

The service worker implementation and production build are automated-gate tested for formatting, typed application code, unit/integration behaviour and build success. A real-browser test that installs the worker, disconnects networking, reloads the page and verifies cache migration across two deployed versions remains open and must not be inferred from unit/build coverage alone.

## Privacy

Precise coordinates are stored locally when the user selects a location. The offline core does not transmit those coordinates. Location access is initiated through an explicit user action in the current web shell, and manual coordinates remain available when location permission or services are unavailable.
