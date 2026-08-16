# Accessibility validation

SalahOS treats accessibility as a release-quality requirement across the shared Web/PWA application and browser-hosted display targets. Automated checks are deliberately separated from physical-device and assistive-technology acceptance.

## Enforced repository contracts

`npm run verify:accessibility-contract` checks that the shared styling retains:

- visible `:focus-visible` outlines for buttons, inputs, selects, textareas and disclosure summaries;
- an interactive control minimum height of at least `2.75rem`;
- the smart-display burn-in movement rule;
- a `prefers-reduced-motion: reduce` override that disables smart-display animation.

The normal `npm run check` gate executes this verifier.

## Browser visual coverage

The deterministic visual-regression suite separately exercises:

- English/LTR and Arabic/RTL presentation;
- light and dark themes;
- phone portrait and landscape dimensions;
- tablet dimensions;
- the production 1920x1080 smart-display route;
- increased root text sizing;
- document-level horizontal-overflow detection;
- locale/direction/theme settling before screenshot capture.

Screenshots are uploaded as CI artifacts when the browser suite executes.

## Evidence boundary

These automated checks are useful regression controls but do not by themselves prove complete accessibility conformance. The following remain distinct acceptance work where applicable:

- screen-reader behavior and announcement quality on representative platforms;
- physical-device dynamic-type/font-scaling behavior;
- physical touch-target ergonomics;
- operating-system high-contrast/forced-colour behavior;
- zoom/reflow acceptance beyond the explicitly tested browser fixtures;
- physical Raspberry Pi Touch Display 2 and TV viewing-distance usability.

A TODO item must not be promoted to complete merely because the static accessibility contract exists. Completion requires the relevant automated or manual evidence described by `TODO.md` and `TESTING.md`.

**Author:** privacyOG
