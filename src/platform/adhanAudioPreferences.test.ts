import { describe, expect, it } from 'vitest';
import { defaultAdhanAudioPreferences } from '../domain/adhanAudioLibrary';
import { PERSISTED_APPLICATION_KEYS } from './applicationStorage';
import {
  ADHAN_AUDIO_PREFERENCES_STORAGE_KEY,
  loadAdhanAudioPreferences,
  saveAdhanAudioPreferences,
} from './adhanAudioPreferences';
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

describe('Adhan audio preference storage', () => {
  it('is included in native application preference hydration', () => {
    expect(PERSISTED_APPLICATION_KEYS).toContain(ADHAN_AUDIO_PREFERENCES_STORAGE_KEY);
  });

  it('round-trips a validated library configuration', () => {
    const storage = new MemoryStorage();
    const preferences = {
      ...defaultAdhanAudioPreferences,
      defaultSourceId: 'fajr-malmo' as const,
      prayerSelections: {
        ...defaultAdhanAudioPreferences.prayerSelections,
        fajr: 'fajr-malmo' as const,
      },
      volumePercent: 64,
      notificationOnly: true,
    };

    saveAdhanAudioPreferences(storage, preferences);

    expect(loadAdhanAudioPreferences(storage)).toEqual(preferences);
  });

  it('falls back to defaults for invalid serialized state', () => {
    const storage = new MemoryStorage();
    storage.setItem(ADHAN_AUDIO_PREFERENCES_STORAGE_KEY, '{invalid');
    expect(loadAdhanAudioPreferences(storage)).toBe(defaultAdhanAudioPreferences);
  });
});
