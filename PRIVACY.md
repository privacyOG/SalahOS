# SalahOS Privacy Principles

**Author:** privacyOG

SalahOS is designed so privacy is an implementation property rather than a workflow obstacle: normal Islamic utility should work with the least data required by each enabled feature, while privacy and data-management controls remain available in Settings.

## Core principles

- Core prayer calculations run locally on the device.
- No account is required for core prayer-time functionality.
- Foreground location permission is explained in terms of its benefits: local prayer times, nearby mosques, Qiblah and local weather.
- The Qiblah Finder can start a foreground live-location watch after permission onboarding, exposes a stop control, and does not persist a location trail.
- Saved coordinates, selected mosque, calculation settings, Hijri adjustment, and timetable data are stored locally by default.
- Precise location is never included in routine diagnostics or logs.
- Behavioural analytics and diagnostic collection are disabled by default.
- Network features send only the data required to provide the enabled feature and must document that boundary.
- Imported timetable/configuration files are treated as untrusted input and validated before use.
- Secrets, signing credentials, and private API keys must never be committed to the repository.

## Location handling

When automatic location is enabled, SalahOS requests foreground location and resolves the best available position from platform GPS/network assistance, recent live cache, saved/mosque context or manual fallback. If permission is denied or positioning is unavailable, saved/manual workflows remain available without blocking core prayer calculations.

Coordinate-to-timezone resolution is local/offline using the bundled timezone lookup. The shared location resolver itself does not send coordinates to a remote location service.

### Feature-specific location network use

Some enabled features inherently require remote requests. SalahOS keeps those requests scoped to the feature that needs them:

- **Weather:** when enabled, the resolved coordinates required for the forecast are sent to the documented weather provider. Weather failure never blocks prayer calculations.
- **Qiblah Google Maps view:** opening the interactive Google map sends normal map/network requests to Google and can reveal the viewed map area. Local bearing and fallback guidance remain available without Google Maps.
- **Mosque/community services:** remote directory or publishing operations occur only when those network-backed features are used; unrelated prayer settings and precise-location history are not attached to those requests.
- **Managed displays:** remote management traffic occurs only for configured managed-display deployments.

SalahOS does not use the location resolver for advertising, fingerprinting, behavioural profiling or unrelated telemetry.

## Data & privacy controls

Normal prayer, Qiblah, mosque and weather workflows do not require users to navigate through privacy configuration screens. Data-management controls remain grouped under **Settings → Data & privacy**, including settings import/export/reset and optional diagnostics controls.

This separation keeps privacy choices accessible without making them a prerequisite for ordinary use.

## Optional diagnostics

Privacy-preserving crash/performance diagnostics are available under **Settings → Data & privacy** and are **off by default**.

When enabled, SalahOS stores a bounded local diagnostic buffer containing only:

- coarse standard error classes;
- anonymous fingerprints derived from errors without retaining raw messages or stacks; and
- rounded navigation/first-contentful-paint timing values.

Diagnostics do **not** store precise location, URLs, raw error messages, raw stacks, prayer settings, mosque data, search text or account identifiers. They are never uploaded automatically. A user can explicitly prepare an export for support and can clear the local buffer at any time.

Disabling diagnostics stops further collection; previously retained local entries remain until the user clears them, so disabling does not silently destroy evidence the user may want to export.

## Qiblah Finder maps

The Qiblah bearing, compass guidance, saved/manual-location paths, recalibration guidance, and bundled city search remain local. Google Maps JavaScript API is the primary interactive Qiblah map provider only when the deployment configures a restricted client key and the user opens the Map view.

Opening the Google Maps view sends normal map/network requests to Google. Those requests include normal network metadata such as the device's public IP address and can reveal the viewed map area and therefore the approximate current or manually selected location. SalahOS does not attach stored prayer settings, mosque data, prayer history, or unrelated application data to those map requests.

The Google provider is restricted to the documented Qiblah adapter and deployment key policy. OpenStreetMap is not used by the Qiblah map. If Google Maps is unavailable, blocked or unconfigured, SalahOS switches to a local network-free bearing surface that keeps manual pin selection and the locally calculated Qiblah direction available.

## Network failure

Network loss must not prevent locally calculable prayer schedules, Qiblah bearing calculation, access to previously saved mosque timetables, or previously saved settings. Interactive Google Maps, fresh weather and other explicitly network-backed enhancements may be unavailable while offline without disabling their local/core counterparts.

## Security baseline

- TLS for optional network traffic.
- Strict validation of CSV/JSON imports.
- Content Security Policy on web/PWA targets where applicable.
- Minimal native permissions.
- Dependency vulnerability review before releases.
- No secrets in source control.
