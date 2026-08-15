# SalahOS Privacy Principles

**Author:** privacyOG

SalahOS is designed around local-first prayer-time functionality.

## Core principles

- Core prayer calculations run locally on the device.
- No account is required for core prayer-time functionality.
- Precise location is requested only when the user chooses current-location functionality.
- Continuous GPS polling is avoided unless a future feature has a clear, disclosed need.
- Saved coordinates, selected mosque, calculation settings, Hijri adjustment, and timetable data are stored locally by default.
- Precise location must not be included in routine analytics, diagnostics, or logs.
- No unnecessary analytics or telemetry is enabled by default.
- Remote APIs are optional enhancements and must disclose what data is transmitted and why.
- Imported timetable/configuration files are treated as untrusted input and validated before use.
- Secrets, signing credentials, and private API keys must never be committed to the repository.

## Location handling

When current location is used, SalahOS should request the least permission required by the platform. If permission is denied or unavailable, the application must continue to support saved/manual locations without degrading core calculation functionality.

Coordinate-to-timezone resolution should prefer a local/offline strategy where practical. When a remote resolver is explicitly used, the application must clearly disclose that coordinates are transmitted to that service.

## Telemetry

The default product does not require behavioural analytics. If optional diagnostics are introduced later, they must be opt-in or strictly privacy-preserving, documented, and must exclude precise location and prayer-history data unless the user knowingly provides it for support.

## Network failure

Network loss must not prevent locally calculable prayer schedules, access to previously saved mosque timetables, or previously saved settings.

## Security baseline

- TLS for optional network traffic.
- Strict validation of CSV/JSON imports.
- Content Security Policy on web/PWA targets where applicable.
- Minimal native permissions.
- Dependency vulnerability review before releases.
- No secrets in source control.
