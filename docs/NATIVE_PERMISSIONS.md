# Native permission review

SalahOS follows a least-privilege native permission policy. Permissions and privacy usage descriptions are retained only when they are required by an implemented feature.

## Android

The application manifest declares:

- `ACCESS_COARSE_LOCATION` — foreground location when the user explicitly asks SalahOS to use the current position.
- `ACCESS_FINE_LOCATION` — permits the native location bridge to return an accurate foreground fix where the operating system grants it. The main prayer-location flow can operate without continuous high-accuracy tracking; the Qiblah Finder explicitly requests a high-accuracy foreground fix first when the user selects current-position guidance and falls back when that fix is unavailable.
- `SCHEDULE_EXACT_ALARM` — user-managed precise-alarm capability for prayer notifications on Android versions where exact scheduling is restricted. SalahOS continues with an explicit inexact fallback when unavailable.
- `INTERNET` — required by the Capacitor web runtime and browser-hosted application shell. Core prayer calculations and Qiblah bearing remain local-first and do not require a remote account or remote calculation service. Optional Qiblah map imagery uses reviewed third-party image hosts only after explicit user action.

The compass sensor does not add a new Android runtime permission. Android supplies magnetic heading through the native compass adapter; SalahOS converts magnetic heading to true north locally using the selected coordinates and WMM2025 magnetic declination.

The application does **not** request background location or an unrestricted battery-optimisation exemption. Camera, microphone and contact permissions are not part of the current feature set.

## iOS / iPadOS

`NSLocationWhenInUseUsageDescription` is the only location privacy description required by the current implementation. Location acquisition is user-initiated and foreground-only. The native compass can use that existing foreground location authorization for an iOS geographic/true heading. If a true heading is unavailable, SalahOS falls back to the magnetic heading and performs the magnetic-declination correction locally rather than introducing another permission.

The application does not declare always/background location access or a background location mode. Camera, microphone and contacts access are not part of the current feature set.

## Qiblah live-location lifecycle

The Qiblah Finder starts a live foreground location watch only after a successful user-initiated current-position request. The UI exposes an explicit stop action, the watch is stopped when another manual/city/map-pin location is chosen or the component is unmounted, and the implementation does not request background location capability.

## Permanent policy gate

`npm run security:native-permissions` checks the committed Android manifest and iOS property list. The gate fails when an unreviewed Android permission appears, when foreground location declarations disappear, or when background/always-location capabilities are introduced.

Any future native capability must be reviewed against the privacy threat model before its permission is added. The permission must be narrowly scoped, documented here, reflected in platform-specific user-facing copy where required, and covered by the repository quality gate.
