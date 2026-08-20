import { useMemo, useState } from 'react';

import type { ManagedDisplayRemoteStatus } from '../domain/managedAdminProtocol';
import type { Locale } from '../i18n/translations';
import { createManagedAdminClient } from '../platform/managedAdminTransport';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = {
  en: {
    title: 'Remote display administration',
    subtitle:
      'Connect to an optional SalahOS managed service to enroll, monitor, configure and revoke mosque displays.',
    endpoint: 'Managed service URL',
    token: 'Admin token',
    connect: 'Connect / refresh fleet',
    disconnected: 'Not connected',
    connected: 'Fleet loaded',
    error: 'Remote administration request failed',
    enroll: 'Enroll display',
    displayId: 'Display ID',
    organizationId: 'Organization ID',
    mosqueId: 'Mosque ID',
    locationId: 'Location ID',
    resolution: 'Resolution profile',
    orientation: 'Orientation',
    landscape: 'Landscape',
    portrait: 'Portrait',
    playlist: 'Playlist ID',
    enrollAction: 'Create enrollment',
    deviceCredential: 'One-time device credential',
    credentialWarning:
      'Copy this credential into the display now. SalahOS does not persist it in the administration UI.',
    fleet: 'Managed fleet',
    empty: 'No displays are enrolled in this managed service.',
    lastSeen: 'Last seen',
    appVersion: 'App version',
    reportedRevision: 'Reported revision',
    targetRevision: 'Target revision',
    syncState: 'Sync state',
    theme: 'Display theme',
    updateTheme: 'Publish next revision',
    revoke: 'Revoke display',
    never: 'Never',
    classic: 'Classic',
    midnight: 'Midnight',
    sandstone: 'Sandstone',
    emerald: 'Emerald',
    localOnly:
      'The service URL and admin token remain in memory for this page session and are not written to SalahOS application storage.',
  },
  ar: {
    title: 'الإدارة البعيدة لشاشات العرض',
    subtitle: 'اتصل بخدمة إدارة اختيارية لتسجيل شاشات المسجد ومراقبتها وضبطها وإلغائها.',
    endpoint: 'رابط خدمة الإدارة',
    token: 'رمز المشرف',
    connect: 'اتصال / تحديث الأسطول',
    disconnected: 'غير متصل',
    connected: 'تم تحميل الأسطول',
    error: 'فشل طلب الإدارة البعيدة',
    enroll: 'تسجيل شاشة',
    displayId: 'معرّف الشاشة',
    organizationId: 'معرّف المؤسسة',
    mosqueId: 'معرّف المسجد',
    locationId: 'معرّف الموقع',
    resolution: 'ملف دقة العرض',
    orientation: 'اتجاه العرض',
    landscape: 'أفقي',
    portrait: 'عمودي',
    playlist: 'معرّف قائمة العرض',
    enrollAction: 'إنشاء تسجيل',
    deviceCredential: 'بيانات اعتماد الجهاز لمرة واحدة',
    credentialWarning: 'انسخ هذه البيانات إلى الشاشة الآن. واجهة الإدارة لا تحفظها.',
    fleet: 'أسطول الشاشات',
    empty: 'لا توجد شاشات مسجلة في خدمة الإدارة.',
    lastSeen: 'آخر اتصال',
    appVersion: 'إصدار التطبيق',
    reportedRevision: 'الإصدار المبلّغ',
    targetRevision: 'الإصدار المطلوب',
    syncState: 'حالة المزامنة',
    theme: 'سمة الشاشة',
    updateTheme: 'نشر الإصدار التالي',
    revoke: 'إلغاء الشاشة',
    never: 'أبداً',
    classic: 'كلاسيكي',
    midnight: 'منتصف الليل',
    sandstone: 'الحجر الرملي',
    emerald: 'زمردي',
    localOnly: 'رابط الخدمة ورمز المشرف يبقيان في ذاكرة الصفحة ولا يتم حفظهما في تخزين التطبيق.',
  },
} as const;

