# SalahOS v1.6.0 release notes

SalahOS v1.6.0 is a mobile usability, Qur’an reliability, Islamic Knowledge organisation, theme and release-hardening update. It improves small-screen, large-text, Arabic/RTL and offline behavior while preserving provenance, signing and exact-head release checks.

## Highlights

- Removes Iqamah content from **Today** while retaining prayer start times, locality and calculation provenance.
- Adds persistent **Standard, Light Blue, Emerald, Navy, Warm Sand and Soft Lavender** palettes independently of Light, Dark or System appearance.
- Improves mobile Calendar, mosque empty/offline/location-denied states, Qiblah sensor fallbacks and Settings discoverability.
- Adds permanent responsive acceptance across 320×568, 360×780, 390×844, 430×932, 844×390 and 768×1024, including Arabic RTL and 200% text scenarios.

## Qur’an reader and SalahOS 2026

- Adds **SalahOS 2026 (English meaning)** as the default English-meaning mode, transparently derived from the pinned M. M. Pickthall (1930) baseline/reference with project-guide verse-specific overrides.
- Keeps **M. M. Pickthall (1930)** separately selectable and preserves Arabic-only reading.
- Applies the supplied Ashʿarī Muhkam/Mutashabih methodology to the required seed passages, preserving Salaf-style tafwīd/tanzīh and contextual Khalaf taʾwīl notes where provided.
- Pins Qur’anic Arabic as **Uthmani · Medina Mushaf · Hafs**, with explicit Arabic language metadata, RTL direction, right alignment and bidi isolation.
- Corrects opening Bismillah presentation: Al-Fātiḥah retains Bismillah as ayah 1; At-Tawbah receives no opening Bismillah; ordinary surahs display one standalone opening Bismillah without duplicating a source prefix in ayah 1.
- Keeps canonical packaged Qur’an bytes and integrity hashes unchanged while performing Bismillah normalization only in the reader display layer.
- Preserves search, bookmarks, Resume, copy/share, retry recovery and normalized Arabic search without modifying canonical display text.

## Whole-corpus sign-off

The project owner `privacyOG` explicitly signed off the complete 114-surah / 6,236-ayah SalahOS 2026 corpus for V1.6.0 release on **2026-09-09**. The authoritative sign-off is recorded in `src/data/quran-scholarly-signoff.json`.

The verse-level review register remains supplemental provenance and is not artificially expanded into 6,236 machine-generated reviewer records. CI validates the complete corpus, required Mutashabih seed treatments, translation identity, Uthmani/Hafs/Medina provenance and the explicit whole-corpus sign-off.

## Islamic Knowledge

- Separates Qur’an, Hadith and **Fiqh & questions** scopes.
- Makes content and source information easier to reach on mobile while keeping translation distinct from commentary.
- Renames the abbreviated Hadith “Isnad” field to **Companion narrator** while retaining sourced grading and school distinctions.
- Aligns curated Qur’an excerpts with the SalahOS 2026 identity while preserving explicit Uthmani Arabic, Pickthall baseline and tafsir provenance.

## Quality and release engineering

- Synchronises npm/package-lock to `1.6.0`, Android to `versionCode 11` / `versionName 1.6.0`, and iOS to build `11` / marketing version `1.6.0`.
- Retains formatting, lint, typecheck, unit/coverage, Qur’an integrity/governance, dependency/security, mosque reproducibility, production-build and bundle-budget checks.
- Retains permanent Quality, Visual Regression, Android emulator lifecycle, iPhone/iPad Simulator and Windows executable workflows.
- Keeps publication fail-closed on the exact current `main` revision, persistent Android signing, archive integrity, exact final file-set verification and SHA-256 verification.

## Downloadable v1.6.0 assets

A successful publication contains:

- `SalahOS-v1.6.0-android.apk`
- `SalahOS-v1.6.0-android.aab`
- `SalahOS-v1.6.0-windows-x64.exe`
- `SalahOS-v1.6.0-web-pwa.zip`
- `SalahOS-v1.6.0-raspberry-pi-kiosk.tar.gz`
- `SHA256SUMS.txt`

GitHub also exposes the standard source-code ZIP and tarball for the release tag.

## Distribution boundaries

A consumer iOS/iPadOS `.ipa` is not included because Apple distribution signing/provisioning is not configured. No native macOS `.dmg` is included because SalahOS has no native macOS target.

Physical Android/iOS device acceptance remains a separately tracked hardware-validation item. Emulator/Simulator/browser evidence is not represented as physical-device testing. By project-owner release decision, that outstanding hardware validation is documented as a post-release follow-up rather than a blocker to the V1.6.0 downloadable release.

## Author

privacyOG
