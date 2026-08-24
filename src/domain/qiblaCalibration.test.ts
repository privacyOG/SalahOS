import { describe, expect, it } from 'vitest';
import {
  QIBLA_COMPASS_CALIBRATION_THRESHOLD_DEGREES,
  qiblaCompassAccuracyKnown,
  qiblaCompassCalibrationNeeded,
  qiblaCompassCalibrationPassed,
} from './qiblaCalibration';

describe('Qiblah compass calibration policy', () => {
  it('uses a 20 degree threshold', () => {
    expect(QIBLA_COMPASS_CALIBRATION_THRESHOLD_DEGREES).toBe(20);
  });

  it('does not classify missing accuracy as poor or passed', () => {
    expect(qiblaCompassAccuracyKnown(null)).toBe(false);
    expect(qiblaCompassCalibrationNeeded(null)).toBe(false);
    expect(qiblaCompassCalibrationPassed(null)).toBe(false);
  });

  it('requests calibration above 20 degrees', () => {
    expect(qiblaCompassCalibrationNeeded(20)).toBe(false);
    expect(qiblaCompassCalibrationNeeded(21)).toBe(true);
  });

  it('passes fresh readings at or below 20 degrees', () => {
    expect(qiblaCompassCalibrationPassed(20)).toBe(true);
    expect(qiblaCompassCalibrationPassed(8)).toBe(true);
    expect(qiblaCompassCalibrationPassed(21)).toBe(false);
  });
});
