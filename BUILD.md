# SalahOS build and deployment

This document records the build paths that are actually implemented and verified in this repository. Do not treat an automated build as proof of physical-device acceptance or distribution readiness.

## Current build status

| Target                       | Current status                    | Verified path / boundary                                                     |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Web / PWA                    | Implemented and automated         | `npm run build` + `npm run verify:web-build`; automated offline tests        |
| Android                      | Native build automated            | Committed Capacitor project, Gradle debug/release checks, emulator acceptance |
| iOS / iPadOS                 | Native Simulator build automated  | Committed Capacitor/Xcode project and permanent macOS Simulator build gate   |
| Raspberry Pi Touch Display 2 | Repository-validated kiosk path   | Launcher, deployment docs, viewport fixture and continuity tests             |
| TV / kiosk                   | Repository-validated browser path | Smart-display mode, kiosk URL path, usability tests and deployment docs      |

The Raspberry Pi and TV rows describe browser-hosted paths verified in repository tests, not completed physical-device acceptance. Android has validated native build and emulator evidence but physical-device/distribution work remains open. iOS/iPadOS has a validated native project and automated Simulator build; physical iPhone/iPad acceptance, signing/distribution and remaining visual/native-notification checks stay open. See `docs/PLATFORM_STATUS.md` for the current matrix.

## Prerequisites

- Node.js 22.13.0 or newer. CI uses Node.js 22.
- npm supplied with Node.js.
- A clean checkout for release builds.
- Android SDK/JDK tooling for native Android builds.
- macOS/Xcode for iOS/iPadOS builds.

The committed `package-lock.json` is the authoritative npm dependency lockfile.

## Clean install

Install exactly the dependency graph recorded in the lockfile:

```bash
npm ci --ignore-scripts
```

For a release or deployment candidate, run the complete repository gate:

```bash
npm run check
```

Do not replace `npm ci` with a dependency-changing install during release preparation. Dependency updates must be intentional changes reviewed with the lockfile diff.

## Full quality gate

`npm run check` is the repository-level release gate. It runs the security/policy checks, documentation verification, formatting, lint, strict TypeScript typecheck, automated tests, production Web/PWA build and deploy-artifact verification. Additional platform-specific verifiers are added to this command as native/security contracts are completed.

A failed step means the candidate must not be treated as release-ready.

## Production Web/PWA build

Create the production bundle with:

```bash
npm run build
```

Vite writes the deployable site to:

```text
dist/
```

Validate that bundle with:

```bash
npm run verify:web-build
```

The verifier requires the built HTML shell, manifest, service worker and first-party icon assets; validates the expected PWA configuration; and confirms the shipped service-worker source matches the tested source.

### Local production preview

```bash
npm run preview
```

For validation from another device on the same trusted local network:

```bash
npm run preview -- --host 0.0.0.0
```

The preview server is for validation, not a production hosting recommendation.

### Static deployment contract

Deploy the complete contents of `dist/` to one origin. Preserve the application expectations below:

- `/index.html`, `/manifest.webmanifest`, `/sw.js`, `/icons/` and generated `/assets/` remain reachable at the same origin;
- client-side routes fall back to `index.html` when no physical file matches;
- production uses HTTPS for normal PWA/service-worker operation;
- `/sw.js` and `manifest.webmanifest` remain updateable rather than effectively immutable;
- content-derived assets may use long-lived caching;
- files are served with correct MIME types;
- the security-header baseline in `docs/WEB_SECURITY_HEADERS.md` is not weakened simply to make a deployment load.

SalahOS currently expects a root deployment (`/`). A future sub-path deployment must change and revalidate the Vite base, manifest URLs and service-worker scope together.

## PWA/offline smoke checks

After the first successful load of a deployment candidate:

1. confirm the manifest and service worker load from the same origin;
2. confirm the service worker controls a subsequent load;
3. disable network access and reload the application;
4. confirm saved location/timezone/calculation settings restore locally;
5. confirm prayer calculations continue without a remote request;
6. restore network access and confirm normal operation remains intact.

Automated tests cover the committed service-worker offline navigation fallback and cache-version cleanup. Real-browser visual/install acceptance remains separately tracked.

## Android native build

Android uses the shared application inside the committed Capacitor project.

Synchronise/build the native application with:

```bash
npm run android:build
```

That path builds the shared application, synchronises Capacitor assets/plugins, runs Gradle `assembleDebug` and executes the permanent Android notification-reboot verifier.

For an unsigned repository release check:

```bash
npm run android:release-check
```

Release signing is configured only through the documented `SALAHOS_ANDROID_*` environment variables and fails closed on partial signing configuration. Signing credentials and keystores must not be committed.

See `docs/ANDROID.md` for build/install details and platform limitations. A successful Gradle build does not by itself prove every physical Android device, battery mode, notification timing or store-distribution path.

## iOS / iPadOS native build

iOS uses the same shared application inside `ios/App/App.xcodeproj` with Capacitor Swift Package Manager dependencies.

Prepare the project with:

```bash
npm run build
npx cap sync ios
```

The permanent macOS CI gate reproduces an unsigned Simulator build using:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/SalahOSDerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

For Xcode and physical-development-device instructions, see `docs/IOS.md`.

The automated Simulator build proves native project/build integration. It does not prove physical iPhone/iPad signing, App Store distribution, visual acceptance on every form factor or native notification delivery in every lifecycle state.

## Raspberry Pi / Touch Display 2

The Raspberry Pi path reuses the Web/PWA application through the documented local Chromium kiosk deployment rather than maintaining a separate prayer engine.

See `docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md` for Raspberry Pi OS, display/orientation and kiosk setup. Repository tests validate the launcher, autostart configuration logic, target viewport fixtures and offline/runtime continuity. Physical power-on, touch/display and long-duration acceptance remain separate hardware evidence.

## TV / kiosk

The supported TV path is browser-hosted smart-display mode, either directly in a compatible browser or through an HDMI-attached browser-capable host.

See `docs/TV_KIOSK_DEPLOYMENT.md` for the supported deployment boundary. The repository does not claim native packages for television operating systems that are not actually implemented.

## Deployment upgrades

For an application upgrade:

1. build from a clean checkout and committed lockfile;
2. run `npm run check`;
3. run the target platform build gate(s);
4. deploy/package one internally consistent release rather than mixing old and new assets;
5. repeat applicable offline, visual and native acceptance checks.

The Web/PWA service worker uses a versioned SalahOS shell-cache namespace and activation removes only stale SalahOS shell caches.

## Configuration and secrets

Core prayer calculations do not require a remote-service credential. If optional integrations are added, follow `docs/SECRETS_POLICY.md`; never place credentials or private keys in source, the web bundle, committed environment files, mobile manifests or release assets.

Native signing secrets likewise belong in the appropriate secure CI/platform stores or local developer signing systems, not the repository.

## Release boundary

A passing repository/Web build does not imply all native or physical targets are ready. An Android emulator build does not equal broad Android device/distribution acceptance. An iOS Simulator build does not equal physical iPhone/iPad or App Store acceptance. Repository-validated Raspberry Pi/TV browser paths do not substitute for physical hardware validation.

Only claim the validation level recorded in `docs/PLATFORM_STATUS.md` and `TODO.md`, and only tag a release after the applicable final verification gates are satisfied.
