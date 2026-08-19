import { describe, expect, it } from 'vitest';
import {
  announcementLifecycleAt,
  createMosqueAnnouncement,
  previewMosqueAnnouncement,
  type MosqueAnnouncementDraft,
} from './mosqueAnnouncement';

const baseDraft: MosqueAnnouncementDraft = {
  announcementId: 'announcement-001',
  mosqueId: 'masjid-al-noor:sydney',
  english: {
    title: 'Community dinner',
    body: 'Join us after Maghrib for a community dinner.',
  },
  arabic: {
    title: 'عشاء جماعي',
    body: 'انضموا إلينا بعد صلاة المغرب للعشاء الجماعي.',
  },
  imageUrl: 'https://example.org/community-dinner.jpg',
  callToActionUrl: 'https://example.org/events/community-dinner',
  priority: 'normal',
  pinned: false,
  surfaces: ['mobile', 'web', 'display'],
  startsAt: '2026-08-20T08:00:00.000Z',
  endsAt: '2026-08-22T08:00:00.000Z',
  recurrence: 'none',
  archived: false,
};

describe('managed mosque announcements', () => {
  it('normalizes bilingual content and deterministic surface ordering', () => {
    const announcement = createMosqueAnnouncement({
      ...baseDraft,
      english: {
        title: '  Community   dinner ',
        body: ' Join us   after Maghrib. ',
      },
      surfaces: ['display', 'mobile', 'display'],
    });

    expect(announcement.english?.title).toBe('Community dinner');
    expect(announcement.english?.body).toBe('Join us after Maghrib.');
    expect(announcement.surfaces).toEqual(['mobile', 'display']);
    expect(Object.isFrozen(announcement)).toBe(true);
  });

  it('supports one language independently while warning in preview', () => {
    const preview = previewMosqueAnnouncement(
      {
        ...baseDraft,
        arabic: null,
        surfaces: ['mobile'],
      },
      '2026-08-20T09:00:00.000Z',
    );

    expect(preview.state).toBe('published');
    expect(preview.warnings).toContain('Arabic content is not supplied');
  });

  it('derives draft, scheduled, published, expired and archived states', () => {
    const draft = createMosqueAnnouncement({ ...baseDraft, startsAt: null, endsAt: null });
    const scheduled = createMosqueAnnouncement(baseDraft);
    const archived = createMosqueAnnouncement({ ...baseDraft, archived: true });

    expect(announcementLifecycleAt(draft, '2026-08-20T09:00:00.000Z')).toBe('draft');
    expect(announcementLifecycleAt(scheduled, '2026-08-19T09:00:00.000Z')).toBe('scheduled');
    expect(announcementLifecycleAt(scheduled, '2026-08-20T09:00:00.000Z')).toBe('published');
    expect(announcementLifecycleAt(scheduled, '2026-08-22T08:00:00.000Z')).toBe('expired');
    expect(announcementLifecycleAt(archived, '2026-08-20T09:00:00.000Z')).toBe('archived');
  });

  it('preserves priority, pinning and recurrence metadata', () => {
    const announcement = createMosqueAnnouncement({
      ...baseDraft,
      priority: 'priority',
      pinned: true,
      recurrence: 'weekly',
    });

    expect(announcement.priority).toBe('priority');
    expect(announcement.pinned).toBe(true);
    expect(announcement.recurrence).toBe('weekly');
  });

  it('warns when a display announcement has no image', () => {
    const preview = previewMosqueAnnouncement(
      { ...baseDraft, imageUrl: null, surfaces: ['display'] },
      '2026-08-20T09:00:00.000Z',
    );

    expect(preview.warnings).toContain('Display-targeted announcement has no image');
  });

  it('rejects missing content, empty targets and invalid publication windows', () => {
    expect(() => createMosqueAnnouncement({ ...baseDraft, english: null, arabic: null })).toThrow(
      /requires English or Arabic/u,
    );
    expect(() => createMosqueAnnouncement({ ...baseDraft, surfaces: [] })).toThrow(
      /at least one surface/u,
    );
    expect(() =>
      createMosqueAnnouncement({
        ...baseDraft,
        startsAt: '2026-08-22T08:00:00.000Z',
        endsAt: '2026-08-20T08:00:00.000Z',
      }),
    ).toThrow(/later than start/u);
  });

  it('rejects unsafe remote URLs with embedded credentials', () => {
    expect(() =>
      createMosqueAnnouncement({
        ...baseDraft,
        callToActionUrl: 'https://admin:secret@example.org/action',
      }),
    ).toThrow(/credential-free/u);
  });
});
