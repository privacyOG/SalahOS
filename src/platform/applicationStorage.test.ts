import { describe, expect, it } from 'vitest';
import {
  createNativePreferencesStorage,
  getApplicationStorage,
  initializeApplicationStorage,
  PERSISTED_APPLICATION_KEYS,
  type PreferencesStore,
} from './applicationStorage';
import type { KeyValueStorage } from './settingsStorage';

class MemoryPreferences implements PreferencesStore {
  readonly values = new Map<string, string>();
  readonly writes: { key: string; value: string }[] = [];
  readonly removals: string[] = [];

  get({ key }: { key: string }): Promise<{ value: string | null }> {
    return Promise.resolve({ value: this.values.get(key) ?? null });
  }

  set({ key, value }: { key: string; value: string }): Promise<void> {
    this.writes.push({ key, value });
    this.values.set(key, value);
    return Promise.resolve();
  }

  remove({ key }: { key: string }): Promise<void> {
    this.removals.push(key);
    this.values.delete(key);
    return Promise.resolve();
  }
}

class MemoryWebStorage implements KeyValueStorage {
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

describe('native application storage', () => {
  it('hydrates the persisted application keys before synchronous reads', async () => {
    const preferences = new MemoryPreferences();
    preferences.values.set(PERSISTED_APPLICATION_KEYS[0], '{"version":2}');
    preferences.values.set(PERSISTED_APPLICATION_KEYS[1], '{"version":1,"locations":[]}');

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[0])).toBe('{"version":2}');
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[1])).toBe('{"version":1,"locations":[]}');
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[2])).toBeNull();
  });

  it('updates synchronous reads immediately and persists writes in order', async () => {
    const preferences = new MemoryPreferences();
    const storage = await createNativePreferencesStorage(preferences, ['alpha']);

    storage.setItem('alpha', 'one');
    storage.setItem('alpha', 'two');

    expect(storage.getItem('alpha')).toBe('two');
    await storage.flush();
    expect(preferences.writes).toEqual([
      { key: 'alpha', value: 'one' },
      { key: 'alpha', value: 'two' },
    ]);
    expect(preferences.values.get('alpha')).toBe('two');
  });

  it('removes cached and native values through the same storage contract', async () => {
    const preferences = new MemoryPreferences();
    preferences.values.set('alpha', 'one');
    const storage = await createNativePreferencesStorage(preferences, ['alpha']);

    storage.removeItem('alpha');

    expect(storage.getItem('alpha')).toBeNull();
    await storage.flush();
    expect(preferences.removals).toEqual(['alpha']);
    expect(preferences.values.has('alpha')).toBe(false);
  });

  it('keeps unrelated native preference keys outside the application cache', async () => {
    const preferences = new MemoryPreferences();
    preferences.values.set('unrelated', 'keep-me');

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem('unrelated')).toBeNull();
    await storage.flush();
    expect(preferences.values.get('unrelated')).toBe('keep-me');
  });

  it('uses existing Capacitor Preferences values as authoritative on native shells', async () => {
    const preferences = new MemoryPreferences();
    const webStorage = new MemoryWebStorage();
    preferences.values.set(PERSISTED_APPLICATION_KEYS[0], 'native-value');
    webStorage.setItem(PERSISTED_APPLICATION_KEYS[0], 'stale-web-value');

    await initializeApplicationStorage(webStorage, {
      isNativePlatform: () => true,
      preferences,
    });

    expect(getApplicationStorage().getItem(PERSISTED_APPLICATION_KEYS[0])).toBe('native-value');
    expect(webStorage.getItem(PERSISTED_APPLICATION_KEYS[0])).toBeNull();
    expect(preferences.writes).toEqual([]);
  });

  it('migrates legacy iOS Web Storage values into Preferences before removing them', async () => {
    const preferences = new MemoryPreferences();
    const webStorage = new MemoryWebStorage();
    webStorage.setItem(PERSISTED_APPLICATION_KEYS[0], 'legacy-settings');
    webStorage.setItem(PERSISTED_APPLICATION_KEYS[1], 'legacy-locations');

    await initializeApplicationStorage(webStorage, {
      isNativePlatform: () => true,
      preferences,
    });

    expect(getApplicationStorage().getItem(PERSISTED_APPLICATION_KEYS[0])).toBe('legacy-settings');
    expect(getApplicationStorage().getItem(PERSISTED_APPLICATION_KEYS[1])).toBe('legacy-locations');
    expect(preferences.values.get(PERSISTED_APPLICATION_KEYS[0])).toBe('legacy-settings');
    expect(preferences.values.get(PERSISTED_APPLICATION_KEYS[1])).toBe('legacy-locations');
    expect(webStorage.getItem(PERSISTED_APPLICATION_KEYS[0])).toBeNull();
    expect(webStorage.getItem(PERSISTED_APPLICATION_KEYS[1])).toBeNull();
  });

  it('keeps browser and PWA storage on the provided Web Storage implementation', async () => {
    const preferences = new MemoryPreferences();
    const webStorage = new MemoryWebStorage();
    webStorage.setItem(PERSISTED_APPLICATION_KEYS[0], 'web-value');

    await initializeApplicationStorage(webStorage, {
      isNativePlatform: () => false,
      preferences,
    });

    expect(getApplicationStorage()).toBe(webStorage);
    expect(getApplicationStorage().getItem(PERSISTED_APPLICATION_KEYS[0])).toBe('web-value');
    expect(preferences.values.size).toBe(0);
  });
});
