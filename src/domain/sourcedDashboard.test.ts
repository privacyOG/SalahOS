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
