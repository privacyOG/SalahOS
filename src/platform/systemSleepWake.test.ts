import { describe, expect, it } from 'vitest';
import { createSystemSleepWakeDetector } from './systemSleepWake';

describe('createSystemSleepWakeDetector', () => {
  it('ignores ordinary timer progression below the wake threshold', () => {
    const detector = createSystemSleepWakeDetector({ wallTimeMs: 1_000_000 });

    expect(detector.sample({ wallTimeMs: 1_001_000 })).toBe(false);
    expect(detector.sample({ wallTimeMs: 1_002_000 })).toBe(false);
  });

  it('detects a long elapsed wall-clock gap after suspension', () => {
    const detector = createSystemSleepWakeDetector({ wallTimeMs: 1_000_000 });

    expect(detector.sample({ wallTimeMs: 1_031_000 })).toBe(true);
  });

  it('uses the configured threshold inclusively', () => {
    const detector = createSystemSleepWakeDetector({ wallTimeMs: 1_000_000 }, 10_000);

    expect(detector.sample({ wallTimeMs: 1_009_999 })).toBe(false);
    expect(detector.sample({ wallTimeMs: 1_019_999 })).toBe(true);
  });

  it('does not classify a backward system-clock correction as sleep', () => {
    const detector = createSystemSleepWakeDetector({ wallTimeMs: 1_000_000 });

    expect(detector.sample({ wallTimeMs: 900_000 })).toBe(false);
  });

  it('supports explicit re-baselining after a separate runtime refresh', () => {
    const detector = createSystemSleepWakeDetector({ wallTimeMs: 1_000_000 });

    detector.reset({ wallTimeMs: 2_000_000 });
    expect(detector.sample({ wallTimeMs: 2_001_000 })).toBe(false);
  });

  it('rejects invalid thresholds and samples', () => {
    expect(() => createSystemSleepWakeDetector({ wallTimeMs: 1_000 }, 0)).toThrow(RangeError);
    expect(() => createSystemSleepWakeDetector({ wallTimeMs: Number.NaN })).toThrow(RangeError);
  });
});
