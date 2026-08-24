import { describe, expect, it } from 'vitest';

import {
  completeQiblaPermissionOnboarding,
  loadQiblaPermissionOnboarding,
  qiblaPermissionOnboardingRequired,
  QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
} from './qiblaPermissionOnboarding';
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

describe('Qiblah permission onboarding persistence', () => {
  it('defaults to incomplete and required on a true first run', () => {
    const storage = new MemoryStorage();
    expect(loadQiblaPermissionOnboarding(storage)).toEqual({
      version: 1,
      completed: false,
    });
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(true);
  });

  it('does not interrupt existing configured installations during upgrade', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(loadQiblaPermissionOnboarding(storage)).toEqual({ version: 1, completed: true });
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(false);
  });

  it('persists completion using the application storage key', () => {
    const storage = new MemoryStorage();
    completeQiblaPermissionOnboarding(storage);

    expect(storage.getItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, completed: true }),
    );
    expect(loadQiblaPermissionOnboarding(storage)).toEqual({ version: 1, completed: true });
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(false);
  });

  it('fails closed to first-run onboarding for invalid persisted data', () => {
    const storage = new MemoryStorage();
    storage.setItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY, '{invalid');
    expect(loadQiblaPermissionOnboarding(storage).completed).toBe(false);
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(true);

    storage.setItem(
      QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
      JSON.stringify({ version: 2, completed: true }),
    );
    expect(loadQiblaPermissionOnboarding(storage).completed).toBe(false);
  });
});
