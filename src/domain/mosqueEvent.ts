export type MosqueEventSurface = 'mobile' | 'web' | 'display';
export type MosqueEventRecurrence = 'none' | 'daily' | 'weekly';

export interface EventLocalizedContent {
  readonly title: string;
  readonly description: string;
}

export interface MosqueEventDraft {
  readonly eventId: string;
  readonly mosqueId: string;
  readonly english: EventLocalizedContent | null;
  readonly arabic: EventLocalizedContent | null;
  readonly venue: string;
  readonly allDay: boolean;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly recurrence: MosqueEventRecurrence;
  readonly imageUrl: string | null;
  readonly registrationUrl: string | null;
  readonly surfaces: readonly MosqueEventSurface[];
}

export interface MosqueEvent extends MosqueEventDraft {
  readonly english: EventLocalizedContent | null;
  readonly arabic: EventLocalizedContent | null;
  readonly surfaces: readonly MosqueEventSurface[];
}

function assertIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeText(value: string, label: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1-${String(maxLength)} characters`);
  }
  return normalized;
}

function normalizeLocalizedContent(
  value: EventLocalizedContent | null,
  label: string,
): EventLocalizedContent | null {
  if (value === null) return null;
  return Object.freeze({
    title: normalizeText(value.title, `${label} title`, 140),
    description: normalizeText(value.description, `${label} description`, 6000),
  });
}

function normalizeRemoteUrl(value: string | null, label: string): string | null {
  if (value === null) return null;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new RangeError(`${label} must be a valid HTTP(S) URL`);
  }
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    parsed.username ||
    parsed.password
  ) {
    throw new RangeError(`${label} must be a credential-free HTTP(S) URL`);
  }
  return parsed.toString();
}

function normalizeSurfaces(surfaces: readonly MosqueEventSurface[]): readonly MosqueEventSurface[] {
  const allowed: readonly MosqueEventSurface[] = ['mobile', 'web', 'display'];
  const normalized = allowed.filter((surface) => surfaces.includes(surface));
  if (normalized.length === 0) {
    throw new RangeError('Event must target at least one surface');
  }
  return Object.freeze(normalized);
}

export function createMosqueEvent(draft: MosqueEventDraft): MosqueEvent {
  const english = normalizeLocalizedContent(draft.english, 'English');
  const arabic = normalizeLocalizedContent(draft.arabic, 'Arabic');
  if (english === null && arabic === null) {
    throw new RangeError('Event requires English or Arabic content');
  }

  const startsAt = assertIsoTimestamp(draft.startsAt, 'Event startsAt');
  const endsAt = assertIsoTimestamp(draft.endsAt, 'Event endsAt');
  if (endsAt <= startsAt) {
    throw new RangeError('Event end must be later than start');
  }

  if (draft.allDay) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const startsAtUtcMidnight = start.getUTCHours() === 0 && start.getUTCMinutes() === 0;
    const endsAtUtcMidnight = end.getUTCHours() === 0 && end.getUTCMinutes() === 0;
    if (!startsAtUtcMidnight || !endsAtUtcMidnight) {
      throw new RangeError('All-day events must use UTC-midnight boundaries');
    }
  }

  return Object.freeze({
    eventId: assertIdentifier(draft.eventId, 'Event ID'),
    mosqueId: assertIdentifier(draft.mosqueId, 'Mosque ID'),
    english,
    arabic,
    venue: normalizeText(draft.venue, 'Event venue', 300),
    allDay: draft.allDay,
    startsAt,
    endsAt,
    recurrence: draft.recurrence,
    imageUrl: normalizeRemoteUrl(draft.imageUrl, 'Event image URL'),
    registrationUrl: normalizeRemoteUrl(draft.registrationUrl, 'Event registration URL'),
    surfaces: normalizeSurfaces(draft.surfaces),
  });
}

export function upcomingMosqueEvents(
  events: readonly MosqueEvent[],
  now: string,
): readonly MosqueEvent[] {
  const current = assertIsoTimestamp(now, 'Current time');
  return Object.freeze(
    events
      .filter((event) => event.endsAt > current)
      .slice()
      .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
  );
}

function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/gu, '\\\\')
    .replace(/\r?\n/gu, '\\n')
    .replace(/,/gu, '\\,')
    .replace(/;/gu, '\\;');
}

function calendarTimestamp(value: string): string {
  return value.replace(/[-:]/gu, '').replace(/\.\d{3}Z$/u, 'Z');
}

export function mosqueEventCalendarEntry(event: MosqueEvent): string {
  const content = event.english ?? event.arabic;
  if (content === null) {
    throw new RangeError('Calendar event requires localized content');
  }

  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeCalendarText(`${event.eventId}@salahos`)}`,
    `DTSTART:${calendarTimestamp(event.startsAt)}`,
    `DTEND:${calendarTimestamp(event.endsAt)}`,
    `SUMMARY:${escapeCalendarText(content.title)}`,
    `DESCRIPTION:${escapeCalendarText(content.description)}`,
    `LOCATION:${escapeCalendarText(event.venue)}`,
  ];
  if (event.registrationUrl !== null) lines.push(`URL:${event.registrationUrl}`);
  if (event.recurrence === 'daily') lines.push('RRULE:FREQ=DAILY');
  if (event.recurrence === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
  lines.push('END:VEVENT');
  return `${lines.join('\r\n')}\r\n`;
}
