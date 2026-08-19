import { describe, expect, it } from 'vitest';

import { deriveRamadanMode } from './ramadan';

describe('Ramadan mode', () => {
  it('activates for the ninth Hijri month and exposes the Ramadan day', () => {
    expect(deriveRamadanMode({ year: 1448, month: 9, day: 12 })).toEqual({
      active: true,
      hijriYear: 1448,
      ramadanDay: 12,
      source: 'corrected-hijri-date',
    });
  });

  it.each([
    { year: 1448, month: 8, day: 30 },
    { year: 1448, month: 10, day: 1 },
  ])('stays inactive outside Ramadan', (hijri) => {
    expect(deriveRamadanMode(hijri)).toEqual({
      active: false,
      hijriYear: hijri.year,
      ramadanDay: null,
      source: 'corrected-hijri-date',
    });
  });

  it('accepts the full supported Ramadan day range', () => {
    expect(deriveRamadanMode({ year: 1448, month: 9, day: 1 }).ramadanDay).toBe(1);
    expect(deriveRamadanMode({ year: 1448, month: 9, day: 30 }).ramadanDay).toBe(30);
  });

  it.each([
    { year: 0, month: 9, day: 1 },
    { year: 1448, month: 0, day: 1 },
    { year: 1448, month: 13, day: 1 },
    { year: 1448, month: 9, day: 0 },
    { year: 1448, month: 9, day: 31 },
  ])('rejects invalid Hijri date parts', (hijri) => {
    expect(() => deriveRamadanMode(hijri)).toThrow(RangeError);
  });
});
