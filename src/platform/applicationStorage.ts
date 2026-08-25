import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import {
  defaultPrayerBoardTemplateConfig,
  parsePrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import { ADHAN_AUDIO_PREFERENCES_STORAGE_KEY } from './adhanAudioPreferences';
import { BEST_AVAILABLE_LOCATION_STORAGE_KEY } from './bestAvailableLocation';
import { COMMUNITY_CONTENT_STORAGE_KEY } from './communityContentStorage';
import { MANAGED_DISPLAY_CONNECTION_STORAGE_KEY } from './managedDisplayConnectionStorage';
import { MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY } from './managedPrayerBoardCache';
import { MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY } from './mobilePrayerBoardDisplayConfig';
import { MOSQUE_LIBRARY_STORAGE_KEY } from './mosqueLibrary';
import { MOSQUE_PROFILE_LIBRARY_STORAGE_KEY } from './mosqueProfileLibrary';
import { PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY } from './prayerBoardAnnouncementRotation';
import { PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY } from './prayerBoardDisplayConfig';
import { PRAYER_BOARD_WEATHER_STORAGE_KEY } from './prayerBoardWeather';
import { PRIVACY_DIAGNOSTICS_STORAGE_KEY } from './privacyDiagnostics';
import { QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY } from './qiblaPermissionOnboarding';
import { SAVED_LOCATIONS_STORAGE_KEY } from './savedLocations';
import { SETTINGS_STORAGE_KEY } from './settingsStorage';
import type { KeyValueStorage } from './settingsStorage';
import { SMART_DISPLAY_THEME_STORAGE_KEY } from './smartDisplayTheme';

export const PERSISTED_APPLICATION_KEYS = Object.freeze([
  SETTINGS_STORAGE_KEY,
  SAVED_LOCATIONS_STORAGE_KEY,
  BEST_AVAILABLE_LOCATION_STORAGE_KEY,
  MOSQUE_LIBRARY_STORAGE_KEY,
  COMMUNITY_CONTENT_STORAGE_KEY,
  SMART_DISPLAY_THEME_STORAGE_KEY,
  MOSQUE_PROFILE_LIBRARY_STORAGE_KEY,
  MANAGED_DISPLAY_CONNECTION_STORAGE_KEY,
  MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY,
  PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
  PRAYER_BOARD_WEATHER_STORAGE_KEY,
  PRAYER_BOARD_ANNOUNCEMENT_ROTATION_STORAGE_KEY,
  QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
  ADHAN_AUDIO_PREFERENCES_STORAGE_KEY,
  PRIVACY_DIAGNOSTICS_STORAGE_KEY,
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

export function migrateMissingApplicationStorageKeys(
  source: KeyValueStorage,
  target: KeyValueStorage,
  keys: readonly string[] = PERSISTED_APPLICATION_KEYS,
): void {
  for (const key of keys) {
    if (target.getItem(key) !== null) continue;
    const value = source.getItem(key);
    if (value !== null) target.setItem(key, value);
  }
}

function normalizedLegacyPrayerBoardConfig(serialized: string | null): string {
  if (serialized === null) return JSON.stringify(defaultPrayerBoardTemplateConfig);

  try {
    return JSON.stringify(parsePrayerBoardTemplateConfig(JSON.parse(serialized)));
  } catch {
    return JSON.stringify(defaultPrayerBoardTemplateConfig);
  }
}

export function ensureIndependentMobilePrayerBoardDisplayConfig(storage: KeyValueStorage): void {
  if (storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY) !== null) return;

  const legacyDisplayConfig = storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
  storage.setItem(
    MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
    normalizedLegacyPrayerBoardConfig(legacyDisplayConfig),
  );
}

export async function initializeApplicationStorage(webStorage: KeyValueStorage): Promise<void> {
  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') {
    ensureIndependentMobilePrayerBoardDisplayConfig(webStorage);
    activeStorage = webStorage;
    nativeStorage = null;
    return;
  }

  const storage = await createNativePreferencesStorage(Preferences);
  migrateMissingApplicationStorageKeys(webStorage, storage);
  ensureIndependentMobilePrayerBoardDisplayConfig(storage);
  await storage.flush();
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
