# SalahOS Architecture and Technical Decisions

**Author:** privacyOG

## Product scope

SalahOS is a cross-platform Islamic prayer-time application and smart-display ecosystem. The same prayer-domain logic supports Android, iOS/iPadOS, modern browsers/PWA, Raspberry Pi Touch Display 2, TV browsers, and kiosk/full-screen deployments.

## Architecture principles

1. **Reliable core prayer operation:** prayer calculations, settings, saved locations, and imported mosque timetables remain usable locally, including offline after the required application data is installed.
2. **Deterministic domain core:** astronomical and prayer-time calculations live in pure TypeScript with no UI, DOM, storage, GPS, or network dependency.
3. **Shared application logic:** platform shells adapt location, notifications, persistence, lifecycle behaviour and supported audio policy without duplicating prayer rules.
4. **Explicit provenance:** every displayed prayer schedule identifies calculation method/source, Asr convention, high-latitude rule, timezone, manual offsets, and mosque timetable source where applicable.
5. **Offline capable:** core prayer-time functionality remains useful with no network connection after installation/configuration.
6. **Accessible and bilingual from the start:** English and Arabic/RTL are architectural requirements rather than later retrofits.
7. **Reviewed platform capabilities:** native permissions, credentials and remote-network capabilities must be explicit, purpose-scoped and reviewed before release.

## Cross-platform strategy

### Shared web application

The primary application is TypeScript + React. Vite provides development/build tooling. The web build is progressively enhanced into a PWA and is the deployment target for desktop browsers, Raspberry Pi kiosk mode, TV browsers, and generic kiosk displays.

### Android and iOS/iPadOS

Capacitor provides the committed native shells. Both mobile targets reuse the shared application and prayer-domain logic. Native adapters currently cover foreground current-location access, local persistence and local prayer-notification scheduling/lifecycle policy. Platform constraints are represented explicitly instead of creating separate prayer implementations or promising unsupported background behaviour.

The Android path additionally carries its exact-alarm fallback and reboot-restoration contract. The iOS/iPadOS path is compiled as an unsigned Simulator application in the recorded Xcode build workflow; interactive simulator/physical-device acceptance remains a separate validation layer.

### Raspberry Pi and TV/kiosk

Raspberry Pi OS runs the production web build in Chromium kiosk/full-screen mode. Touch Display 2 fixtures exercise target viewport contracts using the same presentation components. TV deployment uses a compatible TV browser or an attached browser-capable host. SalahOS does not claim separate native television packages that are not present in the repository.

## Repository layout

```text
.github/workflows/   hosted build/validation workflows
android/             Android Capacitor shell
ios/                 iOS/iPadOS Capacitor shell
src/                 shared application UI and adapters
src/domain/          pure prayer/calendar/domain logic
src/platform/        browser/native adapter boundaries
src/i18n/            localisation resources
src/styles/          shared visual system
public/              static/PWA assets
scripts/             policy, build and deployment helpers
docs/                platform/security/deployment documentation
examples/             validated example/import fixtures
```

The prayer engine remains intentionally separable from platform code; a future package extraction must not change its semantic contract or introduce platform dependencies.

## Coding conventions

- TypeScript strict mode is mandatory.
- Pure calculation modules must not import browser, React, storage, GPS, notification, or network APIs.
- All user-facing strings must be localisable.
- Dates/times crossing application boundaries use explicit timezone-aware data rather than implicit host-local assumptions.
- Precise coordinates must never appear in normal logs.
- Public functions and domain types require concise documentation where intent is not obvious.
- Tests are colocated for small pure modules or placed under integration fixtures where multiple boundaries are exercised.
- Repository policy scripts must fail closed when a security-sensitive capability is widened without review.

## State boundaries

- **Domain state:** calculation parameters, method registry, prayer results, provenance.
- **Persistent user state:** selected location, timezone, language, theme, calculation settings, saved locations, mosque timetable/library, notification preferences.
- **Ephemeral UI state:** current clock tick, open controls, transient errors and current online state.
- **Platform state:** permission status, app lifecycle, notification scheduling capability, exact-alarm capability and native persistence readiness.

## Security, privacy and networking boundaries

Core prayer calculation and ordinary application operation do not depend on a remote prayer API or mandatory account. Remote capabilities are allowed when they implement a documented SalahOS feature, but each capability must be explicitly reviewed for transmitted data, authentication/credential handling, TLS, response validation, failure isolation and user-facing behaviour. Optional provider failure must not invalidate the local prayer engine or corrupt authoritative prayer/source state.

Native location is foreground and user-initiated. Android does not request background location or an unrestricted battery-optimisation exemption. iOS/iPadOS uses only the foreground location usage description and does not declare a background location mode. `docs/NATIVE_PERMISSIONS.md` and the native-permission policy script are the executable review boundary for permission expansion.

Client-visible service credentials such as a restricted Google Maps browser key are treated as public identifiers rather than secrets. Private signing material, server credentials and URL-signing secrets must remain outside shipped application bundles. The repository network-policy gate records approved remote hosts/capabilities so a new dependency on external infrastructure cannot be introduced accidentally.

## v1 acceptance criteria

SalahOS v1 implementation must:

- calculate all five daily prayers plus Sunrise from a selected location/date/timezone;
- support Standard/Shafi'i-family and Hanafi Asr conventions;
- support multiple recognised calculation methods and manual offsets;
- show current/next prayer with a live countdown;
- persist settings locally and work offline;
- share responsive application logic across phone, tablet, Raspberry Pi Touch Display 2, and 1080p kiosk/TV targets;
- provide English and Arabic/RTL UI;
- import/manage local mosque timetables and distinguish prayer start from Iqamah;
- schedule supported native prayer alerts within documented platform limits;
- pass the applicable automated domain, integration, security and build checks on the exact release revision;
- complete the target-specific visual/device acceptance items identified in `TODO.md` before a release tag is created.
