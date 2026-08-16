import { describe, expect, it } from 'vitest';
import type {
  Channel,
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
  PermissionStatus,
  SettingsPermissionStatus,
} from '@capacitor/local-notifications';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import type { ScheduledNotificationRecord } from './notificationScheduler';
import {
  androidNotificationId,
  openAndroidExactAlarmSettings,
  readAndroidExactAlarmCapability,
  synchronizeAndroidPrayerNotifications,
} from './androidNotificationScheduler';

class FakeClient {
  permission: PermissionStatus = { display: 'granted' };
  exactPermission: SettingsPermissionStatus = { exact_alarm: 'granted' };
  requested = 0;
  exactChecks = 0;
  exactSettingsChanges = 0;
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
  checkExactNotificationSetting(): Promise<SettingsPermissionStatus> {
    this.exactChecks += 1;
    return Promise.resolve(this.exactPermission);
  }
  changeExactNotificationSetting(): Promise<SettingsPermissionStatus> {
    this.exactSettingsChanges += 1;
    return Promise.resolve(this.exactPermission);
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

  it('reports exact capability only when Android exact-alarm access is granted', async () => {
    const client = new FakeClient();
    expect(await readAndroidExactAlarmCapability({ client, supported: true })).toBe('exact');

    client.exactPermission = { exact_alarm: 'denied' };
    expect(await readAndroidExactAlarmCapability({ client, supported: true })).toBe('inexact');
    expect(client.exactChecks).toBe(2);
  });

  it('does not query native exact-alarm settings on unsupported targets', async () => {
    const client = new FakeClient();
    expect(await readAndroidExactAlarmCapability({ client, supported: false })).toBe('unsupported');
    expect(client.exactChecks).toBe(0);
  });

  it('opens exact-alarm settings only through an explicit caller action', async () => {
    const client = new FakeClient();
    client.exactPermission = { exact_alarm: 'denied' };

    const result = await openAndroidExactAlarmSettings({ client, supported: true });

    expect(result).toBe('inexact');
    expect(client.exactSettingsChanges).toBe(1);
  });

  it('requests display permission and schedules future records with exact capability metadata', async () => {
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
    if (result.status === 'synchronized') expect(result.alarmPrecision).toBe('exact');
    expect(client.requested).toBe(1);
    expect(client.exactChecks).toBe(1);
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

  it('keeps scheduling with an honest inexact fallback when exact access is denied', async () => {
    const client = new FakeClient();
    client.exactPermission = { exact_alarm: 'denied' };

    const result = await synchronizeAndroidPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result.status).toBe('synchronized');
    if (result.status === 'synchronized') expect(result.alarmPrecision).toBe('inexact');
    expect(client.scheduled).toHaveLength(1);
    expect(client.exactSettingsChanges).toBe(0);
  });

  it('fails closed when display permission is denied before checking exact access', async () => {
    const client = new FakeClient();
    client.permission = { display: 'denied' };

    const result = await synchronizeAndroidPrayerNotifications([resolution(futureRecord)], 'en', {
      client,
      supported: true,
      nowEpochMilliseconds: Date.parse('2026-08-16T00:00:00.000Z'),
    });

    expect(result).toEqual({ status: 'permission-denied' });
    expect(client.scheduled).toEqual([]);
    expect(client.exactChecks).toBe(0);
  });

  it('cancels owned pending records when no future notification remains without requesting display permission', async () => {
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
    expect(client.exactChecks).toBe(1);
  });
});
