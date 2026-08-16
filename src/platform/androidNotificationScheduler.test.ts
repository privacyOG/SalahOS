import { describe, expect, it } from 'vitest';
import type {
  Channel,
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
  PermissionStatus,
} from '@capacitor/local-notifications';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import type { ScheduledNotificationRecord } from './notificationScheduler';
import {
  androidNotificationId,
  synchronizeAndroidPrayerNotifications,
} from './androidNotificationScheduler';

class FakeClient {
  permission: PermissionStatus = { display: 'granted' };
  requested = 0;
  pending: PendingLocalNotificationSchema[] = [];
  scheduled: LocalNotificationSchema[] = [];
  cancelled: number[] = [];
  channels: Channel[] = [];

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
  createChannel(channel: Channel): Promise<void> {
    this.channels.push(channel);
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

describe('Android local notification scheduler', () => {
  it('uses stable positive 32-bit notification identifiers', () => {
    const first = androidNotificationId(futureRecord.id);
    expect(first).toBe(androidNotificationId(futureRecord.id));
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(2_147_483_647);
  });

  it('requests permission when needed and schedules future SalahOS records with metadata', async () => {
    const client = new FakeClient();
    client.permission = { display: 'prompt' };
    client.requestPermissions = () => {
      client.requested += 1;
      client.permission = { display: 'granted' };
      return Promise.resolve(client.permission);
    };

    const result = await synchronizeAndroidPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    expect(client.requested).toBe(1);
    expect(client.channels).toHaveLength(2);
    expect(client.scheduled).toHaveLength(1);
    expect(client.scheduled[0]).toMatchObject({
      id: androidNotificationId(futureRecord.id),
      title: 'Dhuhr prayer time',
      channelId: 'salahos-prayer-silent-vibration',
      autoCancel: true,
    });
    expect(client.scheduled[0]?.extra).toMatchObject({
      namespace: 'salahos-prayer-v1',
      record: futureRecord,
    });
  });

  it('fails closed when display permission is denied', async () => {
    const client = new FakeClient();
    client.permission = { display: 'denied' };

    const result = await synchronizeAndroidPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result).toEqual({ status: 'permission-denied' });
    expect(client.scheduled).toEqual([]);
  });

  it('cancels owned pending records when no future notification remains without requesting permission', async () => {
    const client = new FakeClient();
    client.permission = { display: 'denied' };
    client.pending = [
      {
        id: androidNotificationId(futureRecord.id),
        title: 'old',
        body: 'old',
        schedule: { at: new Date(futureRecord.instantEpochMilliseconds) },
        extra: { namespace: 'salahos-prayer-v1', record: futureRecord },
      },
    ];

    const result = await synchronizeAndroidPrayerNotifications([], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    expect(client.requested).toBe(0);
    expect(client.cancelled).toEqual([androidNotificationId(futureRecord.id)]);
  });
});
