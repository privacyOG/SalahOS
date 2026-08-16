import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { MOSQUE_LIBRARY_STORAGE_KEY } from './mosqueLibrary';
import { SAVED_LOCATIONS_STORAGE_KEY } from './savedLocations';
import { SETTINGS_STORAGE_KEY } from './settingsStorage';
import type { KeyValueStorage } from './settingsStorage';

export const PERSISTED_APPLICATION_KEYS = Object.freeze([
  SETTINGS_STORAGE_KEY,
  SAVED_LOCATIONS_STORAGE_KEY,
  MOSQUE_LIBRARY_STORAGE_KEY,
] as const);

export interface PreferencesStore {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

export interface FlushableKeyValueStorage extends KeyValueStorage {
  flush(): Promise<void>;
}

export interface ApplicationStorageDependencies {
  readonly isNativePlatform: () => boolean;
  readonly preferences: PreferencesStore;
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

const defaultDependencies: ApplicationStorageDependencies = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  preferences: Preferences,
};

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

export async function initializeApplicationStorage(
  webStorage: KeyValueStorage,
  dependencies: ApplicationStorageDependencies = defaultDependencies,
): Promise<void> {
  if (!dependencies.isNativePlatform()) {
    activeStorage = webStorage;
    nativeStorage = null;
    return;
  }

  const storage = await createNativePreferencesStorage(dependencies.preferences);
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
