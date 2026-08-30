# SalahOS v1.5.2 release notes

SalahOS v1.5.2 expands the Australian mosque experience and corrects the Fajr/Sunrise prayer-state boundary while preserving the exact-head quality, signing and packaging contract established in prior releases.

## Australian mosque directory

- Expands the bundled Australian mosque catalogue from the former 106-record OpenStreetMap-only runtime to a **254-record deduplicated combined directory** built from reviewed OpenStreetMap and Australian Mosque Finder factual source snapshots.
- Preserves source provenance and attribution through the combined catalogue and deployable country/region packs.
- Uses audited and evidence-scored cross-source identity matching, coordinate quarantine for unsafe geospatial records and explicit protection against known false merges.
- Keeps the directory offline-first and integrates the combined catalogue into the shared directory service and generated Australian state/territory packs.
- Strengthens reproducibility and visual acceptance so source, combined and pack outputs must remain internally consistent with the 254-record contract.

## Selected mosque prayer and Iqamah context

- `Use mosque` now activates the selected directory mosque as the Today prayer-location context without overwriting the user's separately saved personal location.
- Prayer starts continue to use SalahOS calculation settings at the selected mosque's coordinates and timezone unless an explicit authoritative local-mosque timetable is selected.
- Explicit mosque-specific congregation times published by the Australian Mosque Finder listing are surfaced as Iqamah/Jama'ah times.
- Multiple published congregation sessions remain visible rather than being collapsed to one value.
- Missing congregation times are shown as **Not published**; SalahOS does not fabricate an Iqamah time.
- Generic locality prayer calendars are not mislabelled as mosque-specific Iqamah data.
- A separately configured full local-mosque timetable remains authoritative and is not overridden by directory metadata.

## Fajr and Sunrise correctness

- Adds Sunrise permanently to the Today timetable as a distinct **non-prayer time** labelled as the point where **Fajr ends**.
- Corrects current-prayer resolution so Fajr can no longer remain marked as current after Sunrise.
- Between Sunrise and Dhuhr, Today reports the state as **Between prayer times** while Dhuhr remains the next obligatory prayer.
- Sunrise is never treated as an obligatory prayer, current prayer or next obligatory prayer, and its Iqamah value is correctly shown as not applicable.
- Updates mobile, tablet, accessibility, RTL, weather and device-UX visual contracts to preserve exactly five obligatory prayer rows plus the separate Sunrise boundary row.

## Quality and release engineering

- Preserves strict Prettier, ESLint and TypeScript checks with no suppressions added for this release.
- Keeps the 254-record Australian source/combined/pack reproducibility checks and shared-directory acceptance in the permanent Quality Gate.
- Keeps the main JavaScript chunk below the unchanged 550,000-byte architecture budget by persisting only a lightweight selected-mosque context rather than eagerly bundling the complete Australian catalogue into Today.
- Preserves full unit/coverage, production-build, bundle-budget, visual-regression, Android emulator lifecycle, fresh iPhone/iPad Simulator and packaged Windows executable acceptance.

## Release reconciliation

- Synchronises npm, package-lock, Android and iOS marketing versions at `1.5.2`.
- Advances Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together to build `9`.
- Preserves fail-closed exact-current-main release preflight, persistent Android production-signing verification, archive integrity checks and exact-final-file-set verification.

## Downloadable v1.5.2 assets

A successful v1.5.2 publication includes:

- `SalahOS-v1.5.2-android.apk` — persistently signed Android release APK for direct installation;
- `SalahOS-v1.5.2-android.aab` — persistently signed Android App Bundle for Google Play/distribution workflows;
- `SalahOS-v1.5.2-windows-x64.exe` — self-contained 64-bit Windows 10/11 desktop executable;
- `SalahOS-v1.5.2-web-pwa.zip` — complete production Web/PWA package;
- `SalahOS-v1.5.2-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — SHA-256 hashes for all packaged release assets.

The Windows executable includes its .NET runtime and expects the Microsoft Edge WebView2 Runtime, normally present on current Windows 10/11 installations. GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and a distribution archive can be validated. iPhone/iPad Simulator acceptance is test evidence, not a consumer installer.
- No native macOS `.dmg` is published because SalahOS does not contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance is not inferred from browser, emulator or Simulator evidence.

## Release gates

The v1.5.2 release revision must be the exact current `main` commit and pass the permanent Quality Gate, Visual Regression, Android, iOS and Windows workflows. The release-asset workflow reruns repository quality checks, verifies persistent Android signing, builds and verifies APK/AAB packages, validates Web/PWA and Raspberry Pi archives, checks the exact final file set and SHA-256 manifest, and only then creates or updates the GitHub release. The Windows workflow independently self-tests the packaged executable and reconciles its checksum into the published manifest.

## Author

privacyOG
