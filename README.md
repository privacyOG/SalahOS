# SalahOS

A privacy-focused, cross-platform Islamic prayer-time application and smart-display ecosystem for Android, iOS/iPadOS, Raspberry Pi, TV, browser/PWA, and kiosk displays.

SalahOS is designed around accurate local prayer calculations, selectable calculation methods and madhhab/Asr conventions, local mosque timetables, Adhan and notifications, Hijri dates, Arabic/RTL support, and useful offline operation.

## Project principles

- Local-first prayer calculations and settings.
- No mandatory account for core prayer-time functionality.
- Pure prayer-domain engine separated from UI, network, GPS, and platform APIs.
- Explicit calculation provenance and no fabricated astronomical events.
- Shared application logic across mobile, Raspberry Pi, TV, PWA, and kiosk deployments.
- English and Arabic/RTL treated as first-class requirements.

## Initial architecture

- TypeScript + React shared application.
- Vite production/development tooling.
- Pure TypeScript astronomical/prayer calculation modules under `src/domain/`.
- Capacitor native shell for Android, with iOS/iPadOS native work still tracked separately.
- PWA/browser deployment for web, Raspberry Pi Chromium kiosk, TV browser, and generic kiosk targets.
- Vitest, ESLint, Prettier, strict TypeScript, and GitHub Actions quality gates.

## Documentation

- [Build and Web/PWA deployment](BUILD.md)
- [Android build and install](docs/ANDROID.md)
- [Tested platform/build status](docs/PLATFORM_STATUS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Notification and Adhan platform limitations](docs/NOTIFICATION_LIMITATIONS.md)
- [Dependency license review](docs/DEPENDENCY_LICENSE_REVIEW.md)
- [Privacy behaviour](PRIVACY.md)
- [Architecture and design](DESIGN.md)
- [Research and calculation references](RESEARCH.md)
- [Verification evidence](TESTING.md)
- [Implementation tracker](TODO.md)

## Platform status

- **Web / PWA:** automated build and repository verification path.
- **Android:** Capacitor native shell, foreground native location adapter and automated debug-APK build path; emulator/physical-device acceptance, native notifications/Adhan and release signing remain open.
- **Raspberry Pi / Touch Display 2:** repository-validated browser/kiosk deployment path; physical Touch Display 2 acceptance remains open.
- **TV / generic kiosk:** repository-validated browser-hosted smart-display path; target TV/remote acceptance remains open.
- **iOS / iPadOS:** native shell/build and native adapters remain planned, not validated.

See [Tested platform/build status](docs/PLATFORM_STATUS.md) for the exact evidence and capability boundaries.

## Development

```bash
npm install
npm run dev
```

Quality gate:

```bash
npm run check
```

The dependency lockfile is intentionally not considered complete until dependency resolution has been generated and verified.

## Status

SalahOS is under active development. `TODO.md` is the authoritative implementation tracker; items are checked only after implementation and relevant verification.

## Author

privacyOG
