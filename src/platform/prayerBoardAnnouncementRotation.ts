import {
  createPrayerBoardAnnouncementRotationConfig,
  defaultPrayerBoardAnnouncementRotationConfig,
  PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
  type PrayerBoardAnnouncementRotationConfig,
} from '../domain/prayerBoardAnnouncementRotation';
import type {
  PrayerScheduleKey,
  SignagePlaylist,
  SignageScheduleContext,
  SignageScheduleRule,
  Weekday,
} from '../domain/signagePlaylist';
import type { AnnouncementScene, SignageOfflineFallback } from '../domain/signageScene';
import type { KeyValueStorage } from './settingsStorage';

export const PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY =
  'salahos.prayerBoardAnnouncementRotation';
export const PRAYER_BOARD_ANNOUNCEMENT_ROTATION_CHANGE_EVENT =
  'salahos:prayer-board-announcement-rotation-change';

type JsonRecord = Record<string, unknown>;

const SCHEDULE_CONTEXTS: readonly SignageScheduleContext[] = ['all', 'normal', 'jumuah', 'ramadan'];
const PRAYER_KEYS: readonly PrayerScheduleKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
  'jumuah',
];
const OFFLINE_FALLBACKS: readonly SignageOfflineFallback[] = [
  'retain-last-good',
  'prayer-board',
  'hide-scene',
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  return value;
}

function requiredNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requiredString(value, label);
}

function stringEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new TypeError(`${label} contains an unsupported value`);
  }
  return value as T;
}

function parsePlaylist(value: unknown): SignagePlaylist | null {
  if (value === null) return null;
  if (!isRecord(value) || !Array.isArray(value.scenes)) {
    throw new TypeError('Announcement rotation playlist is invalid');
  }
  return {
    playlistId: requiredString(value.playlistId, 'Announcement playlist ID'),
    mosqueId: requiredString(value.mosqueId, 'Announcement playlist mosque ID'),
    title: requiredString(value.title, 'Announcement playlist title'),
    revision: requiredNumber(value.revision, 'Announcement playlist revision'),
    scenes: value.scenes.map((entry) => {
      if (!isRecord(entry)) throw new TypeError('Announcement playlist entry is invalid');
      return {
        sceneId: requiredString(entry.sceneId, 'Announcement scene ID'),
        dwellSeconds: requiredNumber(entry.dwellSeconds, 'Announcement dwell seconds'),
      };
    }),
  };
}

function parseWeekday(value: unknown): Weekday {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 6) {
    throw new TypeError('Announcement schedule weekday must be an integer from 0 through 6');
  }
  return value as Weekday;
}

function parseRule(value: unknown): SignageScheduleRule {
  if (!isRecord(value)) throw new TypeError('Announcement schedule rule is invalid');
  const base = {
    ruleId: requiredString(value.ruleId, 'Announcement schedule rule ID'),
    playlistId: requiredString(value.playlistId, 'Announcement schedule playlist ID'),
    priority: requiredNumber(value.priority, 'Announcement schedule priority'),
    context: stringEnum(value.context, SCHEDULE_CONTEXTS, 'Announcement schedule context'),
  };

  if (value.kind === 'time-window') {
    if (!Array.isArray(value.weekdays)) {
      throw new TypeError('Announcement time-window weekdays are invalid');
    }
    return {
      ...base,
      kind: 'time-window',
      startDate: nullableString(value.startDate, 'Announcement schedule start date'),
      endDate: nullableString(value.endDate, 'Announcement schedule end date'),
      weekdays: value.weekdays.map(parseWeekday),
      startsAt: requiredString(value.startsAt, 'Announcement schedule start clock'),
      endsAt: requiredString(value.endsAt, 'Announcement schedule end clock'),
    };
  }

  if (value.kind === 'prayer-relative') {
    return {
      ...base,
      kind: 'prayer-relative',
      prayer: stringEnum(value.prayer, PRAYER_KEYS, 'Announcement schedule prayer'),
      offsetMinutes: requiredNumber(value.offsetMinutes, 'Announcement prayer-relative offset'),
      durationMinutes: requiredNumber(
        value.durationMinutes,
        'Announcement prayer-relative duration',
      ),
    };
  }

  throw new TypeError('Announcement schedule rule kind is invalid');
}

function parseScene(value: unknown): AnnouncementScene {
  if (!isRecord(value) || value.kind !== 'announcement') {
    throw new TypeError('Announcement rotation scene is invalid');
  }
  return {
    sceneId: requiredString(value.sceneId, 'Announcement scene ID'),
    mosqueId: requiredString(value.mosqueId, 'Announcement scene mosque ID'),
    kind: 'announcement',
    title: requiredString(value.title, 'Announcement scene title'),
    offlineFallback: stringEnum(
      value.offlineFallback,
      OFFLINE_FALLBACKS,
      'Announcement offline fallback',
    ),
    announcementId: requiredString(value.announcementId, 'Announcement ID'),
  };
}

export function parsePrayerBoardAnnouncementRotationConfig(
  raw: string,
): PrayerBoardAnnouncementRotationConfig {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION) {
    throw new RangeError('Unsupported prayer-board announcement rotation schema version');
  }
  if (
    typeof value.enabled !== 'boolean' ||
    !Array.isArray(value.rules) ||
    !Array.isArray(value.scenes)
  ) {
    throw new TypeError('Prayer-board announcement rotation payload is invalid');
  }
  return createPrayerBoardAnnouncementRotationConfig({
    version: PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
    enabled: value.enabled,
    playlist: parsePlaylist(value.playlist),
    rules: value.rules.map(parseRule),
    scenes: value.scenes.map(parseScene),
  });
}

export function serializePrayerBoardAnnouncementRotationConfig(
  config: PrayerBoardAnnouncementRotationConfig,
): string {
  return JSON.stringify(createPrayerBoardAnnouncementRotationConfig(config));
}

export function loadPrayerBoardAnnouncementRotationConfig(
  storage: KeyValueStorage,
): PrayerBoardAnnouncementRotationConfig {
  const raw = storage.getItem(PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY);
  if (raw === null) return defaultPrayerBoardAnnouncementRotationConfig;
  try {
    return parsePrayerBoardAnnouncementRotationConfig(raw);
  } catch {
    return defaultPrayerBoardAnnouncementRotationConfig;
  }
}

export function savePrayerBoardAnnouncementRotationConfig(
  storage: KeyValueStorage,
  config: PrayerBoardAnnouncementRotationConfig,
): void {
  storage.setItem(
    PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY,
    serializePrayerBoardAnnouncementRotationConfig(config),
  );
}
