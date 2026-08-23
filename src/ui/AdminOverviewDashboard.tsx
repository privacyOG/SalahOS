import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createAdminDashboardStatus,
  type AdminOperationalError,
  type AdminPrayerPublicationStatusInput,
  type ManagedDisplayStatus,
  type ScheduledAdminItem,
} from '../domain/adminDashboard';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import type { ObligatoryPrayerName } from '../domain/prayerEngine';
import { deriveRamadanMode } from '../domain/ramadan';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { formatLocalTime, localeTag, translate } from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadCommunityContentLibrary } from '../platform/communityContentStorage';
import {
  createManagedAdminClient,
  type ManagedAdminConnection,
} from '../platform/managedAdminTransport';
import {
  getManagedAdminSession,
  MANAGED_ADMIN_SESSION_CHANGE_EVENT,
} from '../platform/managedAdminSession';
import { loadPrayerBoardAnnouncementRotationConfig } from '../platform/prayerBoardAnnouncementRotation';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import type { AdminDestination } from './applicationRoute';

type AdminOverviewProps = Readonly<{
  navigate: (destination: AdminDestination) => void;
}>;

type PrayerSummaryRow = Readonly<{
  prayer: ObligatoryPrayerName;
  start: string;
  iqamah: string;
  isCurrent: boolean;
  isNext: boolean;
}>;

type SeasonalSummary = Readonly<{
  nextJumuah: string | null;
  ramadan: string | null;
}>;

type SignageSummary = Readonly<{
  enabled: boolean;
  rules: number;
  scenes: number;
}>;

type OverviewCopy = Readonly<{
  statusHealthy: string;
  statusAttention: string;
  statusError: string;
  publication: string;
  publicationPublished: string;
  publicationDraft: string;
  publicationMissing: string;
  prayerToday: string;
  prayerUnavailable: string;
  start: string;
  iqamah: string;
  current: string;
  next: string;
  seasonal: string;
  noJumuah: string;
  ramadanInactive: string;
  community: string;
  noCommunity: string;
  signage: string;
  signageEnabled: string;
  signageDisabled: string;
  fleet: string;
  fleetDisconnected: string;
  online: string;
  stale: string;
  offline: string;
  issues: string;
  noIssues: string;
  quickActions: string;
  prayerAction: string;
  communityAction: string;
  displaysAction: string;
  loading: string;
}>;

