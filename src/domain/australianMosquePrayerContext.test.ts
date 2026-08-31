import { describe, expect, it } from 'vitest';
import {
  australianMosques,
  type AustralianMosqueRecord,
} from './australianMosqueDirectoryCombined';
import {
  applyAustralianMosqueCongregationTimes,
  AUSTRALIAN_MOSQUE_CONGREGATION_ACCEPTANCE_WINDOW_MINUTES,
  guardedPublishedAustralianMosqueCongregationMinutes,
  hasPublishedAustralianMosqueCongregationTimes,
  publishedAustralianMosqueCongregationMinutes,
} from './australianMosquePrayerContext';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { applyPrayerSourceToDashboard } from './sourcedDashboard';

function mosqueByName(name: string): AustralianMosqueRecord {
  const record = australianMosques.find((candidate) => candidate.name === name);
  if (record === undefined) throw new Error(`${name} fixture is missing`);
  return record;
}

function erskineMusallah(): AustralianMosqueRecord {
  return mosqueByName('Sydney CBD - Erskine Musallah');
}

describe('Australian mosque published congregation times', () => {
  it('parses all explicitly published daily congregation sessions without inventing missing prayers', () => {
    const record = erskineMusallah();

    expect(
      publishedAustralianMosqueCongregationMinutes(record.enriched.prayerTimes, 'dhuhr'),
    ).toEqual([735, 795]);
    expect(
      publishedAustralianMosqueCongregationMinutes(record.enriched.prayerTimes, 'fajr'),
    ).toEqual([]);
    expect(hasPublishedAustralianMosqueCongregationTimes(record.enriched.prayerTimes)).toBe(true);
  });

  it('rejects impossible congregation values from the three affected real records', () => {
    const lismore = mosqueByName('Lismore Masallah');
    const canningVale = mosqueByName('Canning Vale Musalla');
    const erskine = erskineMusallah();

    expect(
      guardedPublishedAustralianMosqueCongregationMinutes(
        lismore.enriched.prayerTimes,
        'isha',
        18 * 60 + 46,
      ),
    ).toEqual([]);
    expect(
      guardedPublishedAustralianMosqueCongregationMinutes(
        canningVale.enriched.prayerTimes,
        'maghrib',
        17 * 60 + 58,
      ),
    ).toEqual([]);
    expect(
      guardedPublishedAustralianMosqueCongregationMinutes(
        erskine.enriched.prayerTimes,
        'dhuhr',
        12 * 60 + 17,
      ),
    ).toEqual([13 * 60 + 15]);
  });

  it('uses named acceptance windows and permits Isha to wrap across midnight', () => {
    expect(AUSTRALIAN_MOSQUE_CONGREGATION_ACCEPTANCE_WINDOW_MINUTES).toEqual({
      fajr: 120,
      dhuhr: 90,
      asr: 90,
      maghrib: 90,
      isha: 90,
    });
    expect(
      guardedPublishedAustralianMosqueCongregationMinutes(
        { isha: '12:30 am' },
        'isha',
        23 * 60 + 45,
      ),
    ).toEqual([30]);
    expect(
      guardedPublishedAustralianMosqueCongregationMinutes(
        { isha: '1:30 am' },
        'isha',
        23 * 60 + 45,
      ),
    ).toEqual([]);
  });

  it('overlays only the plausible Erskine session after its resolved 12:17 Dhuhr start', () => {
    const record = erskineMusallah();
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-30T00:00:00.000Z'),
      coordinates: createCoordinates(record.latitude, record.longitude),
      timeZone: 'Australia/Sydney',
      // Mirrors the resolved 12:17 Dhuhr start in the v1.5.3 acceptance fixture.
      adjustments: { dhuhr: 21 },
    });
    const calculated = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });
    const enriched = applyAustralianMosqueCongregationTimes(calculated, {
      mosqueName: record.name,
      prayerTimes: record.enriched.prayerTimes,
    });

    expect(enriched.sourceMode).toBe('calculated');
    expect(enriched.mosqueName).toBe(record.name);
    expect(enriched.prayers.find((row) => row.name === 'dhuhr')).toMatchObject({
      localMinutes: 12 * 60 + 17,
      iqamahLocalMinutes: 13 * 60 + 15,
      source: 'calculated',
    });
    expect(enriched.prayers.find((row) => row.name === 'fajr')?.iqamahLocalMinutes).toBeNull();
  });
});
