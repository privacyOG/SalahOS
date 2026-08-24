# v1.4 verification upgrades

Stage 52 strengthens SalahOS release verification without changing the prayer-calculation contract or requiring a network connection for normal application use.

## Golden visual regression

`npm run visual:check` includes `scripts/visual-golden-regression.mjs` after the existing responsive and product-surface visual matrix.

The committed deterministic baselines are:

- `tests/golden/today-phone-en-light.png`;
- `tests/golden/knowledge-phone-ar-dark.png`.

The harness fixes the application clock, seeds local settings and uses the pinned Playwright Chromium build from the Visual Regression workflow. `pngjs` and `pixelmatch` compare the rendered screenshot to the committed baseline. A scenario fails when more than 0.5% of pixels exceed the configured pixel-difference threshold.

Baselines are repository evidence and must not be regenerated simply to make an unexplained visual change pass. A baseline update should accompany an intentional reviewed UI change.

## Accessibility and RTL containment

`scripts/visual-accessibility-axe.mjs` runs axe against representative Today, Knowledge and Settings surfaces using WCAG 2.0, 2.1 and 2.2 A/AA tags. Critical and serious violations fail the gate.

The same acceptance also checks document direction for Arabic fixtures and verifies that rendered elements remain contained by the viewport instead of hiding horizontal overflow with CSS alone.

## Cross-browser smoke journeys

`scripts/cross-browser-smoke.mjs` runs the same core journey in the pinned Playwright Chromium, Firefox and WebKit engines. Each engine verifies:

1. the Today surface renders;
2. all six first-class congregation navigation destinations are present;
3. the lazy-loaded Knowledge destination becomes usable;
4. the lazy-loaded Administration surface becomes usable;
5. the tested viewport does not develop horizontal overflow.

This is a compatibility smoke gate, not a replacement for the larger Chromium visual matrix or native Android/iOS acceptance.

## Core coverage threshold

The version-matched `@vitest/coverage-v8` provider is pinned in `package-lock.json`; the permanent Quality Gate installs it reproducibly through `npm ci` and runs `npm run test:coverage`.

`vitest.config.ts` applies the threshold to the selected core domain/platform modules and requires at least:

- 50% lines;
- 50% statements;
- 45% functions;
- 40% branches.

The threshold is intended to stop core coverage from silently falling below the established v1.4 floor. Raising it should follow additional meaningful tests rather than excluding difficult code.

## Final completion rule

Stage 52 is complete only when the exact implementation head passes:

- Quality Gate, including coverage and the Stage 51 bundle budget;
- Visual Regression, including golden, axe and three-engine browser acceptance;
- Android debug build and emulator lifecycle acceptance;
- iOS Simulator build plus successful fresh iPhone and iPad install/launch/relaunch acceptance.

After the temporary v1.4 tracker is reconciled, the resulting tracker-only head must pass the same gates before merge.
