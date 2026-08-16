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

## Architecture

- TypeScript + React shared application.
- Vite production/development tooling.
- Pure TypeScript astronomical/prayer calculation modules under `src/domain/`.
- Capacitor native shells for Android and iOS/iPadOS using the shared application logic.
- PWA/browser deployment for web, Raspberry Pi Chromium kiosk, TV browser, and generic kiosk targets.
- Vitest, ESLint, Prettier, strict TypeScript, and GitHub Actions quality gates.

## Documentation

- [Build and deployment](BUILD.md)
- [Android build and install](docs/ANDROID.md)
- [iOS / iPadOS build and install](docs/IOS.md)
- [Tested platform/build status](docs/PLATFORM_STATUS.md)
- [Raspberry Pi Touch Display 2](docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md)
- [TV / kiosk deployment](docs/TV_KIOSK_DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Notification and Adhan platform limitations](docs/NOTIFICATION_LIMITATIONS.md)
- [Dependency license review](docs/DEPENDENCY_LICENSE_REVIEW.md)
- [Privacy behaviour](PRIVACY.md)
- [Architecture and design](DESIGN.md)
- [Research and calculation references](RESEARCH.md)
- [Verification evidence](TESTING.md)
- [Implementation tracker](TODO.md)

## Platform status

- **Web / PWA:** automated build, offline and repository verification path.
- **Android:** committed Capacitor native shell with native location/storage/notification integration, permanent build gates, release-signing infrastructure and Android emulator acceptance; broader physical-device/notification timing and distribution acceptance remain open.
- **iOS / iPadOS:** committed Capacitor/Xcode native shell with native location/storage/notification integration and permanent unsigned Simulator build validation; final current-main visual/offline acceptance, physical-device signing/validation and real notification-delivery acceptance remain open.
- **Raspberry Pi / Touch Display 2:** repository-validated browser/kiosk deployment path; physical Touch Display 2 acceptance remains open.
- **TV / generic kiosk:** repository-validated browser-hosted smart-display path; target TV/remote/readability acceptance remains open.

See [Tested platform/build status](docs/PLATFORM_STATUS.md) for the exact evidence and capability boundaries.

## Development

Install the committed dependency graph and start the development server:

```bash
npm ci --ignore-scripts
npm run dev
```

Run the repository quality gate with:

```bash
npm run check
```

Platform-specific native build instructions are linked above. Do not treat a successful shared/Web build as proof that a native or physical target has passed its separate acceptance checks.

## Status

SalahOS is under active development. `TODO.md` is the authoritative implementation tracker; an item is marked complete only after implementation and the relevant verification evidence exists.

## Author

privacyOG
