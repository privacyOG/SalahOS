# Location and timezone subsystem

**Author:** privacyOG

## Privacy model

SalahOS treats precise coordinates as sensitive local data. Core prayer-time operation does not require a remote location or timezone API.

- Browser GPS is requested only when the user explicitly requests/current-location functionality.
- The browser adapter performs a one-shot `getCurrentPosition` request rather than continuous tracking.
- Manual coordinates are supported by the same validated coordinate model.
- Coordinates are converted to an IANA timezone locally using the bundled `@photostructure/tz-lookup` dataset.
- SalahOS does not derive a civil timezone from longitude.
- UTC offsets and daylight-saving changes are obtained from the runtime's IANA timezone rules through `Intl.DateTimeFormat`.
- The current core implementation does not transmit precise coordinates over the network.

## Offline timezone lookup

`@photostructure/tz-lookup` is pinned in the dependency lockfile. Its compact timezone-boundary data is bundled with the application, allowing coordinate-to-IANA lookup while offline.

The lookup is intentionally marked `approximateBoundaryLookup: true` in provenance. Compact polygon lookup can be ambiguous or approximate close to timezone borders. A later settings/UI layer should allow a user to inspect and override the detected IANA timezone instead of pretending boundary lookup is infallible.

## Browser geolocation states

The browser adapter returns typed outcomes rather than throwing for ordinary location-service failures:

- `unsupported`
- `permission-denied`
- `unavailable`
- `timeout`
- `unknown`

A platform/UI layer can therefore retain a previously saved/manual location when GPS is denied or unavailable.

## DST and civil date

The timezone module resolves the offset for a specific instant. This is required because the same location can have different UTC offsets across the year. Tests cover both southern-hemisphere and northern-hemisphere DST behavior, including exact 2026 transition boundaries for Sydney and London.

`civilDateInTimeZone` also converts the current instant to the selected location's local Gregorian date before the pure prayer engine is invoked. This prevents the host device's timezone from selecting the wrong prayer day for a remote/saved location.

## Remaining work

The domain/platform core is intentionally separate from:

- saved/favourite location persistence;
- manual city search/geocoding;
- native Android/iOS location adapters;
- UI permission/error flows;
- manual IANA timezone override;
- persistence/version migration.

Those remain separate TODO items and must not be inferred complete merely because the local resolver exists.
