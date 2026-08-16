from pathlib import Path

# Branch-only integration helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing integration anchor: {old[:120]}')
    return text.replace(old, new, 1)


Path('src/domain/notificationPrayerInputs.ts').write_text(r'''import type { PrayerScheduleInput } from './notificationSchedule';
import { mosqueDayForDate, resolvePrayerSource } from './mosqueTimetable';
import type { MosqueTimetable, PrayerSourceMode } from './mosqueTimetable';
import type { PrayerDashboardModel } from './dashboard';
import type { NotificationPrayerName } from './notificationPreferences';

const notificationPrayers: readonly NotificationPrayerName[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

function inputsForDate(
  date: string,
  schedule: PrayerDashboardModel['today'],
  sourceMode: PrayerSourceMode,
  mosqueTimetable: MosqueTimetable | null,
): readonly PrayerScheduleInput[] {
  const mosqueDay = mosqueTimetable === null ? null : mosqueDayForDate(mosqueTimetable, date);
  const resolved = resolvePrayerSource(sourceMode, schedule, mosqueDay);

  return notificationPrayers.flatMap((prayer) => {
    const localMinutes = resolved[prayer].startLocalMinutes;
    return localMinutes === null ? [] : [{ date, prayer, localMinutes }];
  });
}

export function buildNotificationPrayerInputs(input: {
  readonly dashboard: PrayerDashboardModel;
  readonly sourceMode: PrayerSourceMode;
  readonly mosqueTimetable: MosqueTimetable | null;
}): readonly PrayerScheduleInput[] {
  return [
    ...inputsForDate(
      input.dashboard.today.date,
      input.dashboard.today,
      input.sourceMode,
      input.mosqueTimetable,
    ),
    ...inputsForDate(
      input.dashboard.tomorrow.date,
      input.dashboard.tomorrow,
      input.sourceMode,
      input.mosqueTimetable,
    ),
  ];
}
''')

Path('src/domain/notificationPrayerInputs.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';
import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import { buildNotificationPrayerInputs } from './notificationPrayerInputs';
import type { MosqueTimetable } from './mosqueTimetable';

const dashboard = buildPrayerDashboard({
  instant: new Date('2026-08-16T02:00:00.000Z'),
  coordinates: createCoordinates(-33.8688, 151.2093),
});

describe('notification prayer inputs', () => {
  it('builds the five obligatory prayers for today and tomorrow from calculated schedules', () => {
    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: 'calculated',
      mosqueTimetable: null,
    });

    expect(inputs).toHaveLength(10);
    expect(new Set(inputs.map((input) => input.date))).toEqual(
      new Set([dashboard.today.date, dashboard.tomorrow.date]),
    );
    expect(inputs.map((input) => input.prayer)).not.toContain('sunrise');
  });

  it('uses mosque start times for each available timetable day without calculated fallback', () => {
    const timetable: MosqueTimetable = {
      version: 1,
      mosqueName: 'Test Mosque',
      days: [
        {
          date: dashboard.today.date,
          prayers: {
            fajr: { startLocalMinutes: 300, iqamah: null },
            dhuhr: { startLocalMinutes: 720, iqamah: null },
            asr: { startLocalMinutes: 900, iqamah: null },
            maghrib: { startLocalMinutes: 1080, iqamah: null },
            isha: { startLocalMinutes: 1170, iqamah: null },
          },
          jumuah: [],
        },
      ],
    };

    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: 'local-mosque',
      mosqueTimetable: timetable,
    });

    expect(inputs).toEqual([
      { date: dashboard.today.date, prayer: 'fajr', localMinutes: 300 },
      { date: dashboard.today.date, prayer: 'dhuhr', localMinutes: 720 },
      { date: dashboard.today.date, prayer: 'asr', localMinutes: 900 },
      { date: dashboard.today.date, prayer: 'maghrib', localMinutes: 1080 },
      { date: dashboard.today.date, prayer: 'isha', localMinutes: 1170 },
    ]);
  });
});
''')

Path('src/platform/androidNotificationScheduler.ts').write_text(r'''import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type {
  Channel,
  LocalNotificationSchema,
  PendingLocalNotificationSchema,
  PermissionStatus,
} from '@capacitor/local-notifications';
import type { Locale } from '../i18n/translations';
import type { NotificationPrayerName } from '../domain/notificationPreferences';
import type { NotificationInstantResolution } from '../domain/notificationInstant';
import {
  applyNotificationSchedulerPlan,
  type NotificationSchedulerAdapter,
  type NotificationSchedulerPlan,
  type ScheduledNotificationRecord,
} from './notificationScheduler';

const extraNamespace = 'salahos-prayer-v1';
const silentChannelId = 'salahos-prayer-silent';
const silentVibrationChannelId = 'salahos-prayer-silent-vibration';

