# Qiblah compass recalibration

SalahOS treats compass calibration as a foreground device-guidance flow. It does not claim to programmatically calibrate the hardware sensor because Android, iOS and browser sensor stacks generally expose heading data and accuracy rather than a portable calibration API.

## Behaviour

- A persistent **Recalibrate compass** action is available while live compass guidance is usable.
- A known heading accuracy above 20° is treated as poor and opens a one-time prompt offering **Start recalibration** or **Not now**.
- Recalibration guides the user through slow figure-8 motion and reminds them to move away from metal, magnets, speakers, magnetic cases and large electrical equipment.
- Starting recalibration restarts the live heading session so the UI waits for a fresh sensor reading.
- SalahOS automatically reassesses the next fresh accuracy readings. A known reading at or below 20° completes the calibration flow successfully.
- Dismissing the poor-accuracy prompt suppresses repeated prompts until the sensor reports an acceptable reading and later becomes poor again.
- If compass permission is denied, the sensor is unsupported, or the heading adapter fails, recalibration is disabled and the true-north bearing/map fallback remains available.

## Verification

`src/domain/qiblaCalibration.test.ts` locks the accuracy policy. `scripts/visual-qibla-calibration.mjs` exercises the low-accuracy prompt, guided/manual recalibration, fresh-reading success, denied permission, and unsupported-device fallbacks as part of `npm run visual:check`.
