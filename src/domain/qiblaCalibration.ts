export const QIBLA_COMPASS_CALIBRATION_THRESHOLD_DEGREES = 20;

export function qiblaCompassAccuracyKnown(
  accuracyDegrees: number | null | undefined,
): accuracyDegrees is number {
  return (
    accuracyDegrees !== null &&
    accuracyDegrees !== undefined &&
    Number.isFinite(accuracyDegrees) &&
    accuracyDegrees >= 0
  );
}

export function qiblaCompassCalibrationNeeded(
  accuracyDegrees: number | null | undefined,
): boolean {
  return (
    qiblaCompassAccuracyKnown(accuracyDegrees) &&
    accuracyDegrees > QIBLA_COMPASS_CALIBRATION_THRESHOLD_DEGREES
  );
}

export function qiblaCompassCalibrationPassed(
  accuracyDegrees: number | null | undefined,
): boolean {
  return (
    qiblaCompassAccuracyKnown(accuracyDegrees) &&
    accuracyDegrees <= QIBLA_COMPASS_CALIBRATION_THRESHOLD_DEGREES
  );
}
