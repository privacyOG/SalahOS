import type { NotificationIntent } from './notificationSchedule';
import { resolveZonedCivilTime } from './zonedCivilTime';

export type NotificationInstantResolution =
  | {
      readonly status: 'scheduled';
      readonly intent: NotificationIntent;
      readonly timeZone: string;
      readonly instant: Date;
      readonly offsetMinutes: number;
      readonly ambiguity: 'none' | 'earlier-occurrence';
    }
  | {
      readonly status: 'skipped-nonexistent-local-time';
      readonly intent: NotificationIntent;
      readonly timeZone: string;
    };

/**
 * Convert a civil notification intent to an exact instant.
 * If a wall-clock time repeats at DST end, schedule the earlier occurrence deterministically.
 * If a wall-clock time does not exist at DST start, skip it rather than silently inventing a time.
 */
export function resolveNotificationIntentInstant(
  intent: NotificationIntent,
  timeZone: string,
): NotificationInstantResolution {
  const resolution = resolveZonedCivilTime(
    { date: intent.deliveryDate, localMinutes: intent.deliveryLocalMinutes },
    timeZone,
  );

  if (resolution.status === 'nonexistent') {
    return {
      status: 'skipped-nonexistent-local-time',
      intent,
      timeZone,
    };
  }

  if (resolution.status === 'ambiguous') {
    return {
      status: 'scheduled',
      intent,
      timeZone,
      instant: resolution.earlier.instant,
      offsetMinutes: resolution.earlier.offsetMinutes,
      ambiguity: 'earlier-occurrence',
    };
  }

  return {
    status: 'scheduled',
    intent,
    timeZone,
    instant: resolution.candidate.instant,
    offsetMinutes: resolution.candidate.offsetMinutes,
    ambiguity: 'none',
  };
}

export function resolveNotificationScheduleInstants(
  intents: readonly NotificationIntent[],
  timeZone: string,
): readonly NotificationInstantResolution[] {
  return intents.map((intent) => resolveNotificationIntentInstant(intent, timeZone));
}
