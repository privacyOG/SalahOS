export type AnnouncementLifecycleState =
  'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export type AnnouncementSurface = 'mobile' | 'web' | 'display';
export type AnnouncementPriority = 'normal' | 'priority';
export type AnnouncementRecurrence = 'none' | 'daily' | 'weekly';

export interface AnnouncementLocalizedContent {
  readonly title: string;
  readonly body: string;
}

export interface MosqueAnnouncementDraft {
  readonly announcementId: string;
  readonly mosqueId: string;
  readonly english: AnnouncementLocalizedContent | null;
  readonly arabic: AnnouncementLocalizedContent | null;
  readonly imageUrl: string | null;
  readonly callToActionUrl: string | null;
  readonly priority: AnnouncementPriority;
  readonly pinned: boolean;
  readonly surfaces: readonly AnnouncementSurface[];
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly recurrence: AnnouncementRecurrence;
  readonly archived: boolean;
}

export interface MosqueAnnouncement extends MosqueAnnouncementDraft {
  readonly english: AnnouncementLocalizedContent | null;
  readonly arabic: AnnouncementLocalizedContent | null;
  readonly surfaces: readonly AnnouncementSurface[];
}

export interface AnnouncementPreview {
  readonly announcement: MosqueAnnouncement;
  readonly state: AnnouncementLifecycleState;
  readonly warnings: readonly string[];
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

function normalizeOptionalTimestamp(value: string | null, label: string): string | null {
  return value === null ? null : assertIsoTimestamp(value, label);
}

function normalizeText(value: string, label: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1-${maxLength} characters`);
  }
  return normalized;
}

function normalizeLocalizedContent(
  value: AnnouncementLocalizedContent | null,
  label: string,
): AnnouncementLocalizedContent | null {
  if (value === null) return null;
  return Object.freeze({
    title: normalizeText(value.title, `${label} title`, 140),
    body: normalizeText(value.body, `${label} body`, 4000),
  });
}

function normalizeRemoteUrl(value: string | null, label: string): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(normalized);
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

function normalizeSurfaces(
  surfaces: readonly AnnouncementSurface[],
): readonly AnnouncementSurface[] {
  const allowed: readonly AnnouncementSurface[] = ['mobile', 'web', 'display'];
  const normalized = allowed.filter((surface) => surfaces.includes(surface));
  if (normalized.length === 0) {
    throw new RangeError('Announcement must target at least one surface');
  }
  return Object.freeze(normalized);
}

export function createMosqueAnnouncement(draft: MosqueAnnouncementDraft): MosqueAnnouncement {
  const english = normalizeLocalizedContent(draft.english, 'English');
  const arabic = normalizeLocalizedContent(draft.arabic, 'Arabic');
  if (english === null && arabic === null) {
    throw new RangeError('Announcement requires English or Arabic content');
  }

  const startsAt = normalizeOptionalTimestamp(draft.startsAt, 'Announcement startsAt');
  const endsAt = normalizeOptionalTimestamp(draft.endsAt, 'Announcement endsAt');
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) {
    throw new RangeError('Announcement end must be later than start');
  }

  return Object.freeze({
    announcementId: assertIdentifier(draft.announcementId, 'Announcement ID'),
    mosqueId: assertIdentifier(draft.mosqueId, 'Mosque ID'),
    english,
    arabic,
    imageUrl: normalizeRemoteUrl(draft.imageUrl, 'Announcement image URL'),
    callToActionUrl: normalizeRemoteUrl(draft.callToActionUrl, 'Announcement call-to-action URL'),
    priority: draft.priority,
    pinned: draft.pinned,
    surfaces: normalizeSurfaces(draft.surfaces),
    startsAt,
    endsAt,
    recurrence: draft.recurrence,
    archived: draft.archived,
  });
}

export function announcementLifecycleAt(
  announcement: MosqueAnnouncement,
  now: string,
): AnnouncementLifecycleState {
  if (announcement.archived) return 'archived';
  const current = assertIsoTimestamp(now, 'Current time');
  if (announcement.endsAt !== null && current >= announcement.endsAt) return 'expired';
  if (announcement.startsAt !== null && current < announcement.startsAt) return 'scheduled';
  if (announcement.startsAt === null) return 'draft';
  return 'published';
}

export function previewMosqueAnnouncement(
  draft: MosqueAnnouncementDraft,
  now: string,
): AnnouncementPreview {
  const announcement = createMosqueAnnouncement(draft);
  const warnings: string[] = [];
  if (announcement.english === null) warnings.push('English content is not supplied');
  if (announcement.arabic === null) warnings.push('Arabic content is not supplied');
  if (announcement.surfaces.includes('display') && announcement.imageUrl === null) {
    warnings.push('Display-targeted announcement has no image');
  }
  return Object.freeze({
    announcement,
    state: announcementLifecycleAt(announcement, now),
    warnings: Object.freeze(warnings),
  });
}
