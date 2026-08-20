import { describe, expect, it } from 'vitest';

import { createMosqueAnnouncement } from '../domain/mosqueAnnouncement';
import { createMosqueEvent } from '../domain/mosqueEvent';
import {
  COMMUNITY_CONTENT_STORAGE_KEY,
  loadCommunityContentLibrary,
  parseCommunityContentLibrary,
  saveCommunityContentLibrary,
  serializeCommunityContentLibrary,
  type CommunityContentLibrary,
} from './communityContentStorage';
import type { KeyValueStorage } from './settingsStorage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function library(): CommunityContentLibrary {
  return {
    announcements: [
      createMosqueAnnouncement({
        announcementId: 'community-update',
        mosqueId: 'masjid-al-noor:sydney',
        english: { title: 'Community update', body: 'News for the congregation.' },
        arabic: null,
        imageUrl: null,
        callToActionUrl: null,
        priority: 'normal',
        pinned: false,
        surfaces: ['mobile', 'web'],
        startsAt: '2026-08-20T00:00:00.000Z',
        endsAt: null,
        recurrence: 'none',
        archived: false,
      }),
    ],
    events: [
      createMosqueEvent({
        eventId: 'community-dinner',
        mosqueId: 'masjid-al-noor:sydney',
        english: { title: 'Community dinner', description: 'Dinner after Maghrib.' },
        arabic: null,
        venue: 'Community hall',
        allDay: false,
        startsAt: '2026-08-22T08:00:00.000Z',
        endsAt: '2026-08-22T10:00:00.000Z',
        recurrence: 'none',
        imageUrl: null,
        registrationUrl: null,
        surfaces: ['mobile'],
      }),
    ],
  };
}

describe('community content storage', () => {
  it('round-trips validated announcement and event content', () => {
    const serialized = serializeCommunityContentLibrary(library());
    const parsed = parseCommunityContentLibrary(serialized);

    expect(parsed).toEqual(library());
  });

  it('persists and loads a versioned local library', () => {
    const storage = new MemoryStorage();
    saveCommunityContentLibrary(storage, library());

    expect(storage.getItem(COMMUNITY_CONTENT_STORAGE_KEY)).not.toBeNull();
    expect(loadCommunityContentLibrary(storage)).toEqual(library());
  });

  it('fails closed to an empty library when stored content is invalid', () => {
    const storage = new MemoryStorage();
    storage.setItem(COMMUNITY_CONTENT_STORAGE_KEY, '{"version":99}');

    expect(loadCommunityContentLibrary(storage)).toEqual({ announcements: [], events: [] });
  });

  it('rejects malformed content and duplicate per-mosque identifiers', () => {
    expect(() =>
      parseCommunityContentLibrary('{"version":1,"announcements":[],"events":{}}'),
    ).toThrow(/arrays/u);

    const duplicate = library();
    const firstAnnouncement = duplicate.announcements[0];
    if (firstAnnouncement === undefined) throw new Error('Announcement fixture is missing');

    expect(() =>
      serializeCommunityContentLibrary({
        ...duplicate,
        announcements: [firstAnnouncement, firstAnnouncement],
      }),
    ).toThrow(/Duplicate announcement/u);
  });
});
