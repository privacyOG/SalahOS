import { describe, expect, it } from 'vitest';
import {
  defaultNotificationPreferences,
  parseNotificationPreferences,
  updatePrayerNotificationPreference,
} from './notificationPreferences';

describe('notification preferences', () => {
  it('defaults every obligatory prayer to opt-in delivery with Adhan disabled', () => {
    expect(defaultNotificationPreferences.fajr).toEqual({
      enabled: false,
      reminderMinutes: null,
      prayerTimeNotification: true,
      sound: 'default',
      vibration: true,
      adhanEnabled: false,
    });
    expect(Object.keys(defaultNotificationPreferences)).toEqual([
      'fajr',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
  });

  it('parses independent prayer preferences and safe defaults', () => {
    const parsed = parseNotificationPreferences({
      fajr: {
        enabled: true,
        reminderMinutes: 15,
        prayerTimeNotification: false,
        sound: 'silent',
        vibration: false,
        adhanEnabled: true,
      },
    });

    expect(parsed.fajr).toEqual({
      enabled: true,
      reminderMinutes: 15,
      prayerTimeNotification: false,
      sound: 'silent',
      vibration: false,
      adhanEnabled: true,
    });
    expect(parsed.dhuhr).toEqual(defaultNotificationPreferences.dhuhr);
  });

  it('rejects reminder values outside the supported range', () => {
    expect(() =>
      parseNotificationPreferences({ fajr: { enabled: true, reminderMinutes: 181 } }),
    ).toThrow(RangeError);
    expect(() =>
      parseNotificationPreferences({ fajr: { enabled: true, reminderMinutes: 0 } }),
    ).toThrow(RangeError);
  });

  it('updates one prayer without mutating the remaining preferences', () => {
    const updated = updatePrayerNotificationPreference(defaultNotificationPreferences, 'maghrib', {
      enabled: true,
      reminderMinutes: 10,
      adhanEnabled: true,
    });

    expect(updated.maghrib.enabled).toBe(true);
    expect(updated.maghrib.reminderMinutes).toBe(10);
    expect(updated.maghrib.adhanEnabled).toBe(true);
    expect(updated.fajr).toEqual(defaultNotificationPreferences.fajr);
    expect(updated).not.toBe(defaultNotificationPreferences);
  });
});
