import { assertIanaTimeZone, utcOffsetMinutesAt } from './timezone';

export interface CivilTimeInput {
  readonly date: string;
  readonly localMinutes: number;
}

export interface ZonedInstantCandidate {
  readonly instant: Date;
  readonly offsetMinutes: number;
}

export type ZonedCivilTimeResolution =
  | {
      readonly status: 'exact';
      readonly candidate: ZonedInstantCandidate;
    }
  | {
      readonly status: 'ambiguous';
      readonly earlier: ZonedInstantCandidate;
      readonly later: ZonedInstantCandidate;
    }
  | {
      readonly status: 'nonexistent';
    };

function parseCivilDate(date: string): readonly [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) {
    throw new RangeError(`Invalid civil date: ${date}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  if (
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid civil date: ${date}`);
  }
  return [year, month, day];
}

function validateLocalMinutes(localMinutes: number): void {
  if (!Number.isInteger(localMinutes) || localMinutes < 0 || localMinutes >= 1_440) {
    throw new RangeError('Local minutes must be an integer from 0 through 1439');
  }
}

function localPartsAt(instant: Date, timeZone: string): readonly [number, number, number, number, number] {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
  return [parts.year ?? 0, parts.month ?? 0, parts.day ?? 0, parts.hour ?? 0, parts.minute ?? 0];
}

function sameCivilTime(
  instant: Date,
  timeZone: string,
  expected: readonly [number, number, number, number, number],
): boolean {
  const actual = localPartsAt(instant, timeZone);
  return actual.every((value, index) => value === expected[index]);
}

/**
 * Resolve a wall-clock civil time against IANA timezone rules without guessing through DST gaps.
 * Repeated wall-clock times return both candidates in chronological order; nonexistent times return no instant.
 */
export function resolveZonedCivilTime(
  input: CivilTimeInput,
  timeZone: string,
): ZonedCivilTimeResolution {
  assertIanaTimeZone(timeZone);
  validateLocalMinutes(input.localMinutes);
  const [year, month, day] = parseCivilDate(input.date);
  const hour = Math.floor(input.localMinutes / 60);
  const minute = input.localMinutes % 60;
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  const expected = [year, month, day, hour, minute] as const;

  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    offsets.add(utcOffsetMinutesAt(new Date(naiveUtc + hours * 3_600_000), timeZone));
  }

  const candidates = [...offsets]
    .map((offsetMinutes): ZonedInstantCandidate => ({
      instant: new Date(naiveUtc - offsetMinutes * 60_000),
      offsetMinutes,
    }))
    .filter((candidate) => sameCivilTime(candidate.instant, timeZone, expected))
    .sort((left, right) => left.instant.getTime() - right.instant.getTime());

  if (candidates.length === 0) {
    return { status: 'nonexistent' };
  }
  if (candidates.length === 1) {
    return { status: 'exact', candidate: candidates[0] };
  }
  return {
    status: 'ambiguous',
    earlier: candidates[0],
    later: candidates[candidates.length - 1],
  };
}
