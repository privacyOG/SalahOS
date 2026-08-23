import {
  createPrayerBoardAnnouncementRotationConfig,
  defaultPrayerBoardAnnouncementRotationConfig,
  PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
  type PrayerBoardAnnouncementRotationConfig,
} from '../domain/prayerBoardAnnouncementRotation';
import type { AnnouncementScene } from '../domain/signageScene';
import type { SignagePlaylist, SignageScheduleRule } from '../domain/signagePlaylist';
import type { KeyValueStorage } from './settingsStorage';

export const PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY =
  'salahos.prayerBoardAnnouncementRotation';
export const PRAYER_BOARD_ANNOUNCEMENT_ROTATION_CHANGE_EVENT =
  'salahos:prayer-board-announcement-rotation-change';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePlaylist(value: unknown): SignagePlaylist | null {
  if (value === null) return null;
  if (!isRecord(value) || !Array.isArray(value.scenes)) {
    throw new TypeError('Announcement rotation playlist is invalid');
  }
  return {
    playlistId: String(value.playlistId ?? ''),
    mosqueId: String(value.mosqueId ?? ''),
    title: String(value.title ?? ''),
    revision: Number(value.revision),
    scenes: value.scenes.map((entry) => {
      if (!isRecord(entry)) throw new TypeError('Announcement playlist entry is invalid');
      return {
        sceneId: String(entry.sceneId ?? ''),
        dwellSeconds: Number(entry.dwellSeconds),
      };
    }),
  };
}

function parseRule(value: unknown): SignageScheduleRule {
  if (!isRecord(value)) throw new TypeError('Announcement schedule rule is invalid');
  const base = {
    ruleId: String(value.ruleId ?? ''),
    playlistId: String(value.playlistId ?? ''),
    priority: Number(value.priority),
    context: String(value.context ?? '') as SignageScheduleRule['context'],
  };
  if (value.kind === 'time-window') {
    if (!Array.isArray(value.weekdays)) {
      throw new TypeError('Announcement time-window weekdays are invalid');
    }
    return {
      ...base,
      kind: 'time-window',
      startDate: value.startDate === null ? null : String(value.startDate ?? ''),
      endDate: value.endDate === null ? null : String(value.endDate ?? ''),
      weekdays: value.weekdays.map(Number) as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
      startsAt: String(value.startsAt ?? ''),
      endsAt: String(value.endsAt ?? ''),
    };
  }
  if (value.kind === 'prayer-relative') {
    return {
      ...base,
      kind: 'prayer-relative',
      prayer: String(value.prayer ?? '') as SignageScheduleRule & never,
      offsetMinutes: Number(value.offsetMinutes),
      durationMinutes: Number(value.durationMinutes),
    } as SignageScheduleRule;
  }
  throw new TypeError('Announcement schedule rule kind is invalid');
}

function parseScene(value: unknown): AnnouncementScene {
  if (!isRecord(value) || value.kind !== 'announcement') {
    throw new TypeError('Announcement rotation scene is invalid');
  }
  return {
    sceneId: String(value.sceneId ?? ''),
    mosqueId: String(value.mosqueId ?? ''),
    kind: 'announcement',
    title: String(value.title ?? ''),
    offlineFallback: String(value.offlineFallback ?? '') as AnnouncementScene['offlineFallback'],
    announcementId: String(value.announcementId ?? ''),
  };
}

export function parsePrayerBoardAnnouncementRotationConfig(
  raw: string,
): PrayerBoardAnnouncementRotationConfig {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION) {
    throw new RangeError('Unsupported prayer-board announcement rotation schema version');
  }
  if (typeof value.enabled !== 'boolean' || !Array.isArray(value.rules) || !Array.isArray(value.scenes)) {
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
