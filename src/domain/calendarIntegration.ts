import type { MosqueEvent } from './mosqueEvent';

const ICALENDAR_PRODID = '-//privacyOG//SalahOS//EN';
const MAX_CONTENT_LINE_OCTETS = 75;

export interface MosqueCalendarOptions {
  readonly calendarName: string;
  readonly generatedAt: string;
}

function assertCalendarText(value: string, label: string, maxLength: number): string {
  const normalized = value.replace(/\r?\n/gu, '\n').trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1-${String(maxLength)} characters`);
  }
  return normalized;
}

function assertUtcTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/gu, '\\\\')
    .replace(/\r?\n/gu, '\\n')
    .replace(/,/gu, '\\,')
    .replace(/;/gu, '\\;');
}

function calendarTimestamp(value: string): string {
  return assertUtcTimestamp(value, 'Calendar timestamp')
    .replace(/[-:]/gu, '')
    .replace(/\.\d{3}Z$/u, 'Z');
}

function calendarDate(value: string): string {
  return assertUtcTimestamp(value, 'All-day calendar timestamp').slice(0, 10).replace(/-/gu, '');
}

function foldCalendarLine(line: string): string {
  const segments: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = MAX_CONTENT_LINE_OCTETS;

  for (const character of line) {
    const characterBytes = new TextEncoder().encode(character).length;
    if (characterBytes > limit) {
      throw new RangeError('Calendar content contains an unsupported oversized code point');
    }
    if (currentBytes + characterBytes > limit) {
      segments.push(current);
      current = character;
      currentBytes = characterBytes;
      limit = MAX_CONTENT_LINE_OCTETS - 1;
      continue;
    }
    current += character;
    currentBytes += characterBytes;
  }
  segments.push(current);
  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`)).join('\r\n');
}

function contentLine(name: string, value: string): string {
  return foldCalendarLine(`${name}:${value}`);
}

function normalizeCalendarUrl(value: string | null): string | null {
  if (value === null) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new RangeError('Calendar event URL must be valid');
  }
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new RangeError('Calendar event URL must be a credential-free HTTP(S) URL');
  }
  return parsed.toString();
}

function eventComponent(event: MosqueEvent, generatedAt: string): readonly string[] {
  const content = event.english ?? event.arabic;
  if (content === null) {
    throw new RangeError('Calendar event requires localized content');
  }

  const startsAt = assertUtcTimestamp(event.startsAt, 'Event startsAt');
  const endsAt = assertUtcTimestamp(event.endsAt, 'Event endsAt');
  if (endsAt <= startsAt) {
    throw new RangeError('Calendar event end must be later than start');
  }
  const url = normalizeCalendarUrl(event.registrationUrl);
  const lines = [
    'BEGIN:VEVENT',
    contentLine('UID', escapeCalendarText(`${event.eventId}.${event.mosqueId}@salahos`)),
    contentLine('DTSTAMP', calendarTimestamp(generatedAt)),
  ];

  if (event.allDay) {
    if (!startsAt.endsWith('T00:00:00.000Z') || !endsAt.endsWith('T00:00:00.000Z')) {
      throw new RangeError('All-day calendar events require UTC-midnight boundaries');
    }
    lines.push(
      contentLine('DTSTART;VALUE=DATE', calendarDate(startsAt)),
      contentLine('DTEND;VALUE=DATE', calendarDate(endsAt)),
    );
  } else {
    lines.push(
      contentLine('DTSTART', calendarTimestamp(startsAt)),
      contentLine('DTEND', calendarTimestamp(endsAt)),
    );
  }

  lines.push(
    contentLine('SUMMARY', escapeCalendarText(content.title)),
    contentLine('DESCRIPTION', escapeCalendarText(content.description)),
    contentLine('LOCATION', escapeCalendarText(event.venue)),
  );
  if (url !== null) lines.push(contentLine('URL', url));
  if (event.recurrence === 'daily') lines.push('RRULE:FREQ=DAILY');
  if (event.recurrence === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
  lines.push('END:VEVENT');
  return Object.freeze(lines);
}

export function mosqueEventsCalendar(
  events: readonly MosqueEvent[],
  options: MosqueCalendarOptions,
): string {
  if (events.length === 0) {
    throw new RangeError('Calendar export requires at least one mosque event');
  }
  const generatedAt = assertUtcTimestamp(options.generatedAt, 'Calendar generatedAt');
  const calendarName = assertCalendarText(options.calendarName, 'Calendar name', 200);
  const lines = [
    'BEGIN:VCALENDAR',
    contentLine('PRODID', ICALENDAR_PRODID),
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    contentLine('X-WR-CALNAME', escapeCalendarText(calendarName)),
  ];

  for (const event of events) {
    lines.push(...eventComponent(event, generatedAt));
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
