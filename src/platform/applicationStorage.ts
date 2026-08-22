import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { COMMUNITY_CONTENT_STORAGE_KEY } from './communityContentStorage';
import { MANAGED_DISPLAY_CONNECTION_STORAGE_KEY } from './managedDisplayConnectionStorage';
import { MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY } from './managedPrayerBoardCache';
import { MOSQUE_LIBRARY_STORAGE_KEY } from './mosqueLibrary';
import { MOSQUE_PROFILE_LIBRARY_STORAGE_KEY } from './mosqueProfileLibrary';
import { PRAYER_BOARD_WEATHER_STORAGE_KEY } from './prayerBoardWeather';
import { SAVED_LOCATIONS_STORAGE_KEY } from './savedLocations';
import { SETTINGS_STORAGE_KEY } from './settingsStorage';
import type { KeyValueStorage } from './settingsStorage';
import { SMART_DISPLAY_THEME_STORAGE_KEY } from './smartDisplayTheme';

export const PERSISTED_APPLICATION_KEYS = Object.freeze([
  SETTINGS_STORAGE_KEY,
  SAVED_LOCATIONS_STORAGE_KEY,
  MOSQUE_LIBRARY_STORAGE_KEY,
  COMMUNITY_CONTENT_STORAGE_KEY,
  SMART_DISPLAY_THEME_STORAGE_KEY,
  MOSQUE_PROFILE_LIBRARY_STORAGE_KEY,
  MANAGED_DISPLAY_CONNECTION_STORAGE_KEY,
  MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY,
  PRAYER_BOARD_WEATHER_STORAGE_KEY,
] as const);

export interface PreferencesStore {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

export interface FlushableKeyValueStorage extends KeyValueStorage {
  flush(): Promise<void>;
}

class NativePreferencesStorage implements FlushableKeyValueStorage {
  private readonly cache = new Map<string, string>();
  private pendingWrite: Promise<void> = Promise.resolve();

  constructor(private readonly preferences: PreferencesStore) {}

  async hydrate(keys: readonly string[]): Promise<void> {
    const entries = await Promise.all(
      keys.map(async (key) => ({ key, value: (await this.preferences.get({ key })).value })),
    );
    for (const entry of entries) {
      if (entry.value !== null) {
        this.cache.set(entry.key, entry.value);
      }
    }
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    this.pendingWrite = this.pendingWrite.then(() => this.preferences.set({ key, value }));
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    this.pendingWrite = this.pendingWrite.then(() => this.preferences.remove({ key }));
  }

  async flush(): Promise<void> {
    await this.pendingWrite;
  }
}

let activeStorage: KeyValueStorage | null = null;
let nativeStorage: FlushableKeyValueStorage | null = null;

export async function createNativePreferencesStorage(
  preferences: PreferencesStore,
  keys: readonly string[] = PERSISTED_APPLICATION_KEYS,
): Promise<FlushableKeyValueStorage> {
  const storage = new NativePreferencesStorage(preferences);
  await storage.hydrate(keys);
  return storage;
}

export async function initializeApplicationStorage(webStorage: KeyValueStorage): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    activeStorage = webStorage;
    nativeStorage = null;
    return;
  }

  const storage = await createNativePreferencesStorage(Preferences);
  activeStorage = storage;
  nativeStorage = storage;
}

export function getApplicationStorage(): KeyValueStorage {
  if (activeStorage === null) {
    throw new Error('Application storage has not been initialized');
  }
  return activeStorage;
}

export async function flushApplicationStorage(): Promise<void> {
  await nativeStorage?.flush();
}
