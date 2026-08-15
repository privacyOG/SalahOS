import type { PrayerName } from './prayerEngine';

export type NotificationPrayerName = Exclude<PrayerName, 'sunrise'>;
export type NotificationSound = 'default' | 'silent';

export interface PrayerNotificationPreference {
  readonly enabled: boolean;
  readonly reminderMinutes: number | null;
  readonly prayerTimeNotification: boolean;
  readonly sound: NotificationSound;
  readonly vibration: boolean;
  readonly adhanEnabled: boolean;
}

export type NotificationPreferences = Readonly<
  Record<NotificationPrayerName, PrayerNotificationPreference>
>;

export const NOTIFICATION_PRAYERS: readonly NotificationPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const defaultPrayerNotificationPreference: PrayerNotificationPreference = Object.freeze({
  enabled: false,
  reminderMinutes: null,
  prayerTimeNotification: true,
  sound: 'default',
  vibration: true,
  adhanEnabled: false,
});

export const defaultNotificationPreferences: NotificationPreferences = Object.freeze({
  fajr: defaultPrayerNotificationPreference,
  dhuhr: defaultPrayerNotificationPreference,
  asr: defaultPrayerNotificationPreference,
  maghrib: defaultPrayerNotificationPreference,
  isha: defaultPrayerNotificationPreference,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseReminderMinutes(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 180) {
    throw new RangeError('Notification reminder minutes must be an integer from 1 through 180');
  }
  return Number(value);
}

function parsePreference(value: unknown): PrayerNotificationPreference {
  if (!isRecord(value)) {
    return defaultPrayerNotificationPreference;
  }

  const sound: NotificationSound = value.sound === 'silent' ? 'silent' : 'default';
  return {
    enabled: value.enabled === true,
    reminderMinutes: parseReminderMinutes(value.reminderMinutes),
    prayerTimeNotification: value.prayerTimeNotification !== false,
    sound,
    vibration: value.vibration !== false,
    adhanEnabled: value.adhanEnabled === true,
  };
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (!isRecord(value)) {
    return defaultNotificationPreferences;
  }

  return {
    fajr: parsePreference(value.fajr),
    dhuhr: parsePreference(value.dhuhr),
    asr: parsePreference(value.asr),
    maghrib: parsePreference(value.maghrib),
    isha: parsePreference(value.isha),
  };
}

export function updatePrayerNotificationPreference(
  preferences: NotificationPreferences,
  prayer: NotificationPrayerName,
  patch: Partial<PrayerNotificationPreference>,
): NotificationPreferences {
  const candidate = parsePreference({ ...preferences[prayer], ...patch });
  return { ...preferences, [prayer]: candidate };
}
