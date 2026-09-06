import { describe, expect, it } from 'vitest';
import {
  applyNotificationOnboardingSelection,
  notificationSelectionFromPreferences,
} from './notificationOnboardingPreferences';
import {
  defaultNotificationPreferences,
  updatePrayerNotificationPreference,
} from './notificationPreferences';

describe('notification onboarding preferences', () => {
  it('defaults a fully disabled installation to all prayers selected without mutating storage', () => {
    expect(notificationSelectionFromPreferences(defaultNotificationPreferences)).toEqual({
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    });
    expect(defaultNotificationPreferences.fajr.enabled).toBe(false);
  });

  it('changes only enabled flags and preserves existing per-prayer detail', () => {
    const current = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      reminderMinutes: 15,
      sound: 'silent',
      adhanEnabled: true,
    });
    const next = applyNotificationOnboardingSelection(current, {
      fajr: true,
      dhuhr: false,
      asr: true,
      maghrib: false,
      isha: true,
    });
    expect(next.fajr).toMatchObject({
      enabled: true,
      reminderMinutes: 15,
      sound: 'silent',
      adhanEnabled: true,
      prayerTimeNotification: true,
      vibration: true,
    });
    expect(next.asr.enabled).toBe(true);
    expect(next.dhuhr.enabled).toBe(false);
  });
});
