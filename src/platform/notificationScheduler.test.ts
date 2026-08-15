import { describe, expect, it } from 'vitest';
import type { NotificationIntent } from '../domain/notificationSchedule';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import {
  applyNotificationSchedulerPlan,
  planNotificationScheduler,
} from './notificationScheduler';
import type {
  NotificationSchedulerAdapter,
  ScheduledNotificationRecord,
} from './notificationScheduler';

function intent(id: string, prayer: 'fajr' | 'dhuhr' = 'fajr'): NotificationIntent {
  return {
    id,
    prayer,
    prayerDate: '2026-08-16',
    kind: 'prayer-time',
    deliveryDate: '2026-08-16',
    deliveryLocalMinutes: prayer === 'fajr' ? 330 : 730,
    sound: 'default',
    vibration: true,
  };
}

function scheduled(
  id: string,
  instant: string,
  options: {
    readonly prayer?: 'fajr' | 'dhuhr';
    readonly timeZone?: string;
    readonly offsetMinutes?: number;
    readonly ambiguity?: 'none' | 'earlier-occurrence';
  } = {},
): NotificationInstantResolution {
  return {
    status: 'scheduled',
    intent: intent(id, options.prayer),
    timeZone: options.timeZone ?? 'Australia/Sydney',
    instant: new Date(instant),
    offsetMinutes: options.offsetMinutes ?? 600,
    ambiguity: options.ambiguity ?? 'none',
  };
}

function skipped(id: string): NotificationInstantResolution {
  return {
    status: 'skipped-nonexistent-local-time',
    intent: intent(id),
    timeZone: 'Europe/London',
  };
}

class MemoryScheduler implements NotificationSchedulerAdapter {
  readonly records = new Map<string, ScheduledNotificationRecord>();
  readonly operations: string[] = [];

  async listScheduled(): Promise<readonly ScheduledNotificationRecord[]> {
    return [...this.records.values()];
  }

  async schedule(notification: ScheduledNotificationRecord): Promise<void> {
    this.operations.push(`schedule:${notification.id}`);
    this.records.set(notification.id, notification);
  }

  async cancel(id: string): Promise<void> {
    this.operations.push(`cancel:${id}`);
    this.records.delete(id);
  }
}

describe('notification scheduler adapter', () => {
  it('schedules exact resolved notifications through the adapter', async () => {
    const adapter = new MemoryScheduler();
    const resolution = scheduled('fajr', '2026-08-15T19:30:00.000Z');

    const plan = await applyNotificationSchedulerPlan(adapter, [resolution]);

    expect(plan.cancelIds).toEqual([]);
    expect(plan.skippedIds).toEqual([]);
    expect(plan.schedule.map((record) => record.id)).toEqual(['fajr']);
    expect(adapter.operations).toEqual(['schedule:fajr']);
    expect(adapter.records.get('fajr')?.instantEpochMilliseconds).toBe(
      Date.parse('2026-08-15T19:30:00.000Z'),
    );
  });

  it('is idempotent when the desired schedule is applied twice', async () => {
    const adapter = new MemoryScheduler();
    const resolution = scheduled('fajr', '2026-08-15T19:30:00.000Z');

    await applyNotificationSchedulerPlan(adapter, [resolution]);
    adapter.operations.length = 0;
    const secondPlan = await applyNotificationSchedulerPlan(adapter, [resolution]);

    expect(secondPlan).toEqual({ schedule: [], cancelIds: [], skippedIds: [] });
    expect(adapter.operations).toEqual([]);
  });

  it('cancels stale state before scheduling a changed exact instant', async () => {
    const adapter = new MemoryScheduler();
    await applyNotificationSchedulerPlan(adapter, [
      scheduled('fajr', '2026-08-15T19:30:00.000Z'),
    ]);
    adapter.operations.length = 0;

    const plan = await applyNotificationSchedulerPlan(adapter, [
      scheduled('fajr', '2026-08-15T19:35:00.000Z'),
    ]);

    expect(plan.cancelIds).toEqual(['fajr']);
    expect(plan.schedule.map((record) => record.id)).toEqual(['fajr']);
    expect(adapter.operations).toEqual(['cancel:fajr', 'schedule:fajr']);
    expect(adapter.records.get('fajr')?.instantEpochMilliseconds).toBe(
      Date.parse('2026-08-15T19:35:00.000Z'),
    );
  });

  it('cancels installed notifications that become nonexistent local times', async () => {
    const adapter = new MemoryScheduler();
    await applyNotificationSchedulerPlan(adapter, [
      scheduled('fajr', '2026-03-29T00:30:00.000Z', {
        timeZone: 'Europe/London',
        offsetMinutes: 0,
      }),
    ]);
    adapter.operations.length = 0;

    const plan = await applyNotificationSchedulerPlan(adapter, [skipped('fajr')]);

    expect(plan.schedule).toEqual([]);
    expect(plan.cancelIds).toEqual(['fajr']);
    expect(plan.skippedIds).toEqual(['fajr']);
    expect(adapter.operations).toEqual(['cancel:fajr']);
    expect(adapter.records.size).toBe(0);
  });

  it('replaces a record when timezone or ambiguity policy metadata changes', () => {
    const desired = scheduled('fajr', '2026-10-25T00:30:00.000Z', {
      timeZone: 'Europe/London',
      offsetMinutes: 60,
      ambiguity: 'earlier-occurrence',
    });
    const current: ScheduledNotificationRecord[] = [
      {
        id: 'fajr',
        prayer: 'fajr',
        kind: 'prayer-time',
        instantEpochMilliseconds: Date.parse('2026-10-25T00:30:00.000Z'),
        timeZone: 'Europe/London',
        offsetMinutes: 60,
        ambiguity: 'none',
        sound: 'default',
        vibration: true,
      },
    ];

    const plan = planNotificationScheduler(current, [desired]);
    expect(plan.cancelIds).toEqual(['fajr']);
    expect(plan.schedule.map((record) => record.ambiguity)).toEqual(['earlier-occurrence']);
  });

  it('rejects conflicting desired records that share one stable id', () => {
    expect(() =>
      planNotificationScheduler([], [
        scheduled('same', '2026-08-15T19:30:00.000Z'),
        scheduled('same', '2026-08-15T19:31:00.000Z'),
      ]),
    ).toThrow(RangeError);
  });
});
