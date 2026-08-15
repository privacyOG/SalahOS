import type {
  NotificationPreferences,
  NotificationPrayerName,
  NotificationSound,
} from './notificationPreferences';

export type NotificationIntentKind = 'reminder' | 'prayer-time' | 'adhan';

export interface PrayerScheduleInput {
  readonly date: string;
  readonly prayer: NotificationPrayerName;
  readonly localMinutes: number;
}

export interface NotificationIntent {
  readonly id: string;
  readonly prayer: NotificationPrayerName;
  readonly prayerDate: string;
  readonly kind: NotificationIntentKind;
  readonly deliveryDate: string;
  readonly deliveryLocalMinutes: number;
  readonly sound: NotificationSound;
  readonly vibration: boolean;
}

export interface NotificationReconciliation {
  readonly schedule: readonly NotificationIntent[];
  readonly cancelIds: readonly string[];
}

function parseCivilDate(date: string): readonly [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) throw new RangeError(`Invalid civil date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const instant = new Date(Date.UTC(year, month - 1, day));
  if (
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid civil date: ${date}`);
  }
  return [year, month, day];
}

function shiftCivilDate(date: string, days: number): string {
  const [year, month, day] = parseCivilDate(date);
  const instant = new Date(Date.UTC(year, month - 1, day + days));
  return [
    String(instant.getUTCFullYear()).padStart(4, '0'),
    String(instant.getUTCMonth() + 1).padStart(2, '0'),
    String(instant.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeDelivery(date: string, localMinutes: number): {
  readonly date: string;
  readonly localMinutes: number;
} {
  if (!Number.isInteger(localMinutes)) {
    throw new RangeError('Notification local minutes must be an integer');
  }
  const dayOffset = Math.floor(localMinutes / 1_440);
  const normalizedMinutes = ((localMinutes % 1_440) + 1_440) % 1_440;
  return { date: shiftCivilDate(date, dayOffset), localMinutes: normalizedMinutes };
}

function intentId(date: string, prayer: NotificationPrayerName, kind: NotificationIntentKind): string {
  return `${date}:${prayer}:${kind}`;
}

function createIntent(
  input: PrayerScheduleInput,
  kind: NotificationIntentKind,
  deliveryMinutes: number,
  sound: NotificationSound,
  vibration: boolean,
): NotificationIntent {
  const delivery = normalizeDelivery(input.date, deliveryMinutes);
  return {
    id: intentId(input.date, input.prayer, kind),
    prayer: input.prayer,
    prayerDate: input.date,
    kind,
    deliveryDate: delivery.date,
    deliveryLocalMinutes: delivery.localMinutes,
    sound,
    vibration,
  };
}

function validatePrayerInput(input: PrayerScheduleInput): void {
  parseCivilDate(input.date);
  if (!Number.isInteger(input.localMinutes) || input.localMinutes < 0 || input.localMinutes >= 1_440) {
    throw new RangeError('Prayer local minutes must be an integer from 0 through 1439');
  }
}

export function buildNotificationIntents(
  prayers: readonly PrayerScheduleInput[],
  preferences: NotificationPreferences,
): readonly NotificationIntent[] {
  const intents: NotificationIntent[] = [];
  const seenIds = new Set<string>();

  for (const input of prayers) {
    validatePrayerInput(input);
    const preference = preferences[input.prayer];
    const candidates: NotificationIntent[] = [];

    if (preference.enabled && preference.reminderMinutes !== null) {
      candidates.push(
        createIntent(
          input,
          'reminder',
          input.localMinutes - preference.reminderMinutes,
          preference.sound,
          preference.vibration,
        ),
      );
    }

    if (preference.enabled && preference.prayerTimeNotification) {
      candidates.push(
        createIntent(
          input,
          'prayer-time',
          input.localMinutes,
          preference.sound,
          preference.vibration,
        ),
      );
    }

    if (preference.adhanEnabled) {
      candidates.push(createIntent(input, 'adhan', input.localMinutes, 'default', false));
    }

    for (const candidate of candidates) {
      if (seenIds.has(candidate.id)) continue;
      seenIds.add(candidate.id);
      intents.push(candidate);
    }
  }

  return intents.sort((left, right) =>
    `${left.deliveryDate}:${String(left.deliveryLocalMinutes).padStart(4, '0')}:${left.id}`.localeCompare(
      `${right.deliveryDate}:${String(right.deliveryLocalMinutes).padStart(4, '0')}:${right.id}`,
    ),
  );
}

function sameIntent(left: NotificationIntent, right: NotificationIntent): boolean {
  return (
    left.id === right.id &&
    left.deliveryDate === right.deliveryDate &&
    left.deliveryLocalMinutes === right.deliveryLocalMinutes &&
    left.sound === right.sound &&
    left.vibration === right.vibration
  );
}

export function reconcileNotificationIntents(
  current: readonly NotificationIntent[],
  desired: readonly NotificationIntent[],
): NotificationReconciliation {
  const currentById = new Map(current.map((intent) => [intent.id, intent]));
  const desiredById = new Map(desired.map((intent) => [intent.id, intent]));
  const cancelIds: string[] = [];
  const schedule: NotificationIntent[] = [];

  for (const [id, existing] of currentById) {
    const replacement = desiredById.get(id);
    if (replacement === undefined || !sameIntent(existing, replacement)) {
      cancelIds.push(id);
    }
  }

  for (const [id, intent] of desiredById) {
    const existing = currentById.get(id);
    if (existing === undefined || !sameIntent(existing, intent)) {
      schedule.push(intent);
    }
  }

  return {
    schedule,
    cancelIds: cancelIds.sort(),
  };
}
