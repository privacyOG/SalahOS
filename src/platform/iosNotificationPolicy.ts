import type { ScheduledNotificationRecord } from './notificationScheduler';

export type IosNotificationLifecycle = 'foreground' | 'background' | 'terminated';
export type IosNotificationAudioMode = 'silent' | 'default-notification-sound';

export interface IosNotificationDeliveryPolicy {
  readonly delivery: 'system-local-notification';
  readonly lifecycle: IosNotificationLifecycle;
  readonly audio: IosNotificationAudioMode;
  readonly requiresAppBackgroundExecution: false;
  readonly fullAdhanAutoPlayback: false;
}

export function iosNotificationDeliveryPolicy(
  record: Pick<ScheduledNotificationRecord, 'sound'>,
  lifecycle: IosNotificationLifecycle,
): IosNotificationDeliveryPolicy {
  return {
    delivery: 'system-local-notification',
    lifecycle,
    audio: record.sound === 'silent' ? 'silent' : 'default-notification-sound',
    requiresAppBackgroundExecution: false,
    fullAdhanAutoPlayback: false,
  };
}

export const IOS_NOTIFICATION_LIFECYCLES: readonly IosNotificationLifecycle[] = [
  'foreground',
  'background',
  'terminated',
];
