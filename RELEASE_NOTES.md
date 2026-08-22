# SalahOS v1.2.1 release notes

SalahOS v1.2.1 is the first packaged release to include the completed UI/UX v2 work through Stage 23.10. It keeps the local-first prayer engine and privacy boundaries of v1.2.0 while substantially improving congregation navigation, prayer-board presentation, Qiblah usability and managed-display assignment.

## UI/UX v2

- Dedicated congregation destinations for Today, Mosques, Qiblah, Community and Settings.
- Responsive phone bottom navigation, tablet navigation rail and desktop navigation with RTL-aware ordering/alignment.
- Prayer-first Today hierarchy with conditional Ramadan, Jumu'ah and community context.
- Category-based Settings with progressive disclosure for advanced timetable/import/calculation workflows.
- Consolidated SalahOS Design System v2 with semantic tokens, reusable layout/control/state primitives and accessibility contracts.
- Dedicated Mosques and Community reading experiences separated from administration workflows.

## Daily Prayer Display Theme Library

- Shared versioned prayer-board data/template contract that preserves calculation, source, Iqamah and next-prayer semantics.
- Six original SalahOS display templates:
  - Heritage Classic
  - Minimal Modern
  - Bold Countdown Focus
  - Structured Split Board
  - Scenic Spiritual
  - Family & Classroom
- Full-screen preview/configuration workflow with supported module visibility, branding, locale, time-format and accent controls.
- Permanent 1080p/4K English and Arabic/RTL visual-regression coverage for the completed display templates.

## Managed display assignment

- Mosque-level default prayer-board configuration with per-display override/inheritance.
- Revisioned managed-display prayer-board configuration and applied-template heartbeat reporting.
- Exact 1920×1080 and 3840×2160 landscape preview before publication; unsupported portrait/unvalidated targets are blocked.
- Last-known-good managed prayer-board cache with native persistence.
- Reconnect reconciliation that keeps local prayer calculation authoritative and uninterrupted.
- Fail-soft managed display operation when remote configuration/media synchronization is unavailable.
- Safe managed-service state migration and deterministic handling of device-local branding/background assets.

## Qiblah and congregation refinements

- Dedicated Qiblah experience with dominant compass/bearing hierarchy and secondary saved/offline/manual location workflows.
- Local/offline bearing remains authoritative; optional map networking stays explicit and privacy-gated.
- Improved mosque discovery/profile and community announcement/event presentation with provenance/freshness states.

## Downloadable v1.2.1 assets

A successful v1.2.1 release publishes:

- `SalahOS-v1.2.1-android.apk` — persistently signed Android release APK, verified with Android `apksigner`;
- `SalahOS-v1.2.1-web-pwa.zip` — production Web/PWA package;
- `SalahOS-v1.2.1-raspberry-pi-kiosk.tar.gz` — production Web/PWA files plus Raspberry Pi/Linux Chromium kiosk launch and autostart helpers;
- `SHA256SUMS.txt` — portable SHA-256 hashes for all published packages.

The workflow fails closed if Android release signing is unavailable and verifies archive integrity, checksums and the exact final asset set before publication.

## Distribution boundaries

- A consumer iOS/iPadOS `.ipa` is not published until Apple distribution signing/provisioning is configured and validated.
- No native macOS `.dmg` is published because SalahOS does not yet contain a native macOS application target.
- Physical Raspberry Pi, TV/panel, iPhone/iPad and broad Android OEM acceptance remains separate from CI packaging evidence.
- Stage 23.11 optional weather, Stage 23.12 announcement/display rotation, Stage 23.13 mobile Today/home prayer-board variants and later Stage 24–27 work remain separate roadmap items and are not claimed complete by this release.

## Release gates

The v1.2.1 release revision must be the exact current `main` commit and pass the permanent Quality, Android, Visual Regression and iOS workflows. The release-asset workflow reruns the full repository quality gate for Web/PWA/kiosk packaging, verifies persistent Android signing and `apksigner`, verifies portable checksums and the exact four-file package, and only then creates/uploads the GitHub release.

See `docs/RELEASE_ASSETS.md`, `TESTING.md`, `TODO.md` and `docs/PLATFORM_STATUS.md` for exact distribution and validation boundaries.

## Author

privacyOG
