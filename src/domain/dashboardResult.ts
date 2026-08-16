import { buildPrayerDashboard } from './dashboard';
import type { PrayerDashboardModel } from './dashboard';
import type { PrayerName } from './prayerEngine';

type DashboardInput = Parameters<typeof buildPrayerDashboard>[0];

export type PrayerDashboardResult =
  | {
      readonly ok: true;
      readonly dashboard: PrayerDashboardModel;
      readonly unavailablePrayers: readonly PrayerName[];
    }
  | {
      readonly ok: false;
      readonly reason: 'calculation-unavailable';
    };

export function buildPrayerDashboardResult(input: DashboardInput): PrayerDashboardResult {
  try {
    const dashboard = buildPrayerDashboard(input);
    return {
      ok: true,
      dashboard,
      unavailablePrayers: dashboard.prayers
        .filter((prayer) => prayer.localMinutes === null)
        .map((prayer) => prayer.name),
    };
  } catch {
    return { ok: false, reason: 'calculation-unavailable' };
  }
}
