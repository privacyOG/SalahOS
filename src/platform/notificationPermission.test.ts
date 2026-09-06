import type { PermissionStatus } from '@capacitor/local-notifications';
import { describe, expect, it } from 'vitest';
import {
  requestNativePrayerNotificationPermission,
  type NotificationPermissionClient,
} from './notificationPermission';

class FakeClient implements NotificationPermissionClient {
  requested = 0;

  constructor(
    private readonly checked: PermissionStatus,
    private readonly requestedStatus: PermissionStatus = checked,
  ) {}

  checkPermissions(): Promise<PermissionStatus> {
    return Promise.resolve(this.checked);
  }

  requestPermissions(): Promise<PermissionStatus> {
    this.requested += 1;
    return Promise.resolve(this.requestedStatus);
  }
}

const granted = { display: 'granted' } as PermissionStatus;
const denied = { display: 'denied' } as PermissionStatus;

describe('native notification permission', () => {
  it('does not touch native permission on unsupported or web surfaces', async () => {
    const client = new FakeClient(denied, granted);
    await expect(
      requestNativePrayerNotificationPermission({ client, supported: false }),
    ).resolves.toBe('unsupported');
    expect(client.requested).toBe(0);
  });

  it('does not re-request when display permission is already granted', async () => {
    const client = new FakeClient(granted);
    await expect(
      requestNativePrayerNotificationPermission({ client, supported: true }),
    ).resolves.toBe('granted');
    expect(client.requested).toBe(0);
  });

  it('requests display permission once after the caller opts in', async () => {
    const client = new FakeClient(denied, granted);
    await expect(
      requestNativePrayerNotificationPermission({ client, supported: true }),
    ).resolves.toBe('granted');
    expect(client.requested).toBe(1);
  });

  it('reports a declined platform permission after one request', async () => {
    const client = new FakeClient(denied, denied);
    await expect(
      requestNativePrayerNotificationPermission({ client, supported: true }),
    ).resolves.toBe('denied');
    expect(client.requested).toBe(1);
  });
});
