import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';

const sydney = createCoordinates(-33.8688, 151.2093);

describe('date rollover flow', () => {
  it('re-bases the prayer dashboard when Sydney crosses local midnight', () => {
    const beforeMidnight = buildPrayerDashboard({
      instant: new Date('2026-08-16T13:59:59.000Z'),
      coordinates: sydney,
    });
    const afterMidnight = buildPrayerDashboard({
      instant: new Date('2026-08-16T14:00:01.000Z'),
      coordinates: sydney,
    });

    expect(beforeMidnight.timeZone).toBe('Australia/Sydney');
    expect(beforeMidnight.clock).toMatchObject({ hour: 23, minute: 59, second: 59 });
    expect(beforeMidnight.today.date).toBe('2026-08-16');
    expect(beforeMidnight.tomorrow.date).toBe('2026-08-17');
    expect(beforeMidnight.gregorian).toMatchObject({ year: 2026, month: 8, day: 16 });
    expect(beforeMidnight.nextPrayer).toBe('fajr');
    expect(beforeMidnight.nextPrayerDayOffset).toBe(1);

    expect(afterMidnight.clock).toMatchObject({ hour: 0, minute: 0, second: 1 });
    expect(afterMidnight.today.date).toBe('2026-08-17');
    expect(afterMidnight.tomorrow.date).toBe('2026-08-18');
    expect(afterMidnight.gregorian).toMatchObject({ year: 2026, month: 8, day: 17 });
    expect(afterMidnight.nextPrayer).toBe('fajr');
    expect(afterMidnight.nextPrayerDayOffset).toBe(0);

    expect(afterMidnight.today.date).toBe(beforeMidnight.tomorrow.date);
    expect(afterMidnight.prayers.map((prayer) => prayer.localMinutes)).toEqual(
      afterMidnight.today.prayers
        ? afterMidnight.prayers.map((prayer) => prayer.localMinutes)
        : [],
    );
  });
});
