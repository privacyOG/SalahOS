import { describe, expect, it } from 'vitest';

import { createMosqueAnnouncement } from './mosqueAnnouncement';
import { createMosqueEvent } from './mosqueEvent';
import { buildCommunityFeed } from './communityFeed';

const published = createMosqueAnnouncement({
  announcementId: 'weekly-update',
  mosqueId: 'masjid-al-noor:sydney',
  english: { title: 'Weekly update', body: 'Community news for this week.' },
  arabic: { title: 'تحديث أسبوعي', body: 'أخبار المجتمع لهذا الأسبوع.' },
  imageUrl: null,
  callToActionUrl: 'https://example.org/update',
  priority: 'normal',
  pinned: false,
  surfaces: ['mobile', 'web'],
  startsAt: '2026-08-19T00:00:00.000Z',
  endsAt: '2026-08-25T00:00:00.000Z',
  recurrence: 'none',
  archived: false,
});

const pinned = createMosqueAnnouncement({
  announcementId: 'service-change',
  mosqueId: 'masjid-al-noor:sydney',
  english: { title: 'Service change', body: 'Please use the side entrance tonight.' },
  arabic: null,
  imageUrl: null,
  callToActionUrl: null,
  priority: 'priority',
  pinned: true,
  surfaces: ['mobile'],
  startsAt: '2026-08-19T00:00:00.000Z',
  endsAt: null,
  recurrence: 'none',
  archived: false,
});

const upcomingEvent = createMosqueEvent({
  eventId: 'family-evening',
  mosqueId: 'masjid-al-noor:sydney',
  english: { title: 'Family evening', description: 'Community dinner and programme.' },
  arabic: null,
  venue: 'Community hall',
  allDay: false,
  startsAt: '2026-08-21T08:00:00.000Z',
  endsAt: '2026-08-21T10:00:00.000Z',
  recurrence: 'none',
  imageUrl: null,
  registrationUrl: 'https://example.org/events/family-evening',
  surfaces: ['mobile', 'display'],
});

describe('community feed selector', () => {
  it('returns published mobile announcements and upcoming mobile events', () => {
    const feed = buildCommunityFeed({
      announcements: [published, pinned],
      events: [upcomingEvent],
      now: '2026-08-20T00:00:00.000Z',
      locale: 'en',
      surface: 'mobile',
      mosqueId: 'masjid-al-noor:sydney',
    });

    expect(feed.announcements.map((item) => item.id)).toEqual(['service-change', 'weekly-update']);
    expect(feed.events).toHaveLength(1);
    expect(feed.events[0]?.title).toBe('Family evening');
  });

  it('uses Arabic content when available and falls back without inventing a translation', () => {
    const feed = buildCommunityFeed({
      announcements: [published, pinned],
      events: [upcomingEvent],
      now: '2026-08-20T00:00:00.000Z',
      locale: 'ar',
      surface: 'mobile',
    });

    expect(feed.announcements.find((item) => item.id === 'weekly-update')).toMatchObject({
      title: 'تحديث أسبوعي',
      direction: 'rtl',
    });
    expect(feed.announcements.find((item) => item.id === 'service-change')).toMatchObject({
      title: 'Service change',
      direction: 'ltr',
    });
    expect(feed.events[0]).toMatchObject({ title: 'Family evening', direction: 'ltr' });
  });

  it('filters non-targeted, non-published, ended and other-mosque content', () => {
    const scheduled = createMosqueAnnouncement({
      ...published,
      announcementId: 'scheduled',
      startsAt: '2026-08-22T00:00:00.000Z',
    });
    const displayOnly = createMosqueAnnouncement({
      ...published,
      announcementId: 'display-only',
      surfaces: ['display'],
    });
    const otherMosque = createMosqueAnnouncement({
      ...published,
      announcementId: 'other-mosque',
      mosqueId: 'masjid-al-falah:sydney',
    });
    const ended = createMosqueEvent({
      ...upcomingEvent,
      eventId: 'ended',
      startsAt: '2026-08-18T08:00:00.000Z',
      endsAt: '2026-08-18T10:00:00.000Z',
    });

    const feed = buildCommunityFeed({
      announcements: [scheduled, displayOnly, otherMosque],
      events: [ended],
      now: '2026-08-20T00:00:00.000Z',
      locale: 'en',
      surface: 'mobile',
      mosqueId: 'masjid-al-noor:sydney',
    });

    expect(feed.announcements).toEqual([]);
    expect(feed.events).toEqual([]);
  });
});
