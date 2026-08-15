import timezoneLookup from '@photostructure/tz-lookup';
import type { Coordinates } from './coordinates';

export interface TimezoneResolution {
  readonly timeZone: string;
  readonly source: 'offline-coordinate-lookup';
  readonly approximateBoundaryLookup: true;
}

function datePartsInTimeZone(instant: Date, timeZone: string): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  return Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

function requiredPart(parts: Record<string, string>, name: string): number {
  const value = parts[name];
  if (value === undefined) {
    throw new RangeError(`Timezone formatter did not return ${name}`);
  }
  return Number(value);
}

export function assertIanaTimeZone(timeZone: string): string {
  if (!timeZone.trim()) {
    throw new RangeError('IANA timezone is required');
  }

  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(new Date(0));
  } catch {
    throw new RangeError(`Invalid IANA timezone: ${timeZone}`);
  }

  return timeZone;
}

/** Resolve coordinates entirely offline. The compact boundary dataset is approximate near borders. */
export function resolveIanaTimeZone(coordinates: Coordinates): TimezoneResolution {
  const timeZone = assertIanaTimeZone(timezoneLookup(coordinates.latitude, coordinates.longitude));
  return {
    timeZone,
    source: 'offline-coordinate-lookup',
    approximateBoundaryLookup: true,
  };
}

/** Return the civil UTC offset, including DST, for a specific instant and IANA timezone. */
export function utcOffsetMinutesAt(instant: Date, timeZone: string): number {
  assertIanaTimeZone(timeZone);
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Instant must be a valid date');
  }

  const parts = datePartsInTimeZone(instant, timeZone);
  const representedAsUtc = Date.UTC(
    requiredPart(parts, 'year'),
    requiredPart(parts, 'month') - 1,
    requiredPart(parts, 'day'),
    requiredPart(parts, 'hour'),
    requiredPart(parts, 'minute'),
    requiredPart(parts, 'second'),
  );
  const instantAtSecondPrecision = Math.floor(instant.getTime() / 1000) * 1000;
  return (representedAsUtc - instantAtSecondPrecision) / 60_000;
}

/** Return a Date whose UTC Y/M/D fields represent the local civil date in the selected timezone. */
export function civilDateInTimeZone(instant: Date, timeZone: string): Date {
  assertIanaTimeZone(timeZone);
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Instant must be a valid date');
  }

  const parts = datePartsInTimeZone(instant, timeZone);
  return new Date(
    Date.UTC(
      requiredPart(parts, 'year'),
      requiredPart(parts, 'month') - 1,
      requiredPart(parts, 'day'),
      0,
      0,
      0,
      0,
    ),
  );
}
