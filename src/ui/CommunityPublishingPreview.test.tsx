import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createMosqueAnnouncement } from '../domain/mosqueAnnouncement';
import { createMosqueEvent } from '../domain/mosqueEvent';
import { CommunityPublishingPreview } from './CommunityPublishingPreview';

describe('community publishing preview', () => {
  it('renders a targeted Arabic phone announcement preview', () => {
    const announcement = createMosqueAnnouncement({
      announcementId: 'community-update',
      mosqueId: 'masjid-al-noor:sydney',
      english: { title: 'Community update', body: 'English body' },
      arabic: { title: 'إعلان المجتمع', body: 'محتوى الإعلان' },
      imageUrl: 'https://example.org/announcement.jpg',
      callToActionUrl: 'https://example.org/more',
      priority: 'priority',
      pinned: true,
      surfaces: ['mobile', 'web'],
      startsAt: '2026-08-19T06:00:00.000Z',
      endsAt: null,
      recurrence: 'weekly',
      archived: false,
    });

    const markup = renderToStaticMarkup(
      <CommunityPublishingPreview
        kind="announcement"
        announcement={announcement}
        surface="phone"
        locale="ar"
      />,
    );

    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('data-targeted="true"');
    expect(markup).toContain('إعلان المجتمع');
    expect(markup).toContain('href="https://example.org/more"');
    expect(markup).not.toContain('role="status"');
  });

  it('warns when an announcement is not targeted to the selected TV surface', () => {
    const announcement = createMosqueAnnouncement({
      announcementId: 'mobile-only',
      mosqueId: 'masjid-al-noor:sydney',
      english: { title: 'Mobile only', body: 'Mobile announcement' },
      arabic: null,
      imageUrl: null,
      callToActionUrl: null,
      priority: 'normal',
      pinned: false,
      surfaces: ['mobile'],
      startsAt: null,
      endsAt: null,
      recurrence: 'none',
      archived: false,
    });

    const markup = renderToStaticMarkup(
      <CommunityPublishingPreview
        kind="announcement"
        announcement={announcement}
        surface="tv"
        locale="en"
      />,
    );

    expect(markup).toContain('data-targeted="false"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('This announcement is not targeted to this surface.');
  });

  it('renders event metadata and registration on the web surface', () => {
    const event = createMosqueEvent({
      eventId: 'community-iftar',
      mosqueId: 'masjid-al-noor:sydney',
      english: { title: 'Community Iftar', description: 'Join after Maghrib.' },
      arabic: null,
      venue: 'Main prayer hall',
      allDay: false,
      startsAt: '2026-08-20T08:00:00.000Z',
      endsAt: '2026-08-20T10:00:00.000Z',
      recurrence: 'none',
      imageUrl: null,
      registrationUrl: 'https://example.org/register',
      surfaces: ['web', 'display'],
    });

    const markup = renderToStaticMarkup(
      <CommunityPublishingPreview kind="event" event={event} surface="web" locale="en" />,
    );

    expect(markup).toContain('Community Iftar');
    expect(markup).toContain('Main prayer hall');
    expect(markup).toContain('2026-08-20T08:00:00.000Z');
    expect(markup).toContain('href="https://example.org/register"');
  });
});
