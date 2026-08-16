import type { PrayerScheduleInput } from './notificationSchedule';
import { mosqueDayForDate, resolvePrayerSource } from './mosqueTimetable';
import type { MosqueTimetable, PrayerSourceMode } from './mosqueTimetable';
import type { PrayerDashboardModel } from './dashboard';
import type { NotificationPrayerName } from './notificationPreferences';

const notificationPrayers: readonly NotificationPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

function inputsForDate(
  date: string,
  schedule: PrayerDashboardModel['today'],
  sourceMode: PrayerSourceMode,
  mosqueTimetable: MosqueTimetable | null,
): readonly PrayerScheduleInput[] {
  const mosqueDay = mosqueTimetable === null ? null : mosqueDayForDate(mosqueTimetable, date);
  const resolved = resolvePrayerSource(sourceMode, schedule, mosqueDay);

  return notificationPrayers.flatMap((prayer) => {
    const localMinutes = resolved[prayer].startLocalMinutes;
    return localMinutes === null ? [] : [{ date, prayer, localMinutes }];
  });
}

export function buildNotificationPrayerInputs(input: {
  readonly dashboard: PrayerDashboardModel;
  readonly sourceMode: PrayerSourceMode;
  readonly mosqueTimetable: MosqueTimetable | null;
}): readonly PrayerScheduleInput[] {
  return [
    ...inputsForDate(
      input.dashboard.today.date,
      input.dashboard.today,
      input.sourceMode,
      input.mosqueTimetable,
    ),
    ...inputsForDate(
      input.dashboard.tomorrow.date,
      input.dashboard.tomorrow,
      input.sourceMode,
      input.mosqueTimetable,
    ),
  ];
}
