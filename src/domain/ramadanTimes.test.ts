import { describe, expect, it } from 'vitest';

import { buildRamadanFastTimes, RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES } from './ramadanTimes';

describe('Ramadan fasting-time presentation', () => {
  it('uses displayed Fajr for the Suhur boundary and displayed Maghrib for Iftar', () => {
    expect(
      buildRamadanFastTimes({
        displayedFajrLocalMinutes: 305,
        displayedMaghribLocalMinutes: 1_095,
        imsakOffsetMinutes: RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES,
      }),
    ).toEqual({
      imsakLocalMinutes: 295,
      suhurEndsAtLocalMinutes: 305,
      iftarLocalMinutes: 1_095,
      imsakOffsetMinutes: 10,
    });
  });

  it('wraps precautionary Imsak across the civil-day boundary', () => {
    expect(
      buildRamadanFastTimes({
        displayedFajrLocalMinutes: 5,
        displayedMaghribLocalMinutes: 1_100,
        imsakOffsetMinutes: 10,
      }).imsakLocalMinutes,
    ).toBe(1_435);
  });

  it('keeps unavailable displayed prayer times unavailable', () => {
    expect(
      buildRamadanFastTimes({
        displayedFajrLocalMinutes: null,
        displayedMaghribLocalMinutes: null,
        imsakOffsetMinutes: 10,
      }),
    ).toEqual({
      imsakLocalMinutes: null,
      suhurEndsAtLocalMinutes: null,
      iftarLocalMinutes: null,
      imsakOffsetMinutes: 10,
    });
  });

  it('rejects invalid displayed minutes and Imsak offsets', () => {
    expect(() =>
      buildRamadanFastTimes({
        displayedFajrLocalMinutes: -1,
        displayedMaghribLocalMinutes: 1_000,
        imsakOffsetMinutes: 10,
      }),
    ).toThrow(/Displayed Fajr/u);

    expect(() =>
      buildRamadanFastTimes({
        displayedFajrLocalMinutes: 300,
        displayedMaghribLocalMinutes: 1_000,
        imsakOffsetMinutes: 10.5,
      }),
    ).toThrow(/Imsak offset/u);
  });
});