interface LocalNotificationsClient {
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  getPending(): Promise<{ notifications: PendingLocalNotificationSchema[] }>;
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<unknown>;
  cancel(options: { notifications: { id: number }[] }): Promise<void>;
  createChannel(channel: Channel): Promise<void>;
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
    if (record.kind === 'reminder') return { title: `تذكير صلاة ${prayer}`, body: `اقترب موعد صلاة ${prayer}.` };
    if (record.kind === 'adhan') return { title: `أذان ${prayer}`, body: `حان وقت صلاة ${prayer}.` };
    return { title: `وقت صلاة ${prayer}`, body: `حان وقت صلاة ${prayer}.` };
  }
  if (record.kind === 'reminder') return { title: `${prayer} reminder`, body: `${prayer} prayer time is approaching.` };
  if (record.kind === 'adhan') return { title: `${prayer} Adhan`, body: `It is time for ${prayer}.` };
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

function recordFromPending(pending: PendingLocalNotificationSchema): ScheduledNotificationRecord | null {
  const extra = pending.extra as Partial<StoredNotificationExtra> | undefined;
  if (extra?.namespace !== extraNamespace || !isRecord(extra.record)) return null;
  if (androidNotificationId(extra.record.id) !== pending.id) return null;
  return extra.record;
}

export function androidNotificationId(id: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash & 0x7fffffff) || 1;
}

export function androidLocalNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

class AndroidNotificationScheduler implements NotificationSchedulerAdapter {
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
          id: androidNotificationId(record.id),
          title: copy.title,
          body: copy.body,
          schedule: { at: new Date(record.instantEpochMilliseconds) },
          extra,
          autoCancel: true,
          ...(record.sound === 'silent'
            ? { channelId: record.vibration ? silentVibrationChannelId : silentChannelId }
            : {}),
        },
      ],
    });
  }

  async cancel(id: string): Promise<void> {
    await this.client.cancel({ notifications: [{ id: androidNotificationId(id) }] });
  }
}

async function ensureSilentChannels(client: LocalNotificationsClient, locale: Locale): Promise<void> {
  const baseName = locale === 'ar' ? 'تنبيهات الصلاة الصامتة' : 'Silent prayer notifications';
  await client.createChannel({
    id: silentChannelId,
    name: baseName,
    description: locale === 'ar' ? 'تنبيهات صلاة بلا صوت أو اهتزاز' : 'Prayer notifications without sound or vibration',
    importance: 2,
    vibration: false,
  });
  await client.createChannel({
    id: silentVibrationChannelId,
    name: locale === 'ar' ? `${baseName} مع اهتزاز` : `${baseName} with vibration`,
    description: locale === 'ar' ? 'تنبيهات صلاة بلا صوت مع اهتزاز' : 'Prayer notifications without sound, with vibration',
    importance: 3,
    vibration: true,
  });
}

export type AndroidNotificationSyncResult =
  | { readonly status: 'unsupported' }
  | { readonly status: 'permission-denied' }
  | { readonly status: 'synchronized'; readonly plan: NotificationSchedulerPlan };

export async function synchronizeAndroidPrayerNotifications(
  desired: readonly NotificationInstantResolution[],
  locale: Locale,
  options: {
    readonly client?: LocalNotificationsClient;
    readonly supported?: boolean;
    readonly nowEpochMilliseconds?: number;
  } = {},
): Promise<AndroidNotificationSyncResult> {
  const supported = options.supported ?? androidLocalNotificationsSupported();
  if (!supported) return { status: 'unsupported' };

  const client = options.client ?? LocalNotifications;
  const nowEpochMilliseconds = options.nowEpochMilliseconds ?? Date.now();
  const futureDesired = desired.filter(
    (resolution) =>
      resolution.status !== 'scheduled' || resolution.instant.getTime() > nowEpochMilliseconds,
  );
  const adapter = new AndroidNotificationScheduler(client, locale);

  if (futureDesired.length === 0) {
    return { status: 'synchronized', plan: await applyNotificationSchedulerPlan(adapter, []) };
  }

  let permission = await client.checkPermissions();
  if (permission.display !== 'granted') permission = await client.requestPermissions();
  if (permission.display !== 'granted') return { status: 'permission-denied' };

  await ensureSilentChannels(client, locale);
  const plan = await applyNotificationSchedulerPlan(adapter, futureDesired);
  return { status: 'synchronized', plan };
}
''')

Path('src/platform/androidNotificationScheduler.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';
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
''')

