# Location and timezone subsystem

**Author:** privacyOG

## Shared best-available location

SalahOS uses one foreground location resolver for prayer times, Qiblah, weather and nearby-mosque features. After the user enables automatic location it prefers:

1. a precise OS/GPS-assisted fix;
2. an OS/network-assisted approximate fix;
3. a recent live-location cache;
4. selected mosque or saved location where supplied by the feature; and
5. an explicit manual location.

Each resolved context carries coordinates, source, horizontal accuracy when available, fix time, freshness, approximate/precise status and an IANA timezone. Unrelated device telemetry such as altitude, speed and heading is not retained by the shared location path.

Automatic refresh is foreground-only: app start, focus/visibility return, connectivity recovery and a bounded 15-minute interval. SalahOS does not request background location for this resolver.

## Permission experience

First-run permission education is benefit-first: location supports local prayer times, Qiblah, nearby mosques and local weather. Choosing **Not now** dismisses onboarding without enabling automatic location, so later background UI activity cannot unexpectedly prompt for location. Saved/manual workflows remain usable.

Existing configured installations migrate to the automatic-location behavior already expected by their previous completed location/Qiblah onboarding state.

## Offline timezone lookup

Coordinates are converted to an IANA timezone locally using the pinned `@photostructure/tz-lookup` dataset. No remote timezone API is required.

The lookup remains marked `approximateBoundaryLookup: true` because compact boundary data can be ambiguous near timezone borders. Persisted explicit timezone selections are retained where available.

UTC offsets and daylight-saving changes come from the runtime IANA rules through `Intl.DateTimeFormat`; SalahOS does not derive civil time from longitude.

## Location quality and travel

Browser/native adapters retain only coordinates, horizontal accuracy and fix timestamp required to judge location quality. High-accuracy positioning is attempted first and falls back to OS/network-assisted positioning after ordinary timeout/unavailable failures.

A successful live fix is cached for temporary offline continuity. Shared prayer settings update after meaningful movement (250 metres or more) or timezone change, avoiding repeated writes from normal GPS jitter while allowing travel between locations/timezones to update prayer calculations automatically.

Typed foreground failures remain:

- `unsupported`
- `permission-denied`
- `unavailable`
- `timeout`
- `unknown`

## Network use

Core prayer-time and timezone calculation remain local. Features that inherently use online providers, such as enabled weather, may send the resolved coordinates required for that feature. The shared location resolver itself does not send coordinates to a remote location service.

## Verification

Automated coverage verifies precise-first acquisition, approximate fallback, permission denial, accuracy/fix metadata, cache expiry, saved/manual fallback, offline timezone resolution, GPS-jitter suppression and meaningful travel/timezone updates. Qiblah one-shot acquisition delegates to the same shared foreground resolver while retaining its continuous live watch for compass guidance.
