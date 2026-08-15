import { describe, expect, it } from 'vitest';
import {
  defaultNotificationPreferences,
  updatePrayerNotificationPreference,
} from './notificationPreferences';
import { buildNotificationIntents, reconcileNotificationIntents } from './notificationSchedule';

describe('notification schedule core', () => {
  it('builds reminder, prayer-time and Adhan intents from one prayer preference', () => {
    let preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 15,
      prayerTimeNotification: true,
      sound: 'silent',
      vibration: false,
      adhanEnabled: true,
    });
    preferences = updatePrayerNotificationPreference(preferences, 'dhuhr', { enabled: false });

    const intents = buildNotificationIntents(
      [
        { date: '2026-08-16', prayer: 'fajr', localMinutes: 330 },
        { date: '2026-08-16', prayer: 'dhuhr', localMinutes: 730 },
      ],
      preferences,
    );

    expect(intents.map((intent) => intent.kind)).toEqual(['reminder', 'adhan', 'prayer-time']);
    expect(intents[0]).toMatchObject({
      id: '2026-08-16:fajr:reminder',
      deliveryDate: '2026-08-16',
      deliveryLocalMinutes: 315,
      sound: 'silent',
      vibration: false,
    });
    expect(intents[1]).toMatchObject({
      id: '2026-08-16:fajr:adhan',
      deliveryLocalMinutes: 330,
    });
  });

  it('moves a pre-prayer reminder to the previous civil date when required', () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 30,
      prayerTimeNotification: false,
    });

    const intents = buildNotificationIntents(
      [{ date: '2027-01-01', prayer: 'fajr', localMinutes: 20 }],
      preferences,
    );

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      deliveryDate: '2026-12-31',
      deliveryLocalMinutes: 1_430,
    });
  });

  it('deduplicates repeated prayer inputs by stable intent id', () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'maghrib', {
      enabled: true,
      prayerTimeNotification: true,
    });
    const input = { date: '2026-08-16', prayer: 'maghrib' as const, localMinutes: 1_050 };

    const intents = buildNotificationIntents([input, input], preferences);

    expect(intents).toHaveLength(1);
    expect(intents[0]?.id).toBe('2026-08-16:maghrib:prayer-time');
  });

  it('replaces an existing job when recalculation changes its target time', () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'asr', {
      enabled: true,
      prayerTimeNotification: true,
    });
    const current = buildNotificationIntents(
      [{ date: '2026-08-16', prayer: 'asr', localMinutes: 930 }],
      preferences,
    );
    const desired = buildNotificationIntents(
      [{ date: '2026-08-16', prayer: 'asr', localMinutes: 945 }],
      preferences,
    );

    expect(reconcileNotificationIntents(current, desired)).toEqual({
      cancelIds: ['2026-08-16:asr:prayer-time'],
      schedule: desired,
    });
  });

  it('cancels stale prior-date jobs and schedules the next date without duplicate ids', () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'isha', {
      enabled: true,
      prayerTimeNotification: true,
    });
    const current = buildNotificationIntents(
      [{ date: '2026-08-16', prayer: 'isha', localMinutes: 1_230 }],
      preferences,
    );
    const desired = buildNotificationIntents(
      [{ date: '2026-08-17', prayer: 'isha', localMinutes: 1_231 }],
      preferences,
    );

    expect(reconcileNotificationIntents(current, desired)).toEqual({
      cancelIds: ['2026-08-16:isha:prayer-time'],
      schedule: desired,
    });
  });

  it('does nothing when the desired schedule is already installed', () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'dhuhr', {
      enabled: true,
      reminderMinutes: 10,
    });
    const desired = buildNotificationIntents(
      [{ date: '2026-08-16', prayer: 'dhuhr', localMinutes: 730 }],
      preferences,
    );

    expect(reconcileNotificationIntents(desired, desired)).toEqual({
      schedule: [],
      cancelIds: [],
    });
  });
});
