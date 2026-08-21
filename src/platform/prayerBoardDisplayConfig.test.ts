import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import {
  clearPrayerBoardDisplayConfig,
  loadPrayerBoardDisplayConfig,
  PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
  savePrayerBoardDisplayConfig,
} from './prayerBoardDisplayConfig';
import type { KeyValueStorage } from './settingsStorage';

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

describe('prayer-board display configuration persistence', () => {
  it('returns null until a display-specific configuration is explicitly saved', () => {
    const storage = memoryStorage();
    expect(loadPrayerBoardDisplayConfig(storage)).toBeNull();
  });

  it('round-trips normalized presentation configuration without weakening core modules', () => {
    const storage = memoryStorage();
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'family-classroom',
      primaryLocale: 'ar',
      timeFormat: 'h12',
      accentPreset: 'jewel',
      moduleVisibility: {
        'current-time': false,
        'next-prayer': false,
        countdown: false,
        'prayer-timetable': false,
        jumuah: false,
        'sunrise-sunset': false,
      },
      branding: { mosqueName: { ar: 'مسجد صلاح أو إس' } },
    });

    savePrayerBoardDisplayConfig(storage, config);
    const loaded = loadPrayerBoardDisplayConfig(storage);

    expect(loaded).toMatchObject({
      templateId: 'family-classroom',
      primaryLocale: 'ar',
      timeFormat: 'h12',
      accentPreset: 'jewel',
      branding: { mosqueName: { ar: 'مسجد صلاح أو إس' } },
    });
    expect(loaded?.moduleVisibility['current-time']).toBe(true);
    expect(loaded?.moduleVisibility['next-prayer']).toBe(true);
    expect(loaded?.moduleVisibility.countdown).toBe(true);
    expect(loaded?.moduleVisibility['prayer-timetable']).toBe(true);
    expect(loaded?.moduleVisibility.jumuah).toBe(false);
    expect(loaded?.moduleVisibility['sunrise-sunset']).toBe(false);
  });

  it('fails closed on corrupt serialized configuration and can be cleared', () => {
    const storage = memoryStorage();
    storage.setItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, '{not-json');
    expect(loadPrayerBoardDisplayConfig(storage)).toBeNull();

    savePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({ version: 1, templateId: 'minimal-modern' }),
    );
    expect(loadPrayerBoardDisplayConfig(storage)?.templateId).toBe('minimal-modern');
    clearPrayerBoardDisplayConfig(storage);
    expect(loadPrayerBoardDisplayConfig(storage)).toBeNull();
  });
});
