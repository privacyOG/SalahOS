import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { derivePrayerDashboardTick, prayerDashboardMatchesCivilDate } from './dashboardTick';
import { calculationMethods } from './methods';

const coordinates = createCoordinates(-33.8688, 151.2093);

function buildSydneyDashboard() {
  return buildPrayerDashboard({
    instant: new Date('2026-09-06T00:00:00.000Z'),
    coordinates,
    timeZone: 'Australia/Sydney',
    method: calculationMethods['muslim-world-league'],
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
  });
}

describe('dashboard tick derivation', () => {
  it('reuses astronomical schedules while refreshing live dashboard fields', () => {
    const dashboard = buildSydneyDashboard();
    const tickInstant = new Date('2026-09-06T00:10:00.000Z');
    const ticked = derivePrayerDashboardTick(dashboard, tickInstant);

    expect(ticked.today).toBe(dashboard.today);
    expect(ticked.tomorrow).toBe(dashboard.tomorrow);
    expect(ticked.generatedAt).toEqual(tickInstant);
    expect(ticked.clock).not.toEqual(dashboard.clock);
    expect(ticked.prayers.map((prayer) => prayer.localMinutes)).toEqual(
      dashboard.prayers.map((prayer) => prayer.localMinutes),
    );
  });

  it('detects the calculation-timezone civil-date boundary without astronomy', () => {
    const dashboard = buildSydneyDashboard();

    expect(
      prayerDashboardMatchesCivilDate(dashboard, new Date('2026-09-06T13:59:59.000Z')),
    ).toBe(true);
    expect(
      prayerDashboardMatchesCivilDate(dashboard, new Date('2026-09-06T14:00:00.000Z')),
    ).toBe(false);
    expect(() =>
      derivePrayerDashboardTick(dashboard, new Date('2026-09-06T14:00:00.000Z')),
    ).toThrow('Dashboard schedule must be rebuilt for a new civil date');
  });
});
