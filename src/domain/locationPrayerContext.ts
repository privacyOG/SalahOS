import type { Coordinates } from './coordinates';
import {
  assertIanaTimeZone,
  civilDateInTimeZone,
  resolveIanaTimeZone,
  utcOffsetMinutesAt,
} from './timezone';

export type LocationTimezoneSource = 'offline-coordinate-lookup' | 'persisted-timezone';

export interface LocationPrayerContext {
  readonly coordinates: Coordinates;
  readonly timeZone: string;
  readonly civilDate: Date;
  readonly utcOffsetMinutes: number;
  readonly timezoneSource: LocationTimezoneSource;
}

/**
 * Resolve the civil-date/timezone inputs required by the pure prayer engine
 * without transmitting coordinates to a remote service. A validated persisted
 * IANA timezone can be reused when one was already resolved for this location.
 */
export function createLocationPrayerContext(
  instant: Date,
  coordinates: Coordinates,
  persistedTimeZone?: string,
): LocationPrayerContext {
  const timeZone =
    persistedTimeZone === undefined
      ? resolveIanaTimeZone(coordinates).timeZone
      : assertIanaTimeZone(persistedTimeZone);
  const timezoneSource: LocationTimezoneSource =
    persistedTimeZone === undefined ? 'offline-coordinate-lookup' : 'persisted-timezone';

  return {
    coordinates,
    timeZone,
    civilDate: civilDateInTimeZone(instant, timeZone),
    utcOffsetMinutes: utcOffsetMinutesAt(instant, timeZone),
    timezoneSource,
  };
}
