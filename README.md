# SalahOS

A privacy-focused, cross-platform Islamic prayer-time application and smart-display ecosystem for Android, iOS/iPadOS, Raspberry Pi, TV, browser/PWA, and kiosk displays.

SalahOS is designed around accurate local prayer calculations, selectable calculation methods and madhhab/Asr conventions, local mosque timetables, Adhan alerts and notifications, Hijri dates, Arabic/RTL support, and useful offline operation.

## Project principles

- Local-first prayer calculations and settings.
- No mandatory account for core prayer-time functionality.
- Pure prayer-domain engine separated from UI, network, GPS, and platform APIs.
- Explicit calculation provenance and no fabricated astronomical events.
- Shared application logic across mobile, Raspberry Pi, TV, PWA, and kiosk deployments.
- English and Arabic/RTL treated as first-class requirements.
- Least-privilege native permissions and no unnecessary remote application networking.

## Architecture

- TypeScript + React shared application.
- Vite production/development tooling.
- Pure TypeScript astronomical/prayer calculation modules under `src/domain/`.
- Capacitor native shells for Android and iOS/iPadOS using the same shared application/domain logic.
- PWA/browser deployment for web, Raspberry Pi Chromium kiosk, TV browser, and generic kiosk targets.
- Vitest, ESLint, Prettier, strict TypeScript, and hosted workflow quality gates.

## Implemented v1 capabilities

- Five obligatory prayer times plus Sunrise, current/next prayer state and live countdown.
- Standard/Shafi'i-family and Hanafi Asr conventions.
- Multiple recognised calculation-method profiles, high-latitude strategies and explicit manual adjustments.
- Gregorian and Hijri/Umm al-Qura date presentation with manual correction.
- Browser/native current location, manual coordinates, offline city search, saved locations and offline IANA timezone resolution.
- Calculated, adjusted and local-mosque prayer sources with CSV/JSON timetable import/export.
- Fixed or offset Iqamah rules and one or multiple mosque-specific Jumu'ah sessions.
- English and Arabic localisation with RTL and bidirectional isolation.
- Light, dark and follow-system themes plus keyboard/touch/accessibility support.
- Android and iOS/iPadOS native local-prayer notification adapters with explicit lifecycle/platform constraints.
- Private user-selected local Adhan audio for foreground playback attempts, with background/terminated delivery kept notification-based.
- Web/PWA offline shell and locally persisted settings/timetables.
- Raspberry Pi Touch Display 2 fixture/deployment tooling and browser-based smart-display mode for TV/kiosk use.

## Documentation

- [Build and Web/PWA deployment](BUILD.md)
- [Android build and install](docs/ANDROID.md)
- [iOS/iPadOS build, install and signing](docs/IOS_BUILD_SIGNING.md)
- [Native permission review](docs/NATIVE_PERMISSIONS.md)
- [Tested platform/build status](docs/PLATFORM_STATUS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Notification and Adhan platform limitations](docs/NOTIFICATION_LIMITATIONS.md)
- [Dependency license review](docs/DEPENDENCY_LICENSE_REVIEW.md)
- [Privacy behaviour](PRIVACY.md)
- [Architecture and design](DESIGN.md)
- [Research and calculation references](RESEARCH.md)
- [Verification evidence](TESTING.md)
- [Implementation tracker](TODO.md)
- [Draft v1 release notes](RELEASE_NOTES.md)

## Platform status

- **Web / PWA:** production build, install assets, service-worker offline lifecycle, local persistence and deploy-artifact verification are implemented. The permanent production-browser visual matrix covers 14 phone, tablet, 1080p/4K and Raspberry Pi Touch Display 2 viewport scenarios across English/Arabic and light/dark combinations; human aesthetic and physical-display acceptance remain separate.
- **Android:** Capacitor shell, foreground native location, native persistence, local prayer notifications, exact-alarm fallback policy, reboot restoration contract, release-signing configuration, private foreground local-Adhan playback and Android 35 emulator acceptance have recorded evidence. Physical OEM notification timing, audio-focus behavior and broad target-device acceptance remain open.
- **iOS / iPadOS:** Capacitor shell, foreground native location, native persistence, bounded local prayer notifications, private foreground local-Adhan playback and hosted Xcode Simulator compilation are implemented. The permanent acceptance workflow exercises fresh iPhone/iPad Simulator installation, application-container resolution, launch and explicit terminate/relaunch with screenshot artifacts; physical-device notification/audio/distribution acceptance and network-isolated offline cold start remain separate gates.
- **Raspberry Pi / Touch Display 2:** repository-validated browser/kiosk deployment, touch-display fixtures and offline continuity paths are implemented; physical Touch Display 2 acceptance remains open.
- **TV / generic kiosk:** repository-validated browser-hosted smart-display mode, runtime rollover/recovery and practical keyboard/remote exit handling are implemented; physical TV readability/remote/panel acceptance remains open.

See [Tested platform/build status](docs/PLATFORM_STATUS.md) and [Implementation tracker](TODO.md) for the exact evidence, unresolved validation items and blockers.

## Development

Install the exact committed dependency graph and start the development server:

```bash
npm ci --ignore-scripts
npm run dev
```

Run the complete repository quality gate:

```bash
npm run check
```

The dependency lockfile is committed and pinned for reproducible installation. Native build commands and platform-specific prerequisites are documented in the platform guides above.

## Release status

SalahOS v1.0.0 is prepared as the first production repository/source release. The exact release revision must pass Quality Gate, Android Build, Visual Regression and iOS Build/Simulator acceptance together before the tag is created. This release boundary intentionally does not convert unperformed physical iPhone/iPad, Android OEM, Raspberry Pi Touch Display 2 or TV/panel checks into completed evidence, and it does not imply App Store/Play Store publication or signed store binaries.

The tested platform matrix and remaining physical/target-environment validation are documented in [docs/PLATFORM_STATUS.md](docs/PLATFORM_STATUS.md), [TESTING.md](TESTING.md) and [TODO.md](TODO.md).

## Author

privacyOG
