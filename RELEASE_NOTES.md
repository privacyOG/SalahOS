# SalahOS v1.5.1 release notes

SalahOS v1.5.1 is a focused quality, accessibility and usability update that completes the v1.5.1 theme and Prayer Calendar programme while preserving the release-verification contract established in v1.5.0.

## Theme, contrast and visual consistency

- Strengthens semantic foreground/background ownership so Light, Dark and System appearance modes remain readable and predictable.
- Adds and validates eight curated palettes: Salah Classic, Midnight Gold, Emerald Mosque, Royal Blue, Desert Sand, Olive Heritage, Monochrome and High Contrast.
- Keeps appearance mode independent from palette selection and persists the selected palette through Display settings.
- Extends the shared theme contract across phone, tablet, Web/PWA and mosque/smart-display surfaces.
- Strengthens display-oriented hierarchy for clock, next prayer, prayer/Iqamah rows, announcements and mosque branding without creating a separate styling system.
- Expands representative theme-matrix contrast checks, RTL/large-text coverage and regression protection for the Today and Qiblah readability failure classes.

## Hijri-aligned Prayer Calendar

- Adds a dedicated Prayer Calendar destination with Daily, Weekly, Monthly and Yearly views without changing the Today screen.
- Aligns Gregorian and Hijri presentation through the Umm al-Qura calendar while preserving the existing optional local Hijri correction of ±2 days.
- Standardises English Hijri month names and explicitly displays the `AH` era.
- Locks reference acceptance for 1 January 2026 = 12 Rajab 1447 AH and key 2026 Hijri month/year boundaries.
- Keeps all calendar views on the same civil-date, location, timezone, calculation-method and prayer-time pipeline so views remain mutually consistent.
- Adds responsive, RTL and accessibility coverage for the Prayer Calendar.

## Instructions and operational guidance

- Adds `Instructions guide.md` for ordinary users and mosque administrators.
- Covers Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk operation.
- Documents setup, location, prayer calculation and madhhab options, Iqamah, Qiblah, mosque features, Adhan/notifications, language/themes, offline use, display operation, updates, troubleshooting and reset.

## Release reconciliation

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.5.1`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together to build `8`.
- Preserves fail-closed exact-main release preflight, Android production-signing verification, archive integrity checks and final package verification.
- Corrects the mobile device-UX acceptance contract so it matches the current seven route-capable destinations, with Community retained as a route but hidden from the six-item mobile primary navigation.

## Downloadable v1.5.1 assets

A successful v1.5.1 publication includes:

- `SalahOS-v1.5.1-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.5.1-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.5.1-windows-x64.exe` — self-contained 64-bit Windows 10/11 desktop executable;
- `SalahOS-v1.5.1-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.5.1-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for all packaged release assets.

The Windows executable includes its .NET runtime and expects the Microsoft Edge WebView2 Runtime, normally present on current Windows 10/11 installations. GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. iPhone/iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance is not inferred from browser, emulator or Simulator evidence.

## Release gates

The v1.5.1 release revision must be the exact current `main` commit and pass the permanent Quality Gate, Visual Regression, Android and iOS workflows. Stage 5.1 is accepted only when its calendar acceptance runs successfully on that exact final head. Stage 7 is accepted only after the complete v1.5.1 reconciliation is green.

The core release-asset workflow reruns repository quality checks, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release. The Windows release workflow independently self-tests the packaged executable and reconciles the published checksum manifest.

Implementation and exact-head completion state are recorded in `TEMP_TODO_V1.5.1.md`. See `Instructions guide.md`, `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for detailed operation, validation and distribution boundaries.

## Author

privacyOG
