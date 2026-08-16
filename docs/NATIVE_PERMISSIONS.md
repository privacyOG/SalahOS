# Native permission review

SalahOS follows a least-privilege native permission policy. Permissions and privacy usage descriptions are retained only when they are required by an implemented feature.

## Android

The application manifest declares:

- `ACCESS_COARSE_LOCATION` — foreground location when the user explicitly asks SalahOS to use the current position.
- `ACCESS_FINE_LOCATION` — permits the native location bridge to return an accurate foreground fix where the operating system grants it. SalahOS defaults to non-high-accuracy acquisition and retains only latitude/longitude.
- `SCHEDULE_EXACT_ALARM` — user-managed precise-alarm capability for prayer notifications on Android versions where exact scheduling is restricted. SalahOS continues with an explicit inexact fallback when unavailable.
- `INTERNET` — required by the Capacitor web runtime and browser-hosted application shell. Core prayer calculations remain local-first and do not require a remote account or remote calculation service.

The application does **not** request background location or an unrestricted battery-optimisation exemption. Camera, microphone and contact permissions are not part of the current feature set.

## iOS / iPadOS

`NSLocationWhenInUseUsageDescription` is the only location privacy description required by the current implementation. Location acquisition is user-initiated and foreground-only.

The application does not declare always/background location access or a background location mode. Camera, microphone and contacts access are not part of the current feature set.

## Permanent policy gate

`npm run security:native-permissions` checks the committed Android manifest and iOS property list. The gate fails when an unreviewed Android permission appears, when foreground location declarations disappear, or when background/always-location capabilities are introduced.

Any future native capability must be reviewed against the privacy threat model before its permission is added. The permission must be narrowly scoped, documented here, reflected in platform-specific user-facing copy where required, and covered by the repository quality gate.
