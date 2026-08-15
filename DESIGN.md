# SalahOS Architecture and Technical Decisions

**Author:** privacyOG

## Product scope

SalahOS is a privacy-focused Islamic prayer-time application and smart-display ecosystem. The same prayer-domain logic must support Android, iOS/iPadOS, modern browsers/PWA, Raspberry Pi Touch Display 2, TV browsers, and kiosk/full-screen deployments.

## Architecture principles

1. **Local-first:** prayer calculations, settings, saved locations, and imported mosque timetables operate locally by default.
2. **Deterministic domain core:** astronomical and prayer-time calculations live in a pure TypeScript package with no UI, DOM, storage, GPS, or network dependency.
3. **Shared application logic:** platform shells adapt location, notifications, audio, persistence, and lifecycle behaviour without duplicating prayer rules.
4. **Explicit provenance:** every displayed prayer schedule identifies calculation method/source, Asr convention, high-latitude rule, timezone, manual offsets, and mosque timetable source where applicable.
5. **Offline capable:** core prayer-time functionality remains useful with no network connection after initial installation/configuration.
6. **Accessible and bilingual from the start:** English and Arabic/RTL are architectural requirements rather than later retrofits.

## Cross-platform strategy

### Shared web application

The primary application is TypeScript + React. Vite provides development/build tooling. The web build is progressively enhanced into a PWA and is the deployment target for desktop browsers, Raspberry Pi kiosk mode, TV browsers, and generic kiosk displays.

### Android and iOS

Capacitor is the native shell strategy. Native adapters are used only where browser APIs are insufficient, particularly precise location permissions, local notifications, lifecycle handling, and audio policy. Prayer calculations remain in the shared domain package.

### Raspberry Pi and TV/kiosk

Raspberry Pi OS runs the production web build in Chromium kiosk/full-screen mode. TV deployment targets standards-compliant TV browsers or an attached small computer/Raspberry Pi. SalahOS will not claim unsupported native TV platforms.

## Repository layout

```text
.github/workflows/   CI
src/                 shared application UI and adapters
src/domain/          pure domain logic
src/platform/        browser/native adapter interfaces
src/i18n/            localisation resources
src/styles/          shared visual system
public/               static/PWA assets
tests/                cross-package/integration fixtures
scripts/              build/deployment helpers
```

As the repository grows, the pure prayer engine may be extracted to `packages/prayer-engine/` without changing its public API.

## Coding conventions

- TypeScript strict mode is mandatory.
- Pure calculation modules must not import browser, React, storage, GPS, notification, or network APIs.
- All user-facing strings must be localisable.
- Dates/times crossing application boundaries use explicit timezone-aware data rather than implicit host-local assumptions.
- Precise coordinates must never appear in normal logs.
- Public functions and domain types require concise documentation where intent is not obvious.
- Tests are colocated for small pure modules or placed under `tests/` for integration scenarios.

## State boundaries

- **Domain state:** calculation parameters, method registry, prayer results, provenance.
- **Persistent user state:** selected location, timezone, language, theme, calculation settings, mosque timetable, notification preferences.
- **Ephemeral UI state:** current clock tick, open dialogs, transient errors.
- **Platform state:** permission status, app lifecycle, notification scheduling capability, online/offline state.

## Security and privacy boundaries

Remote APIs are optional enhancement paths. Core calculation does not require an account or remote service. Optional remote calls must disclose what is transmitted, use TLS, validate responses, and degrade safely when unavailable.

## Initial MVP acceptance criteria

The first usable MVP is accepted when it can:

- calculate all five daily prayers plus sunrise from a selected location/date/timezone;
- support Standard/Shafi'i and Hanafi Asr conventions;
- support multiple recognised calculation methods and manual offsets;
- show current/next prayer with a live countdown;
- persist settings locally and work offline;
- run responsively on phone, tablet, Raspberry Pi Touch Display 2, and 1080p kiosk/TV layouts;
- provide English and Arabic/RTL UI;
- import a local mosque timetable and distinguish prayer start from Iqamah;
- pass automated domain, integration, and build checks.
