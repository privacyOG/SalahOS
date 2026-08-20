# SalahOS v1.2.0 release notes

SalahOS v1.2.0 expands the local-first prayer application into a broader mosque, congregation and managed-display platform while preserving the privacy boundary of the core prayer experience. It also introduces the full Qiblah Finder, Ramadan presentation improvements and complete Turkish/Indonesian localisation.

## Managed masjid and congregation platform

- Modern prayer-first design system with responsive congregation navigation.
- Managed mosque identities, authoritative prayer/Iqamah/Jumu'ah publication revisions, mosque following/offline cache, directory/profile experiences, monthly timetables and multiple local mosque profiles.
- Managed authorization and administrator-dashboard foundations without making personal prayer use account-dependent.
- Mosque announcements/events, congregation feeds, publishing previews and managed community-notification policy.

## Managed displays and signage

- Managed signage scenes, ordered playlists, scheduling, display pairing/fleet state and dedicated TV/foyer/Raspberry Pi display layouts.
- Four deterministic smart-display themes: Classic, Midnight, Sandstone and Emerald.
- Optional remote managed-display administration with authenticated fleet actions, one-time display credentials, revisioned configuration, heartbeats and fail-soft cached prayer operation.

## Public and home integrations

- Versioned read-only mosque API contracts and constrained embeddable prayer widgets.
- Home Assistant integration exposing timezone-aware obligatory-prayer sensors.
- Optional loopback-default local network API with explicit LAN opt-in, validation, rate limits and last-known-good snapshots.
- RFC 5545 mosque-event calendar export and read-only subscription feed.
- Privacy-minimised wearable companion snapshot contract and future watchOS/Wear OS architecture exploration.

## Qiblah Finder

- Deterministic local great-circle Qiblah bearing and true-north live compass guidance where supported.
- WMM2025 magnetic-declination correction, screen-orientation compensation, circular smoothing, calibration feedback, alignment tolerance and haptics.
- Saved/current/live/offline-city/map-pin location modes.
- Optional user-enabled OpenStreetMap imagery with attribution and an explicit reviewed privacy/network boundary; core bearing and compass operation remain local/offline.

## Ramadan and languages

- Automatic Ramadan mode, Suhur/Imsak/Iftar presentation and mosque-specific Taraweeh timetable sessions.
- Complete bundled Turkish and Indonesian application localisation alongside English and Arabic/RTL.

## Downloadable v1.2.0 assets

A successful v1.2.0 release publishes the same verified distribution set established by v1.1.0:

- `SalahOS-v1.2.0-android.apk` — persistently signed Android release APK, verified with Android `apksigner`;
- `SalahOS-v1.2.0-web-pwa.zip` — production Web/PWA package;
- `SalahOS-v1.2.0-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — portable SHA-256 hashes for all published packages.

The workflow fails closed if Android release signing is unavailable and verifies archive integrity, checksums and the exact final asset set before publication.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and validated.
- No native macOS `.dmg` is published because SalahOS does not yet contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance remains separate from CI packaging evidence.

## Release gates

The v1.2.0 release revision must be the exact current `main` commit and pass the permanent Quality, Android, Visual Regression and iOS workflows. The release-asset workflow reruns the full repository quality gate for Web/PWA/kiosk packaging, verifies persistent Android signing and `apksigner`, verifies portable checksums and the exact four-file package, and only then creates/uploads the GitHub release.

See `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for exact distribution and validation boundaries.

## Author

privacyOG
