import { civilDateInTimeZone } from '../domain/timezone';

export const TODAY_CLOCK_HIDDEN_MEDIA_QUERY = '(max-width: 720px)';
export const TODAY_COUNTDOWN_FINAL_HOUR_SECONDS = 60 * 60;
export const TODAY_FAST_TICK_MILLISECONDS = 1_000;
export const TODAY_SLOW_TICK_MILLISECONDS = 60_000;

export function todayPrayerCivilDateIso(instant: Date, timeZone: string): string {
  return civilDateInTimeZone(instant, timeZone).toISOString().slice(0, 10);
}

export function millisecondsUntilNextMinute(instant: Date): number {
  if (!Number.isFinite(instant.getTime())) return TODAY_SLOW_TICK_MILLISECONDS;

  const elapsedMilliseconds = instant.getSeconds() * 1_000 + instant.getMilliseconds();
  const remaining = TODAY_SLOW_TICK_MILLISECONDS - elapsedMilliseconds;
  return remaining === 0 ? TODAY_SLOW_TICK_MILLISECONDS : remaining;
}

export function todayCountdownTickMilliseconds(
  secondsUntilNextPrayer: number | null,
  clockHidden: boolean,
): number | null {
  if (secondsUntilNextPrayer === null) return null;
  return clockHidden && secondsUntilNextPrayer > TODAY_COUNTDOWN_FINAL_HOUR_SECONDS
    ? TODAY_SLOW_TICK_MILLISECONDS
    : TODAY_FAST_TICK_MILLISECONDS;
}

export function countdownTargetEpochMilliseconds(
  generatedAt: Date,
  secondsUntilNextPrayer: number | null,
): number | null {
  if (!Number.isFinite(generatedAt.getTime()) || secondsUntilNextPrayer === null) return null;
  return generatedAt.getTime() + Math.max(0, secondsUntilNextPrayer) * 1_000;
}

export function remainingCountdownSeconds(
  targetEpochMilliseconds: number | null,
  now: Date,
): number | null {
  if (targetEpochMilliseconds === null || !Number.isFinite(now.getTime())) return null;
  return Math.max(0, Math.ceil((targetEpochMilliseconds - now.getTime()) / 1_000));
}
