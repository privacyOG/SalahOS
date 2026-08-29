import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { applyPrayerSourceToDashboard } from './sourcedDashboard';
import type { MosqueTimetable } from './mosqueTimetable';

const sydney = createCoordinates(-33.8688, 151.2093);

const mosqueTimetable: MosqueTimetable = {
  mosqueName: 'Example Mosque',
  days: [
    {
      date: '2026-08-16',
      prayers: {
        fajr: { startLocalMinutes: 330, iqamah: { kind: 'offset', offsetMinutes: 20 } },
        dhuhr: { startLocalMinutes: 750, iqamah: { kind: 'fixed', localMinutes: 780 } },
        asr: { startLocalMinutes: 930, iqamah: { kind: 'offset', offsetMinutes: 15 } },
        maghrib: { startLocalMinutes: 1_050, iqamah: { kind: 'offset', offsetMinutes: 10 } },
        isha: { startLocalMinutes: 1_140, iqamah: { kind: 'fixed', localMinutes: 1_170 } },
      },
    },
    {
      date: '2026-08-17',
      prayers: {
        fajr: { startLocalMinutes: 329, iqamah: { kind: 'offset', offsetMinutes: 20 } },
      },
    },
  ],
};

describe('selected prayer source dashboard', () => {
  it('keeps calculated mode on the shared calculated schedule', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'calculated',
      mosqueTimetable,
    });

    expect(sourced.mosqueName).toBeNull();
    expect(sourced.prayers.find((row) => row.name === 'dhuhr')?.localMinutes).toBe(
      base.today.prayers.dhuhr.roundedLocalMinutes,
    );
    expect(sourced.prayers.find((row) => row.name === 'dhuhr')?.iqamahLocalMinutes).toBeNull();
  });

  it('uses mosque starts and iqamah without calculated fallback', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable,
    });

    expect(sourced.mosqueName).toBe('Example Mosque');
    expect(sourced.prayers.find((row) => row.name === 'fajr')).toMatchObject({
      localMinutes: 330,
      iqamahLocalMinutes: 350,
      source: 'local-mosque',
      available: true,
    });
    expect(sourced.prayers.find((row) => row.name === 'dhuhr')).toMatchObject({
      localMinutes: 750,
      iqamahLocalMinutes: 780,
    });
  });

  it('marks the latest entered obligatory mosque prayer as current', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T08:45:00.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable,
    });

    expect(base.clock.localMinutes).toBe(1_125);
    expect(sourced.currentPrayer).toBe('maghrib');
    expect(sourced.prayers.find((row) => row.name === 'maghrib')?.isCurrent).toBe(true);
    expect(sourced.prayers.find((row) => row.name === 'isha')?.isNext).toBe(true);
    expect(sourced.prayers.find((row) => row.name === 'sunrise')?.isCurrent).toBe(false);
  });

  it('keeps Fajr current only until the calculated sunrise boundary', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-15T20:00:00.000Z'),
      coordinates: sydney,
    });
    const sunrise = base.today.prayers.sunrise.roundedLocalMinutes;
    const fajr = base.today.prayers.fajr.roundedLocalMinutes;
    expect(fajr).not.toBeNull();
    expect(sunrise).not.toBeNull();
    expect(fajr ?? 1_440).toBeLessThan(base.clock.localMinutes);
    expect(sunrise ?? 0).toBeGreaterThan(base.clock.localMinutes);

    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });

    expect(sourced.currentPrayer).toBe('fajr');
    expect(sourced.prayers.find((row) => row.name === 'fajr')?.isCurrent).toBe(true);
    expect(sourced.prayers.find((row) => row.name === 'sunrise')?.isCurrent).toBe(false);
  });

  it('ends the Fajr current interval at sunrise while keeping Dhuhr as the next prayer', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-15T21:00:00.000Z'),
      coordinates: sydney,
    });
    const sunrise = base.today.prayers.sunrise.roundedLocalMinutes;
    const dhuhr = base.today.prayers.dhuhr.roundedLocalMinutes;
    expect(sunrise).not.toBeNull();
    expect(dhuhr).not.toBeNull();
    expect(sunrise ?? 1_440).toBeLessThanOrEqual(base.clock.localMinutes);
    expect(dhuhr ?? 0).toBeGreaterThan(base.clock.localMinutes);

    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });

    expect(sourced.currentPrayer).toBeNull();
    expect(sourced.prayers.some((row) => row.isCurrent)).toBe(false);
    expect(sourced.nextPrayer).toBe('dhuhr');
    expect(sourced.prayers.find((row) => row.name === 'dhuhr')?.isNext).toBe(true);
    expect(sourced.prayers.find((row) => row.name === 'sunrise')).toMatchObject({
      isCurrent: false,
      isNext: false,
    });
  });

  it('keeps Isha current after Isha while next prayer rolls to tomorrow Fajr', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T13:59:30.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable,
    });

    expect(sourced.currentPrayer).toBe('isha');
    expect(sourced.prayers.find((row) => row.name === 'isha')?.isCurrent).toBe(true);
    expect(sourced.nextPrayer).toBe('fajr');
    expect(sourced.nextPrayerDayOffset).toBe(1);
    expect(sourced.nextPrayerLocalMinutes).toBe(329);
  });

  it('has no current prayer before the first available obligatory prayer of the civil day', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-15T18:30:00.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable,
    });

    expect(base.clock.localMinutes).toBe(270);
    expect(sourced.currentPrayer).toBeNull();
    expect(sourced.prayers.some((row) => row.isCurrent)).toBe(false);
    expect(sourced.nextPrayer).toBe('fajr');
  });

  it('marks a missing mosque prayer unavailable instead of falling back', () => {
    const incomplete: MosqueTimetable = {
      mosqueName: 'Incomplete Mosque',
      days: [{ date: '2026-08-16', prayers: { fajr: { startLocalMinutes: 330 } } }],
    };
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable: incomplete,
    });

    expect(sourced.prayers.find((row) => row.name === 'dhuhr')).toMatchObject({
      localMinutes: null,
      iqamahLocalMinutes: null,
      available: false,
    });
  });

  it('rolls next prayer to tomorrow mosque Fajr after the last mosque prayer', () => {
    const base = buildPrayerDashboard({
      instant: new Date('2026-08-16T13:59:30.000Z'),
      coordinates: sydney,
    });
    const sourced = applyPrayerSourceToDashboard({
      dashboard: base,
      sourceMode: 'local-mosque',
      mosqueTimetable,
    });

    expect(sourced.nextPrayer).toBe('fajr');
    expect(sourced.nextPrayerDayOffset).toBe(1);
    expect(sourced.nextPrayerLocalMinutes).toBe(329);
  });
});