const copy: Readonly<Record<Locale, OverviewCopy>> = {
  en: {
    statusHealthy: 'Operations healthy',
    statusAttention: 'Needs attention',
    statusError: 'Operational issue',
    publication: 'Prayer publication',
    publicationPublished: 'Published revision is current',
    publicationDraft: 'Draft changes are waiting to be published',
    publicationMissing: 'No managed prayer publication is loaded',
    prayerToday: "Today's prayer & Iqamah",
    prayerUnavailable: 'Configure a location and prayer source to show today’s schedule.',
    start: 'Start',
    iqamah: 'Iqamah',
    current: 'Current',
    next: 'Next',
    seasonal: "Jumu'ah & Ramadan",
    noJumuah: "No upcoming Jumu'ah override is stored.",
    ramadanInactive: 'Ramadan mode is not active for the current corrected Hijri date.',
    community: 'Upcoming community content',
    noCommunity: 'No upcoming announcement or event is stored.',
    signage: 'Signage schedule',
    signageEnabled: 'Announcement rotation is configured',
    signageDisabled: 'Announcement rotation is disabled',
    fleet: 'Display fleet',
    fleetDisconnected: 'Connect the managed service in Displays to load live fleet health.',
    online: 'Online',
    stale: 'Stale',
    offline: 'Offline',
    issues: 'Issues requiring attention',
    noIssues: 'No synchronization or media errors are currently reported.',
    quickActions: 'Common tasks',
    prayerAction: 'Review prayer & Iqamah',
    communityAction: 'Manage community content',
    displaysAction: 'Open displays',
    loading: 'Refreshing managed display status…',
  },
  ar: {
    statusHealthy: 'العمليات سليمة',
    statusAttention: 'يحتاج إلى متابعة',
    statusError: 'مشكلة تشغيلية',
    publication: 'نشر مواقيت الصلاة',
    publicationPublished: 'النسخة المنشورة هي الحالية',
    publicationDraft: 'توجد تغييرات مسودة بانتظار النشر',
    publicationMissing: 'لا توجد نسخة مُدارة لمواقيت الصلاة',
    prayerToday: 'الصلاة والإقامة اليوم',
    prayerUnavailable: 'اضبط الموقع ومصدر المواقيت لإظهار جدول اليوم.',
    start: 'البدء',
    iqamah: 'الإقامة',
    current: 'الحالية',
    next: 'التالية',
    seasonal: 'الجمعة ورمضان',
    noJumuah: 'لا يوجد تجاوز قادم للجمعة محفوظ.',
    ramadanInactive: 'وضع رمضان غير نشط وفق التاريخ الهجري المصحح الحالي.',
    community: 'محتوى المجتمع القادم',
    noCommunity: 'لا يوجد إعلان أو فعالية قادمة محفوظة.',
    signage: 'جدول الشاشات',
    signageEnabled: 'تم إعداد تدوير الإعلانات',
    signageDisabled: 'تدوير الإعلانات معطّل',
    fleet: 'أسطول الشاشات',
    fleetDisconnected: 'اتصل بخدمة الإدارة من قسم الشاشات لتحميل حالة الأسطول الحية.',
    online: 'متصل',
    stale: 'متأخر',
    offline: 'غير متصل',
    issues: 'مشكلات تحتاج إلى متابعة',
    noIssues: 'لا توجد حالياً أخطاء مزامنة أو وسائط مُبلغ عنها.',
    quickActions: 'المهام الشائعة',
    prayerAction: 'مراجعة الصلاة والإقامة',
    communityAction: 'إدارة محتوى المجتمع',
    displaysAction: 'فتح الشاشات',
    loading: 'جارٍ تحديث حالة الشاشات المُدارة…',
  },
  tr: {
    statusHealthy: 'İşlemler sağlıklı',
    statusAttention: 'İlgilenilmesi gerekiyor',
    statusError: 'Operasyon sorunu',
    publication: 'Namaz yayını',
    publicationPublished: 'Yayınlanan revizyon güncel',
    publicationDraft: 'Taslak değişiklikler yayınlanmayı bekliyor',
    publicationMissing: 'Yönetilen namaz yayını yüklenmemiş',
    prayerToday: 'Bugünün namaz ve ikamet saatleri',
    prayerUnavailable: 'Bugünkü programı göstermek için konum ve namaz kaynağını yapılandırın.',
    start: 'Başlangıç',
    iqamah: 'İkamet',
    current: 'Mevcut',
    next: 'Sonraki',
    seasonal: 'Cuma ve Ramazan',
    noJumuah: 'Yaklaşan kayıtlı bir Cuma istisnası yok.',
    ramadanInactive: 'Ramazan modu mevcut düzeltilmiş Hicri tarihte etkin değil.',
    community: 'Yaklaşan topluluk içeriği',
    noCommunity: 'Yaklaşan duyuru veya etkinlik yok.',
    signage: 'Ekran programı',
    signageEnabled: 'Duyuru döngüsü yapılandırılmış',
    signageDisabled: 'Duyuru döngüsü devre dışı',
    fleet: 'Ekran filosu',
    fleetDisconnected: 'Canlı filo sağlığını yüklemek için Ekranlar bölümünden hizmete bağlanın.',
    online: 'Çevrimiçi',
    stale: 'Eski',
    offline: 'Çevrimdışı',
    issues: 'İlgilenilmesi gereken sorunlar',
    noIssues: 'Şu anda bildirilmiş eşitleme veya medya hatası yok.',
    quickActions: 'Sık kullanılan işler',
    prayerAction: 'Namaz ve ikameti gözden geçir',
    communityAction: 'Topluluk içeriğini yönet',
    displaysAction: 'Ekranları aç',
    loading: 'Yönetilen ekran durumu yenileniyor…',
  },
  id: {
    statusHealthy: 'Operasi sehat',
    statusAttention: 'Perlu perhatian',
    statusError: 'Masalah operasional',
    publication: 'Publikasi salat',
    publicationPublished: 'Revisi yang dipublikasikan sudah terkini',
    publicationDraft: 'Perubahan draf menunggu publikasi',
    publicationMissing: 'Belum ada publikasi salat terkelola yang dimuat',
    prayerToday: 'Salat & Iqamah hari ini',
    prayerUnavailable: 'Atur lokasi dan sumber waktu untuk menampilkan jadwal hari ini.',
    start: 'Mulai',
    iqamah: 'Iqamah',
    current: 'Saat ini',
    next: 'Berikutnya',
    seasonal: 'Jumat & Ramadan',
    noJumuah: 'Tidak ada pengecualian Jumat mendatang yang tersimpan.',
    ramadanInactive: 'Mode Ramadan tidak aktif untuk tanggal Hijriah terkoreksi saat ini.',
    community: 'Konten komunitas mendatang',
    noCommunity: 'Tidak ada pengumuman atau acara mendatang yang tersimpan.',
    signage: 'Jadwal signage',
    signageEnabled: 'Rotasi pengumuman telah dikonfigurasi',
    signageDisabled: 'Rotasi pengumuman dinonaktifkan',
    fleet: 'Armada layar',
    fleetDisconnected:
      'Hubungkan layanan terkelola di Layar untuk memuat kesehatan armada langsung.',
    online: 'Daring',
    stale: 'Usang',
    offline: 'Luring',
    issues: 'Masalah yang perlu ditangani',
    noIssues: 'Tidak ada kesalahan sinkronisasi atau media yang dilaporkan.',
    quickActions: 'Tugas umum',
    prayerAction: 'Tinjau salat & Iqamah',
    communityAction: 'Kelola konten komunitas',
    displaysAction: 'Buka layar',
    loading: 'Memperbarui status layar terkelola…',
  },
};

