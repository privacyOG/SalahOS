import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type {
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
  PermissionStatus,
} from '@capacitor/local-notifications';
import type { NotificationPrayerName } from '../domain/notificationPreferences';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import type { Locale } from '../i18n/translations';
import {
  applyNotificationSchedulerPlan,
  type NotificationSchedulerAdapter,
  type NotificationSchedulerPlan,
  type ScheduledNotificationRecord,
} from './notificationScheduler';

const extraNamespace = 'salahos-prayer-v1';

interface LocalNotificationsClient {
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  getPending(): Promise<{ notifications: PendingLocalNotificationSchema[] }>;
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<unknown>;
  cancel(options: { notifications: { id: number }[] }): Promise<void>;
}

interface StoredNotificationExtra {
  readonly namespace: typeof extraNamespace;
  readonly record: ScheduledNotificationRecord;
}

const prayerNames: Readonly<Record<Locale, Readonly<Record<NotificationPrayerName, string>>>> = {
  en: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  ar: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
};

function notificationCopy(
  locale: Locale,
  record: ScheduledNotificationRecord,
): { readonly title: string; readonly body: string } {
  const prayer = prayerNames[locale][record.prayer];
  if (locale === 'ar') {
    if (record.kind === 'reminder')
      return { title: `تذكير صلاة ${prayer}`, body: `اقترب موعد صلاة ${prayer}.` };
    if (record.kind === 'adhan')
      return { title: `أذان ${prayer}`, body: `حان وقت صلاة ${prayer}.` };
    return { title: `وقت صلاة ${prayer}`, body: `حان وقت صلاة ${prayer}.` };
  }
  if (record.kind === 'reminder')
    return { title: `${prayer} reminder`, body: `${prayer} prayer time is approaching.` };
  if (record.kind === 'adhan')
    return { title: `${prayer} Adhan`, body: `It is time for ${prayer}.` };
  return { title: `${prayer} prayer time`, body: `It is time for ${prayer}.` };
}

function isRecord(value: unknown): value is ScheduledNotificationRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<ScheduledNotificationRecord>;
  return (
    typeof record.id === 'string' &&
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(String(record.prayer)) &&
    ['reminder', 'prayer-time', 'adhan'].includes(String(record.kind)) &&
    typeof record.instantEpochMilliseconds === 'number' &&
    Number.isFinite(record.instantEpochMilliseconds) &&
    typeof record.timeZone === 'string' &&
    typeof record.offsetMinutes === 'number' &&
    (record.ambiguity === 'none' || record.ambiguity === 'earlier-occurrence') &&
    (record.sound === 'default' || record.sound === 'silent') &&
    typeof record.vibration === 'boolean'
  );
}

export function iosNotificationId(id: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash & 0x7fffffff || 1;
}

function recordFromPending(
  pending: PendingLocalNotificationSchema,
): ScheduledNotificationRecord | null {
  const extra = pending.extra as Partial<StoredNotificationExtra> | undefined;
  if (extra?.namespace !== extraNamespace || !isRecord(extra.record)) return null;
  if (iosNotificationId(extra.record.id) !== pending.id) return null;
  return extra.record;
}

export function iosLocalNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

class IosNotificationScheduler implements NotificationSchedulerAdapter {
  constructor(
    private readonly client: LocalNotificationsClient,
    private readonly locale: Locale,
  ) {}

  async listScheduled(): Promise<readonly ScheduledNotificationRecord[]> {
    const pending = await this.client.getPending();
    return pending.notifications.flatMap((notification) => {
      const record = recordFromPending(notification);
      return record === null ? [] : [record];
    });
  }

  async schedule(record: ScheduledNotificationRecord): Promise<void> {
    const copy = notificationCopy(this.locale, record);
    const extra: StoredNotificationExtra = { namespace: extraNamespace, record };
    await this.client.schedule({
      notifications: [
        {
          id: iosNotificationId(record.id),
          title: copy.title,
          body: copy.body,
          schedule: { at: new Date(record.instantEpochMilliseconds) },
          extra,
          ...(record.sound === 'silent' ? { silent: true } : { sound: '' }),
        },
      ],
    });
  }

  async cancel(id: string): Promise<void> {
    await this.client.cancel({ notifications: [{ id: iosNotificationId(id) }] });
  }
}

export type IosNotificationSyncResult =
  | { readonly status: 'unsupported' }
  | { readonly status: 'permission-denied' }
  | { readonly status: 'synchronized'; readonly plan: NotificationSchedulerPlan };

export async function synchronizeIosPrayerNotifications(
  desired: readonly NotificationInstantResolution[],
  locale: Locale,
  options: {
    readonly client?: LocalNotificationsClient;
    readonly supported?: boolean;
    readonly nowEpochMilliseconds?: number;
  } = {},
): Promise<IosNotificationSyncResult> {
  const supported = options.supported ?? iosLocalNotificationsSupported();
  if (!supported) return { status: 'unsupported' };

  const client = options.client ?? LocalNotifications;
  const nowEpochMilliseconds = options.nowEpochMilliseconds ?? Date.now();
  const futureDesired = desired.filter(
    (resolution) =>
      resolution.status !== 'scheduled' || resolution.instant.getTime() > nowEpochMilliseconds,
  );
  const adapter = new IosNotificationScheduler(client, locale);

  if (futureDesired.length === 0) {
    const plan = await applyNotificationSchedulerPlan(adapter, []);
    return { status: 'synchronized', plan };
  }

  let permission = await client.checkPermissions();
  if (permission.display !== 'granted') permission = await client.requestPermissions();
  if (permission.display !== 'granted') return { status: 'permission-denied' };

  const plan = await applyNotificationSchedulerPlan(adapter, futureDesired);
  return { status: 'synchronized', plan };
}
