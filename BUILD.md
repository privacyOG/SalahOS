# SalahOS build and deployment

This document records the build paths that are actually implemented and verified in this repository. Do not treat an undocumented platform as release-ready.

## Current build status

| Target                       | Current status                    | Verified path / boundary                                                |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| Web / PWA                    | Implemented and automated         | `npm run build` + `npm run verify:web-build`; automated offline tests   |
| Raspberry Pi Touch Display 2 | Repository-validated kiosk path   | Launcher, deployment docs, viewport fixture and continuity tests        |
| TV / kiosk                   | Repository-validated browser path | Smart-display mode, kiosk URL path, usability tests and deployment docs |
| Android                      | Native path planned               | Shared application only; native project/build/device validation open    |
| iOS / iPadOS                 | Native path planned               | Shared application only; native project/build/device validation open    |

The Raspberry Pi and TV rows describe browser-hosted deployment paths verified in the repository, not completed physical-device acceptance. Android and iOS/iPadOS do not yet have validated native shells. See `docs/PLATFORM_STATUS.md` for the exact tested matrix and remaining boundaries.

## Prerequisites

- Node.js 22.13.0 or newer. CI currently uses Node.js 22.
- npm supplied with the installed Node.js runtime.
- A clean checkout of the repository for release builds.

The committed `package-lock.json` is the authoritative dependency lockfile.

## Clean install

Install exactly the dependency graph recorded in the lockfile:

```bash
npm ci --ignore-scripts
```

For a release or deployment candidate, run the repository security gates as well:

```bash
npm run security:sensitive-files
npm run security:audit
```

Do not replace `npm ci` with a dependency-changing install during release preparation. Dependency updates should be intentional changes reviewed together with the resulting lockfile diff.

## Full quality gate

Run the same local checks represented by CI:

```bash
npm run check
```

This runs, in order:

1. sensitive-file policy
2. dependency vulnerability audit
3. dependency-license policy
4. documentation-link verification
5. formatting check
6. lint
7. strict TypeScript typecheck
8. automated tests
9. production web build
10. deployable web-artifact verification

A failed step means the build should not be treated as a release candidate.

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

The verifier checks the generated deployment artifact rather than source files alone. It requires a non-empty HTML shell, manifest, service worker and first-party icon assets; confirms that the built HTML references bundled production assets and the manifest; validates the expected PWA start/display configuration; and confirms the current SalahOS service-worker cache version is present in the deployed script.

The same verification runs in the repository Quality Gate immediately after the production build.

## Local production preview

After building, serve the production output through Vite's preview server:

```bash
npm run preview
```

To make the preview reachable from another device on the same trusted local network:

```bash
npm run preview -- --host 0.0.0.0
```

The preview server is for validation, not a production hosting recommendation.

## Static deployment contract

Deploy the complete contents of `dist/` to one web origin without selectively omitting generated files.

A production host must preserve these application expectations:

- `/index.html`, `/manifest.webmanifest`, `/sw.js`, `/icons/` and the generated `/assets/` tree must remain reachable at the same origin.
- Client-side navigation routes must fall back to `index.html` when no physical file matches the requested path.
- Production deployment should use HTTPS so browser PWA/service-worker functionality is available in its normal secure context.
- `/sw.js` should be revalidated frequently rather than given an effectively permanent immutable cache lifetime, otherwise application upgrades may be delayed.
- Versioned generated assets under `/assets/` may use long-lived caching because their filenames are content-derived by the production bundler.
- `manifest.webmanifest` should remain updateable and be served with a manifest/JSON-compatible content type.
- JavaScript, CSS, HTML and SVG files must be served with appropriate content types rather than a generic download type.
- Do not weaken the deployment security-header baseline documented in `docs/WEB_SECURITY_HEADERS.md` merely to make the application load.

SalahOS currently expects a root deployment (`/`). If deploying under a sub-path in the future, the Vite base path, manifest URLs and service-worker scope must be changed and revalidated together rather than rewriting URLs only at the web server.

## PWA and offline smoke checks

After the first successful load of a deployed candidate:

1. Confirm the manifest and service worker are requested successfully from the same origin.
2. Confirm the service worker becomes active and controls a subsequent page load.
3. Reload an application route after network access is disabled and confirm the cached application shell still loads.
4. Confirm saved location, timezone and calculation settings are restored locally.
5. Confirm prayer calculations continue without a network request.
6. Restore network access and confirm normal navigation still works.

Automated tests already exercise the committed service-worker offline navigation fallback and cache-version cleanup. Browser/device installation appearance is still subject to the open platform/PWA asset validation items in `TODO.md`; the current SVG manifest icons must not be described as proof of complete platform install-icon coverage.

## Deployment upgrades

The service worker uses a versioned SalahOS shell-cache namespace. When that cache version changes, activation removes only stale SalahOS shell caches and preserves unrelated origin caches.

For an application upgrade:

1. build from a clean checkout and lockfile install;
2. run `npm run check`;
3. deploy the complete new `dist/` tree as one release;
4. avoid mixing an old `sw.js` with a new generated asset tree;
5. perform the offline smoke checks above against the upgraded deployment.

## Configuration and secrets

Core SalahOS prayer calculations do not require a remote service credential. If optional remote integrations are added later, follow `docs/SECRETS_POLICY.md`; do not put credentials or private keys in source files, the web bundle, the manifest, or committed environment files.

## Release boundary

A successful Web/PWA build does not imply that Android or iOS/iPadOS native packages exist, nor does repository validation of the Raspberry Pi/TV browser paths imply physical target-device acceptance. Those targets remain governed by their separate TODO and release-readiness gates. Only claim the level of validation recorded in `docs/PLATFORM_STATUS.md`, and only mark a native or physical platform complete when its applicable build/install/deployment and target-device checks have been exercised.
