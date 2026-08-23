import { describe, expect, it } from 'vitest';

import {
  loadPrayerBoardAnnouncementRotationConfig,
  parsePrayerBoardAnnouncementRotationConfig,
  PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY,
  savePrayerBoardAnnouncementRotationConfig,
} from './prayerBoardAnnouncementRotation';
import type { KeyValueStorage } from './settingsStorage';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

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

function config() {
  return {
    version: 1 as const,
    enabled: true,
    playlist: {
      playlistId: 'prayer-board-announcements:masjid',
      mosqueId: 'masjid',
      title: 'Prayer board announcements',
      revision: 2,
      scenes: [{ sceneId: 'announcement:one', dwellSeconds: 15 }],
    },
    rules: [
      {
        kind: 'prayer-relative' as const,
        ruleId: 'before-jumuah',
        playlistId: 'prayer-board-announcements:masjid',
        priority: 200,
        context: 'jumuah' as const,
        prayer: 'jumuah' as const,
        offsetMinutes: -30,
        durationMinutes: 30,
      },
    ],
    scenes: [
      {
        sceneId: 'announcement:one',
        mosqueId: 'masjid',
        kind: 'announcement' as const,
        title: 'Notice one',
        offlineFallback: 'prayer-board' as const,
        announcementId: 'one',
      },
    ],
  };
}

describe('prayer-board announcement rotation storage', () => {
  it('round-trips a validated signage playlist and prayer-relative schedule', () => {
    const storage = new MemoryStorage();
    savePrayerBoardAnnouncementRotationConfig(storage, config());

    const loaded = loadPrayerBoardAnnouncementRotationConfig(storage);
    expect(loaded.enabled).toBe(true);
    expect(loaded.playlist?.revision).toBe(2);
    expect(loaded.rules[0]?.kind).toBe('prayer-relative');
    if (loaded.rules[0]?.kind === 'prayer-relative') {
      expect(loaded.rules[0].prayer).toBe('jumuah');
      expect(loaded.rules[0].offsetMinutes).toBe(-30);
    }
  });

  it('rejects unsupported schedule enum values instead of casting them through', () => {
    const raw = JSON.stringify({
      ...config(),
      rules: [{ ...config().rules[0], context: 'invalid-context' }],
    });
    expect(() => parsePrayerBoardAnnouncementRotationConfig(raw)).toThrow(/unsupported value/u);
  });

  it('fails closed to disabled rotation when persisted data is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY,
      JSON.stringify({ ...config(), scenes: [{ kind: 'web' }] }),
    );

    const loaded = loadPrayerBoardAnnouncementRotationConfig(storage);
    expect(loaded.enabled).toBe(false);
    expect(loaded.playlist).toBeNull();
    expect(loaded.rules).toEqual([]);
    expect(loaded.scenes).toEqual([]);
  });
});
