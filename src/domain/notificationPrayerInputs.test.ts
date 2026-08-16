import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { buildNotificationPrayerInputs } from './notificationPrayerInputs';
import type { MosqueTimetable } from './mosqueTimetable';

const dashboard = buildPrayerDashboard({
  instant: new Date('2026-08-16T02:00:00.000Z'),
  coordinates: createCoordinates(-33.8688, 151.2093),
});

describe('notification prayer inputs', () => {
  it('builds the five obligatory prayers for today and tomorrow from calculated schedules', () => {
    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });

    expect(inputs).toHaveLength(10);
    expect(new Set(inputs.map((input) => input.date))).toEqual(
      new Set([dashboard.today.date, dashboard.tomorrow.date]),
    );
    expect(inputs.map((input) => input.prayer)).not.toContain('sunrise');
  });

  it('uses mosque start times for each available timetable day without calculated fallback', () => {
    const timetable: MosqueTimetable = {
      mosqueName: 'Test Mosque',
      days: [
        {
          date: dashboard.today.date,
          prayers: {
            fajr: { startLocalMinutes: 300 },
            dhuhr: { startLocalMinutes: 720 },
            asr: { startLocalMinutes: 900 },
            maghrib: { startLocalMinutes: 1080 },
            isha: { startLocalMinutes: 1170 },
          },
        },
      ],
    };

    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: 'local-mosque',
      mosqueTimetable: timetable,
    });

    expect(inputs).toEqual([
      { date: dashboard.today.date, prayer: 'fajr', localMinutes: 300 },
      { date: dashboard.today.date, prayer: 'dhuhr', localMinutes: 720 },
      { date: dashboard.today.date, prayer: 'asr', localMinutes: 900 },
      { date: dashboard.today.date, prayer: 'maghrib', localMinutes: 1080 },
      { date: dashboard.today.date, prayer: 'isha', localMinutes: 1170 },
    ]);
  });
});
