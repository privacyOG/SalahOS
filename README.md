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
- Capacitor planned as the Android/iOS native shell.
- PWA/browser deployment for web, Raspberry Pi Chromium kiosk, TV browser, and generic kiosk targets.
- Vitest, ESLint, Prettier, strict TypeScript, and GitHub Actions quality gates.

See `DESIGN.md`, `RESEARCH.md`, `TESTING.md`, `PRIVACY.md`, and `TODO.md` for architecture, research assumptions, verification policy, privacy principles, and implementation status.

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
