# SalahOS v1.5.0 release notes

SalahOS v1.5.0 completes the ten-stage v1.5 programme with stronger real-world resilience, richer mosque and Islamic-content experiences, clearer privacy controls, more focused product UX, and an explicit release-verification contract across Web, Android, iOS/iPadOS, Raspberry Pi Touch Display and TV/kiosk targets.

## Location, weather and local context

- Strengthens best-available location handling so precise GPS remains preferred while network-assisted fallback is used only after non-terminal precision failures.
- Preserves terminal permission-denial behaviour and fails closed when both precise and approximate acquisition fail instead of inventing coordinates.
- Integrates automatic local weather with cached current/daily context, stale-cache recovery on provider/network failure and expiry of obsolete weather data.
- Improves Today around current/next prayer, prayer times, weather, location confidence and concise local context.

## Mosque directory and timetable quality

- Expands mosque directory coverage and enrichment with distance-aware discovery, selection/favourites, directions, report/edit flows, verification/freshness state, provenance and data-quality scoring.
- Adds explicit quality checks for completeness, provenance coverage, freshness boundaries and unresolved-data conflict penalties.
- Removes unsafe website/social URLs before they can become user actions.
- Preserves local-mosque timetable precedence over calculated times and exposes missing mosque entries as unavailable rather than silently substituting calculated data.
- Keeps timetable date validation fail-closed so mosque data from the wrong civil date cannot override the active schedule.

## Qur'an, Hadith, Fiqh and Islamic Knowledge

- Expands the Islamic Knowledge experience while preserving source/reference provenance and governance requirements.
- Strengthens Qur'an offline/content handling and the supporting content-source policy.
- Extends Hadith and Fiqh/Q&A presentation with explicit reference, grading/scholarly attribution and juristic-context safeguards where applicable.
- Keeps Islamic-content source governance in the permanent Quality Gate.

## Product UX refinement

- Strengthens Today hierarchy around current/next prayer and reduces explanatory-card clutter through progressive disclosure.
- Simplifies phone navigation to the primary destinations while preserving the broader desktop experience.
- Reorganises Settings into Location, Prayer settings, Adhan, Display, Mosques, Privacy & data and Advanced.
- Preserves SalahOS visual identity while improving location-confidence feedback, Arabic/RTL behaviour and compact-device usability.

## Real-world and accessibility verification

- Expands automated GPS/location fallback, weather failure/cache, mosque data-quality/action and timetable-precedence tests.
- Adds a v1.5 representative acceptance matrix for Android-phone, iPhone and iPad viewports with 200% text scaling, reduced-motion preference and assistive-technology-oriented accessible-name/current-prayer semantics.
- Retains dedicated Raspberry Pi Touch Display acceptance across representative 5-inch, 7-inch and 10-inch portrait/landscape profiles.
- Retains TV/kiosk acceptance across all prayer-board templates at 1920×1080 and 3840×2160, including safe-frame, burn-in mitigation and keyboard recovery checks.
- Retains axe-core WCAG A/AA, RTL/container-overflow and cross-browser Chromium/Firefox/WebKit acceptance.
- Clearly distinguishes emulator, Simulator and browser evidence from physical-device testing. Physical Android OEM, iPhone/iPad, Raspberry Pi Touch Display and TV/panel acceptance remains supplementary where hardware is available.

See `docs/REAL_WORLD_VERIFICATION_V1.5.md` for the Stage 9/10 acceptance matrix and physical-device boundary.

## Release reconciliation

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.5.0`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together to build `7`.
- Preserves the established release-asset pipeline for persistently signed Android APK/AAB, Web/PWA ZIP, Raspberry Pi kiosk archive and portable SHA-256 manifest.
- Preserves fail-closed release preflight for exact-main revision, Android signing, version/build parity, archive integrity and final package contents.

## Downloadable v1.5.0 assets

A successful v1.5.0 publication includes:

- `SalahOS-v1.5.0-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.5.0-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.5.0-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.5.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for all packaged release assets.

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. Fresh iPhone and iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance is not inferred from browser, emulator or Simulator evidence.

## Release gates

The v1.5.0 release revision must be the exact current `main` commit and pass the permanent Quality, Visual Regression, Android and iOS workflows. The exact final pull-request head is revalidated after tracker reconciliation before merge. The iOS runtime gate is accepted only when the fresh iPhone/iPad Simulator install/launch/relaunch step itself reports success, not merely when the enclosing workflow reports success.

The release-asset workflow then reruns repository quality checks, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release.

The completed implementation and exact-head evidence for all ten v1.5 stages is recorded in `TEMP_TODO_V1.5.md`. See `docs/REAL_WORLD_VERIFICATION_V1.5.md`, `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for detailed validation and distribution boundaries.

## Author

privacyOG
