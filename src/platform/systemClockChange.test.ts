import { describe, expect, it } from 'vitest';
import { createSystemClockChangeDetector } from './systemClockChange';

describe('createSystemClockChangeDetector', () => {
  it('ignores normal wall-clock progression that matches monotonic elapsed time', () => {
    const detector = createSystemClockChangeDetector({
      wallTimeMs: 1_000_000,
      monotonicTimeMs: 5_000,
    });

    expect(detector.sample({ wallTimeMs: 1_001_000, monotonicTimeMs: 6_000 })).toBe(false);
    expect(detector.sample({ wallTimeMs: 1_011_000, monotonicTimeMs: 16_000 })).toBe(false);
  });

  it('detects a significant forward wall-clock correction', () => {
    const detector = createSystemClockChangeDetector({
      wallTimeMs: 1_000_000,
      monotonicTimeMs: 5_000,
    });

    expect(detector.sample({ wallTimeMs: 1_121_000, monotonicTimeMs: 6_000 })).toBe(true);
  });

  it('detects a significant backward wall-clock correction', () => {
    const detector = createSystemClockChangeDetector({
      wallTimeMs: 1_000_000,
      monotonicTimeMs: 5_000,
    });

    expect(detector.sample({ wallTimeMs: 940_000, monotonicTimeMs: 6_000 })).toBe(true);
  });

  it('does not flag corrections below the configured threshold', () => {
    const detector = createSystemClockChangeDetector(
      { wallTimeMs: 1_000_000, monotonicTimeMs: 5_000 },
      30_000,
    );

    expect(detector.sample({ wallTimeMs: 1_020_000, monotonicTimeMs: 6_000 })).toBe(false);
  });

  it('detects a monotonic clock reset and supports explicit baseline reset', () => {
    const detector = createSystemClockChangeDetector({
      wallTimeMs: 1_000_000,
      monotonicTimeMs: 5_000,
    });

    expect(detector.sample({ wallTimeMs: 1_001_000, monotonicTimeMs: 100 })).toBe(true);
    detector.reset({ wallTimeMs: 2_000_000, monotonicTimeMs: 200 });
    expect(detector.sample({ wallTimeMs: 2_001_000, monotonicTimeMs: 1_200 })).toBe(false);
  });

  it('rejects invalid thresholds and samples', () => {
    expect(() =>
      createSystemClockChangeDetector({ wallTimeMs: 1_000, monotonicTimeMs: 10 }, 0),
    ).toThrow(RangeError);
    expect(() =>
      createSystemClockChangeDetector({ wallTimeMs: Number.NaN, monotonicTimeMs: 10 }),
    ).toThrow(RangeError);
  });
});
