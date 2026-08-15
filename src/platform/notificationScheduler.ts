import type { NotificationIntentKind } from '../domain/notificationSchedule';
import type { NotificationPrayerName, NotificationSound } from '../domain/notificationPreferences';
import type { NotificationInstantResolution } from '../domain/notificationInstant';

export interface ScheduledNotificationRecord {
  readonly id: string;
  readonly prayer: NotificationPrayerName;
  readonly kind: NotificationIntentKind;
  readonly instantEpochMilliseconds: number;
  readonly timeZone: string;
  readonly offsetMinutes: number;
  readonly ambiguity: 'none' | 'earlier-occurrence';
  readonly sound: NotificationSound;
  readonly vibration: boolean;
}

export interface NotificationSchedulerAdapter {
  listScheduled(): Promise<readonly ScheduledNotificationRecord[]>;
  schedule(notification: ScheduledNotificationRecord): Promise<void>;
  cancel(id: string): Promise<void>;
}

export interface NotificationSchedulerPlan {
  readonly schedule: readonly ScheduledNotificationRecord[];
  readonly cancelIds: readonly string[];
  readonly skippedIds: readonly string[];
}

function scheduledRecord(
  resolution: Extract<NotificationInstantResolution, { readonly status: 'scheduled' }>,
): ScheduledNotificationRecord {
  return {
    id: resolution.intent.id,
    prayer: resolution.intent.prayer,
    kind: resolution.intent.kind,
    instantEpochMilliseconds: resolution.instant.getTime(),
    timeZone: resolution.timeZone,
    offsetMinutes: resolution.offsetMinutes,
    ambiguity: resolution.ambiguity,
    sound: resolution.intent.sound,
    vibration: resolution.intent.vibration,
  };
}

function sameRecord(
  left: ScheduledNotificationRecord,
  right: ScheduledNotificationRecord,
): boolean {
  return (
    left.id === right.id &&
    left.prayer === right.prayer &&
    left.kind === right.kind &&
    left.instantEpochMilliseconds === right.instantEpochMilliseconds &&
    left.timeZone === right.timeZone &&
    left.offsetMinutes === right.offsetMinutes &&
    left.ambiguity === right.ambiguity &&
    left.sound === right.sound &&
    left.vibration === right.vibration
  );
}

function desiredRecords(
  resolutions: readonly NotificationInstantResolution[],
): {
  readonly scheduled: readonly ScheduledNotificationRecord[];
  readonly skippedIds: readonly string[];
} {
  const byId = new Map<string, ScheduledNotificationRecord>();
  const skippedIds = new Set<string>();

  for (const resolution of resolutions) {
    if (resolution.status === 'skipped-nonexistent-local-time') {
      skippedIds.add(resolution.intent.id);
      byId.delete(resolution.intent.id);
      continue;
    }

    const record = scheduledRecord(resolution);
    const existing = byId.get(record.id);
    if (existing !== undefined && !sameRecord(existing, record)) {
      throw new RangeError(`Conflicting notification schedule record: ${record.id}`);
    }
    byId.set(record.id, record);
    skippedIds.delete(record.id);
  }

  return {
    scheduled: [...byId.values()].sort((left, right) =>
      left.instantEpochMilliseconds === right.instantEpochMilliseconds
        ? left.id.localeCompare(right.id)
        : left.instantEpochMilliseconds - right.instantEpochMilliseconds,
    ),
    skippedIds: [...skippedIds].sort(),
  };
}

export function planNotificationScheduler(
  current: readonly ScheduledNotificationRecord[],
  desired: readonly NotificationInstantResolution[],
): NotificationSchedulerPlan {
  const currentById = new Map<string, ScheduledNotificationRecord>();
  for (const record of current) {
    const existing = currentById.get(record.id);
    if (existing !== undefined && !sameRecord(existing, record)) {
      throw new RangeError(`Conflicting installed notification record: ${record.id}`);
    }
    currentById.set(record.id, record);
  }

  const desiredState = desiredRecords(desired);
  const desiredById = new Map(desiredState.scheduled.map((record) => [record.id, record]));
  const cancelIds: string[] = [];
  const schedule: ScheduledNotificationRecord[] = [];

  for (const [id, existing] of currentById) {
    const replacement = desiredById.get(id);
    if (replacement === undefined || !sameRecord(existing, replacement)) {
      cancelIds.push(id);
    }
  }

  for (const [id, record] of desiredById) {
    const existing = currentById.get(id);
    if (existing === undefined || !sameRecord(existing, record)) {
      schedule.push(record);
    }
  }

  return {
    schedule,
    cancelIds: cancelIds.sort(),
    skippedIds: desiredState.skippedIds,
  };
}

export async function applyNotificationSchedulerPlan(
  adapter: NotificationSchedulerAdapter,
  desired: readonly NotificationInstantResolution[],
): Promise<NotificationSchedulerPlan> {
  const current = await adapter.listScheduled();
  const plan = planNotificationScheduler(current, desired);

  for (const id of plan.cancelIds) {
    await adapter.cancel(id);
  }
  for (const record of plan.schedule) {
    await adapter.schedule(record);
  }

  return plan;
}
