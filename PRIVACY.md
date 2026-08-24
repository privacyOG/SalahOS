# SalahOS Privacy Principles

**Author:** privacyOG

SalahOS is designed around local-first prayer-time functionality.

## Core principles

- Core prayer calculations run locally on the device.
- No account is required for core prayer-time functionality.
- Precise foreground location is requested through first-run permission education so automatic Qiblah/current-location features can operate only after the platform grants access.
- The Qiblah Finder can start a foreground live-location watch after permission onboarding, exposes a stop control, and does not persist a location trail.
- Saved coordinates, selected mosque, calculation settings, Hijri adjustment, and timetable data are stored locally by default.
- Precise location must not be included in routine analytics, diagnostics, or logs.
- No unnecessary analytics or telemetry is enabled by default.
- Remote APIs are optional enhancements and must disclose what data is transmitted and why.
- Imported timetable/configuration files are treated as untrusted input and validated before use.
- Secrets, signing credentials, and private API keys must never be committed to the repository.

## Location handling

When current location is enabled, SalahOS requests the least permission required by the platform for the active feature. If permission is denied or unavailable, the application continues to support saved/manual locations without degrading core calculation functionality.

Coordinate-to-timezone resolution should prefer a local/offline strategy where practical. When a remote resolver is explicitly used, the application must clearly disclose that coordinates are transmitted to that service.

### Qiblah Finder maps

The Qiblah bearing, compass guidance, saved/manual-location paths, recalibration guidance, and bundled city search remain local. Google Maps JavaScript API is the primary interactive Qiblah map provider only when the deployment configures a restricted client key and the user opens the Map view.

Opening the Google Maps view sends normal map/network requests to Google. Those requests include normal network metadata such as the device's public IP address and can reveal the viewed map area and therefore the approximate current or manually selected location. SalahOS does not attach stored prayer settings, mosque data, prayer history, or unrelated application data to those map requests.

The Google provider is restricted to the documented Qiblah adapter and deployment key policy. OpenStreetMap is not used by the Qiblah map. If Google Maps is unavailable, blocked or unconfigured, SalahOS switches to a local network-free bearing surface that keeps manual pin selection and the locally calculated Qiblah direction available.

## Telemetry

The default product does not require behavioural analytics. If optional diagnostics are introduced later, they must be opt-in or strictly privacy-preserving, documented, and must exclude precise location and prayer-history data unless the user knowingly provides it for support.

## Network failure

Network loss must not prevent locally calculable prayer schedules, Qiblah bearing calculation, access to previously saved mosque timetables, or previously saved settings. Interactive Google Maps may be unavailable while offline without disabling the local bearing, compass guidance, recalibration or local map fallback.

## Security baseline

- TLS for optional network traffic.
- Strict validation of CSV/JSON imports.
- Content Security Policy on web/PWA targets where applicable.
- Minimal native permissions.
- Dependency vulnerability review before releases.
- No secrets in source control.
