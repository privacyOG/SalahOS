# SalahOS v1.4.0 release notes

SalahOS v1.4.0 completes the ten-stage v1.4 programme and packages the resulting release-ready targets from one exact, validated `main` revision. The release strengthens mobile accessibility, makes live Qiblah guidance substantially more automatic and resilient, expands mosque and Islamic-content capabilities, improves startup architecture, and raises permanent verification coverage across browsers and native runtimes.

## Mobile and accessibility hardening

- Hardens compact phone layouts at 360×780 and 390×844 so the final prayer row and trailing content remain reachable above bottom navigation and safe areas.
- Improves confirmed light/dark/RTL contrast cases while preserving the established SalahOS visual identity.
- Extends automated regression coverage for navigation overlap, RTL, text expansion, viewport containment and accessibility-sensitive states.

## Automatic Qiblah and compass guidance

- Automatically acquires the best available OS location when Qiblah opens and starts true-heading updates where supported, while retaining saved and manual fallbacks.
- Moves required permission education into first-run onboarding at the earliest operating-system-valid point.
- Adds a manual Recalibrate Compass action plus poor-heading-accuracy detection, guided recalibration and post-calibration reassessment.
- Makes Google Maps the primary interactive Qiblah provider with Map, Satellite and Hybrid modes, user and Kaaba markers, a high-visibility geodesic Qiblah line, full-route refit, click-to-pin selection and provider-error recovery.
- Keeps a network-free manual-pin fallback when the interactive provider is unavailable.

## Mosque directories

- Adds a bundled offline-first Australian mosque catalogue generated reproducibly from a committed OpenStreetMap snapshot with contributor/ODbL provenance.
- Adds nearby ordering, text search, selection/persistence and deduplication for the bundled catalogue.
- Adds shared/community mosque directory models and service flows for text/geographical lookup, submissions, duplicate detection, moderation/edit suggestions, verification/claim state and local offline cache resilience.

## Adhan audio library

- Adds two rights-verified packaged Adhan recordings with pinned provenance/attribution and normalized audio metadata.
- Adds default and per-prayer selection, preview, volume and notification-only controls.
- Keeps private user-selected local recordings device-local.
- Extends permanent quality/native bundle checks so packaged Adhan audio integrity is verified on Web, Android and iOS synchronization paths.

## Islamic Knowledge

- Adds the Knowledge destination with bundled offline-first Qur'an, Hadith and Q&A starter modules.
- Adds local search and module filtering.
- Preserves explicit Qur'an source/reference labels, Hadith collection/reference/grade/grading authority and Q&A scholar/source attribution with juristic-variation notes where appropriate.
- Provides Knowledge navigation and shell copy across English, Arabic, Turkish and Indonesian, including Arabic RTL acceptance.

## Performance architecture

- Removes the ineffective static edge around timetable import/export so the module is emitted as a genuine lazy chunk.
- Keeps Today eager while Admin, smart-display, Mosques, Qiblah, Knowledge, Community and Settings load at route/surface level.
- Reduces the validated startup JavaScript path from the previous approximately 882 kB monolithic chunk to a largest chunk of 469,196 bytes; the timetable-import module is approximately 4 kB and lazy loaded.
- Adds a permanent bundle architecture budget. The validated v1.4 build emits 21 JavaScript chunks, with 898,871 total JavaScript bytes.

## Verification upgrades

- Adds deterministic golden screenshot regression for representative Today EN/light and Knowledge AR/dark states.
- Adds axe-core WCAG A/AA checks plus stronger RTL and viewport/container-overflow acceptance.
- Adds Chromium, Firefox and WebKit smoke journeys covering eager and lazy-loaded application surfaces.
- Locks V8 core coverage thresholds into the Quality Gate.
- Preserves exact-head Quality, Visual Regression, Android emulator lifecycle and fresh iPhone/iPad Simulator lifecycle acceptance before release.

## Release and integrity improvements

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.4.0`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together to build `6`.
- Publishes both a persistently signed Android APK and signed Android App Bundle (AAB).
- Verifies the APK with Android `apksigner`, verifies the AAB signature, validates Web/PWA and Raspberry Pi archive integrity, and publishes a portable SHA-256 manifest covering every packaged artifact.
- Fails closed if the release candidate is not the exact current `main`, persistent Android release signing is unavailable, version/build metadata diverges, or the final package contains missing or unexpected files.

## Downloadable v1.4.0 assets

A successful v1.4.0 publication includes:

- `SalahOS-v1.4.0-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.4.0-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.4.0-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.4.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for all packaged release assets.

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. Fresh iPhone and iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance remains separate from automated browser, emulator, Simulator and packaging evidence.

## Release gates

The v1.4.0 release revision must be the exact current `main` commit and pass the permanent Quality, Android, Visual Regression and iOS workflows. The release-asset workflow then reruns the complete repository quality gate, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release.

The completed implementation and exact-head evidence for all ten v1.4 stages is recorded in `TEMP_TODO_V1.4.md`. See `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for detailed implementation, validation and distribution boundaries.

## Author

privacyOG
