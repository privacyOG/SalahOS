# Troubleshooting

This guide covers the currently implemented and verified Web/PWA/shared application paths. Native Android, iOS/iPadOS, Raspberry Pi hardware and TV-specific shells remain subject to their own platform validation and should not be treated as release-verified merely because the shared Web application works.

## Clean install or dependency errors

Use the committed lockfile rather than resolving a fresh dependency graph:

```bash
rm -rf node_modules
npm ci --ignore-scripts
npm run check
```

If `npm ci` reports that `package.json` and `package-lock.json` disagree, do not work around the lockfile. Update dependencies intentionally, regenerate the lockfile with npm, and review the resulting dependency/security/license changes before committing them.

The quality gate includes:

- sensitive-file policy;
- npm vulnerability audit;
- dependency-license policy;
- documentation-link verification;
- formatting;
- lint;
- strict typecheck;
- automated tests;
- production build;
- generated Web/PWA artifact verification.

## Development server does not start

Confirm the installed Node.js version satisfies the repository engine requirement:

```bash
node --version
npm --version
```

Then perform the clean lockfile install above and start Vite:

```bash
npm run dev
```

Do not use a production deployment directory as a substitute for the development server while debugging source changes.

## Production build succeeds but deployment is incomplete

Build and verify the deployable artifact together:

```bash
npm run build
npm run verify:web-build
```

The deployable directory is `dist/`. The verifier requires the production HTML shell, manifest, service worker and first-party PWA icons and confirms the shipped service worker matches the tested source.

See [BUILD.md](../BUILD.md) for the complete Web/PWA deployment contract.

## App loads but prayer times are wrong

Check the inputs before changing calculation code:

1. confirm the selected coordinates/location;
2. confirm the resolved IANA timezone;
3. confirm the local civil date shown by the app;
4. confirm the selected calculation method;
5. confirm the Asr convention;
6. confirm the high-latitude rule;
7. confirm per-prayer minute adjustments;
8. confirm whether the source is calculated prayer times or a local mosque timetable.

A local mosque timetable intentionally overrides calculated prayer starts for the selected timetable day. Iqamah/Jama'ah times are separate from prayer-start times.

For a reproducible calculation issue, record the coordinates, IANA timezone, local date, calculation method, Asr convention, high-latitude rule and any prayer adjustments. Avoid reporting only a city name because cities can span large areas and daylight-saving rules are timezone-specific.

## Location permission denied or unavailable

Browser geolocation is optional. If permission is denied or positioning is unavailable:

- use manual latitude/longitude entry; or
- use the bundled offline city/location search; or
- select a previously saved location.

SalahOS does not require continuous GPS polling for prayer calculation. A fresh location request can be made when the user explicitly wants to refresh the current location.

## Wrong timezone after changing location

Fresh browser geolocation or raw manual coordinates should resolve the timezone from the bundled coordinate lookup. Saved settings and known offline city-search results may restore a validated cached IANA timezone.

If a stored timezone is malformed or no longer accepted, the persisted location is rejected rather than silently applying an invalid timezone. Re-select or re-enter the location to rebuild valid state.

## Daylight-saving or midnight rollover looks wrong

Prayer schedules are based on the selected location's local civil date, not the machine's UTC date alone.

When investigating a rollover issue, record:

- the selected IANA timezone;
- the local wall-clock time;
- the corresponding date before and after midnight or the DST transition;
- whether the issue affects prayer calculation, notification intent, or only presentation.

The shared timezone layer explicitly handles daylight-saving gaps and repeated wall-clock times. Notification delivery by an operating system is a separate platform concern.

## Offline reload fails

The production service worker is registered only for the production application path. Development-server behaviour must not be used as proof of PWA offline behaviour.

For an offline test:

1. build the production application;
2. serve the production artifact over a secure origin or localhost;
3. load the app once while online so the service worker can install and cache the application shell;
4. confirm persisted location/settings exist if you want meaningful prayer data after reload;
5. disable network access;
6. reload the same origin.

