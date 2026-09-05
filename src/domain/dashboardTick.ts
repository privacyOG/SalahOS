import { localClockParts, type PrayerDashboardModel } from './dashboard';
import { findNextPrayer } from './nextPrayer';
import { civilDateInTimeZone, utcOffsetMinutesAt } from './timezone';

function sameCivilDate(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

/**
 * Return whether an already-calculated dashboard schedule still belongs to the
 * civil date containing `instant` in the dashboard calculation timezone.
 *
 * This check deliberately performs no astronomical work. Callers can therefore
 * keep a daily schedule cached and rebuild only when the civil date changes.
 */
export function prayerDashboardMatchesCivilDate(
  dashboard: PrayerDashboardModel,
  instant: Date,
): boolean {
  if (!Number.isFinite(instant.getTime())) return false;
  return sameCivilDate(dashboard.civilDate, civilDateInTimeZone(instant, dashboard.timeZone));
}

/**
 * Re-derive the time-sensitive dashboard fields from an existing daily prayer
 * schedule. The expensive astronomical `today`/`tomorrow` schedules are reused
 * unchanged; only clock, UTC offset, next-prayer state and countdown values are
 * refreshed.
 */
export function derivePrayerDashboardTick(
  dashboard: PrayerDashboardModel,
  instant: Date,
): PrayerDashboardModel {
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Instant must be valid');
  }
  if (!prayerDashboardMatchesCivilDate(dashboard, instant)) {
    throw new RangeError('Dashboard schedule must be rebuilt for a new civil date');
  }

  const clock = localClockParts(instant, dashboard.timeZone);
  const next = findNextPrayer(clock.localMinutes, dashboard.today, dashboard.tomorrow);
  const prayers = dashboard.prayers.map((row) => ({
    ...row,
    isNext: next?.dayOffset === 0 && next.prayer === row.name,
  }));

  return {
    ...dashboard,
    generatedAt: new Date(instant.getTime()),
    utcOffsetMinutes: utcOffsetMinutesAt(instant, dashboard.timeZone),
    clock,
    prayers,
    nextPrayer: next?.prayer ?? null,
    nextPrayerDayOffset: next?.dayOffset ?? null,
    nextPrayerLocalMinutes: next?.localMinutes ?? null,
    secondsUntilNextPrayer:
      next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60)),
  };
}
