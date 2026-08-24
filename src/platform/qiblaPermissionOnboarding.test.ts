import { describe, expect, it } from 'vitest';

import {
  completeQiblaPermissionOnboarding,
  loadQiblaPermissionOnboarding,
  QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
} from './qiblaPermissionOnboarding';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('Qiblah permission onboarding persistence', () => {
  it('defaults to incomplete when no state exists', () => {
    expect(loadQiblaPermissionOnboarding(new MemoryStorage())).toEqual({
      version: 1,
      completed: false,
    });
  });

  it('persists completion using the application storage key', () => {
    const storage = new MemoryStorage();
    completeQiblaPermissionOnboarding(storage);

    expect(storage.getItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, completed: true }),
    );
    expect(loadQiblaPermissionOnboarding(storage)).toEqual({ version: 1, completed: true });
  });

  it('fails closed to first-run onboarding for invalid persisted data', () => {
    const storage = new MemoryStorage();
    storage.setItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY, '{invalid');
    expect(loadQiblaPermissionOnboarding(storage).completed).toBe(false);

    storage.setItem(
      QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
      JSON.stringify({ version: 2, completed: true }),
    );
    expect(loadQiblaPermissionOnboarding(storage).completed).toBe(false);
  });
});