const prayerTranslationKeys: Readonly<Record<ObligatoryPrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

function readSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function canonicalTimestamp(value: string): string {
  return new Date(value).toISOString();
}

function localizedAnnouncementTitle(
  announcement: ReturnType<typeof loadCommunityContentLibrary>['announcements'][number],
  locale: Locale,
): string {
  if (locale === 'ar')
    return announcement.arabic?.title ?? announcement.english?.title ?? announcement.announcementId;
  return announcement.english?.title ?? announcement.arabic?.title ?? announcement.announcementId;
}

function localizedEventTitle(
  event: ReturnType<typeof loadCommunityContentLibrary>['events'][number],
  locale: Locale,
): string {
  if (locale === 'ar') return event.arabic?.title ?? event.english?.title ?? event.eventId;
  return event.english?.title ?? event.arabic?.title ?? event.eventId;
}

function scheduledCommunityItems(locale: Locale): readonly ScheduledAdminItem[] {
  const library = loadCommunityContentLibrary(getApplicationStorage());
  const announcements: ScheduledAdminItem[] = library.announcements
    .filter((announcement) => !announcement.archived && announcement.startsAt !== null)
    .map((announcement) => ({
      id: `announcement:${announcement.mosqueId}:${announcement.announcementId}`,
      kind: 'announcement',
      title: localizedAnnouncementTitle(announcement, locale),
      startsAt: canonicalTimestamp(announcement.startsAt ?? new Date(0).toISOString()),
    }));
  const events: ScheduledAdminItem[] = library.events.map((event) => ({
    id: `event:${event.mosqueId}:${event.eventId}`,
    kind: 'event',
    title: localizedEventTitle(event, locale),
    startsAt: canonicalTimestamp(event.startsAt),
  }));
  return [...announcements, ...events];
}

function displayStatus(
  syncState: 'current' | 'syncing' | 'offline' | 'stale' | 'revoked',
): ManagedDisplayStatus['state'] {
  if (syncState === 'current') return 'online';
  if (syncState === 'syncing' || syncState === 'stale') return 'stale';
  return 'offline';
}

function managedDisplaysFromConnection(
  connection: ManagedAdminConnection,
): Promise<readonly ManagedDisplayStatus[]> {
  return createManagedAdminClient(connection)
    .listDisplays()
    .then((displays) =>
      displays.map((display) => ({
        displayId: display.identity.displayId,
        state: displayStatus(display.syncState),
        lastSeenAt: display.lastSeenAt,
      })),
    );
}

