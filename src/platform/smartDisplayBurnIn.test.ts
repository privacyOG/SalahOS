import { describe, expect, it } from 'vitest';

import { smartDisplayBurnInShiftIndex } from './smartDisplayBurnIn';

describe('smartDisplayBurnInShiftIndex', () => {
  it('advances through four stable positions at 15-minute intervals', () => {
    const start = new Date('2026-08-23T05:00:00.000Z');
    const sequence = Array.from({ length: 5 }, (_, index) =>
      smartDisplayBurnInShiftIndex(new Date(start.getTime() + index * 15 * 60 * 1000)),
    );
    expect(sequence.slice(0, 4)).toHaveLength(4);
    expect(new Set(sequence.slice(0, 4))).toEqual(new Set([0, 1, 2, 3]));
    expect(sequence[4]).toBe(sequence[0]);
  });

  it('selects a non-zero position for the fixed Stage 25 visual instant', () => {
    expect(smartDisplayBurnInShiftIndex(new Date('2026-08-23T05:30:00.000Z'))).toBe(2);
  });

  it('fails closed to the neutral position for an invalid instant', () => {
    expect(smartDisplayBurnInShiftIndex(new Date(Number.NaN))).toBe(0);
  });
});
