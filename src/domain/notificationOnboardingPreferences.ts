import {
  NOTIFICATION_PRAYERS,
  updatePrayerNotificationPreference,
  type NotificationPrayerName,
  type NotificationPreferences,
} from './notificationPreferences';

export type NotificationPrayerSelection = Readonly<Record<NotificationPrayerName, boolean>>;

export const allPrayerNotificationsSelected: NotificationPrayerSelection = Object.freeze({
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
});

export const noPrayerNotificationsSelected: NotificationPrayerSelection = Object.freeze({
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
});

export function notificationSelectionFromPreferences(
  preferences: NotificationPreferences,
): NotificationPrayerSelection {
  const selected: NotificationPrayerSelection = {
    fajr: preferences.fajr.enabled,
    dhuhr: preferences.dhuhr.enabled,
    asr: preferences.asr.enabled,
    maghrib: preferences.maghrib.enabled,
    isha: preferences.isha.enabled,
  };
  return NOTIFICATION_PRAYERS.some((prayer) => selected[prayer])
    ? selected
    : allPrayerNotificationsSelected;
}

export function applyNotificationOnboardingSelection(
  preferences: NotificationPreferences,
  selection: NotificationPrayerSelection,
): NotificationPreferences {
  return NOTIFICATION_PRAYERS.reduce(
    (current, prayer) =>
      updatePrayerNotificationPreference(current, prayer, { enabled: selection[prayer] }),
    preferences,
  );
}
