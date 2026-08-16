# Native permission review

SalahOS uses the minimum native permissions required by the features currently implemented in the Android and iOS shells. New native permissions must be justified by a shipped feature and added to the executable permission verifier before they can pass the repository quality gate.

## Android

The application manifest is allowed to declare only:

- `android.permission.ACCESS_COARSE_LOCATION` — used for the explicit one-shot current-location action. SalahOS does not continuously track location.
- `android.permission.ACCESS_FINE_LOCATION` — retained because the native geolocation plugin may return a precise fix when the user grants that level of access. The application still requests a single fix and discards accuracy, altitude, speed, heading and timestamps.
- `android.permission.SCHEDULE_EXACT_ALARM` — used by the native local-notification path where Android permits exact prayer-time scheduling. Platform restrictions and denial/fallback behavior remain documented separately.
- `android.permission.INTERNET` — retained for the Capacitor/WebView networking capability and supported Web/PWA or explicitly configured network paths. Core prayer calculation remains local and no optional remote provider is enabled merely by this permission.

The source manifest must not add camera, microphone, contacts, storage/media, background-location or other unrelated permissions without a separate feature/security review. Plugin/library manifests may contribute permissions required by pinned dependencies; the Android build and notification-reboot verifier remain responsible for validating the merged native application.

## iOS / iPadOS

The application declares only `NSLocationWhenInUseUsageDescription` for location. SalahOS asks for location only after the user chooses the current-location action.

The project intentionally does **not** declare:

- `NSLocationAlwaysUsageDescription`;
- `NSLocationAlwaysAndWhenInUseUsageDescription`;
- background location modes;
- camera, microphone, contacts or photo-library usage descriptions;
- an application entitlements file.

The earlier Always-and-When-In-Use description was removed because the current native implementation has no background-location capability and does not request always-on location access.

## Automated enforcement

`npm run verify:native-permissions` checks the explicit Android source-manifest allowlist, verifies iOS has only the required when-in-use location description, rejects known unrelated/background declarations, and fails if an iOS entitlements file is configured through the Xcode project without review.

This verifier is part of `npm run check`. A permission change therefore requires an intentional repository change and review rather than silently expanding the native privilege surface.
