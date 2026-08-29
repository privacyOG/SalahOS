import { describe, expect, it } from 'vitest';
import {
  australianMosques,
  type AustralianMosqueRecord,
} from './australianMosqueDirectoryCombined';
import {
  applyAustralianMosqueCongregationTimes,
  hasPublishedAustralianMosqueCongregationTimes,
  publishedAustralianMosqueCongregationMinutes,
} from './australianMosquePrayerContext';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { applyPrayerSourceToDashboard } from './sourcedDashboard';

function erskineMusallah(): AustralianMosqueRecord {
  const record = australianMosques.find(
    (candidate) => candidate.id === 'mosque-finder:sydney-cbd-erskine-musallah',
  );
  if (record === undefined) throw new Error('Sydney CBD Erskine Musallah fixture is missing');
  return record;
}

describe('Australian mosque published congregation times', () => {
  it('parses all explicitly published daily congregation sessions without inventing missing prayers', () => {
    const record = erskineMusallah();

    expect(publishedAustralianMosqueCongregationMinutes(record, 'dhuhr')).toEqual([735, 795]);
    expect(publishedAustralianMosqueCongregationMinutes(record, 'fajr')).toEqual([]);
    expect(hasPublishedAustralianMosqueCongregationTimes(record)).toBe(true);
  });

  it('overlays the primary published congregation time while keeping calculated prayer starts', () => {
    const record = erskineMusallah();
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-30T00:00:00.000Z'),
      coordinates: createCoordinates(record.latitude, record.longitude),
      timeZone: 'Australia/Sydney',
    });
    const calculated = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });
    const enriched = applyAustralianMosqueCongregationTimes(calculated, record);

    expect(enriched.sourceMode).toBe('calculated');
    expect(enriched.mosqueName).toBe(record.name);
    expect(enriched.prayers.find((row) => row.name === 'dhuhr')).toMatchObject({
      localMinutes: base.today.prayers.dhuhr.roundedLocalMinutes,
      iqamahLocalMinutes: 735,
      source: 'calculated',
    });
    expect(enriched.prayers.find((row) => row.name === 'fajr')?.iqamahLocalMinutes).toBeNull();
  });
});
