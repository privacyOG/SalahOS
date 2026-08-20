# SalahOS Privacy Principles

**Author:** privacyOG

SalahOS is designed around local-first prayer-time functionality.

## Core principles

- Core prayer calculations run locally on the device.
- No account is required for core prayer-time functionality.
- Precise location is requested only when the user chooses current-location functionality.
- Continuous location watching is off by default. The Qiblah Finder starts a foreground live-location watch only after the user chooses current-position guidance, exposes a stop control, and does not persist a location trail.
- Saved coordinates, selected mosque, calculation settings, Hijri adjustment, and timetable data are stored locally by default.
- Precise location must not be included in routine analytics, diagnostics, or logs.
- No unnecessary analytics or telemetry is enabled by default.
- Remote APIs are optional enhancements and must disclose what data is transmitted and why.
- Imported timetable/configuration files are treated as untrusted input and validated before use.
- Secrets, signing credentials, and private API keys must never be committed to the repository.

## Location handling

When current location is used, SalahOS should request the least permission required by the platform. If permission is denied or unavailable, the application must continue to support saved/manual locations without degrading core calculation functionality.

Coordinate-to-timezone resolution should prefer a local/offline strategy where practical. When a remote resolver is explicitly used, the application must clearly disclose that coordinates are transmitted to that service.

### Qiblah Finder maps

The Qiblah bearing, compass guidance, saved-location path, and bundled city search remain local. Map imagery is optional and is not requested until the user explicitly selects **Load map tiles**.

When map tiles are enabled, the selected third-party tile provider receives the requested tile coordinates/viewed map area and normal network request metadata such as the device's public IP address. A map centred on a current or manually selected location can therefore reveal that approximate viewed area to the provider. SalahOS does not attach stored prayer settings, mosque data, prayer history, or a separate raw-coordinate payload to those tile requests.

The reviewed Web/PWA image-source policy limits Qiblah map imagery to the documented OpenStreetMap standard-tile and Esri World Imagery hosts. Core Qiblah direction continues to work without those providers.

## Telemetry

The default product does not require behavioural analytics. If optional diagnostics are introduced later, they must be opt-in or strictly privacy-preserving, documented, and must exclude precise location and prayer-history data unless the user knowingly provides it for support.

## Network failure

Network loss must not prevent locally calculable prayer schedules, Qiblah bearing calculation, access to previously saved mosque timetables, or previously saved settings. Optional Qiblah map imagery may be unavailable while offline without disabling the local bearing or compass guidance.

## Security baseline

- TLS for optional network traffic.
- Strict validation of CSV/JSON imports.
- Content Security Policy on web/PWA targets where applicable.
- Minimal native permissions.
- Dependency vulnerability review before releases.
- No secrets in source control.