If an older deployment is stuck, restore network access first and allow the current service worker to activate. The service worker removes only stale SalahOS shell-cache versions; it must not delete unrelated origin caches.

## Settings appear to reset

Settings are stored locally in a versioned envelope. Corrupt, invalid or unsupported future-version data is rejected instead of being trusted.

Check whether browser/site data was cleared, private-browsing storage was discarded, or the origin changed. Local browser storage is scoped to the origin, so moving between different hostnames, ports or protocols creates a different storage context.

When importing settings, malformed nested location or timetable data should be rejected rather than partially applied.

## Mosque timetable does not appear

Confirm that:

- the imported or manually entered timetable passed validation;
- the timetable contains the relevant Gregorian date;
- the mosque timetable is saved locally;
- local-mosque source mode is selected;
- the selected timetable belongs to the expected mosque/profile.

CSV/JSON imports are validated before use. Manual entries require all five obligatory prayer starts for the day. Iqamah may be unconfigured, a fixed local time, or an offset after prayer start where supported by the current editor.

## Iqamah value is rejected

For a fixed Iqamah, use valid 24-hour `HH:MM` local time.

For an offset rule, use an integer from 0 through 180 minutes after prayer start. A rule that would cross into the next civil day is rejected by the timetable validation layer.

## Notifications do not fire

First distinguish **schedule intent** from **platform delivery**. The shared layer can calculate, resolve and reconcile notification jobs, but Web/PWA, Android, iOS/iPadOS and host-kiosk delivery are governed by different permission/background rules.

See [Notification and Adhan platform limitations](NOTIFICATION_LIMITATIONS.md) before treating a missing delivered notification as a prayer-calculation defect.

For shared scheduling diagnostics, record:

- prayer/date and intent type;
- selected IANA timezone;
- desired local notification time;
- resolved instant;
- current notification preferences;
- whether the prayer time changed after location/method/adjustment changes.

Do not assume a browser service worker is a continuously running exact alarm clock.

## Arabic/RTL presentation issue

When reporting an RTL issue, include:

- English or Arabic locale;
- light or dark theme;
- viewport width/height;
- browser/platform;
- the exact control or text that is clipped, reversed or misaligned.

Mixed-direction values such as coordinates, times and identifiers should remain isolated from surrounding RTL text. Do not fix an RTL defect by forcing the whole application into LTR layout.

## Stale application after deployment

After deploying a new build:

1. verify the server is serving the new `dist/` contents;
2. confirm `sw.js` and `manifest.webmanifest` are reachable from the expected root;
3. reload while online so the new service worker can install/activate;
4. then repeat the offline-reload check if relevant.

Avoid long-lived immutable caching for `sw.js` itself. Hashed Vite assets can be cached more aggressively because their filenames change when their content changes.

## Security or license gate failure

Do not bypass a failing security gate.

- Sensitive-file failures mean a credential-like file must be removed from version control or explicitly handled by the established safe-example policy.
- Vulnerability-audit failures require dependency review/update/removal.
- Dependency-license failures require review of the exact package and license expression. Production dependencies are restricted to the approved permissive set; MPL-2.0 is currently admitted only for explicitly reviewed development-only build tooling.

See [Dependency license review](DEPENDENCY_LICENSE_REVIEW.md) for the license-policy boundary.

## A test fails only around a timezone or date boundary

Capture the exact fixture instant and IANA timezone. Avoid replacing a precise zoned-time test with machine-local `Date` assumptions. The existing tests intentionally exercise midnight rollover, DST gaps/repeats and multiple geographic regions.

Do not widen tolerances or disable a failing test merely to make the gate pass. If an external reference differs, document the reference, calculation inputs and expected tolerance explicitly.

## Before opening a bug report

Run:

```bash
npm ci --ignore-scripts
npm run check
```

Then include the failing command, error output, relevant platform/browser information and the smallest reproducible input set. Do not include passwords, API credentials, signing keys, private certificates or other secrets in logs or issue attachments.