app_path = Path('src/App.tsx')
app = app_path.read_text()
app = replace_once(
    app,
    "import {\n  NOTIFICATION_PRAYERS,\n  updatePrayerNotificationPreference,\n} from './domain/notificationPreferences';",
    "import {\n  NOTIFICATION_PRAYERS,\n  updatePrayerNotificationPreference,\n} from './domain/notificationPreferences';\nimport { buildNotificationIntents } from './domain/notificationSchedule';\nimport { resolveNotificationScheduleInstants } from './domain/notificationInstant';\nimport { buildNotificationPrayerInputs } from './domain/notificationPrayerInputs';",
)
app = replace_once(
    app,
    "import { requestCurrentLocation } from './platform/currentLocation';",
    "import { requestCurrentLocation } from './platform/currentLocation';\nimport { synchronizeAndroidPrayerNotifications } from './platform/androidNotificationScheduler';",
)
anchor = "  const direction = localeDirection(locale);\n  const resolvedTimeZone = dashboard?.timeZone;\n"
insertion = r'''  const direction = localeDirection(locale);
  const resolvedTimeZone = dashboard?.timeZone;

  useEffect(() => {
    if (dashboard === null) return;

    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: settings.prayerSourceMode,
      mosqueTimetable: settings.mosqueTimetable,
    });
    const intents = buildNotificationIntents(inputs, settings.notificationPreferences);
    const resolutions = resolveNotificationScheduleInstants(intents, dashboard.timeZone);

    void synchronizeAndroidPrayerNotifications(resolutions, locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
  }, [
    dashboard?.today.date,
    dashboard?.tomorrow.date,
    dashboard?.timeZone,
    locale,
    settings.asrConvention,
    settings.calculationMethodId,
    settings.highLatitudeRule,
    settings.mosqueTimetable,
    settings.notificationPreferences,
    settings.prayerAdjustments,
    settings.prayerSourceMode,
    errorLogger,
  ]);
'''
app = replace_once(app, anchor, insertion)
app_path.write_text(app)

error_log = Path('src/platform/errorLog.ts')
text = error_log.read_text()
text = replace_once(
    text,
    "  | 'prayer-calculation-unavailable'",
    "  | 'prayer-calculation-unavailable'\n  | 'notification-scheduling-unavailable'",
)
error_log.write_text(text)

translations = Path('src/i18n/translations.ts')
text = translations.read_text()
text = text.replace(
    "Delivery and exact scheduling depend on platform permission and background restrictions; these settings are stored locally until a platform scheduler is enabled.",
    "Android local notifications are scheduled on-device after notification permission is granted. Exact delivery still depends on Android alarm, battery and background restrictions; other targets remain platform-dependent.",
    1,
)
text = text.replace(
    "يعتمد التسليم والجدولة الدقيقة على إذن المنصة وقيود العمل في الخلفية؛ تُحفظ هذه الإعدادات محلياً إلى أن يتم تفعيل مجدول خاص بالمنصة.",
    "تُجدول تنبيهات أندرويد محلياً على الجهاز بعد منح إذن الإشعارات. يبقى التوقيت الدقيق خاضعاً لقيود المنبّه والبطارية والعمل في الخلفية في أندرويد، بينما تعتمد المنصات الأخرى على دعمها الخاص.",
    1,
)
translations.write_text(text)

android_doc = Path('docs/ANDROID.md')
text = android_doc.read_text().rstrip() + r'''

## Local prayer notifications

The Android shell uses the first-party Capacitor Local Notifications plugin for on-device prayer alerts. When at least one notification or reminder preference is enabled, SalahOS checks Android notification permission and requests it when needed. A denial is respected and no remote push service is used.

The app reconciles its pending native notifications against the shared prayer scheduler whenever the local civil date, timezone, calculation/source settings, mosque timetable or notification preferences change. It schedules both today and tomorrow where the selected source provides prayer starts, ignores already-past deliveries, and removes stale SalahOS-owned pending jobs. Native identifiers are deterministic 32-bit values and the full scheduler record is retained in notification metadata so unrelated app notifications are never adopted or cancelled.

Silent notifications use dedicated Android channels, including a silent-with-vibration channel. Default-sound behavior uses the platform default channel. Android 8+ channel behavior means sound/vibration combinations are partly channel-controlled and remain subject to user notification settings.

This implementation deliberately does **not** request `SCHEDULE_EXACT_ALARM`. Android can therefore defer delivery under alarm, Doze, battery-optimisation or vendor background policies. Exact-alarm policy, reboot recovery, Adhan audio playback and physical/emulator delivery testing remain separate tracker items and must not be represented as complete.
'''
android_doc.write_text(text + '\n')

limitations = Path('docs/NOTIFICATION_LIMITATIONS.md')
text = limitations.read_text().rstrip() + r'''

### Current Android implementation boundary

The committed Android shell now has an on-device Local Notifications adapter. It requests display permission only when a configured prayer alert requires native delivery, reconciles today/tomorrow prayer jobs from the shared scheduler, ignores already-past jobs and removes stale SalahOS-owned pending jobs without touching unrelated notifications.

Exact alarms are not enabled in the current Android manifest. Consequently, scheduled times are notification intent rather than a guarantee of exact wall-clock delivery, especially under Doze, battery optimisation, OEM background restrictions or user notification-channel settings. Reboot rescheduling and Adhan playback are also not yet implemented.
'''
limitations.write_text(text + '\n')
