# Visual regression

SalahOS includes a deterministic browser visual-regression harness for shared Web/PWA and responsive-layout verification. It is intentionally separate from physical-device acceptance.

## Run locally

Build the production web application first, then run the visual suite:

```bash
npm run build
npm run verify:visual-regression
```

The harness uses an installed Chrome or Chromium executable. Set `CHROME_BIN` if the browser is not available under a common executable name.

Screenshots are written to:

```text
artifacts/visual-regression/
```

That generated directory is ignored by version control.

## Deterministic fixture

The suite preloads a versioned SalahOS settings envelope into browser local storage before each captured case. It uses:

- Sydney coordinates (`-33.8688`, `151.2093`);
- `Australia/Sydney` as the explicit IANA timezone;
- Muslim World League calculation parameters;
- standard Asr convention;
- angle-based high-latitude handling;
- calculated prayer source;
- no mosque timetable override;
- a fixed browser wall clock of `2026-08-16T12:00:00Z` injected before application bootstrap.

Freezing `Date.now()` keeps the local date, prayer rows, current/next-prayer state and countdown source stable across repeated captures. The fixture does not request browser geolocation and does not depend on a remote API.

## Captured cases

The current browser matrix captures:

1. phone portrait — English / light;
2. phone portrait — Arabic / RTL / dark;
3. phone landscape — English / light;
4. tablet — English / light;
5. 1920×1080 kiosk — Arabic / RTL / dark using the production `?mode=smart-display` route;
6. phone portrait — English / light with the root text size increased to 125%.

The ordinary phone/tablet cases wait for the production `.app-shell`. The kiosk case waits for the production `.smart-display` root, preventing a false 1080p pass that only exercised the normal settings UI.

For each case the harness requires:

- the expected SalahOS application root to render meaningful content;
- the document-root `lang` value to match the selected locale;
- the document-root LTR/RTL direction to match the selected locale;
- no document-level horizontal overflow at the requested viewport size.

The 125% fixture is a regression guard for responsive behaviour under increased text sizing. It is not, by itself, a complete accessibility conformance audit.

## Browser process policy

The harness starts Chrome/Chromium with background networking, extensions, sync and GPU use disabled. A unique temporary browser profile is used for each process. `--no-sandbox` is added only when the harness itself is executed as the root user, which is required by Chromium in some isolated container environments; normal non-root hosted runners keep the browser sandbox enabled.

## CI artifacts

The Quality Gate runs the suite after the production build and deployable-web-artifact checks. PNG files are uploaded through the workflow artifact system and retained for a limited period so failed or changed layouts can be inspected directly.

The screenshot-upload step uses `if: always()` and ignores a missing screenshot directory. Therefore an earlier build failure remains the primary failure rather than being obscured by the artifact-upload step.

## Evidence boundary

A green browser visual suite can support software-only claims for the tested viewport, locale, theme, direction and overflow contracts. It does **not** prove:

- physical Raspberry Pi Touch Display 2 rendering, touch calibration or enclosure behaviour;
- TV overscan, CEC, remote-control navigation or viewing-distance usability;
- physical Android/iPhone safe-area, font-scaling or manufacturer-specific behaviour;
- native notification delivery;
- accessibility conformance beyond the explicit automated invariants.

Those items stay open until exercised in their applicable environment.