function prayerSummary(
  settings: PersistedSettings,
  now: Date,
): {
  readonly date: string | null;
  readonly rows: readonly PrayerSummaryRow[];
  readonly seasonal: SeasonalSummary;
} {
  if (settings.location === null) {
    return { date: null, rows: [], seasonal: { nextJumuah: null, ramadan: null } };
  }

  const result = buildPrayerDashboardResult({
    instant: now,
    coordinates: settings.location.coordinates,
    ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
    method: calculationMethods[settings.calculationMethodId],
    asrConvention: settings.asrConvention,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.prayerAdjustments,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  });
  if (!result.ok) {
    return { date: null, rows: [], seasonal: { nextJumuah: null, ramadan: null } };
  }

  const sourced = applyPrayerSourceToDashboard({
    dashboard: result.dashboard,
    sourceMode: settings.prayerSourceMode,
    mosqueTimetable: settings.mosqueTimetable,
  });
  const rows = sourced.prayers
    .filter((row): row is typeof row & { name: ObligatoryPrayerName } => row.name !== 'sunrise')
    .map((row) => ({
      prayer: row.name,
      start:
        row.localMinutes === null
          ? '—'
          : formatLocalTime(row.localMinutes, settings.locale, settings.timeFormat),
      iqamah:
        row.iqamahLocalMinutes === null
          ? '—'
          : formatLocalTime(row.iqamahLocalMinutes, settings.locale, settings.timeFormat),
      isCurrent: row.isCurrent,
      isNext: row.isNext,
    }));

  const today = result.dashboard.today.date;
  const nextJumuahDay = settings.mosqueTimetable?.days
    .filter((day) => day.date >= today && (day.jumuahSessions?.length ?? 0) > 0)
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  const nextJumuah =
    nextJumuahDay === undefined
      ? null
      : `${nextJumuahDay.date} · ${(nextJumuahDay.jumuahSessions ?? [])
          .map(
            (session) =>
              `${session.label} ${formatLocalTime(
                session.salahLocalMinutes,
                settings.locale,
                settings.timeFormat,
              )}`,
          )
          .join(' · ')}`;
  const ramadan = deriveRamadanMode(result.dashboard.hijri);
  const ramadanLabel = ramadan.active
    ? `Ramadan ${String(ramadan.ramadanDay ?? '')} · ${String(ramadan.hijriYear)} AH`
    : null;

  return {
    date: today,
    rows,
    seasonal: { nextJumuah, ramadan: ramadanLabel },
  };
}

function signageSummary(): SignageSummary {
  try {
    const config = loadPrayerBoardAnnouncementRotationConfig(getApplicationStorage());
    return {
      enabled: config.enabled,
      rules: config.rules.length,
      scenes: config.scenes.length,
    };
  } catch {
    return { enabled: false, rules: 0, scenes: 0 };
  }
}

function fixturePublication(search: string, now: Date): AdminPrayerPublicationStatusInput | null {
  if (new URLSearchParams(search).get('adminFixture') !== 'stage24') return null;
  return {
    publishedRevisionId: 'rev-024',
    draftRevisionId: 'rev-025',
    publishedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
  };
}