const themeIds: readonly SmartDisplayThemeId[] = ['classic', 'midnight', 'sandstone', 'emerald'];

interface EnrollmentField {
  readonly label: string;
  readonly value: string;
  readonly setValue: (value: string) => void;
}

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function formatLastSeen(value: string | null, locale: Locale, never: string): string {
  if (value === null) return never;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function RemoteDisplayAdminPanel() {
  const locale = readLocale();
  const text = copy[locale];
  const [baseUrl, setBaseUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [displays, setDisplays] = useState<readonly ManagedDisplayRemoteStatus[]>([]);
  const [connectionState, setConnectionState] = useState<'idle' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceCredential, setDeviceCredential] = useState<string | null>(null);
  const [displayId, setDisplayId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [mosqueId, setMosqueId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [resolutionProfile, setResolutionProfile] = useState('tv-16x9');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [playlistId, setPlaylistId] = useState('');
  const [themeDrafts, setThemeDrafts] = useState<Record<string, SmartDisplayThemeId>>({});

  const client = useMemo(() => {
    try {
      return baseUrl.trim() === '' || adminToken.trim() === ''
        ? null
        : createManagedAdminClient({ baseUrl, adminToken });
    } catch {
      return null;
    }
  }, [adminToken, baseUrl]);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const refreshFleet = async () => {
    setDeviceCredential(null);
    if (client === null) {
      setConnectionState('error');
      setErrorMessage('Invalid service URL or admin token format.');
      return;
    }
    try {
      const nextDisplays = await client.listDisplays();
      setDisplays(nextDisplays);
      setThemeDrafts(
        Object.fromEntries(
          nextDisplays.map((display) => [
            display.identity.displayId,
            display.remoteConfig.displayTheme,
          ]),
        ),
      );
      setConnectionState('connected');
      setErrorMessage('');
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const enrollDisplay = async () => {
    if (client === null) return;
    try {
      const enrollment = await client.registerDisplay({
        displayId,
        organizationId,
        mosqueId,
        locationId,
        orientation,
        resolutionProfile,
        playlistId: playlistId.trim() === '' ? null : playlistId,
      });
      setDeviceCredential(enrollment.deviceToken);
      await refreshFleet();
      setDeviceCredential(enrollment.deviceToken);
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const publishNextRevision = async (display: ManagedDisplayRemoteStatus) => {
    if (client === null) return;
    const theme = themeDrafts[display.identity.displayId] ?? display.remoteConfig.displayTheme;
    try {
      await client.updateDisplayConfig(display.identity.displayId, {
        expectedRevision: display.remoteConfig.contentRevision,
        contentRevision: display.remoteConfig.contentRevision + 1,
        playlistId: display.remoteConfig.playlistId,
        displayTheme: theme,
      });
      await refreshFleet();
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const revokeDisplay = async (display: ManagedDisplayRemoteStatus) => {
    if (client === null) return;
    try {
      await client.revokeDisplay(display.identity.displayId);
      await refreshFleet();
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const enrollmentFields: readonly EnrollmentField[] = [
    { label: text.displayId, value: displayId, setValue: setDisplayId },
    { label: text.organizationId, value: organizationId, setValue: setOrganizationId },
    { label: text.mosqueId, value: mosqueId, setValue: setMosqueId },
    { label: text.locationId, value: locationId, setValue: setLocationId },
    { label: text.resolution, value: resolutionProfile, setValue: setResolutionProfile },
    { label: text.playlist, value: playlistId, setValue: setPlaylistId },
  ];

  return (
    <section
      className="remote-display-admin-panel"
      aria-labelledby="remote-display-admin-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="remote-display-admin-panel__heading">
        <div>
          <p className="remote-display-admin-panel__eyebrow">SalahOS</p>
          <h2 id="remote-display-admin-title">{text.title}</h2>
        </div>
        <p>{text.subtitle}</p>
      </header>

      <p className="remote-display-admin-panel__privacy">{text.localOnly}</p>

      <div className="remote-display-admin-panel__connection">
        <label>
          <span>{text.endpoint}</span>
          <input
            type="url"
            value={baseUrl}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setBaseUrl(event.target.value);
            }}
          />
        </label>
        <label>
          <span>{text.token}</span>
          <input
            type="password"
            value={adminToken}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setAdminToken(event.target.value);
            }}
          />
        </label>
        <button type="button" onClick={() => void refreshFleet()}>
          {text.connect}
        </button>
      </div>

      <p className="remote-display-admin-panel__status" role="status">
        {connectionState === 'connected'
          ? text.connected
          : connectionState === 'error'
            ? `${text.error}: ${errorMessage}`
            : text.disconnected}
      </p>

      {client !== null && (
        <details className="remote-display-admin-panel__enroll">
          <summary>{text.enroll}</summary>
          <div className="remote-display-admin-panel__form-grid">
            {enrollmentFields.map((field) => (
              <label key={field.label}>
                <span>{field.label}</span>
                <input
                  value={field.value}
                  onChange={(event) => {
                    field.setValue(event.target.value);
                  }}
                />
              </label>
            ))}
            <label>
              <span>{text.orientation}</span>
              <select
                value={orientation}
                onChange={(event) => {
                  setOrientation(event.target.value as 'landscape' | 'portrait');
                }}
              >
                <option value="landscape">{text.landscape}</option>
                <option value="portrait">{text.portrait}</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => void enrollDisplay()}>
            {text.enrollAction}
          </button>
        </details>
      )}

      {deviceCredential !== null && (
        <aside className="remote-display-admin-panel__credential" role="status">
          <strong>{text.deviceCredential}</strong>
          <code dir="ltr">{deviceCredential}</code>
          <span>{text.credentialWarning}</span>
        </aside>
      )}

      <section aria-labelledby="remote-display-fleet-title">
        <h3 id="remote-display-fleet-title">{text.fleet}</h3>
        {displays.length === 0 ? (
          <p className="remote-display-admin-panel__empty">{text.empty}</p>
        ) : (
          <div className="remote-display-admin-panel__fleet">
            {displays.map((display) => (
              <article className="remote-display-card" key={display.identity.displayId}>
                <header>
                  <strong dir="ltr">{display.identity.displayId}</strong>
                  <span data-sync-state={display.syncState}>{display.syncState}</span>
                </header>
                <dl>
                  <div>
                    <dt>{text.lastSeen}</dt>
                    <dd>{formatLastSeen(display.lastSeenAt, locale, text.never)}</dd>
                  </div>
                  <div>
                    <dt>{text.appVersion}</dt>
                    <dd>{display.appVersion ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{text.reportedRevision}</dt>
                    <dd>{display.reportedContentRevision}</dd>
                  </div>
                  <div>
                    <dt>{text.targetRevision}</dt>
                    <dd>{display.remoteConfig.contentRevision}</dd>
                  </div>
                  <div>
                    <dt>{text.syncState}</dt>
                    <dd>{display.syncState}</dd>
                  </div>
                </dl>
                <label>
                  <span>{text.theme}</span>
                  <select
                    value={
                      themeDrafts[display.identity.displayId] ?? display.remoteConfig.displayTheme
                    }
                    disabled={display.remoteConfig.revoked}
                    onChange={(event) => {
                      setThemeDrafts((current) => ({
                        ...current,
                        [display.identity.displayId]: event.target.value as SmartDisplayThemeId,
                      }));
                    }}
                  >
                    {themeIds.map((theme) => (
                      <option key={theme} value={theme}>
                        {text[theme]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="remote-display-card__actions">
                  <button
                    type="button"
                    disabled={display.remoteConfig.revoked}
                    onClick={() => void publishNextRevision(display)}
                  >
                    {text.updateTheme}
                  </button>
                  <button
                    type="button"
                    disabled={display.remoteConfig.revoked}
                    onClick={() => void revokeDisplay(display)}
                  >
                    {text.revoke}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
