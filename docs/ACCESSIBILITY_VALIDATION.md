# Accessibility validation

SalahOS treats accessibility as a release-quality requirement across the shared Web/PWA application and browser-hosted display targets. Automated checks are deliberately separated from physical-device and assistive-technology acceptance.

## Enforced repository contracts

`npm run verify:accessibility-contract` checks that the shared styling retains:

- visible `:focus-visible` outlines for buttons, inputs, selects, textareas and disclosure summaries;
- an interactive control minimum height of at least `2.75rem`;
- the smart-display burn-in movement rule;
- a `prefers-reduced-motion: reduce` override that disables smart-display animation;
- the permanent browser-accessibility command and Quality Gate wiring described below.

The normal `npm run check` gate executes this static verifier.

## Browser visual coverage

The deterministic visual-regression suite exercises:

- English/LTR and Arabic/RTL presentation;
- light and dark themes;
- phone portrait and landscape dimensions;
- tablet dimensions;
- the production 1920x1080 smart-display route;
- increased root text sizing;
- document-level horizontal-overflow detection;
- locale/direction/theme settling before screenshot capture.

## Browser accessibility regression

`npm run verify:accessibility-browser` starts the production preview in Chrome/Chromium and performs three additional checks after the production build:

1. **200% text reflow** — a 390x844 English/light phone fixture applies a `200%` root font size, requires the effective root font size to increase, and fails on document-level horizontal overflow. A PNG named `phone-portrait-en-light-text-200.png` is captured for review.
2. **Keyboard-visible focus** — the harness sends a real Tab key event through the browser debugging protocol, requires focus to move to an interactive element, and verifies that the computed focus outline is at least 3px with the expected offset.
3. **Reduced motion** — Chromium emulates `prefers-reduced-motion: reduce` on the real `?mode=smart-display` route and requires the smart-display header animation to resolve to `none`.

The harness uses the same deterministic Sydney configuration and fixed wall-clock approach as visual regression. The Quality Gate runs it immediately after the main visual suite. Its screenshot is uploaded through the same retained visual-artifact set.

## Evidence boundary

These automated checks are useful regression controls but do not by themselves prove complete accessibility conformance. The following remain distinct acceptance work where applicable:

- screen-reader behavior and announcement quality on representative platforms;
- physical-device dynamic-type/font-scaling behavior;
- physical touch-target ergonomics;
- operating-system high-contrast/forced-colour behavior;
- zoom/reflow acceptance beyond the explicitly tested browser fixtures;
- physical Raspberry Pi Touch Display 2 and TV viewing-distance usability.

A TODO item must not be promoted to complete merely because the static or browser accessibility contract exists. Completion requires the relevant automated or manual evidence described by `TODO.md` and `TESTING.md`.

**Author:** privacyOG
