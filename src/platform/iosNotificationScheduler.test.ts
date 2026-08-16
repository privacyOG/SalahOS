import { describe, expect, it } from 'vitest';
import type {
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
  PermissionStatus,
} from '@capacitor/local-notifications';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import type { ScheduledNotificationRecord } from './notificationScheduler';
import { iosNotificationId, synchronizeIosPrayerNotifications } from './iosNotificationScheduler';

class FakeClient {
  permission: PermissionStatus = { display: 'granted' };
  requested = 0;
  pending: PendingLocalNotificationSchema[] = [];
  scheduled: LocalNotificationSchema[] = [];
  cancelled: number[] = [];

  checkPermissions(): Promise<PermissionStatus> {
    return Promise.resolve(this.permission);
  }
  requestPermissions(): Promise<PermissionStatus> {
    this.requested += 1;
    return Promise.resolve(this.permission);
  }
  getPending(): Promise<{ notifications: PendingLocalNotificationSchema[] }> {
    return Promise.resolve({ notifications: this.pending });
  }
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void> {
    this.scheduled.push(...options.notifications);
    return Promise.resolve();
  }
  cancel(options: { notifications: { id: number }[] }): Promise<void> {
    this.cancelled.push(...options.notifications.map((notification) => notification.id));
    return Promise.resolve();
  }
}

function resolution(record: ScheduledNotificationRecord): NotificationInstantResolution {
  return {
    status: 'scheduled',
    intent: {
      id: record.id,
      prayer: record.prayer,
      prayerDate: '2026-08-16',
      kind: record.kind,
      deliveryDate: '2026-08-16',
      deliveryLocalMinutes: 720,
      sound: record.sound,
      vibration: record.vibration,
    },
    instant: new Date(record.instantEpochMilliseconds),
    timeZone: record.timeZone,
    offsetMinutes: record.offsetMinutes,
    ambiguity: record.ambiguity,
  };
}

const futureRecord: ScheduledNotificationRecord = {
  id: '2026-08-16:dhuhr:prayer-time',
  prayer: 'dhuhr',
  kind: 'prayer-time',
  instantEpochMilliseconds: Date.parse('2026-08-16T12:00:00.000Z'),
  timeZone: 'Australia/Sydney',
  offsetMinutes: 600,
  ambiguity: 'none',
  sound: 'silent',
  vibration: true,
};

describe('iOS local notification scheduler', () => {
  it('uses stable positive notification identifiers', () => {
    const first = iosNotificationId(futureRecord.id);
    expect(first).toBe(iosNotificationId(futureRecord.id));
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(2_147_483_647);
  });

  it('requests display permission then schedules an owned silent request', async () => {
    const client = new FakeClient();
    client.permission = { display: 'prompt' };
    client.requestPermissions = () => {
      client.requested += 1;
      client.permission = { display: 'granted' };
      return Promise.resolve(client.permission);
    };

    const result = await synchronizeIosPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    expect(client.requested).toBe(1);
    expect(client.scheduled).toHaveLength(1);
    expect(client.scheduled[0]).toMatchObject({
      id: iosNotificationId(futureRecord.id),
      title: 'Dhuhr prayer time',
      silent: true,
    });
    expect(client.scheduled[0]?.sound).toBeUndefined();
    expect(client.scheduled[0]?.extra).toMatchObject({
      namespace: 'salahos-prayer-v1',
      record: futureRecord,
      deliveryPolicies: [
        {
          lifecycle: 'foreground',
          requiresAppBackgroundExecution: false,
          fullAdhanAutoPlayback: false,
        },
        {
          lifecycle: 'background',
          requiresAppBackgroundExecution: false,
          fullAdhanAutoPlayback: false,
        },
        {
          lifecycle: 'terminated',
          requiresAppBackgroundExecution: false,
          fullAdhanAutoPlayback: false,
        },
      ],
    });
  });

  it('uses platform-default sound fallback for non-silent alerts', async () => {
    const client = new FakeClient();
    const audible = { ...futureRecord, sound: 'default' as const };

    const result = await synchronizeIosPrayerNotifications([resolution(audible)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    expect(client.scheduled[0]).toMatchObject({ sound: '' });
    expect(client.scheduled[0]?.silent).toBeUndefined();
  });

  it('fails closed when display permission remains denied', async () => {
    const client = new FakeClient();
    client.permission = { display: 'denied' };

    const result = await synchronizeIosPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result).toEqual({ status: 'permission-denied' });
    expect(client.requested).toBe(1);
    expect(client.scheduled).toEqual([]);
  });

  it('cancels owned pending records without asking permission when no future request remains', async () => {
    const client = new FakeClient();
    client.permission = { display: 'denied' };
    client.pending = [
      {
        id: iosNotificationId(futureRecord.id),
        title: 'old',
        body: 'old',
        schedule: { at: new Date(futureRecord.instantEpochMilliseconds) },
        extra: { namespace: 'salahos-prayer-v1', record: futureRecord },
      },
    ];

    const result = await synchronizeIosPrayerNotifications([], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    expect(client.requested).toBe(0);
    expect(client.cancelled).toEqual([iosNotificationId(futureRecord.id)]);
  });

  it('does nothing on unsupported targets', async () => {
    const client = new FakeClient();
    const result = await synchronizeIosPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: false,
    });

    expect(result).toEqual({ status: 'unsupported' });
    expect(client.scheduled).toEqual([]);
  });
});
