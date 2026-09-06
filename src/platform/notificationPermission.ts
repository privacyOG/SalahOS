import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type PermissionStatus } from '@capacitor/local-notifications';

export interface NotificationPermissionClient {
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
}

export type NativeNotificationPermissionResult = 'unsupported' | 'granted' | 'denied';

/**
 * Request display permission only after an explicit notification opt-in.
 * Exact-alarm special access remains outside this helper and under the existing
 * Android user-action and inexact-fallback contract.
 */
export async function requestNativePrayerNotificationPermission(
  options: {
    readonly client?: NotificationPermissionClient;
    readonly supported?: boolean;
  } = {},
): Promise<NativeNotificationPermissionResult> {
  const supported = options.supported ?? Capacitor.isNativePlatform();
  if (!supported) return 'unsupported';

  const client = options.client ?? LocalNotifications;
  let status = await client.checkPermissions();
  if (status.display !== 'granted') status = await client.requestPermissions();
  return status.display === 'granted' ? 'granted' : 'denied';
}
