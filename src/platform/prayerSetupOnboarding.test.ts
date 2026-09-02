import { describe, expect, it } from 'vitest';

import {
  completePrayerSetupOnboarding,
  initializePrayerSetupOnboarding,
  loadPrayerSetupOnboarding,
  prayerSetupOnboardingRequired,
  PRAYER_SETUP_ONBOARDING_STORAGE_KEY,
} from './prayerSetupOnboarding';
import { SETTINGS_STORAGE_KEY } from './settingsStorage';

class MemoryStorage {
  private readonly values = new Map<string, string>();

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

describe('prayer setup onboarding persistence', () => {
  it('marks a true first run as pending before location can create settings', () => {
    const storage = new MemoryStorage();
    expect(initializePrayerSetupOnboarding(storage)).toEqual({ version: 1, completed: false });
    expect(storage.getItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, completed: false }),
    );

    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(prayerSetupOnboardingRequired(storage)).toBe(true);
  });

  it('does not interrupt an existing configured install during upgrade', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 2 }));

    expect(initializePrayerSetupOnboarding(storage)).toEqual({ version: 1, completed: true });
    expect(prayerSetupOnboardingRequired(storage)).toBe(false);
  });

  it('does not show again after completion', () => {
    const storage = new MemoryStorage();
    initializePrayerSetupOnboarding(storage);
    completePrayerSetupOnboarding(storage);

    expect(loadPrayerSetupOnboarding(storage)).toEqual({ version: 1, completed: true });
    expect(prayerSetupOnboardingRequired(storage)).toBe(false);
  });

  it('fails closed to pending for corrupt or incomplete state', () => {
    const storage = new MemoryStorage();
    storage.setItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY, '{invalid');
    expect(prayerSetupOnboardingRequired(storage)).toBe(true);

    storage.setItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 1 }));
    expect(prayerSetupOnboardingRequired(storage)).toBe(true);
  });
});
