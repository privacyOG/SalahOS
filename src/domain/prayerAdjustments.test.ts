import { describe, expect, it } from 'vitest';
import {
  displayedManualPrayerAdjustmentMinutes,
  hasManualPrayerAdjustments,
  manualPrayerAdjustmentMinutes,
  resetManualPrayerAdjustments,
} from './prayerAdjustments';

describe('manual prayer adjustment status', () => {
  it('returns the signed adjustment for an adjusted prayer', () => {
    const adjustments = { fajr: 3, isha: -2 } as const;

    expect(manualPrayerAdjustmentMinutes(adjustments, 'fajr')).toBe(3);
    expect(manualPrayerAdjustmentMinutes(adjustments, 'isha')).toBe(-2);
  });

  it('treats missing and explicit zero offsets as unadjusted', () => {
    expect(manualPrayerAdjustmentMinutes({}, 'dhuhr')).toBeNull();
    expect(manualPrayerAdjustmentMinutes({ asr: 0 }, 'asr')).toBeNull();
    expect(hasManualPrayerAdjustments({ maghrib: 0 })).toBe(false);
  });

  it('shows calculated adjustment provenance but suppresses replaced mosque prayer times', () => {
    expect(displayedManualPrayerAdjustmentMinutes('fajr', 4, 'calculated')).toBe(4);
    expect(displayedManualPrayerAdjustmentMinutes('isha', -3, 'calculated-adjustments')).toBe(-3);
    expect(displayedManualPrayerAdjustmentMinutes('fajr', 4, 'local-mosque')).toBeNull();
    expect(displayedManualPrayerAdjustmentMinutes('sunrise', 4, 'local-mosque')).toBe(4);
    expect(displayedManualPrayerAdjustmentMinutes('asr', 0, 'calculated')).toBeNull();
  });

  it('detects any non-zero manual offset', () => {
    expect(hasManualPrayerAdjustments({ fajr: 0, dhuhr: 1 })).toBe(true);
    expect(hasManualPrayerAdjustments({ isha: -1 })).toBe(true);
  });

  it('resets to an empty adjustment set without mutating the source', () => {
    const source = { fajr: 2, isha: -4 } as const;
    const reset = resetManualPrayerAdjustments();

    expect(reset).toEqual({});
    expect(source).toEqual({ fajr: 2, isha: -4 });
  });
});
