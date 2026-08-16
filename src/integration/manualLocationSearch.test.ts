import { describe, expect, it } from 'vitest';
import { buildPrayerDashboard } from '../domain/dashboard';
import { searchLocations } from '../domain/locationSearch';

describe('manual location search integration', () => {
  it('feeds an offline search result into the production prayer dashboard', () => {
    const sydney = searchLocations('Sydney')[0];
    if (sydney === undefined) throw new Error('Sydney must exist in the offline location catalogue');

    const dashboard = buildPrayerDashboard({
      instant: new Date('2026-08-16T02:00:00.000Z'),
      coordinates: sydney.coordinates,
    });

    expect(sydney.timeZone).toBe('Australia/Sydney');
    expect(dashboard.timeZone).toBe('Australia/Sydney');
    expect(dashboard.today.date).toEqual({ year: 2026, month: 8, day: 16 });
    expect(dashboard.prayers).toHaveLength(6);
  });
});
