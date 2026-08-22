import { describe, expect, it } from 'vitest';

import {
  createNativePreferencesStorage,
  migrateMissingApplicationStorageKeys,
  PERSISTED_APPLICATION_KEYS,
  type PreferencesStore,
} from './applicationStorage';
import { PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY } from './prayerBoardDisplayConfig';
import type { KeyValueStorage } from './settingsStorage';

class MemoryPreferences implements PreferencesStore {
  readonly values = new Map<string, string>();

  get({ key }: { key: string }): Promise<{ value: string | null }> {
    return Promise.resolve({ value: this.values.get(key) ?? null });
  }

  set({ key, value }: { key: string; value: string }): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }

  remove({ key }: { key: string }): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

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

describe('prayer-board native persistence', () => {
  it('registers the selected prayer-board configuration for native hydration', () => {
    expect(PERSISTED_APPLICATION_KEYS).toContain(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
    expect(new Set(PERSISTED_APPLICATION_KEYS).size).toBe(PERSISTED_APPLICATION_KEYS.length);
  });

  it('hydrates a saved prayer-board configuration through Capacitor Preferences storage', async () => {
    const preferences = new MemoryPreferences();
    const serialized = JSON.stringify({
      version: 1,
      templateId: 'scenic-spiritual',
      primaryLocale: 'en',
      languageMode: 'single',
      timeFormat: 'h23',
      accentPreset: 'jewel',
    });
    preferences.values.set(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, serialized);

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(serialized);
  });

  it('migrates an existing WebView selection into native Preferences without overwriting native data', async () => {
    const webStorage = new MemoryStorage();
    const preferences = new MemoryPreferences();
    const oldWebSelection = '{"templateId":"heritage-classic"}';
    const nativeSelection = '{"templateId":"scenic-spiritual"}';

    webStorage.setItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, oldWebSelection);
    const nativeStorage = await createNativePreferencesStorage(preferences);
    migrateMissingApplicationStorageKeys(webStorage, nativeStorage);
    await nativeStorage.flush();
    expect(preferences.values.get(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(oldWebSelection);

    preferences.values.set(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, nativeSelection);
    const alreadyNative = await createNativePreferencesStorage(preferences);
    migrateMissingApplicationStorageKeys(webStorage, alreadyNative);
    await alreadyNative.flush();
    expect(preferences.values.get(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(nativeSelection);
  });
});
