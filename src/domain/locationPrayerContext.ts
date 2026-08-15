import type { Coordinates } from './coordinates';
import { civilDateInTimeZone, resolveIanaTimeZone, utcOffsetMinutesAt } from './timezone';

export interface LocationPrayerContext {
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly civilDate: Date;
  readonly utcOffsetMinutes: number;
  readonly timezoneSource: 'offline-coordinate-lookup';
}

/**
 * Resolve the civil-date/timezone inputs required by the pure prayer engine
 * without transmitting coordinates to a remote service.
 */
export function createLocationPrayerContext(
  instant: Date,
  coordinates: Coordinates,
): LocationPrayerContext {
  const timezone = resolveIanaTimeZone(coordinates);

  return {
    coordinates,
    timeZone: timezone.timeZone,
    civilDate: civilDateInTimeZone(instant, timezone.timeZone),
    utcOffsetMinutes: utcOffsetMinutesAt(instant, timezone.timeZone),
    timezoneSource: timezone.source,
  };
}
