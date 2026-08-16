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
  private readonly pendingMutations = new Map<string, string | null>();
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

  private async applyMutation(key: string, value: string | null): Promise<void> {
    if (value === null) {
      await this.preferences.remove({ key });
    } else {
      await this.preferences.set({ key, value });
    }

    if (this.pendingMutations.get(key) === value) {
      this.pendingMutations.delete(key);
    }
  }

  private queueMutation(key: string, value: string | null): void {
    this.pendingMutations.set(key, value);
    this.pendingWrite = this.pendingWrite.then(async () => {
      try {
        await this.applyMutation(key, value);
      } catch {
        // Keep the latest mutation pending so flush() can retry it.
      }
    });
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);
    this.queueMutation(key, value);
  }

  removeItem(key: string): void {
    this.cache.delete(key);
    this.queueMutation(key, null);
  }

  async flush(): Promise<void> {
    await this.pendingWrite;
    let firstFailure: unknown;
    let failed = false;

    for (const [key, value] of [...this.pendingMutations]) {
      try {
        await this.applyMutation(key, value);
      } catch (error) {
        if (!failed) {
          firstFailure = error;
          failed = true;
        }
      }
    }

    if (failed) {
      throw firstFailure;
    }
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

async function migrateLegacyWebStorage(
  webStorage: KeyValueStorage,
  storage: FlushableKeyValueStorage,
  keys: readonly string[] = PERSISTED_APPLICATION_KEYS,
): Promise<void> {
  let migrated = false;
  for (const key of keys) {
    if (storage.getItem(key) !== null) continue;
    const legacyValue = webStorage.getItem(key);
    if (legacyValue === null) continue;
    storage.setItem(key, legacyValue);
    migrated = true;
  }

  if (migrated) {
    await storage.flush();
  }

  for (const key of keys) {
    if (storage.getItem(key) !== null) {
      webStorage.removeItem(key);
    }
  }
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
  await migrateLegacyWebStorage(webStorage, storage);
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
