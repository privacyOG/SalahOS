import { describe, expect, it } from 'vitest';
import {
  createNativePreferencesStorage,
  PERSISTED_APPLICATION_KEYS,
  type PreferencesStore,
} from './applicationStorage';
import { PRAYER_SETUP_ONBOARDING_STORAGE_KEY } from './prayerSetupOnboarding';
import { QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY } from './qiblaPermissionOnboarding';

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

describe('native application storage', () => {
  it('hydrates the persisted application keys before synchronous reads', async () => {
    const preferences = new MemoryPreferences();
    preferences.values.set(PERSISTED_APPLICATION_KEYS[0], '{"version":2}');
    preferences.values.set(PERSISTED_APPLICATION_KEYS[1], '{"version":1,"locations":[]}');
    preferences.values.set(
      PERSISTED_APPLICATION_KEYS[3],
      '{"version":1,"announcements":[],"events":[]}',
    );
    preferences.values.set(PERSISTED_APPLICATION_KEYS[4], 'midnight');
    preferences.values.set(
      PERSISTED_APPLICATION_KEYS[5],
      '{"version":1,"profiles":[],"selectedProfileId":null}',
    );
    preferences.values.set(
      PERSISTED_APPLICATION_KEYS[6],
      '{"version":1,"connection":{"baseUrl":"https://admin.example.org","displayId":"display:lobby","deviceToken":"dddddddddddddddddddddddddddddddddddddddddddddddd"}}',
    );
    preferences.values.set(
      QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
      '{"version":1,"completed":true}',
    );
    preferences.values.set(
      PRAYER_SETUP_ONBOARDING_STORAGE_KEY,
      '{"version":1,"completed":true}',
    );

    const storage = await createNativePreferencesStorage(preferences);

    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[0])).toBe('{"version":2}');
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[1])).toBe('{"version":1,"locations":[]}');
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[2])).toBeNull();
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[3])).toBe(
      '{"version":1,"announcements":[],"events":[]}',
    );
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[4])).toBe('midnight');
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[5])).toBe(
      '{"version":1,"profiles":[],"selectedProfileId":null}',
    );
    expect(storage.getItem(PERSISTED_APPLICATION_KEYS[6])).toContain('"displayId":"display:lobby"');
    expect(storage.getItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY)).toBe(
      '{"version":1,"completed":true}',
    );
    expect(storage.getItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY)).toBe(
      '{"version":1,"completed":true}',
    );
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
});
