import { useMemo, useState } from 'react';

import {
  createManagedPrayerBoardAssignmentConfig,
  type ManagedDisplayRemoteStatus,
  type ManagedMosquePrayerBoardDefault,
} from '../domain/managedAdminProtocol';
import { resolveManagedPrayerBoardTarget } from '../domain/managedPrayerBoardTarget';
import {
  defaultPrayerBoardTemplateConfig,
  getPrayerBoardTemplate,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import { localeTag } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { remoteDisplayAdminCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { createManagedAdminClient } from '../platform/managedAdminTransport';
import { loadPrayerBoardDisplayConfig } from '../platform/prayerBoardDisplayConfig';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { displayThemeForPrayerBoardConfig } from './PrayerBoardRenderer';
import { ManagedDisplayTargetPreview } from './ManagedDisplayTargetPreview';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = remoteDisplayAdminCopy;

const assignmentCopy = {
  en: {
    draft: 'Prayer-board assignment draft',
    draftHelp:
      'This is the validated Admin → Display themes configuration. Device-local image/logo media is replaced with the template’s built-in artwork before managed preview and publication.',
    template: 'Prayer-board design',
    source: 'Assignment source',
    serviceDefault: 'Service default',
    mosqueDefault: 'Mosque default',
    displayOverride: 'Display override',
    reportedTemplate: 'Last applied design',
    target: 'Target profile',
    compatible: 'Validated for publication',
    incompatible: 'Publication blocked',
    previewDraft: 'Preview draft on target',
    publishOverride: 'Publish display override',
    previewMosque: 'Preview mosque default',
    useMosque: 'Use mosque default',
    setMosque: 'Set draft as mosque default',
    mosqueRevision: 'Mosque default revision',
    previewRequired: 'Preview this exact target before publishing.',
    noMosqueDefault: 'No mosque default has been published yet.',
    published: 'Managed prayer-board revision published.',
  },
  ar: {
    draft: 'مسودة تعيين لوحة الصلاة',
    draftHelp:
      'هذه هي إعدادات الإدارة ← سمات العرض المعتمدة. تُستبدل الصور والشعارات المحلية الخاصة بالجهاز بالخلفية المدمجة للقالب قبل المعاينة والنشر المُدار.',
    template: 'تصميم لوحة الصلاة',
    source: 'مصدر التعيين',
    serviceDefault: 'الإعداد الافتراضي للخدمة',
    mosqueDefault: 'الإعداد الافتراضي للمسجد',
    displayOverride: 'تخصيص خاص بالشاشة',
    reportedTemplate: 'آخر تصميم مطبّق',
    target: 'ملف الهدف',
    compatible: 'معتمد للنشر',
    incompatible: 'النشر محظور',
    previewDraft: 'معاينة المسودة على الهدف',
    publishOverride: 'نشر تخصيص الشاشة',
    previewMosque: 'معاينة إعداد المسجد',
    useMosque: 'استخدام إعداد المسجد',
    setMosque: 'تعيين المسودة كافتراضي للمسجد',
    mosqueRevision: 'إصدار إعداد المسجد',
    previewRequired: 'عاين هذا الهدف الفعلي قبل النشر.',
    noMosqueDefault: 'لم يتم نشر إعداد افتراضي للمسجد بعد.',
    published: 'تم نشر إصدار لوحة الصلاة المُدارة.',
  },
  tr: {
    draft: 'Namaz panosu atama taslağı',
    draftHelp:
      'Bu, doğrulanmış Yönetim → Ekran temaları yapılandırmasıdır. Cihaza yerel görsel/logo medyası, yönetilen önizleme ve yayından önce şablonun yerleşik görseliyle değiştirilir.',
    template: 'Namaz panosu tasarımı',
    source: 'Atama kaynağı',
    serviceDefault: 'Hizmet varsayılanı',
    mosqueDefault: 'Cami varsayılanı',
    displayOverride: 'Ekran geçersiz kılması',
    reportedTemplate: 'Son uygulanan tasarım',
    target: 'Hedef profil',
    compatible: 'Yayın için doğrulandı',
    incompatible: 'Yayın engellendi',
    previewDraft: 'Taslağı hedefte önizle',
    publishOverride: 'Ekran geçersiz kılmasını yayımla',
    previewMosque: 'Cami varsayılanını önizle',
    useMosque: 'Cami varsayılanını kullan',
    setMosque: 'Taslağı cami varsayılanı yap',
    mosqueRevision: 'Cami varsayılan revizyonu',
    previewRequired: 'Yayımlamadan önce bu tam hedefi önizleyin.',
    noMosqueDefault: 'Henüz bir cami varsayılanı yayımlanmadı.',
    published: 'Yönetilen namaz panosu revizyonu yayımlandı.',
  },
  id: {
    draft: 'Draf penetapan papan salat',
    draftHelp:
      'Ini adalah konfigurasi Admin → Tema layar yang tervalidasi. Media gambar/logo lokal perangkat diganti dengan karya bawaan templat sebelum pratinjau dan publikasi terkelola.',
    template: 'Desain papan salat',
    source: 'Sumber penetapan',
    serviceDefault: 'Default layanan',
    mosqueDefault: 'Default masjid',
    displayOverride: 'Override layar',
    reportedTemplate: 'Desain terakhir diterapkan',
    target: 'Profil target',
    compatible: 'Tervalidasi untuk publikasi',
    incompatible: 'Publikasi diblokir',
    previewDraft: 'Pratinjau draf pada target',
    publishOverride: 'Publikasikan override layar',
    previewMosque: 'Pratinjau default masjid',
    useMosque: 'Gunakan default masjid',
    setMosque: 'Jadikan draf default masjid',
    mosqueRevision: 'Revisi default masjid',
    previewRequired: 'Pratinjau target persis ini sebelum publikasi.',
    noMosqueDefault: 'Belum ada default masjid yang dipublikasikan.',
    published: 'Revisi papan salat terkelola dipublikasikan.',
  },
} as const;

interface EnrollmentField {
  readonly label: string;
  readonly value: string;
  readonly setValue: (value: string) => void;
}

interface TargetPreviewState {
  readonly identity: ManagedDisplayRemoteStatus['identity'];
  readonly config: PrayerBoardTemplateConfig;
}

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readAssignmentDraft(): PrayerBoardTemplateConfig {
  try {
    const stored = loadPrayerBoardDisplayConfig(getApplicationStorage());
    return createManagedPrayerBoardAssignmentConfig(stored ?? defaultPrayerBoardTemplateConfig);
  } catch {
    return createManagedPrayerBoardAssignmentConfig(defaultPrayerBoardTemplateConfig);
  }
}

function formatLastSeen(value: string | null, locale: Locale, never: string): string {
  if (value === null) return never;
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function assignmentFingerprint(
  displayId: string,
  purpose: 'draft' | 'mosque-default',
  config: PrayerBoardTemplateConfig,
): string {
  return `${displayId}:${purpose}:${JSON.stringify(config)}`;
}

export function RemoteDisplayAdminPanel() {
  const locale = readLocale();
  const text = copy[locale];
  const assignmentText = assignmentCopy[locale];
  const [baseUrl, setBaseUrl] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [displays, setDisplays] = useState<readonly ManagedDisplayRemoteStatus[]>([]);
  const [mosqueDefaults, setMosqueDefaults] = useState<readonly ManagedMosquePrayerBoardDefault[]>(
    [],
  );
  const [connectionState, setConnectionState] = useState<'idle' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [deviceCredential, setDeviceCredential] = useState<string | null>(null);
  const [displayId, setDisplayId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [mosqueId, setMosqueId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [resolutionProfile, setResolutionProfile] = useState('1920x1080');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [playlistId, setPlaylistId] = useState('');
  const [assignmentDraft] = useState(readAssignmentDraft);
  const [previewed, setPreviewed] = useState<Record<string, true>>({});
  const [targetPreview, setTargetPreview] = useState<TargetPreviewState | null>(null);

  const client = useMemo(() => {
    try {
      return baseUrl.trim() === '' || adminToken.trim() === ''
        ? null
        : createManagedAdminClient({ baseUrl, adminToken });
    } catch {
      return null;
    }
  }, [adminToken, baseUrl]);

  const mosqueDefaultById = useMemo(
    () => new Map(mosqueDefaults.map((entry) => [entry.mosqueId, entry] as const)),
    [mosqueDefaults],
  );

  if (smartDisplayModeRequested(window.location.search)) return null;

  const refreshFleet = async () => {
    setDeviceCredential(null);
    setStatusMessage('');
    if (client === null) {
      setConnectionState('error');
      setErrorMessage('Invalid service URL or admin token format.');
      return;
    }
    try {
      const [nextDisplays, nextDefaults] = await Promise.all([
        client.listDisplays(),
        client.listMosquePrayerBoardDefaults(),
      ]);
      setDisplays(nextDisplays);
      setMosqueDefaults(nextDefaults);
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

  const openTargetPreview = (
    display: ManagedDisplayRemoteStatus,
    config: PrayerBoardTemplateConfig,
    purpose: 'draft' | 'mosque-default',
  ) => {
    const normalized = createManagedPrayerBoardAssignmentConfig(config);
    setPreviewed((current) => ({
      ...current,
      [assignmentFingerprint(display.identity.displayId, purpose, normalized)]: true,
    }));
    setTargetPreview({ identity: display.identity, config: normalized });
  };

  const publishDisplayOverride = async (display: ManagedDisplayRemoteStatus) => {
    if (client === null) return;
    const target = resolveManagedPrayerBoardTarget(display.identity);
    const fingerprint = assignmentFingerprint(display.identity.displayId, 'draft', assignmentDraft);
    if (!target.supported || previewed[fingerprint] !== true) return;
    try {
      await client.updateDisplayConfig(display.identity.displayId, {
        expectedRevision: display.remoteConfig.contentRevision,
        contentRevision: display.remoteConfig.contentRevision + 1,
        playlistId: display.remoteConfig.playlistId,
        displayTheme: displayThemeForPrayerBoardConfig(assignmentDraft),
        prayerBoardConfig: assignmentDraft,
      });
      setStatusMessage(assignmentText.published);
      await refreshFleet();
      setStatusMessage(assignmentText.published);
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const publishMosqueDefault = async (display: ManagedDisplayRemoteStatus) => {
    if (client === null) return;
    const target = resolveManagedPrayerBoardTarget(display.identity);
    const fingerprint = assignmentFingerprint(display.identity.displayId, 'draft', assignmentDraft);
    if (!target.supported || previewed[fingerprint] !== true) return;
    const current = mosqueDefaultById.get(display.identity.mosqueId);
    try {
      await client.updateMosquePrayerBoardDefault(display.identity.mosqueId, {
        expectedRevision: current?.revision ?? 0,
        revision: (current?.revision ?? 0) + 1,
        prayerBoardConfig: assignmentDraft,
      });
      setStatusMessage(assignmentText.published);
      await refreshFleet();
      setStatusMessage(assignmentText.published);
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(error instanceof Error ? error.message : text.error);
    }
  };

  const useMosqueDefault = async (
    display: ManagedDisplayRemoteStatus,
    mosqueDefault: ManagedMosquePrayerBoardDefault,
  ) => {
    if (client === null) return;
    const fingerprint = assignmentFingerprint(
      display.identity.displayId,
      'mosque-default',
      mosqueDefault.prayerBoardConfig,
    );
    if (previewed[fingerprint] !== true) return;
    try {
      await client.updateDisplayConfig(display.identity.displayId, {
        expectedRevision: display.remoteConfig.contentRevision,
        contentRevision: display.remoteConfig.contentRevision + 1,
        playlistId: display.remoteConfig.playlistId,
        displayTheme: displayThemeForPrayerBoardConfig(mosqueDefault.prayerBoardConfig),
        prayerBoardConfig: null,
      });
      setStatusMessage(assignmentText.published);
      await refreshFleet();
      setStatusMessage(assignmentText.published);
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

      <aside className="remote-display-admin-panel__assignment-draft">
        <div>
          <strong>{assignmentText.draft}</strong>
          <span>{assignmentText.draftHelp}</span>
        </div>
        <b>{getPrayerBoardTemplate(assignmentDraft.templateId).label}</b>
      </aside>

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
          ? statusMessage || text.connected
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
            {displays.map((display) => {
              const target = resolveManagedPrayerBoardTarget(display.identity);
              const mosqueDefault = mosqueDefaultById.get(display.identity.mosqueId);
              const draftFingerprint = assignmentFingerprint(
                display.identity.displayId,
                'draft',
                assignmentDraft,
              );
              const mosqueFingerprint =
                mosqueDefault === undefined
                  ? null
                  : assignmentFingerprint(
                      display.identity.displayId,
                      'mosque-default',
                      mosqueDefault.prayerBoardConfig,
                    );
              const assignmentLabel =
                display.remoteConfig.prayerBoardAssignment === 'display-override'
                  ? assignmentText.displayOverride
                  : display.remoteConfig.prayerBoardAssignment === 'mosque-default'
                    ? assignmentText.mosqueDefault
                    : assignmentText.serviceDefault;
              return (
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
                      <dt>{assignmentText.template}</dt>
                      <dd>
                        {
                          getPrayerBoardTemplate(display.remoteConfig.prayerBoardConfig.templateId)
                            .label
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>{assignmentText.source}</dt>
                      <dd>{assignmentLabel}</dd>
                    </div>
                    <div>
                      <dt>{assignmentText.reportedTemplate}</dt>
                      <dd>
                        {display.reportedPrayerBoardTemplateId === null
                          ? '—'
                          : getPrayerBoardTemplate(display.reportedPrayerBoardTemplateId).label}
                      </dd>
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
                      <dt>{assignmentText.target}</dt>
                      <dd dir="ltr">
                        {target.width > 0
                          ? `${String(target.width)}×${String(target.height)} · `
                          : ''}
                        {display.identity.orientation} · {display.identity.resolutionProfile}
                      </dd>
                    </div>
                    <div>
                      <dt>{assignmentText.mosqueRevision}</dt>
                      <dd>{mosqueDefault?.revision ?? '—'}</dd>
                    </div>
                  </dl>

                  <p
                    className="remote-display-card__compatibility"
                    data-compatible={target.supported ? 'true' : 'false'}
                  >
                    <strong>
                      {target.supported ? assignmentText.compatible : assignmentText.incompatible}
                    </strong>
                    {!target.supported && <span>{target.reason}</span>}
                  </p>

                  <div className="remote-display-card__assignment-actions">
                    <button
                      type="button"
                      disabled={!target.supported || display.remoteConfig.revoked}
                      onClick={() => {
                        openTargetPreview(display, assignmentDraft, 'draft');
                      }}
                    >
                      {assignmentText.previewDraft}
                    </button>
                    <button
                      type="button"
                      disabled={
                        !target.supported ||
                        display.remoteConfig.revoked ||
                        previewed[draftFingerprint] !== true
                      }
                      onClick={() => void publishDisplayOverride(display)}
                    >
                      {assignmentText.publishOverride}
                    </button>
                    <button
                      type="button"
                      disabled={
                        !target.supported ||
                        display.remoteConfig.revoked ||
                        previewed[draftFingerprint] !== true
                      }
                      onClick={() => void publishMosqueDefault(display)}
                    >
                      {assignmentText.setMosque}
                    </button>
                    {mosqueDefault === undefined ? (
                      <span className="remote-display-card__assignment-note">
                        {assignmentText.noMosqueDefault}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!target.supported || display.remoteConfig.revoked}
                          onClick={() => {
                            openTargetPreview(
                              display,
                              mosqueDefault.prayerBoardConfig,
                              'mosque-default',
                            );
                          }}
                        >
                          {assignmentText.previewMosque}
                        </button>
                        <button
                          type="button"
                          disabled={
                            !target.supported ||
                            display.remoteConfig.revoked ||
                            mosqueFingerprint === null ||
                            previewed[mosqueFingerprint] !== true
                          }
                          onClick={() => void useMosqueDefault(display, mosqueDefault)}
                        >
                          {assignmentText.useMosque}
                        </button>
                      </>
                    )}
                    {(previewed[draftFingerprint] !== true ||
                      (mosqueDefault !== undefined &&
                        mosqueFingerprint !== null &&
                        previewed[mosqueFingerprint] !== true)) &&
                      target.supported && (
                        <span className="remote-display-card__assignment-note">
                          {assignmentText.previewRequired}
                        </span>
                      )}
                  </div>

                  <div className="remote-display-card__actions">
                    <button
                      type="button"
                      disabled={display.remoteConfig.revoked}
                      onClick={() => void revokeDisplay(display)}
                    >
                      {text.revoke}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {targetPreview !== null && (
        <ManagedDisplayTargetPreview
          identity={targetPreview.identity}
          config={targetPreview.config}
          locale={locale}
          onClose={() => {
            setTargetPreview(null);
          }}
        />
      )}
    </section>
  );
}
