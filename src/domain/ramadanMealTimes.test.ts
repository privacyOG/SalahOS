import { describe, expect, it } from 'vitest';

import { deriveRamadanMealTimes } from './ramadanMealTimes';

describe('Ramadan meal times', () => {
  it('uses the prayer times and sources actually presented to the user', () => {
    expect(
      deriveRamadanMealTimes({
        fajr: { localMinutes: 315, source: 'local-mosque' },
        maghrib: { localMinutes: 1_050, source: 'local-mosque' },
        imsakMinutesBeforeFajr: 10,
      }),
    ).toEqual({
      suhurEnd: {
        localMinutes: 315,
        source: 'local-mosque',
        provenance: 'Suhur ends at displayed Fajr',
      },
      imsak: {
        localMinutes: 305,
        source: 'local-mosque',
        configuredMinutesBeforeFajr: 10,
        provenance: 'Configured 10 minutes before displayed Fajr',
      },
      iftar: {
        localMinutes: 1_050,
        source: 'local-mosque',
        provenance: 'Iftar follows displayed Maghrib',
      },
    });
  });

  it('does not invent an Imsak time when no offset is configured', () => {
    const times = deriveRamadanMealTimes({
      fajr: { localMinutes: 300, source: 'calculated' },
      maghrib: { localMinutes: 1_060, source: 'calculated' },
      imsakMinutesBeforeFajr: null,
    });

    expect(times.suhurEnd.localMinutes).toBe(300);
    expect(times.imsak.localMinutes).toBeNull();
    expect(times.imsak.configuredMinutesBeforeFajr).toBeNull();
    expect(times.imsak.provenance).toContain('No optional Imsak offset configured');
    expect(times.iftar.localMinutes).toBe(1_060);
  });

  it('preserves unavailable Fajr or Maghrib without fabricating a value', () => {
    const times = deriveRamadanMealTimes({
      fajr: { localMinutes: null, source: 'calculated-adjustments' },
      maghrib: { localMinutes: null, source: 'calculated-adjustments' },
      imsakMinutesBeforeFajr: 15,
    });

    expect(times.suhurEnd.localMinutes).toBeNull();
    expect(times.imsak.localMinutes).toBeNull();
    expect(times.iftar.localMinutes).toBeNull();
  });

  it('normalizes a configured Imsak offset across civil midnight', () => {
    const times = deriveRamadanMealTimes({
      fajr: { localMinutes: 5, source: 'calculated' },
      maghrib: { localMinutes: 1_100, source: 'calculated' },
      imsakMinutesBeforeFajr: 10,
    });

    expect(times.imsak.localMinutes).toBe(1_435);
  });

  it.each([
    { fajr: -1, maghrib: 1_000 },
    { fajr: 300, maghrib: 1_440 },
    { fajr: Number.NaN, maghrib: 1_000 },
  ])('rejects invalid displayed local minutes', ({ fajr, maghrib }) => {
    expect(() =>
      deriveRamadanMealTimes({
        fajr: { localMinutes: fajr, source: 'calculated' },
        maghrib: { localMinutes: maghrib, source: 'calculated' },
        imsakMinutesBeforeFajr: null,
      }),
    ).toThrow(RangeError);
  });
});
