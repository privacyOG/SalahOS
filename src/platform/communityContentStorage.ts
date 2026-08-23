import {
  createMosqueAnnouncement,
  type AnnouncementLocalizedContent,
  type AnnouncementPriority,
  type AnnouncementRecurrence,
  type AnnouncementSurface,
  type MosqueAnnouncement,
} from '../domain/mosqueAnnouncement';
import {
  createMosqueEvent,
  type EventLocalizedContent,
  type MosqueEvent,
  type MosqueEventRecurrence,
  type MosqueEventSurface,
} from '../domain/mosqueEvent';
import type { KeyValueStorage } from './settingsStorage';

export const COMMUNITY_CONTENT_STORAGE_KEY = 'salahos.communityContent';
export const COMMUNITY_CONTENT_SCHEMA_VERSION = 1;
export const COMMUNITY_CONTENT_CHANGE_EVENT = 'salahos:community-content-change';

export interface CommunityContentLibrary {
  readonly announcements: readonly MosqueAnnouncement[];
  readonly events: readonly MosqueEvent[];
}

interface CommunityContentEnvelope {
  readonly version: 1;
  readonly announcements: readonly MosqueAnnouncement[];
  readonly events: readonly MosqueEvent[];
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: JsonRecord, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  return value;
}

function nullableString(record: JsonRecord, key: string, label: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string or null`);
  return value;
}

function requiredBoolean(record: JsonRecord, key: string, label: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean`);
  return value;
}

function localizedAnnouncement(value: unknown, label: string): AnnouncementLocalizedContent | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new TypeError(`${label} must be an object or null`);
  return {
    title: requiredString(value, 'title', `${label} title`),
    body: requiredString(value, 'body', `${label} body`),
  };
}

function localizedEvent(value: unknown, label: string): EventLocalizedContent | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new TypeError(`${label} must be an object or null`);
  return {
    title: requiredString(value, 'title', `${label} title`),
    description: requiredString(value, 'description', `${label} description`),
  };
}

function stringEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new TypeError(`${label} contains an unsupported value`);
  }
  return value as T;
}

function stringEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): readonly T[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value.map((entry) => stringEnum(entry, allowed, label));
}

function parseAnnouncement(value: unknown): MosqueAnnouncement {
  if (!isRecord(value)) throw new TypeError('Announcement must be an object');
  return createMosqueAnnouncement({
    announcementId: requiredString(value, 'announcementId', 'Announcement ID'),
    mosqueId: requiredString(value, 'mosqueId', 'Announcement mosque ID'),
    english: localizedAnnouncement(value.english, 'Announcement English content'),
    arabic: localizedAnnouncement(value.arabic, 'Announcement Arabic content'),
    imageUrl: nullableString(value, 'imageUrl', 'Announcement image URL'),
    callToActionUrl: nullableString(value, 'callToActionUrl', 'Announcement call-to-action URL'),
    priority: stringEnum<AnnouncementPriority>(
      value.priority,
      ['normal', 'priority'],
      'Announcement priority',
    ),
    pinned: requiredBoolean(value, 'pinned', 'Announcement pinned'),
    surfaces: stringEnumArray<AnnouncementSurface>(
      value.surfaces,
      ['mobile', 'web', 'display'],
      'Announcement surfaces',
    ),
    startsAt: nullableString(value, 'startsAt', 'Announcement startsAt'),
    endsAt: nullableString(value, 'endsAt', 'Announcement endsAt'),
    recurrence: stringEnum<AnnouncementRecurrence>(
      value.recurrence,
      ['none', 'daily', 'weekly'],
      'Announcement recurrence',
    ),
    archived: requiredBoolean(value, 'archived', 'Announcement archived'),
  });
}

function parseEvent(value: unknown): MosqueEvent {
  if (!isRecord(value)) throw new TypeError('Event must be an object');
  return createMosqueEvent({
    eventId: requiredString(value, 'eventId', 'Event ID'),
    mosqueId: requiredString(value, 'mosqueId', 'Event mosque ID'),
    english: localizedEvent(value.english, 'Event English content'),
    arabic: localizedEvent(value.arabic, 'Event Arabic content'),
    venue: requiredString(value, 'venue', 'Event venue'),
    allDay: requiredBoolean(value, 'allDay', 'Event allDay'),
    startsAt: requiredString(value, 'startsAt', 'Event startsAt'),
    endsAt: requiredString(value, 'endsAt', 'Event endsAt'),
    recurrence: stringEnum<MosqueEventRecurrence>(
      value.recurrence,
      ['none', 'daily', 'weekly'],
      'Event recurrence',
    ),
    imageUrl: nullableString(value, 'imageUrl', 'Event image URL'),
    registrationUrl: nullableString(value, 'registrationUrl', 'Event registration URL'),
    surfaces: stringEnumArray<MosqueEventSurface>(
      value.surfaces,
      ['mobile', 'web', 'display'],
      'Event surfaces',
    ),
  });
}

function assertUniqueIds(library: CommunityContentLibrary): void {
  const announcementIds = new Set<string>();
  for (const announcement of library.announcements) {
    const key = `${announcement.mosqueId}:${announcement.announcementId}`;
    if (announcementIds.has(key)) throw new RangeError(`Duplicate announcement: ${key}`);
    announcementIds.add(key);
  }

  const eventIds = new Set<string>();
  for (const event of library.events) {
    const key = `${event.mosqueId}:${event.eventId}`;
    if (eventIds.has(key)) throw new RangeError(`Duplicate event: ${key}`);
    eventIds.add(key);
  }
}

export function parseCommunityContentLibrary(raw: string): CommunityContentLibrary {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== COMMUNITY_CONTENT_SCHEMA_VERSION) {
    throw new RangeError('Unsupported community-content schema version');
  }
  if (!Array.isArray(value.announcements) || !Array.isArray(value.events)) {
    throw new TypeError('Community content must contain announcement and event arrays');
  }

  const library: CommunityContentLibrary = Object.freeze({
    announcements: Object.freeze(value.announcements.map(parseAnnouncement)),
    events: Object.freeze(value.events.map(parseEvent)),
  });
  assertUniqueIds(library);
  return library;
}

export function serializeCommunityContentLibrary(library: CommunityContentLibrary): string {
  const normalized: CommunityContentLibrary = {
    announcements: library.announcements.map((announcement) =>
      parseAnnouncement(JSON.parse(JSON.stringify(announcement)) as unknown),
    ),
    events: library.events.map((event) => parseEvent(JSON.parse(JSON.stringify(event)) as unknown)),
  };
  assertUniqueIds(normalized);
  const envelope: CommunityContentEnvelope = {
    version: COMMUNITY_CONTENT_SCHEMA_VERSION,
    announcements: normalized.announcements,
    events: normalized.events,
  };
  return JSON.stringify(envelope, null, 2);
}

export function loadCommunityContentLibrary(storage: KeyValueStorage): CommunityContentLibrary {
  const raw = storage.getItem(COMMUNITY_CONTENT_STORAGE_KEY);
  if (raw === null)
    return Object.freeze({ announcements: Object.freeze([]), events: Object.freeze([]) });
  try {
    return parseCommunityContentLibrary(raw);
  } catch {
    return Object.freeze({ announcements: Object.freeze([]), events: Object.freeze([]) });
  }
}

export function saveCommunityContentLibrary(
  storage: KeyValueStorage,
  library: CommunityContentLibrary,
): void {
  storage.setItem(COMMUNITY_CONTENT_STORAGE_KEY, serializeCommunityContentLibrary(library));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COMMUNITY_CONTENT_CHANGE_EVENT));
  }
}
