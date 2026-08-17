# SalahOS v1.1.0 release notes

SalahOS v1.1.0 adds the canonical SalahOS visual identity and introduces verified downloadable release packages so users do not need to build supported distributions from source.

## Canonical SalahOS branding

- Uses the project owner's supplied SalahOS mosque/clock/crescent artwork as the canonical source.
- Applies the canonical identity to Web/PWA, Android launcher/adaptive/round icons, iOS AppIcon, the application header and smart-display presentation.
- Retains the canonical source in the repository and verifies generated platform assets by source hash, output hash and image dimensions.
- Removes the prior generic placeholder SVG icon fallbacks.
- Updates the PWA application-shell cache so installed Web/PWA clients receive the new branding cleanly.

## Downloadable release assets

A successful v1.1.0 release workflow publishes:

- `SalahOS-v1.1.0-android.apk` — cryptographically signed Android release APK;
- `SalahOS-v1.1.0-web-pwa.zip` — production Web/PWA package;
- `SalahOS-v1.1.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — integrity hashes for the downloadable packages.

The Android APK is a mandatory release job for a tagged v1.1.0 release. The workflow refuses to publish an unsigned or debug APK and verifies the signed result using Android `apksigner` before release publication.

The persistent Android signing identity is supplied only through GitHub Actions secrets and is never committed to the repository.

## Distribution boundaries

- The iOS/iPadOS native application remains build- and Simulator-validated, but a consumer `.ipa` is not published until Apple distribution signing/provisioning is configured and the distribution archive can be validated.
- SalahOS does not yet contain a native macOS desktop application target, so a `.dmg` is not published. A Web/PWA or iOS Simulator artifact will not be relabeled as a macOS installer.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance remains separate from CI packaging evidence and is not marked as completed by this release.

## Existing prayer, location and display functionality

v1.1.0 retains the v1 prayer/time engine and application capabilities, including:

- five obligatory prayer calculations plus Sunrise;
- Standard/Shafi'i-family and Hanafi Asr conventions;
- recognised calculation-method profiles, high-latitude handling and manual adjustments;
- Gregorian and Hijri/Umm al-Qura presentation;
- local/offline city search, saved locations and IANA timezone resolution;
- local mosque timetable import/manual entry, Iqamah and multiple Jumu'ah sessions;
- native Android/iOS prayer notification adapters with documented lifecycle constraints;
- private user-selected local Adhan audio for foreground playback attempts;
- English/Arabic RTL, light/dark/system themes and accessibility support;
- Web/PWA offline shell and Raspberry Pi/TV/kiosk smart-display operation.

## Release gates

The exact v1.1.0 release revision must pass the permanent Quality, Android, Visual Regression and iOS workflows before tagging. In addition, the release-asset workflow must successfully produce the Web/PWA and Raspberry Pi packages and a persistently signed, `apksigner`-verified Android APK before the GitHub release is published.

See `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for the exact distribution and validation boundaries.

## Author

privacyOG