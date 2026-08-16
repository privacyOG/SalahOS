import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import { resolveNotificationScheduleInstants } from '../domain/notificationInstant';
import {
  defaultNotificationPreferences,
  updatePrayerNotificationPreference,
} from '../domain/notificationPreferences';
import type { NotificationPrayerName } from '../domain/notificationPreferences';
import { buildNotificationIntents } from '../domain/notificationSchedule';
import {
  applyNotificationSchedulerPlan,
  type NotificationSchedulerAdapter,
  type ScheduledNotificationRecord,
} from '../platform/notificationScheduler';

class MemoryScheduler implements NotificationSchedulerAdapter {
  readonly records = new Map<string, ScheduledNotificationRecord>();
  readonly operations: string[] = [];

  listScheduled(): Promise<readonly ScheduledNotificationRecord[]> {
    return Promise.resolve([...this.records.values()]);
  }

  schedule(notification: ScheduledNotificationRecord): Promise<void> {
    this.operations.push(`schedule:${notification.id}`);
    this.records.set(notification.id, notification);
    return Promise.resolve();
  }

  cancel(id: string): Promise<void> {
    this.operations.push(`cancel:${id}`);
    this.records.delete(id);
    return Promise.resolve();
  }
}

const sydney = createCoordinates(-33.8688, 151.2093);
const instant = new Date('2026-08-16T02:00:00.000Z');

function prayerInputs(adjustments: Readonly<Partial<Record<NotificationPrayerName, number>>> = {}) {
  const dashboard = buildPrayerDashboard({
    instant,
    coordinates: sydney,
    adjustments,
  });

  return dashboard.prayers.flatMap((prayer) => {
    if (prayer.name === 'sunrise' || prayer.localMinutes === null) return [];
    return [
      {
        date: dashboard.today.date,
        prayer: prayer.name,
        localMinutes: prayer.localMinutes,
      },
    ];
  });
}

describe('notification scheduling integration flow', () => {
  it('reconciles recalculated prayer times through exact-instant scheduler delivery', async () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 15,
      prayerTimeNotification: true,
      sound: 'silent',
      vibration: false,
    });
    const adapter = new MemoryScheduler();

    const initialIntents = buildNotificationIntents(prayerInputs(), preferences);
    const initialResolutions = resolveNotificationScheduleInstants(
      initialIntents,
      'Australia/Sydney',
    );
    const initialPlan = await applyNotificationSchedulerPlan(adapter, initialResolutions);

    expect(initialPlan.cancelIds).toEqual([]);
    expect(initialPlan.skippedIds).toEqual([]);
    expect(initialPlan.schedule.map((record) => record.id)).toEqual([
      '2026-08-16:fajr:reminder',
      '2026-08-16:fajr:prayer-time',
    ]);
    const initialPrayerInstant = adapter.records.get(
      '2026-08-16:fajr:prayer-time',
    )?.instantEpochMilliseconds;
    expect(initialPrayerInstant).toBeTypeOf('number');

    adapter.operations.length = 0;
    const recalculatedIntents = buildNotificationIntents(prayerInputs({ fajr: 5 }), preferences);
    const recalculatedResolutions = resolveNotificationScheduleInstants(
      recalculatedIntents,
      'Australia/Sydney',
    );
    const recalculatedPlan = await applyNotificationSchedulerPlan(adapter, recalculatedResolutions);

    expect(recalculatedPlan.cancelIds).toEqual([
      '2026-08-16:fajr:prayer-time',
      '2026-08-16:fajr:reminder',
    ]);
    expect(recalculatedPlan.schedule.map((record) => record.id)).toEqual([
      '2026-08-16:fajr:reminder',
      '2026-08-16:fajr:prayer-time',
    ]);
    expect(adapter.operations).toEqual([
      'cancel:2026-08-16:fajr:prayer-time',
      'cancel:2026-08-16:fajr:reminder',
      'schedule:2026-08-16:fajr:reminder',
      'schedule:2026-08-16:fajr:prayer-time',
    ]);

    const recalculatedPrayerInstant = adapter.records.get(
      '2026-08-16:fajr:prayer-time',
    )?.instantEpochMilliseconds;
    expect(recalculatedPrayerInstant).toBe(initialPrayerInstant! + 5 * 60_000);
    expect(adapter.records.get('2026-08-16:fajr:prayer-time')).toMatchObject({
      timeZone: 'Australia/Sydney',
      sound: 'silent',
      vibration: false,
      ambiguity: 'none',
    });

    adapter.operations.length = 0;
    const idempotentPlan = await applyNotificationSchedulerPlan(adapter, recalculatedResolutions);
    expect(idempotentPlan).toEqual({ schedule: [], cancelIds: [], skippedIds: [] });
    expect(adapter.operations).toEqual([]);
  });
});
