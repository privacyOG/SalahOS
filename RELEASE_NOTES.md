# SalahOS v1.6.1 release notes

SalahOS v1.6.1 is a focused post-v1.6.0 update for Qur’an navigation, mobile Arabic/RTL presentation and the Hadith library. It contains the two feature updates merged to `main` after v1.6.0 and keeps the existing exact-main release, signing and checksum safeguards.

## Qur’an reader improvements

- Adds faster Surah and Ayah navigation in the Knowledge Qur’an reader.
- Improves mobile layout and deep-verse navigation behavior.
- Makes translation verse references more explicit and easier to follow.
- Strengthens wrapped Arabic RTL rendering so Arabic remains right-aligned across wrapped lines and narrow phone widths.
- Adds dedicated Qur’an navigation and wrapped-Arabic RTL visual acceptance coverage.

## Hadith library

- Adds **The Forty Nawawi Hadiths** as a complete offline collection containing all 42 numbered entries supplied for the project.
- Organises Hadith content by scholar/compiler and collection, including Imam al-Nawawi and the existing curated Imam al-Bukhari and Imam Muslim selections.
- Adds search across hadith title/text, scholar names, collection names and references.
- Preserves the existing Bukhari and Muslim entries as clearly identified curated selections rather than representing them as complete Sahih collections.
- Adds mobile-friendly scholar/collection browsing and dedicated Hadith-library visual acceptance.
- Enforces Arabic `dir="rtl"`, right alignment, bidi isolation and wrapped-line right alignment in the Hadith reader.

## Quality and release engineering

- Synchronises npm/package-lock to `1.6.1`, Android to `versionCode 12` / `versionName 1.6.1`, and iOS to build `12` / marketing version `1.6.1`.
- Retains formatting, lint, typecheck, unit/coverage, Qur’an integrity/governance, dependency/security, mosque reproducibility, production-build and bundle-budget checks.
- Retains permanent Quality, Visual Regression, Android emulator lifecycle, iPhone/iPad Simulator and Windows executable workflows.
- Keeps publication fail-closed on the exact current `main` revision, persistent Android signing, archive integrity, exact final file-set verification and SHA-256 verification.

## Downloadable v1.6.1 assets

A successful publication contains:

- `SalahOS-v1.6.1-android.apk`
- `SalahOS-v1.6.1-android.aab`
- `SalahOS-v1.6.1-windows-x64.exe`
- `SalahOS-v1.6.1-web-pwa.zip`
- `SalahOS-v1.6.1-raspberry-pi-kiosk.tar.gz`
- `SHA256SUMS.txt`

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

A consumer iOS/iPadOS `.ipa` is not included because Apple distribution signing/provisioning is not configured. The iOS build remains covered by the repository’s iPhone/iPad Simulator validation workflow. No native macOS `.dmg` is included because SalahOS has no native macOS target.

Physical Android/iOS device acceptance remains a separately tracked hardware-validation item; emulator, Simulator and browser evidence are not represented as physical-device testing.

## Author

privacyOG