function fixtureDisplays(search: string, now: Date): readonly ManagedDisplayStatus[] | null {
  if (new URLSearchParams(search).get('adminFixture') !== 'stage24') return null;
  return [
    {
      displayId: 'foyer-tv',
      state: 'online',
      lastSeenAt: new Date(now.getTime() - 60 * 1000).toISOString(),
    },
    {
      displayId: 'hall-tv',
      state: 'stale',
      lastSeenAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    { displayId: 'classroom-display', state: 'offline', lastSeenAt: null },
  ];
}

function fixtureItems(search: string, now: Date): readonly ScheduledAdminItem[] | null {
  if (new URLSearchParams(search).get('adminFixture') !== 'stage24') return null;
  return [
    {
      id: 'announcement:parking',
      kind: 'announcement',
      title: 'Friday parking notice',
      startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event:community-dinner',
      kind: 'event',
      title: 'Community dinner',
      startsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function formatScheduledInstant(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminOverviewDashboard({ navigate }: AdminOverviewProps) {
  const [settings, setSettings] = useState(readSettings);
  const [now, setNow] = useState(() => new Date());
  const [displays, setDisplays] = useState<readonly ManagedDisplayStatus[]>([]);
  const [fleetConnected, setFleetConnected] = useState(() => getManagedAdminSession() !== null);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetError, setFleetError] = useState<AdminOperationalError | null>(null);
  const locale = settings.locale;
  const text = copy[locale];
  const fixture = new URLSearchParams(window.location.search).get('adminFixture') === 'stage24';

  const refreshFleet = useCallback(async () => {
    const connection = getManagedAdminSession();
    setFleetConnected(connection !== null);
    if (connection === null) {
      setDisplays([]);
      setFleetError(null);
      return;
    }

    setFleetLoading(true);
    try {
      setDisplays(await managedDisplaysFromConnection(connection));
      setFleetError(null);
    } catch {
      setFleetError({
        source: 'sync',
        code: 'fleet-refresh-failed',
        message: 'Managed display fleet could not be refreshed.',
        occurredAt: new Date().toISOString(),
      });
    } finally {
      setFleetLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshLocal = () => {
      setSettings(readSettings());
      setNow(new Date());
    };
    const refreshAll = () => {
      refreshLocal();
      void refreshFleet();
    };
    void refreshFleet();
    window.addEventListener(MANAGED_ADMIN_SESSION_CHANGE_EVENT, refreshAll);
    window.addEventListener('focus', refreshAll);
    return () => {
      window.removeEventListener(MANAGED_ADMIN_SESSION_CHANGE_EVENT, refreshAll);
      window.removeEventListener('focus', refreshAll);
    };
  }, [refreshFleet]);

  const prayer = useMemo(() => prayerSummary(settings, now), [settings, now]);
  const signage = useMemo(signageSummary, [settings]);
  const publication = fixturePublication(window.location.search, now) ?? {
    publishedRevisionId: null,
    draftRevisionId: null,
    publishedAt: null,
  };
  const scheduledItems =
    fixtureItems(window.location.search, now) ?? scheduledCommunityItems(locale);
  const resolvedDisplays = fixtureDisplays(window.location.search, now) ?? displays;
  const errors = fleetError === null ? [] : [fleetError];
  const dashboard = createAdminDashboardStatus({
    now: now.toISOString(),
    prayerPublication: publication,
    scheduledItems,
    displays: resolvedDisplays,
    errors,
  });
  const effectiveFleetConnected = fixture || fleetConnected;
  const healthLabel =
    dashboard.health === 'healthy'
      ? text.statusHealthy
      : dashboard.health === 'error'
        ? text.statusError
        : text.statusAttention;
  const publicationLabel =
    dashboard.prayerPublication.state === 'published'
      ? text.publicationPublished
      : dashboard.prayerPublication.state === 'draft-pending'
        ? text.publicationDraft
        : text.publicationMissing;

  return (
    <section className="admin-overview" aria-labelledby="admin-overview-status">
      <div className="admin-overview__summary">
        <div>
          <p className="admin-overview__eyebrow">SalahOS</p>
          <h2 id="admin-overview-status">{healthLabel}</h2>
          <p>{publicationLabel}</p>
        </div>
        <div className="admin-overview__actions" aria-label={text.quickActions}>
          <button
            type="button"
            onClick={() => {
              navigate('prayer-iqamah');
            }}
          >
            {text.prayerAction}
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('community');
            }}
          >
            {text.communityAction}
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('displays');
            }}
          >
            {text.displaysAction}
          </button>
        </div>
      </div>

      <div className="admin-overview-grid">
        <section className="admin-overview-card" aria-labelledby="admin-publication-title">
          <div className="admin-overview-card__heading">
            <h3 id="admin-publication-title">{text.publication}</h3>
            <span data-state={dashboard.prayerPublication.state}>
              {dashboard.prayerPublication.state}
            </span>
          </div>
          <strong>{publicationLabel}</strong>
          {dashboard.prayerPublication.publishedRevisionId !== null && (
            <p>
              {dashboard.prayerPublication.publishedRevisionId}
              {dashboard.prayerPublication.draftRevisionId !== null &&
              dashboard.prayerPublication.draftRevisionId !==
                dashboard.prayerPublication.publishedRevisionId
                ? ` → ${dashboard.prayerPublication.draftRevisionId}`
                : ''}
            </p>
          )}
        </section>

        <section
          className="admin-overview-card admin-overview-card--fleet"
          aria-labelledby="admin-fleet-title"
        >
          <div className="admin-overview-card__heading">
            <h3 id="admin-fleet-title">{text.fleet}</h3>
            {fleetLoading && <span role="status">{text.loading}</span>}
          </div>
          {effectiveFleetConnected ? (
            <div className="admin-fleet-counts">
              <div>
                <strong>{dashboard.displayCounts.online}</strong>
                <span>{text.online}</span>
              </div>
              <div>
                <strong>{dashboard.displayCounts.stale}</strong>
                <span>{text.stale}</span>
              </div>
              <div>
                <strong>{dashboard.displayCounts.offline}</strong>
                <span>{text.offline}</span>
              </div>
            </div>
          ) : (
            <p>{text.fleetDisconnected}</p>
          )}
        </section>

        <section
          className="admin-overview-card admin-overview-card--prayers"
          aria-labelledby="admin-prayers-title"
        >
          <div className="admin-overview-card__heading">
            <h3 id="admin-prayers-title">{text.prayerToday}</h3>
            {prayer.date !== null && <span>{prayer.date}</span>}
          </div>
          {prayer.rows.length === 0 ? (
            <p>{text.prayerUnavailable}</p>
          ) : (
            <div className="admin-prayer-table" role="table">
              <div className="admin-prayer-table__head" role="row">
                <span role="columnheader" />
                <span role="columnheader">{text.start}</span>
                <span role="columnheader">{text.iqamah}</span>
              </div>
              {prayer.rows.map((row) => (
                <div className="admin-prayer-table__row" role="row" key={row.prayer}>
                  <strong role="rowheader">
                    {translate(locale, prayerTranslationKeys[row.prayer])}
                  </strong>
                  <span role="cell">{row.start}</span>
                  <span role="cell">{row.iqamah}</span>
                  {(row.isCurrent || row.isNext) && (
                    <small>{row.isCurrent ? text.current : text.next}</small>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-overview-card" aria-labelledby="admin-seasonal-title">
          <h3 id="admin-seasonal-title">{text.seasonal}</h3>
          <p>{prayer.seasonal.nextJumuah ?? text.noJumuah}</p>
          <p>{prayer.seasonal.ramadan ?? text.ramadanInactive}</p>
        </section>

        <section className="admin-overview-card" aria-labelledby="admin-community-title">
          <h3 id="admin-community-title">{text.community}</h3>
          {dashboard.upcomingItems.length === 0 ? (
            <p>{text.noCommunity}</p>
          ) : (
            <ul className="admin-overview-list">
              {dashboard.upcomingItems.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <span>{item.kind}</span>
                  <strong>{item.title}</strong>
                  <time dateTime={item.startsAt}>
                    {formatScheduledInstant(item.startsAt, locale)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-overview-card" aria-labelledby="admin-signage-title">
          <div className="admin-overview-card__heading">
            <h3 id="admin-signage-title">{text.signage}</h3>
            <span data-state={signage.enabled ? 'enabled' : 'disabled'}>
              {signage.enabled ? 'on' : 'off'}
            </span>
          </div>
          <strong>{signage.enabled ? text.signageEnabled : text.signageDisabled}</strong>
          <p>
            {String(signage.rules)} rules · {String(signage.scenes)} scenes
          </p>
        </section>
      </div>

      <section className="admin-overview-issues" aria-labelledby="admin-issues-title">
        <h3 id="admin-issues-title">{text.issues}</h3>
        {dashboard.errors.length === 0 ? (
          <p>{text.noIssues}</p>
        ) : (
          <ul>
            {dashboard.errors.map((error) => (
              <li key={`${error.code}:${error.occurredAt}`}>
                <strong>{error.message}</strong>
                <code>{error.code}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
