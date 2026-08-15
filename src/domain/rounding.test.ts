import { describe, expect, it } from 'vitest';
import { roundMinutes } from './rounding';

describe('roundMinutes', () => {
  it('applies each deterministic policy without hidden offsets', () => {
    expect(roundMinutes(123.49, 'nearest-minute')).toBe(123);
    expect(roundMinutes(123.5, 'nearest-minute')).toBe(124);
    expect(roundMinutes(123.01, 'ceiling-minute')).toBe(124);
    expect(roundMinutes(123.99, 'floor-minute')).toBe(123);
  });

  it('rejects non-finite values', () => {
    expect(() => roundMinutes(Number.NaN, 'nearest-minute')).toThrow(RangeError);
  });
});
