import {
  buildPrayerDashboard,
  buildPrayerDashboardSchedule,
  derivePrayerDashboard,
} from './dashboard';
import type {
  PrayerDashboardInput,
  PrayerDashboardModel,
  PrayerDashboardScheduleInput,
  PrayerDashboardScheduleModel,
} from './dashboard';
import type { PrayerName } from './prayerEngine';

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

export type PrayerDashboardScheduleResult =
  | {
      readonly ok: true;
      readonly schedule: PrayerDashboardScheduleModel;
      readonly unavailablePrayers: readonly PrayerName[];
    }
  | {
      readonly ok: false;
      readonly reason: 'calculation-unavailable';
    };

export function buildPrayerDashboardScheduleResult(
  input: PrayerDashboardScheduleInput,
): PrayerDashboardScheduleResult {
  try {
    const schedule = buildPrayerDashboardSchedule(input);
    return {
      ok: true,
      schedule,
      unavailablePrayers: schedule.prayers
        .filter((prayer) => prayer.localMinutes === null)
        .map((prayer) => prayer.name),
    };
  } catch {
    return { ok: false, reason: 'calculation-unavailable' };
  }
}

export function derivePrayerDashboardResult(
  scheduleResult: PrayerDashboardScheduleResult,
  instant: Date,
): PrayerDashboardResult {
  if (!scheduleResult.ok) return scheduleResult;

  try {
    return {
      ok: true,
      dashboard: derivePrayerDashboard(scheduleResult.schedule, instant),
      unavailablePrayers: scheduleResult.unavailablePrayers,
    };
  } catch {
    return { ok: false, reason: 'calculation-unavailable' };
  }
}

export function buildPrayerDashboardResult(input: PrayerDashboardInput): PrayerDashboardResult {
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
