# SalahOS Architecture and Technical Decisions

**Author:** privacyOG

## Product scope

SalahOS is a privacy-focused Islamic prayer-time application and smart-display ecosystem. The same prayer-domain logic supports Android, iOS/iPadOS, modern browsers/PWA, Raspberry Pi Touch Display 2, TV browsers, and kiosk/full-screen deployments.

## Architecture principles

1. **Local-first:** prayer calculations, settings, saved locations, imported mosque timetables, timezone lookup and user-selected local Adhan audio operate locally by default.
2. **Deterministic domain core:** astronomical and prayer-time calculations live in pure TypeScript modules with no UI, DOM, storage, GPS, notification or network dependency.
3. **Shared application logic:** platform shells adapt location, notifications, audio, persistence and lifecycle behaviour without duplicating prayer rules.
4. **Explicit provenance:** displayed prayer schedules identify calculation method/source, Asr convention, high-latitude handling, timezone, manual offsets and mosque timetable source where applicable.
5. **Offline capable:** core prayer-time functionality remains useful with no network connection after installation/configuration.
6. **Accessible and bilingual from the start:** English and Arabic/RTL are architectural requirements rather than later retrofits.
7. **Fail closed on uncertain prayer data:** unavailable astronomical/calendar inputs are surfaced explicitly rather than replaced with guessed times.

## Cross-platform strategy

### Shared web application

The primary application is TypeScript + React. Vite provides development/build tooling. The production web build is progressively enhanced into a PWA and is also the deployment target for desktop browsers, Raspberry Pi kiosk mode, TV browsers and generic kiosk displays.

### Android and iOS/iPadOS

Capacitor provides the native shells. Native adapters are used where browser APIs are insufficient, particularly location permission/acquisition, local notifications, lifecycle integration and platform audio policy. Prayer calculations remain in the shared domain modules.

The repository contains committed Android and iOS native projects. Automated Android build/emulator and iOS Simulator evidence does not substitute for every physical-device, distribution or lifecycle acceptance condition.

### Raspberry Pi and TV/kiosk

Raspberry Pi OS runs the production web build in Chromium kiosk/full-screen mode. TV deployment targets standards-compliant TV browsers or an attached browser-capable host. SalahOS does not claim unsupported native TV packages.

Physical display/touch, TV overscan, remote/CEC and viewing-distance acceptance remain distinct from repository/browser viewport tests.

## Repository layout

```text
.github/workflows/   repository, Android and iOS automation
android/             Capacitor Android native project
ios/                 Capacitor iOS/iPadOS native project
src/                 shared application UI and runtime composition
src/domain/          pure prayer/calendar/location-domain logic
src/platform/        browser/native storage, location, notification and security adapters
src/i18n/            localisation resources and formatting helpers
src/ui/              reusable presentation components
public/              static/PWA assets and service worker
scripts/             validation, build and kiosk/deployment helpers
docs/                platform, security, calculation and release documentation
examples/             validated example/import fixtures
```

Tests are colocated beside the modules they exercise, with integration fixtures under `src/integration/`. If the prayer engine later needs independent packaging it may be extracted without changing its behavioural contract.

## Coding conventions

- TypeScript strict mode is mandatory.
- Pure calculation modules must not import browser, React, storage, GPS, notification or network APIs.
- All user-facing strings must be localisable.
- Dates/times crossing application boundaries use explicit civil-date/timezone data rather than implicit host-local assumptions.
- Precise coordinates must never appear in normal logs.
- Public functions and domain types require concise documentation where intent is not obvious.
- Tests stay close to the production boundary they verify.
- Repository verification scripts fail closed when a reviewed security/platform contract is broadened without an intentional change.

## State boundaries

- **Domain state:** calculation parameters, method registry, prayer results and provenance.
- **Persistent user state:** selected location/timezone, language, theme, calculation settings, mosque timetable, notification preferences and related local libraries.
- **Local media state:** a user-selected Adhan recording is device-local and is not part of exported settings or a remote upload path.
- **Ephemeral UI state:** current clock tick, open controls and transient errors.
- **Platform state:** permission status, app lifecycle, notification scheduling capability and online/offline state.

## Prayer-method policy boundaries

Named calculation methods keep base astronomical parameters, authority-specific adjustments and calendar-dependent rules separate from user/manual prayer offsets.

Umm al-Qura uses a fixed Isha interval of 90 minutes after Maghrib outside Ramadan and 120 minutes during Ramadan. The Ramadan decision uses the uncorrected Umm al-Qura calendar so the user's optional Hijri display correction cannot silently change an explicitly selected calculation method.

A method marked `cross-checked-reference` has been reconciled with the documented reference set; this is not institutional certification. Diyanet/Turkey and Dubai remain explicitly `pending-authoritative-source` where authority-formula parity is not yet established.

## Security and privacy boundaries

Core calculation does not require an account or remote service.

Optional remote requests must pass through the reviewed network boundary, use an explicitly allowed HTTPS origin, omit browser credentials/referrers, fail on redirects and preserve the local/offline failure path. No remote provider is enabled merely because the boundary exists.

Native permission, Android merged-manifest permission, Android backup/data-transfer and native transport policies are executable repository checks rather than documentation-only expectations.

## Initial MVP acceptance criteria

The first usable MVP is accepted when it can:

- calculate all five daily prayers plus sunrise from a selected location/date/timezone;
- support Standard/Shafi'i and Hanafi Asr conventions;
- support multiple recognised calculation methods and manual offsets;
- show current/next prayer with a live countdown;
- persist settings locally and work offline;
- run responsively on phone, tablet, Raspberry Pi Touch Display 2 and 1080p kiosk/TV layouts;
- provide English and Arabic/RTL UI;
- import a local mosque timetable and distinguish prayer start from Iqamah;
- provide documented platform-aware prayer notification/Adhan behaviour;
- pass applicable automated domain, integration, security and native build checks.

Physical-target acceptance remains a separate release-readiness requirement where `TODO.md` explicitly requires it.
