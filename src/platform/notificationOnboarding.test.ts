import { describe, expect, it } from 'vitest';
import {
  completeNotificationOnboarding,
  initializeNotificationOnboarding,
  loadNotificationOnboarding,
  notificationOnboardingRequired,
  NOTIFICATION_ONBOARDING_STORAGE_KEY,
} from './notificationOnboarding';
import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

class MemoryStorage implements KeyValueStorage {
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

describe('notification onboarding state', () => {
  it('persists a fresh incomplete state before settings can be created', () => {
    const storage = new MemoryStorage();
    expect(initializeNotificationOnboarding(storage)).toEqual({
      version: 1,
      completed: false,
      decision: null,
    });
    expect(storage.getItem(NOTIFICATION_ONBOARDING_STORAGE_KEY)).not.toBeNull();
    expect(notificationOnboardingRequired(storage)).toBe(true);
  });

  it('migrates an already configured installation as completed', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, '{}');
    expect(initializeNotificationOnboarding(storage).completed).toBe(true);
    expect(notificationOnboardingRequired(storage)).toBe(false);
  });

  it('does not automatically re-prompt after decline', () => {
    const storage = new MemoryStorage();
    initializeNotificationOnboarding(storage);
    completeNotificationOnboarding(storage, 'declined');
    expect(loadNotificationOnboarding(storage)).toEqual({
      version: 1,
      completed: true,
      decision: 'declined',
    });
    expect(notificationOnboardingRequired(storage)).toBe(false);
  });
});
