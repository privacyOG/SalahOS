import { describe, expect, it } from 'vitest';
import { resolveNotificationScheduleInstants } from '../domain/notificationInstant';
import {
  defaultNotificationPreferences,
  updatePrayerNotificationPreference,
} from '../domain/notificationPreferences';
import { buildNotificationIntents, type PrayerScheduleInput } from '../domain/notificationSchedule';
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

function resolve(inputs: readonly PrayerScheduleInput[], preferences = defaultNotificationPreferences) {
  return resolveNotificationScheduleInstants(
    buildNotificationIntents(inputs, preferences),
    'Australia/Sydney',
  );
}

const fajr: PrayerScheduleInput = {
  date: '2026-08-16',
  prayer: 'fajr',
  localMinutes: 330,
};

const nextDayFajr: PrayerScheduleInput = {
  date: '2026-08-17',
  prayer: 'fajr',
  localMinutes: 329,
};

describe('notification delivery lifecycle integration', () => {
  it('carries per-prayer reminder, prayer-time, sound, vibration and Adhan choices into installed records', async () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 20,
      prayerTimeNotification: true,
      sound: 'silent',
      vibration: true,
      adhanEnabled: true,
    });
    const scheduler = new MemoryScheduler();

    const plan = await applyNotificationSchedulerPlan(
      scheduler,
      resolve([fajr, fajr], preferences),
    );

    expect(plan.cancelIds).toEqual([]);
    expect(plan.schedule.map((record) => record.id)).toEqual([
      '2026-08-16:fajr:reminder',
      '2026-08-16:fajr:adhan',
      '2026-08-16:fajr:prayer-time',
    ]);
    expect([...scheduler.records.values()]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '2026-08-16:fajr:reminder',
          sound: 'silent',
          vibration: true,
        }),
        expect.objectContaining({
          id: '2026-08-16:fajr:prayer-time',
          sound: 'silent',
          vibration: true,
        }),
        expect.objectContaining({
          id: '2026-08-16:fajr:adhan',
          sound: 'default',
          vibration: false,
        }),
      ]),
    );

    scheduler.operations.length = 0;
    const identical = await applyNotificationSchedulerPlan(
      scheduler,
      resolve([fajr], preferences),
    );
    expect(identical).toEqual({ schedule: [], cancelIds: [], skippedIds: [] });
    expect(scheduler.operations).toEqual([]);
  });

  it('cancels every owned prayer job when that prayer is disabled', async () => {
    const enabled = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 15,
      prayerTimeNotification: true,
      sound: 'default',
      vibration: false,
      adhanEnabled: true,
    });
    const disabled = updatePrayerNotificationPreference(enabled, 'fajr', {
      enabled: false,
      reminderMinutes: null,
      prayerTimeNotification: false,
      adhanEnabled: false,
    });
    const scheduler = new MemoryScheduler();

    await applyNotificationSchedulerPlan(scheduler, resolve([fajr], enabled));
    scheduler.operations.length = 0;
    const plan = await applyNotificationSchedulerPlan(scheduler, resolve([fajr], disabled));

    expect(plan.schedule).toEqual([]);
    expect(plan.cancelIds).toEqual([
      '2026-08-16:fajr:adhan',
      '2026-08-16:fajr:prayer-time',
      '2026-08-16:fajr:reminder',
    ]);
    expect(scheduler.records.size).toBe(0);
  });

  it('replaces the prior civil-date jobs at daily rollover without duplicates', async () => {
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: 10,
      prayerTimeNotification: true,
    });
    const scheduler = new MemoryScheduler();

    await applyNotificationSchedulerPlan(scheduler, resolve([fajr], preferences));
    scheduler.operations.length = 0;
    const rollover = await applyNotificationSchedulerPlan(
      scheduler,
      resolve([nextDayFajr], preferences),
    );

    expect(rollover.cancelIds).toEqual([
      '2026-08-16:fajr:prayer-time',
      '2026-08-16:fajr:reminder',
    ]);
    expect(rollover.schedule.map((record) => record.id)).toEqual([
      '2026-08-17:fajr:reminder',
      '2026-08-17:fajr:prayer-time',
    ]);
    expect([...scheduler.records.keys()].sort()).toEqual([
      '2026-08-17:fajr:prayer-time',
      '2026-08-17:fajr:reminder',
    ]);
  });

  it('removes an installed job when a recalculation lands in a nonexistent DST wall-clock time', async () => {
    const scheduler = new MemoryScheduler();
    scheduler.records.set('2026-10-04:fajr:prayer-time', {
      id: '2026-10-04:fajr:prayer-time',
      prayer: 'fajr',
      kind: 'prayer-time',
      instantEpochMilliseconds: Date.parse('2026-10-03T16:30:00.000Z'),
      timeZone: 'Australia/Sydney',
      offsetMinutes: 600,
      ambiguity: 'none',
      sound: 'default',
      vibration: true,
    });
    const preferences = updatePrayerNotificationPreference(defaultNotificationPreferences, 'fajr', {
      enabled: true,
      reminderMinutes: null,
      prayerTimeNotification: true,
    });
    const springForwardInput: PrayerScheduleInput = {
      date: '2026-10-04',
      prayer: 'fajr',
      localMinutes: 150,
    };

    const plan = await applyNotificationSchedulerPlan(
      scheduler,
      resolve([springForwardInput], preferences),
    );

    expect(plan.schedule).toEqual([]);
    expect(plan.cancelIds).toEqual(['2026-10-04:fajr:prayer-time']);
    expect(plan.skippedIds).toEqual(['2026-10-04:fajr:prayer-time']);
    expect(scheduler.records.size).toBe(0);
  });
});
