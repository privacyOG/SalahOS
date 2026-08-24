# Native permission review

SalahOS follows a least-privilege native permission policy. Permissions and privacy usage descriptions are retained only when they are required by an implemented feature.

## Android

The application manifest declares:

- `ACCESS_COARSE_LOCATION` — foreground location used by the prayer-location flow and automatic live Qiblah guidance after the user has granted foreground location access.
- `ACCESS_FINE_LOCATION` — permits the native location bridge to return an accurate foreground fix where the operating system grants it. Qiblah requests a high-accuracy foreground fix first and falls back to the platform's lower-power/network-assisted positioning when that fix is unavailable. Android may combine GPS, Wi-Fi and cellular/network positioning internally; SalahOS does not directly scan nearby Bluetooth devices for Qiblah.
- `SCHEDULE_EXACT_ALARM` — user-managed precise-alarm capability for prayer notifications on Android versions where exact scheduling is restricted. SalahOS continues with an explicit inexact fallback when unavailable.
- `INTERNET` — required by the Capacitor web runtime and browser-hosted application shell. Core prayer calculations and Qiblah bearing remain local-first and do not require a remote account or remote calculation service. Optional Qiblah map imagery uses reviewed third-party image hosts only after explicit user action.

The compass sensor does not add a new Android runtime permission. Android supplies magnetic/geographic heading through the native compass adapter; SalahOS converts magnetic heading to true north locally using the active coordinates and WMM2025 magnetic declination when a true heading is unavailable.

The application does **not** request background location or an unrestricted battery-optimisation exemption. Camera, microphone and contact permissions are not part of the current feature set.

## iOS / iPadOS

`NSLocationWhenInUseUsageDescription` is the only location privacy description required by the current native implementation. The first-run congregation onboarding explains and requests foreground location at the start of a new installation. Qiblah then automatically refreshes the foreground location when the Qiblah destination opens. The native compass can use the existing foreground location authorization for a geographic/true heading. If a true heading is unavailable, SalahOS falls back to the magnetic heading and performs the magnetic-declination correction locally rather than introducing another native permission.

For browser/PWA builds where Safari exposes `DeviceOrientationEvent.requestPermission()`, SalahOS requests that orientation permission from the first-run onboarding gesture and also primes it from the user's Qiblah navigation gesture on later sessions. This preserves the browser's user-activation requirement while allowing the Qiblah Finder itself to begin heading updates automatically after navigation.

The application does not declare always/background location access or a background location mode. Camera, microphone and contacts access are not part of the current feature set.

## Qiblah automatic live-location lifecycle

On a true first run, the congregation surface presents a concise permission explanation before requesting foreground location and any browser-only orientation permission that requires a user gesture. Existing configured installations are migrated past this one-time prompt so an application upgrade is not interrupted.

When the Qiblah destination opens after onboarding, the finder automatically:

1. starts from the saved prayer location immediately when one exists, so a bearing is never withheld while a fresh fix is pending;
2. requests the best current foreground position through the operating-system location service;
3. switches to that live position when successful and starts a foreground watch for meaningful movement; and
4. starts true-heading updates automatically as soon as coordinates are available.

If live location is denied, unavailable or times out, the existing saved/manual/city/map-pin location remains usable. The UI still exposes explicit retry, stop-live-location and stop/start-compass controls. Selecting a manual, saved, city or map-pin location cancels any in-flight live request/watch so a late GPS result cannot overwrite the user's explicit choice. All watches and heading sessions are stopped when the Qiblah Finder unmounts.

## Permanent policy gate

`npm run security:native-permissions` checks the committed Android manifest and iOS property list. The gate fails when an unreviewed Android permission appears, when foreground location declarations disappear, or when background/always-location capabilities are introduced.

Any future native capability must be reviewed against the privacy threat model before its permission is added. The permission must be narrowly scoped, documented here, reflected in platform-specific user-facing copy where required, and covered by the repository quality gate.
