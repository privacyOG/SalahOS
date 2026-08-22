import { describe, expect, it } from 'vitest';

import {
  createNativePreferencesStorage,
  ensureIndependentMobilePrayerBoardDisplayConfig,
  migrateMissingApplicationStorageKeys,
  PERSISTED_APPLICATION_KEYS,
  type PreferencesStore,
} from './applicationStorage';
import { MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY } from './mobilePrayerBoardDisplayConfig';
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
  it('registers independent Phone/Home and TV/Kiosk configuration keys for native hydration', () => {
    expect(PERSISTED_APPLICATION_KEYS).toContain(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
    expect(PERSISTED_APPLICATION_KEYS).toContain(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
    expect(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY).not.toBe(
      PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
    );
    expect(new Set(PERSISTED_APPLICATION_KEYS).size).toBe(PERSISTED_APPLICATION_KEYS.length);
  });

  it('hydrates a saved Phone/Home prayer-board configuration through Capacitor Preferences storage', async () => {
    const preferences = new MemoryPreferences();
    const serialized = JSON.stringify({
      version: 1,
      templateId: 'scenic-spiritual',
      primaryLocale: 'en',
      languageMode: 'single',
      timeFormat: 'h23',
      accentPreset: 'jewel',
    });
    preferences.values.set(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, serialized);

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(serialized);
  });

  it('hydrates Phone/Home and TV/Kiosk selections independently', async () => {
    const preferences = new MemoryPreferences();
    const phoneSelection = '{"templateId":"scenic-spiritual"}';
    const displaySelection = '{"templateId":"structured-split-board"}';
    preferences.values.set(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, phoneSelection);
    preferences.values.set(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, displaySelection);

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(phoneSelection);
    expect(storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(displaySelection);
  });

  it('migrates an existing WebView Phone/Home selection without overwriting newer native data', async () => {
    const webStorage = new MemoryStorage();
    const preferences = new MemoryPreferences();
    const oldWebSelection = '{"templateId":"heritage-classic"}';
    const nativeSelection = '{"templateId":"scenic-spiritual"}';

    webStorage.setItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, oldWebSelection);
    const nativeStorage = await createNativePreferencesStorage(preferences);
    migrateMissingApplicationStorageKeys(webStorage, nativeStorage);
    await nativeStorage.flush();
    expect(preferences.values.get(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(
      oldWebSelection,
    );

    preferences.values.set(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, nativeSelection);
    const alreadyNative = await createNativePreferencesStorage(preferences);
    migrateMissingApplicationStorageKeys(webStorage, alreadyNative);
    await alreadyNative.flush();
    expect(preferences.values.get(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBe(
      nativeSelection,
    );
  });

  it('does not use a Phone/Home migration to overwrite the separate TV/Kiosk selection', async () => {
    const webStorage = new MemoryStorage();
    const preferences = new MemoryPreferences();
    webStorage.setItem(
      MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
      '{"templateId":"family-classroom"}',
    );
    preferences.values.set(
      PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
      '{"templateId":"minimal-modern"}',
    );

    const nativeStorage = await createNativePreferencesStorage(preferences);
    migrateMissingApplicationStorageKeys(webStorage, nativeStorage);
    await nativeStorage.flush();

    expect(preferences.values.get(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'family-classroom',
    );
    expect(preferences.values.get(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'minimal-modern',
    );
  });

  it('copies a legacy TV/Kiosk selection into Phone/Home only once', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
      JSON.stringify({ version: 1, templateId: 'scenic-spiritual', accentPreset: 'jewel' }),
    );

    ensureIndependentMobilePrayerBoardDisplayConfig(storage);
    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'scenic-spiritual',
    );

    storage.setItem(
      PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
      JSON.stringify({ version: 1, templateId: 'structured-split-board' }),
    );
    ensureIndependentMobilePrayerBoardDisplayConfig(storage);

    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'scenic-spiritual',
    );
    expect(storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'structured-split-board',
    );
  });

  it('creates an independent Heritage Classic Phone/Home default without a legacy display config', () => {
    const storage = new MemoryStorage();

    ensureIndependentMobilePrayerBoardDisplayConfig(storage);

    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'heritage-classic',
    );
    expect(storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toBeNull();
  });
});
