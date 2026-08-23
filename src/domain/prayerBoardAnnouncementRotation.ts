import type { Locale } from '../i18n/translations';
import {
  announcementLifecycleAt,
  type MosqueAnnouncement,
} from './mosqueAnnouncement';
import type { PrayerBoardAnnouncement } from './prayerBoardTemplate';
import {
  createSignagePlaylist,
  createSignageScheduleRule,
  resolveSignageSchedule,
  type SignagePlaylist,
  type SignageScheduleEvaluationContext,
  type SignageScheduleRule,
} from './signagePlaylist';
import {
  createSignageScene,
  type AnnouncementScene,
} from './signageScene';
import type { SourcedPrayerDashboard } from './sourcedDashboard';

export const PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION = 1 as const;
export const PRAYER_BOARD_ANNOUNCEMENT_PRAYER_GUARD_SECONDS = 10 * 60;

export interface PrayerBoardAnnouncementRotationConfig {
  readonly version: 1;
  readonly enabled: boolean;
  readonly playlist: SignagePlaylist | null;
  readonly rules: readonly SignageScheduleRule[];
  readonly scenes: readonly AnnouncementScene[];
}

export type PrayerBoardAnnouncementSuppressionReason =
  | 'disabled'
  | 'module-hidden'
  | 'no-playlist'
  | 'schedule-inactive'
  | 'prayer-imminent'
  | 'athan-to-iqamah'
  | 'no-active-announcement'
  | null;

export interface PrayerBoardAnnouncementRotationResolution {
  readonly announcement: PrayerBoardAnnouncement | null;
  readonly sceneId: string | null;
  readonly playlistId: string | null;
  readonly suppressionReason: PrayerBoardAnnouncementSuppressionReason;
}

export const defaultPrayerBoardAnnouncementRotationConfig: PrayerBoardAnnouncementRotationConfig =
  Object.freeze({
    version: PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
    enabled: false,
    playlist: null,
    rules: Object.freeze([]),
    scenes: Object.freeze([]),
  });

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function announcementScene(scene: AnnouncementScene): AnnouncementScene {
  const normalized = createSignageScene(scene);
  if (normalized.kind !== 'announcement') {
    throw new TypeError('Prayer-board announcement rotation only accepts announcement scenes');
  }
  return normalized;
}

export function createPrayerBoardAnnouncementRotationConfig(
  input: PrayerBoardAnnouncementRotationConfig,
): PrayerBoardAnnouncementRotationConfig {
  if (input.version !== PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION) {
    throw new RangeError('Unsupported prayer-board announcement rotation version');
  }

  const playlist = input.playlist === null ? null : createSignagePlaylist(input.playlist);
  const rules = Object.freeze(input.rules.map(createSignageScheduleRule));
  const scenes = Object.freeze(input.scenes.map(announcementScene));

  if (!input.enabled) {
    return Object.freeze({
      version: PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
      enabled: false,
      playlist,
      rules,
      scenes,
    });
  }

  if (playlist === null) {
    throw new RangeError('Enabled announcement rotation requires a signage playlist');
  }
  if (rules.length === 0) {
    throw new RangeError('Enabled announcement rotation requires at least one signage schedule rule');
  }
  if (scenes.length === 0) {
    throw new RangeError('Enabled announcement rotation requires at least one announcement scene');
  }

  const sceneIds = new Set(scenes.map((scene) => scene.sceneId));
  for (const entry of playlist.scenes) {
    if (!sceneIds.has(entry.sceneId)) {
      throw new RangeError(`Playlist scene is not configured for announcement rotation: ${entry.sceneId}`);
    }
  }
  if (scenes.some((scene) => scene.mosqueId !== playlist.mosqueId)) {
    throw new RangeError('Announcement scenes and playlist must belong to the same mosque');
  }
  if (rules.some((rule) => rule.playlistId !== playlist.playlistId)) {
    throw new RangeError('Announcement schedule rules must target the configured playlist');
  }

  return Object.freeze({
    version: PRAYER_BOARD_ANNOUNCEMENT_ROTATION_VERSION,
    enabled: true,
    playlist,
    rules,
    scenes,
  });
}

function localizedContent(
  announcement: MosqueAnnouncement,
  locale: Locale,
): Readonly<{ title: string; body: string }> | null {
  if (locale === 'ar') return announcement.arabic ?? announcement.english;
  return announcement.english ?? announcement.arabic;
}

function toPrayerBoardAnnouncement(
  announcement: MosqueAnnouncement,
  locale: Locale,
): PrayerBoardAnnouncement | null {
  const content = localizedContent(announcement, locale);
  if (content === null) return null;
  return Object.freeze({
    id: announcement.announcementId,
    title: content.title,
    body: content.body,
    expiresAtIso: announcement.endsAt,
  });
}

function prayerSuppressionReason(
  dashboard: SourcedPrayerDashboard,
): PrayerBoardAnnouncementSuppressionReason {
  const secondsUntilNext = dashboard.secondsUntilNextPrayer;
  if (
    secondsUntilNext !== null &&
    secondsUntilNext >= 0 &&
    secondsUntilNext <= PRAYER_BOARD_ANNOUNCEMENT_PRAYER_GUARD_SECONDS
  ) {
    return 'prayer-imminent';
  }

  const nowMinutes = dashboard.base.clock.localMinutes;
  for (const prayer of dashboard.prayers) {
    if (
      prayer.name === 'sunrise' ||
      prayer.localMinutes === null ||
      prayer.iqamahLocalMinutes === null
    ) {
      continue;
    }
    if (
      prayer.iqamahLocalMinutes >= prayer.localMinutes &&
      nowMinutes >= prayer.localMinutes &&
      nowMinutes <= prayer.iqamahLocalMinutes
    ) {
      return 'athan-to-iqamah';
    }
  }
  return null;
}

