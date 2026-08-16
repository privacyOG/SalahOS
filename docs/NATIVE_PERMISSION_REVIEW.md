# Native permission review

SalahOS uses the minimum native permissions and platform declarations required by the features currently implemented in the Android and iOS shells. New native permissions must be justified by a shipped feature and added to the executable permission verifiers before they can pass the repository quality gate.

## Reviewed dependency versions

The native permission and manifest assumptions in this review are tied to the exact dependency versions that were inspected:

- `@capacitor/geolocation` `8.2.0`;
- `@capacitor/local-notifications` `8.2.1`.

`npm run verify:native-permissions` checks those exact declared versions. Updating either package must therefore include a fresh permission/manifest review and an intentional update to the verifier contract; changing `package.json` alone is not sufficient.

## Android app-owned permissions

The application source manifest is allowed to declare only:

- `android.permission.ACCESS_COARSE_LOCATION` — used for the explicit one-shot current-location action. SalahOS does not continuously track location.
- `android.permission.ACCESS_FINE_LOCATION` — retained because the native geolocation plugin may return a precise fix when the user grants that level of access. The application still requests a single fix and discards accuracy, altitude, speed, heading and timestamps.
- `android.permission.SCHEDULE_EXACT_ALARM` — used by the native local-notification path where Android permits exact prayer-time scheduling. Platform restrictions and denial/fallback behavior remain documented separately.
- `android.permission.INTERNET` — retained for the Capacitor/WebView networking capability and supported Web/PWA or explicitly configured network paths. Core prayer calculation remains local and no optional remote provider is enabled merely by this permission.

The source manifest must not add camera, microphone, contacts, storage/media, background-location or other unrelated permissions without a separate feature/security review.

## Android dependency-owned permissions

The reviewed `@capacitor/local-notifications` `8.2.1` Android manifest contributes three permissions during manifest merge:

- `android.permission.POST_NOTIFICATIONS`;
- `android.permission.RECEIVE_BOOT_COMPLETED`;
- `android.permission.WAKE_LOCK`.

They support notification permission on current Android versions and the plugin's scheduled-notification/reboot restoration path. The reviewed Geolocation Android plugin manifest contributes no permissions itself; coarse/fine location remain explicit app-owned declarations as required by its documentation.

`npm run verify:android-merged-permissions` runs after the Gradle Android build and inspects merged/packaged manifests containing both the SalahOS activity and Local Notifications restore receiver. The effective permission set is restricted to the four app-owned permissions plus the three reviewed Local Notifications permissions. Any new transitive permission fails the Android build until reviewed.

## Android local-data backup boundary

SalahOS stores sensitive local-first state such as saved locations, mosque timetables/settings and user-selected local Adhan media. The Android app therefore does not opt that state into platform backup or transfer.

The source manifest sets:

- `android:allowBackup="false"`;
- `android:fullBackupContent="@xml/backup_rules"` for the legacy backup-rule path;
- `android:dataExtractionRules="@xml/data_extraction_rules"` for Android 12+ backup/transfer policy.

Both rule files explicitly exclude the root, files, databases, shared preferences and external backup domains. The Android 12+ file applies those exclusions to both cloud backup and device transfer. `verify:native-permissions` enforces the manifest attributes and rule completeness so a future template regeneration cannot silently re-enable local-data export.

## iOS / iPadOS

SalahOS uses `@capacitor/geolocation` 8.2.0. That reviewed release requires both of the following `Info.plist` usage-description keys because its `ion-ios-geolocation` dependency is capable of reporting background location:

- `NSLocationWhenInUseUsageDescription`;
- `NSLocationAlwaysAndWhenInUseUsageDescription`.

The second key is a plugin compatibility declaration, **not** a SalahOS background-location feature. The reviewed plugin documentation states that the plugin itself does not support background geolocation directly and that the Always-and-When-In-Use prompt is not presented to users for this requirement.

SalahOS production code remains foreground/one-shot only:

- it calls `Geolocation.getCurrentPosition()` rather than `watchPosition()`;
- it requests a single fix only after the user chooses current location;
- it uses `enableHighAccuracy: false`, a 10-second timeout and a five-minute maximum cached age;
- it does not declare `UIBackgroundModes`;
- it does not declare the legacy `NSLocationAlwaysUsageDescription`;
- it does not declare camera, microphone, contacts or photo-library usage descriptions;
- it does not configure an application entitlements file.

If SalahOS later adds continuous or background location, that is a separate feature/privacy review and must not be inferred from the compatibility description key already required by the reviewed plugin.

## Automated enforcement

`npm run verify:native-permissions` checks:

- the exact reviewed Geolocation and Local Notifications dependency versions;
- the explicit Android source-manifest permission allowlist;
- Android backup/transfer exclusion attributes and rule files;
- both iOS location description keys required by reviewed Capacitor Geolocation 8.2.0;
- absence of unrelated iOS privacy/background declarations and unreviewed entitlements;
- the one-shot native-location source contract and absence of `watchPosition()`.

`npm run verify:android-merged-permissions` additionally checks the effective Gradle-merged permission set after an Android build.

The source verifier is part of `npm run check`, and the merged verifier runs for both debug and unsigned release Android builds. Permission, backup-surface or reviewed native dependency-version changes therefore require an intentional repository change and review rather than silently expanding native access.
