# SalahOS v1.3.0 release notes

SalahOS v1.3.0 completes the UI/UX v2 programme through Stage 27 and packages the current release-ready SalahOS targets from one exact, validated `main` revision. It preserves the local-first prayer engine, explicit privacy boundaries and prayer-source semantics while completing the redesigned congregation, administration, phone/tablet and smart-display experiences.

## UI/UX v2 completion

- Completes the six original SalahOS prayer-board designs across managed TV/kiosk displays and validated Phone/Home Today variants.
- Adds optional fail-soft prayer-board weather plus scheduled announcement/display rotation without making remote content authoritative for prayer times.
- Completes the managed-masjid administration redesign with dedicated overview, prayer/Iqamah, Jumu'ah/Ramadan, community, display, integration, member and administration destinations.
- Completes phone, tablet, desktop, Raspberry Pi Touch Display and 1080p/4K TV/kiosk refinement.
- Completes accessibility, Arabic/RTL and visual acceptance coverage, including forced-colours, reduced-motion, text expansion and representative human review.
- Retires the legacy single-page application composition, destination-hiding CSS and root compatibility colour aliases. Dedicated v2 Settings panels and `SmartDisplayApplication` now own their surfaces directly.
- Keeps administrator-only fleet, credentials and publishing controls isolated from ordinary congregation workflows.

## Congregation and display experience

- Prayer-first Today presentation with clear Start/Athan, Iqamah/Jama'ah, current/next prayer, countdown, Jumu'ah and Ramadan context.
- Dedicated Today, Mosques, Qiblah, Community and Settings destinations with responsive phone bottom navigation, tablet rail and desktop navigation.
- Category-based Settings for Prayer, Location, Mosque & Iqamah, Notifications & Adhan, Appearance & Language, Data & Privacy, Display Themes and Advanced controls.
- Direct Phone/Home theme selection and optional weather configuration remain available after legacy UI retirement.
- Six independently usable prayer-board templates: Heritage Classic, Minimal Modern, Bold Countdown Focus, Structured Split Board, Scenic Spiritual and Family & Classroom.
- Smart-display runtime remains isolated from congregation navigation and administration forms and continues to use authoritative local prayer data when optional remote content is unavailable.

## Release and integrity improvements

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.3.0`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together to build `5`.
- Tightens exact-main release preflight to verify lockfile-version consistency and Android/iOS build-number parity.
- Produces both a persistently signed Android APK and signed Android App Bundle (AAB).
- Verifies the APK with Android `apksigner`, verifies the AAB JAR signature, verifies Web/PWA and Raspberry Pi archive integrity and publishes a portable SHA-256 manifest for every packaged artifact.
- Fails closed if persistent Android release signing is unavailable or if the final package contains missing or unexpected files.

## Downloadable v1.3.0 assets

A successful v1.3.0 publication includes:

- `SalahOS-v1.3.0-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.3.0-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.3.0-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.3.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for all packaged release assets.

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. The existing iPhone/iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance remains separate from automated browser/emulator/Simulator and packaging evidence.

## Release gates

The v1.3.0 release revision must be the exact current `main` commit and pass the permanent Quality, Android, Visual Regression and iOS workflows. The release-asset workflow then reruns the complete repository quality gate, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release.

See `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md`, `docs/PLATFORM_STATUS.md` and `docs/UI_UX_V2_PLAN.md` for exact implementation, validation and distribution boundaries.

## Author

privacyOG
