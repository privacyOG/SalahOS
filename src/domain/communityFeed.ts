import { announcementLifecycleAt, type MosqueAnnouncement } from './mosqueAnnouncement';
import { upcomingMosqueEvents, type MosqueEvent } from './mosqueEvent';

export type CommunityFeedLocale = 'en' | 'ar';
export type CommunityFeedSurface = 'mobile' | 'web' | 'display';

export interface CommunityAnnouncementFeedItem {
  readonly kind: 'announcement';
  readonly id: string;
  readonly mosqueId: string;
  readonly title: string;
  readonly body: string;
  readonly direction: 'ltr' | 'rtl';
  readonly pinned: boolean;
  readonly priority: 'normal' | 'priority';
  readonly imageUrl: string | null;
  readonly callToActionUrl: string | null;
}

export interface CommunityEventFeedItem {
  readonly kind: 'event';
  readonly id: string;
  readonly mosqueId: string;
  readonly title: string;
  readonly description: string;
  readonly direction: 'ltr' | 'rtl';
  readonly venue: string;
  readonly allDay: boolean;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly imageUrl: string | null;
  readonly registrationUrl: string | null;
}

export interface CommunityFeed {
  readonly announcements: readonly CommunityAnnouncementFeedItem[];
  readonly events: readonly CommunityEventFeedItem[];
}

export interface CommunityFeedInput {
  readonly announcements: readonly MosqueAnnouncement[];
  readonly events: readonly MosqueEvent[];
  readonly now: string;
  readonly locale: CommunityFeedLocale;
  readonly surface: CommunityFeedSurface;
  readonly mosqueId?: string | null;
}

function announcementTargets(
  announcement: MosqueAnnouncement,
  surface: CommunityFeedSurface,
): boolean {
  return announcement.surfaces.includes(surface);
}

function eventTargets(event: MosqueEvent, surface: CommunityFeedSurface): boolean {
  return event.surfaces.includes(surface);
}

function mosqueMatches(itemMosqueId: string, mosqueId: string | null | undefined): boolean {
  return mosqueId === null || mosqueId === undefined || itemMosqueId === mosqueId;
}

function announcementContent(announcement: MosqueAnnouncement, locale: CommunityFeedLocale) {
  if (locale === 'ar') {
    return announcement.arabic === null
      ? announcement.english === null
        ? null
        : { ...announcement.english, direction: 'ltr' as const }
      : { ...announcement.arabic, direction: 'rtl' as const };
  }
  return announcement.english === null
    ? announcement.arabic === null
      ? null
      : { ...announcement.arabic, direction: 'rtl' as const }
    : { ...announcement.english, direction: 'ltr' as const };
}

function eventContent(event: MosqueEvent, locale: CommunityFeedLocale) {
  if (locale === 'ar') {
    return event.arabic === null
      ? event.english === null
        ? null
        : { ...event.english, direction: 'ltr' as const }
      : { ...event.arabic, direction: 'rtl' as const };
  }
  return event.english === null
    ? event.arabic === null
      ? null
      : { ...event.arabic, direction: 'rtl' as const }
    : { ...event.english, direction: 'ltr' as const };
}

export function buildCommunityFeed(input: CommunityFeedInput): CommunityFeed {
  const announcements = input.announcements
    .filter(
      (announcement) =>
        mosqueMatches(announcement.mosqueId, input.mosqueId) &&
        announcementTargets(announcement, input.surface) &&
        announcementLifecycleAt(announcement, input.now) === 'published',
    )
    .map((announcement) => {
      const content = announcementContent(announcement, input.locale);
      if (content === null) return null;
      return Object.freeze<CommunityAnnouncementFeedItem>({
        kind: 'announcement',
        id: announcement.announcementId,
        mosqueId: announcement.mosqueId,
        title: content.title,
        body: content.body,
        direction: content.direction,
        pinned: announcement.pinned,
        priority: announcement.priority,
        imageUrl: announcement.imageUrl,
        callToActionUrl: announcement.callToActionUrl,
      });
    })
    .filter((item): item is CommunityAnnouncementFeedItem => item !== null)
    .sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
      if (left.priority !== right.priority) return left.priority === 'priority' ? -1 : 1;
      return left.id.localeCompare(right.id);
    });

  const events = upcomingMosqueEvents(input.events, input.now)
    .filter(
      (event) =>
        mosqueMatches(event.mosqueId, input.mosqueId) && eventTargets(event, input.surface),
    )
    .map((event) => {
      const content = eventContent(event, input.locale);
      if (content === null) return null;
      return Object.freeze<CommunityEventFeedItem>({
        kind: 'event',
        id: event.eventId,
        mosqueId: event.mosqueId,
        title: content.title,
        description: content.description,
        direction: content.direction,
        venue: event.venue,
        allDay: event.allDay,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        imageUrl: event.imageUrl,
        registrationUrl: event.registrationUrl,
      });
    })
    .filter((item): item is CommunityEventFeedItem => item !== null);

  return Object.freeze({
    announcements: Object.freeze(announcements),
    events: Object.freeze(events),
  });
}