function activeAnnouncementsByScene(
  config: PrayerBoardAnnouncementRotationConfig,
  announcements: readonly MosqueAnnouncement[],
  locale: Locale,
  nowIso: string,
): ReadonlyMap<string, PrayerBoardAnnouncement> {
  if (config.playlist === null) return new Map();
  const announcementById = new Map(
    announcements
      .filter(
        (announcement) =>
          announcement.mosqueId === config.playlist?.mosqueId &&
          announcement.surfaces.includes('display') &&
          announcementLifecycleAt(announcement, nowIso) === 'published',
      )
      .map((announcement) => [announcement.announcementId, announcement] as const),
  );
  const result = new Map<string, PrayerBoardAnnouncement>();
  for (const scene of config.scenes) {
    const announcement = announcementById.get(scene.announcementId);
    if (announcement === undefined) continue;
    const projected = toPrayerBoardAnnouncement(announcement, locale);
    if (projected !== null) result.set(scene.sceneId, projected);
  }
  return result;
}

function selectByAbsoluteDwell(
  playlist: SignagePlaylist,
  available: ReadonlyMap<string, PrayerBoardAnnouncement>,
  nowMs: number,
): Readonly<{ sceneId: string; announcement: PrayerBoardAnnouncement }> | null {
  const entries = playlist.scenes.filter((entry) => available.has(entry.sceneId));
  if (entries.length === 0) return null;
  const totalSeconds = entries.reduce((total, entry) => total + entry.dwellSeconds, 0);
  const elapsedSeconds = Math.floor(nowMs / 1000);
  let position = ((elapsedSeconds % totalSeconds) + totalSeconds) % totalSeconds;
  for (const entry of entries) {
    if (position < entry.dwellSeconds) {
      const announcement = available.get(entry.sceneId);
      if (announcement === undefined) return null;
      return Object.freeze({ sceneId: entry.sceneId, announcement });
    }
    position -= entry.dwellSeconds;
  }
  return null;
}

export function resolvePrayerBoardAnnouncementRotation(input: Readonly<{
  config: PrayerBoardAnnouncementRotationConfig;
  announcements: readonly MosqueAnnouncement[];
  locale: Locale;
  moduleVisible: boolean;
  dashboard: SourcedPrayerDashboard;
  scheduleContext: SignageScheduleEvaluationContext;
  nowIso: string;
}>): PrayerBoardAnnouncementRotationResolution {
  const nowIso = assertIsoTimestamp(input.nowIso, 'Announcement rotation time');
  const normalized = createPrayerBoardAnnouncementRotationConfig(input.config);

  if (!input.moduleVisible) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: normalized.playlist?.playlistId ?? null,
      suppressionReason: 'module-hidden',
    });
  }
  if (!normalized.enabled) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: normalized.playlist?.playlistId ?? null,
      suppressionReason: 'disabled',
    });
  }
  if (normalized.playlist === null) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: null,
      suppressionReason: 'no-playlist',
    });
  }

  const prayerReason = prayerSuppressionReason(input.dashboard);
  if (prayerReason !== null) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: normalized.playlist.playlistId,
      suppressionReason: prayerReason,
    });
  }

  const schedule = resolveSignageSchedule(normalized.rules, input.scheduleContext);
  if (schedule.winner?.playlistId !== normalized.playlist.playlistId) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: normalized.playlist.playlistId,
      suppressionReason: 'schedule-inactive',
    });
  }

  const available = activeAnnouncementsByScene(
    normalized,
    input.announcements,
    input.locale,
    nowIso,
  );
  const selected = selectByAbsoluteDwell(normalized.playlist, available, Date.parse(nowIso));
  if (selected === null) {
    return Object.freeze({
      announcement: null,
      sceneId: null,
      playlistId: normalized.playlist.playlistId,
      suppressionReason: 'no-active-announcement',
    });
  }

  return Object.freeze({
    announcement: selected.announcement,
    sceneId: selected.sceneId,
    playlistId: normalized.playlist.playlistId,
    suppressionReason: null,
  });
}

export function buildPrayerBoardAnnouncementScheduleContext(
  dashboard: SourcedPrayerDashboard,
): SignageScheduleEvaluationContext {
  const civilDate = dashboard.base.civilDate.toISOString().slice(0, 10);
  const clock = dashboard.base.clock;
  const localClock = `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
  const prayerTimes: Partial<Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jumuah', string>> = {};
  for (const prayer of dashboard.prayers) {
    if (prayer.name === 'sunrise' || prayer.localMinutes === null) continue;
    const hours = Math.floor(prayer.localMinutes / 60);
    const minutes = prayer.localMinutes % 60;
    prayerTimes[prayer.name] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const firstJumuah = dashboard.jumuahSessions[0];
  if (firstJumuah !== undefined) prayerTimes.jumuah = firstJumuah.time;

  const isRamadan = dashboard.base.hijri.month === 9;
  const isFriday = dashboard.base.civilDate.getUTCDay() === 5;

  return Object.freeze({
    localDate: civilDate,
    weekday: dashboard.base.civilDate.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    localClock,
    context: isRamadan ? 'ramadan' : isFriday ? 'jumuah' : 'normal',
    prayerTimes: Object.freeze(prayerTimes),
  });
}
