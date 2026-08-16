import { describe, expect, it } from 'vitest';
import { readSystemTime, systemTimeFromMilliseconds } from './systemTime';

describe('systemTimeFromMilliseconds', () => {
  it('returns a Date for a finite representable system time', () => {
    const instant = systemTimeFromMilliseconds(Date.UTC(2026, 7, 16, 1, 30, 0));

    expect(instant?.toISOString()).toBe('2026-08-16T01:30:00.000Z');
  });

  it('accepts representable dates before the Unix epoch', () => {
    const instant = systemTimeFromMilliseconds(-1_000);

    expect(instant?.getTime()).toBe(-1_000);
  });

  it('rejects non-finite system time values', () => {
    expect(systemTimeFromMilliseconds(Number.NaN)).toBeNull();
    expect(systemTimeFromMilliseconds(Number.POSITIVE_INFINITY)).toBeNull();
    expect(systemTimeFromMilliseconds(Number.NEGATIVE_INFINITY)).toBeNull();
  });

  it('rejects finite values outside the JavaScript Date range', () => {
    expect(systemTimeFromMilliseconds(8_640_000_000_000_001)).toBeNull();
    expect(systemTimeFromMilliseconds(-8_640_000_000_000_001)).toBeNull();
  });
});

describe('readSystemTime', () => {
  it('uses the provided wall-clock reader', () => {
    const instant = readSystemTime(() => 1_700_000_000_000);

    expect(instant?.getTime()).toBe(1_700_000_000_000);
  });

  it('returns null instead of constructing an invalid Date', () => {
    expect(readSystemTime(() => Number.NaN)).toBeNull();
  });
});
