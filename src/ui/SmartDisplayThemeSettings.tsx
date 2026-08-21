import { useEffect, useMemo, useState } from 'react';

import {
  PRAYER_BOARD_CORE_MODULES,
  getPrayerBoardTemplate,
  parsePrayerBoardTemplateConfig,
  prayerBoardTemplateRegistry,
  type PrayerBoardAccentPreset,
  type PrayerBoardModuleId,
  type PrayerBoardTemplateConfig,
  type PrayerBoardTemplateId,
} from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadPrayerBoardDisplayConfig,
  PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
  savePrayerBoardDisplayConfig,
} from '../platform/prayerBoardDisplayConfig';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { PrayerBoardRenderer } from './PrayerBoardRenderer';
import { smartDisplayModeRequested } from './SmartDisplay';
import {
  buildPrayerBoardPreviewData,
  type PrayerBoardPreviewScenario,
} from './prayerBoardPreviewData';

interface DisplayConfigCopy {
  readonly title: string;
  readonly subtitle: string;
  readonly selected: string;
  readonly preview: string;
  readonly close: string;
  readonly apply: string;
  readonly applied: string;
  readonly previewRequired: string;
  readonly templateLabel: string;
  readonly configuration: string;
  readonly language: string;
  readonly timeFormat: string;
  readonly accent: string;
  readonly branding: string;
  readonly mosqueName: string;
  readonly modules: string;
  readonly modulesHelp: string;
  readonly landscapeOnly: string;
  readonly previewState: string;
  readonly previewLanguage: string;
  readonly coreLocked: string;
  readonly optional: string;
}

const displayConfigCopy: Readonly<Record<Locale, DisplayConfigCopy>> = {
  en: {
    title: 'Prayer-board designs',
    subtitle:
      'Choose one of the six SalahOS display designs, configure presentation-only options, then review the exact full-screen result before applying it to this display.',
    selected: 'Selected',
    preview: 'Full-screen preview',
    close: 'Close preview',
    apply: 'Apply to this display',
    applied: 'Display configuration applied.',
    previewRequired: 'Preview the current draft before applying it.',
    templateLabel: 'Design',
    configuration: 'Display configuration',
    language: 'Primary language',
    timeFormat: 'Clock format',
    accent: 'Accent preset',
    branding: 'Mosque branding',
    mosqueName: 'Display mosque name',
    modules: 'Optional modules',
    modulesHelp:
      'Core time, next-prayer, countdown and five-prayer timetable information cannot be hidden.',
    landscapeOnly: 'Landscape is the only validated orientation for these TV/kiosk designs.',
    previewState: 'Representative state',
    previewLanguage: 'Preview language',
    coreLocked: 'Core · always shown',
    optional: 'Optional',
  },
  ar: {
    title: 'تصاميم لوحة الصلاة',
    subtitle:
      'اختر أحد تصاميم صلاح أو إس الستة، واضبط خيارات العرض فقط، ثم راجع النتيجة بملء الشاشة قبل تطبيقها على هذه الشاشة.',
    selected: 'محدد',
    preview: 'معاينة بملء الشاشة',
    close: 'إغلاق المعاينة',
    apply: 'تطبيق على هذه الشاشة',
    applied: 'تم تطبيق إعدادات الشاشة.',
    previewRequired: 'عاين المسودة الحالية قبل تطبيقها.',
    templateLabel: 'التصميم',
    configuration: 'إعدادات الشاشة',
    language: 'اللغة الأساسية',
    timeFormat: 'تنسيق الساعة',
    accent: 'نمط الألوان',
    branding: 'هوية المسجد',
    mosqueName: 'اسم المسجد على الشاشة',
    modules: 'الوحدات الاختيارية',
    modulesHelp: 'لا يمكن إخفاء الوقت والصلاة التالية والعد التنازلي وجدول الصلوات الخمس.',
    landscapeOnly: 'الوضع الأفقي هو الاتجاه المعتمد حالياً لتصاميم التلفاز والكشك.',
    previewState: 'حالة تمثيلية',
    previewLanguage: 'لغة المعاينة',
    coreLocked: 'أساسي · يظهر دائماً',
    optional: 'اختياري',
  },
  tr: {
    title: 'Namaz panosu tasarımları',
    subtitle:
      'Altı SalahOS ekran tasarımından birini seçin, yalnızca sunum seçeneklerini ayarlayın ve bu ekrana uygulamadan önce tam ekran sonucu inceleyin.',
    selected: 'Seçili',
    preview: 'Tam ekran önizleme',
    close: 'Önizlemeyi kapat',
    apply: 'Bu ekrana uygula',
    applied: 'Ekran yapılandırması uygulandı.',
    previewRequired: 'Uygulamadan önce mevcut taslağı önizleyin.',
    templateLabel: 'Tasarım',
    configuration: 'Ekran yapılandırması',
    language: 'Birincil dil',
    timeFormat: 'Saat biçimi',
    accent: 'Vurgu ön ayarı',
    branding: 'Cami markalaması',
    mosqueName: 'Ekrandaki cami adı',
    modules: 'İsteğe bağlı modüller',
    modulesHelp: 'Saat, sonraki namaz, geri sayım ve beş vakit tablosu gizlenemez.',
    landscapeOnly: 'Bu TV/kiosk tasarımları için doğrulanmış tek yön yataydır.',
    previewState: 'Temsili durum',
    previewLanguage: 'Önizleme dili',
    coreLocked: 'Temel · her zaman görünür',
    optional: 'İsteğe bağlı',
  },
  id: {
    title: 'Desain papan salat',
    subtitle:
      'Pilih salah satu dari enam desain layar SalahOS, atur opsi presentasi saja, lalu tinjau hasil layar penuh sebelum menerapkannya ke layar ini.',
    selected: 'Dipilih',
    preview: 'Pratinjau layar penuh',
    close: 'Tutup pratinjau',
    apply: 'Terapkan ke layar ini',
    applied: 'Konfigurasi layar diterapkan.',
    previewRequired: 'Pratinjau draf saat ini sebelum menerapkannya.',
    templateLabel: 'Desain',
    configuration: 'Konfigurasi layar',
    language: 'Bahasa utama',
    timeFormat: 'Format jam',
    accent: 'Preset aksen',
    branding: 'Identitas masjid',
    mosqueName: 'Nama masjid di layar',
    modules: 'Modul opsional',
    modulesHelp: 'Waktu, salat berikutnya, hitung mundur, dan jadwal lima salat tidak dapat disembunyikan.',
    landscapeOnly: 'Lanskap adalah satu-satunya orientasi yang tervalidasi untuk desain TV/kios ini.',
    previewState: 'Keadaan contoh',
    previewLanguage: 'Bahasa pratinjau',
    coreLocked: 'Inti · selalu tampil',
    optional: 'Opsional',
  },
};

const optionalModules: readonly PrayerBoardModuleId[] = [
  'dates',
  'jumuah',
  'sunrise-sunset',
  'mosque-branding',
  'announcements',
  'weather',
];

const moduleLabels: Readonly<Record<Locale, Readonly<Record<PrayerBoardModuleId, string>>>> = {
  en: {
    'current-time': 'Current time',
    dates: 'Gregorian & Hijri dates',
    'next-prayer': 'Next prayer',
    countdown: 'Countdown',
    'prayer-timetable': 'Five-prayer timetable',
    jumuah: "Jumu'ah sessions",
    'sunrise-sunset': 'Sunrise & sunset',
    'mosque-branding': 'Mosque branding',
    announcements: 'Announcements',
    weather: 'Weather',
  },
  ar: {
    'current-time': 'الوقت الحالي',
    dates: 'التاريخ الميلادي والهجري',
    'next-prayer': 'الصلاة التالية',
    countdown: 'العد التنازلي',
    'prayer-timetable': 'جدول الصلوات الخمس',
    jumuah: 'صلوات الجمعة',
    'sunrise-sunset': 'الشروق والغروب',
    'mosque-branding': 'هوية المسجد',
    announcements: 'الإعلانات',
    weather: 'الطقس',
  },
  tr: {
    'current-time': 'Mevcut saat',
    dates: 'Miladi ve Hicri tarihler',
    'next-prayer': 'Sonraki namaz',
    countdown: 'Geri sayım',
    'prayer-timetable': 'Beş vakit tablosu',
    jumuah: 'Cuma oturumları',
    'sunrise-sunset': 'Gün doğumu ve batımı',
    'mosque-branding': 'Cami markalaması',
    announcements: 'Duyurular',
    weather: 'Hava durumu',
  },
  id: {
    'current-time': 'Waktu saat ini',
    dates: 'Tanggal Masehi & Hijriah',
    'next-prayer': 'Salat berikutnya',
    countdown: 'Hitung mundur',
    'prayer-timetable': 'Jadwal lima salat',
    jumuah: 'Sesi Jumat',
    'sunrise-sunset': 'Terbit & terbenam',
    'mosque-branding': 'Identitas masjid',
    announcements: 'Pengumuman',
    weather: 'Cuaca',
  },
};

const scenarioLabels: Readonly<Record<Locale, Readonly<Record<PrayerBoardPreviewScenario, string>>>> = {
  en: {
    'before-prayer': 'Before prayer',
    'near-athan': 'Near Athan',
    'between-athan-iqamah': 'Between Athan & Iqamah',
    'iqamah-now': 'Iqamah now',
    jumuah: "Jumu'ah day",
  },
  ar: {
    'before-prayer': 'قبل الصلاة',
    'near-athan': 'قرب الأذان',
    'between-athan-iqamah': 'بين الأذان والإقامة',
    'iqamah-now': 'الإقامة الآن',
    jumuah: 'يوم الجمعة',
  },
  tr: {
    'before-prayer': 'Namazdan önce',
    'near-athan': 'Ezana yakın',
    'between-athan-iqamah': 'Ezan ile kamet arası',
    'iqamah-now': 'Kamet şimdi',
    jumuah: 'Cuma günü',
  },
  id: {
    'before-prayer': 'Sebelum salat',
    'near-athan': 'Menjelang azan',
    'between-athan-iqamah': 'Antara azan & iqamah',
    'iqamah-now': 'Iqamah sekarang',
    jumuah: 'Hari Jumat',
  },
};

const accentLabels: Readonly<Record<PrayerBoardAccentPreset, string>> = {
  emerald: 'Emerald',
  midnight: 'Midnight',
  sandstone: 'Sandstone',
  neutral: 'Neutral',
  jewel: 'Jewel',
};

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function initialDisplayConfig(): PrayerBoardTemplateConfig {
  try {
    const storage = getApplicationStorage();
    const saved = loadPrayerBoardDisplayConfig(storage);
    if (saved !== null) return saved;
    const settings = loadPersistedSettings(storage);
    return parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'heritage-classic',
      primaryLocale: settings.locale,
      timeFormat: settings.timeFormat,
      accentPreset: 'emerald',
    });
  } catch {
    return parsePrayerBoardTemplateConfig({ version: 1, templateId: 'heritage-classic' });
  }
}

function TemplateThumbnail({ templateId }: Readonly<{ templateId: PrayerBoardTemplateId }>) {
  return (
    <span
      className={`prayer-board-template-thumbnail prayer-board-template-thumbnail--${templateId}`}
      aria-hidden="true"
    >
      <span className="prayer-board-template-thumbnail__brand" />
      <span className="prayer-board-template-thumbnail__clock">12:34</span>
      <span className="prayer-board-template-thumbnail__focus" />
      <span className="prayer-board-template-thumbnail__rows">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

export function SmartDisplayThemeSettings() {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [appliedConfig, setAppliedConfig] = useState<PrayerBoardTemplateConfig>(initialDisplayConfig);
  const [draftConfig, setDraftConfig] = useState<PrayerBoardTemplateConfig>(initialDisplayConfig);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<'en' | 'ar'>('en');
  const [previewScenario, setPreviewScenario] =
    useState<PrayerBoardPreviewScenario>('near-athan');
  const [previewedFingerprint, setPreviewedFingerprint] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const text = displayConfigCopy[locale];
  const fingerprint = JSON.stringify(draftConfig);
  const appliedFingerprint = JSON.stringify(appliedConfig);
  const dirty = fingerprint !== appliedFingerprint;
  const previewedCurrentDraft = previewedFingerprint === fingerprint;
  const previewData = useMemo(
    () => buildPrayerBoardPreviewData(previewScenario),
    [previewScenario],
  );
  const previewConfig = useMemo(
    () =>
      parsePrayerBoardTemplateConfig({
        ...draftConfig,
        primaryLocale: previewLocale,
      }),
    [draftConfig, previewLocale],
  );

  useEffect(() => {
    const refresh = () => {
      const nextLocale = readLocale();
      const nextConfig = initialDisplayConfig();
      setLocale(nextLocale);
      setAppliedConfig(nextConfig);
      setDraftConfig(nextConfig);
      setPreviewedFingerprint(null);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const replaceDraft = (value: unknown) => {
    setDraftConfig(parsePrayerBoardTemplateConfig(value));
    setStatus(null);
  };

  const selectTemplate = (templateId: PrayerBoardTemplateId) => {
    const definition = getPrayerBoardTemplate(templateId);
    replaceDraft({
      ...draftConfig,
      templateId,
      background: { kind: 'builtin', artworkId: definition.fallbackArtworkId },
    });
  };

  const setModuleVisibility = (moduleId: PrayerBoardModuleId, visible: boolean) => {
    replaceDraft({
      ...draftConfig,
      moduleVisibility: { ...draftConfig.moduleVisibility, [moduleId]: visible },
    });
  };

  const openPreview = () => {
    setPreviewLocale(draftConfig.primaryLocale === 'ar' ? 'ar' : 'en');
    setPreviewedFingerprint(fingerprint);
    setPreviewOpen(true);
  };

  const applyDraft = () => {
    if (!previewedCurrentDraft) return;
    const saved = savePrayerBoardDisplayConfig(getApplicationStorage(), draftConfig);
    setAppliedConfig(saved);
    setDraftConfig(saved);
    setPreviewedFingerprint(JSON.stringify(saved));
    setStatus(text.applied);
    window.dispatchEvent(new Event(PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT));
  };

  return (
    <section
      className="smart-display-theme-settings prayer-board-config-editor"
      aria-labelledby="smart-display-theme-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="prayer-board-config-editor__header">
        <div>
          <h2 id="smart-display-theme-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <span className="prayer-board-config-editor__orientation">{text.landscapeOnly}</span>
      </header>

      <div className="prayer-board-template-gallery" aria-label={text.templateLabel}>
        {prayerBoardTemplateRegistry.map((definition) => {
          const selected = draftConfig.templateId === definition.id;
          return (
            <button
              key={definition.id}
              type="button"
              className="prayer-board-template-card"
              data-template-card={definition.id}
              aria-pressed={selected}
              onClick={() => {
                selectTemplate(definition.id);
              }}
            >
              <TemplateThumbnail templateId={definition.id} />
              <span className="prayer-board-template-card__copy">
                <strong>{definition.label}</strong>
                <small>{selected ? text.selected : text.optional}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="prayer-board-config-editor__layout">
        <section className="prayer-board-config-panel" aria-labelledby="display-config-title">
          <div className="prayer-board-config-panel__heading">
            <h3 id="display-config-title">{text.configuration}</h3>
            <span>{getPrayerBoardTemplate(draftConfig.templateId).label}</span>
          </div>

          <div className="prayer-board-config-fields">
            <label>
              <span>{text.language}</span>
              <select
                value={draftConfig.primaryLocale}
                onChange={(event) => {
                  replaceDraft({ ...draftConfig, primaryLocale: event.target.value });
                }}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </label>

            <label>
              <span>{text.timeFormat}</span>
              <select
                value={draftConfig.timeFormat}
                onChange={(event) => {
                  replaceDraft({ ...draftConfig, timeFormat: event.target.value });
                }}
              >
                <option value="h23">24-hour</option>
                <option value="h12">12-hour</option>
              </select>
            </label>

            <label>
              <span>{text.accent}</span>
              <select
                value={draftConfig.accentPreset}
                onChange={(event) => {
                  replaceDraft({ ...draftConfig, accentPreset: event.target.value });
                }}
              >
                {(Object.keys(accentLabels) as PrayerBoardAccentPreset[]).map((accent) => (
                  <option key={accent} value={accent}>
                    {accentLabels[accent]}
                  </option>
                ))}
              </select>
            </label>

            <label className="prayer-board-config-fields__wide">
              <span>{text.mosqueName}</span>
              <input
                type="text"
                maxLength={160}
                dir="auto"
                value={draftConfig.branding.mosqueName?.[draftConfig.primaryLocale] ?? ''}
                placeholder={text.branding}
                onChange={(event) => {
                  replaceDraft({
                    ...draftConfig,
                    branding: {
                      ...draftConfig.branding,
                      mosqueName: {
                        ...(draftConfig.branding.mosqueName ?? {}),
                        [draftConfig.primaryLocale]: event.target.value,
                      },
                    },
                  });
                }}
              />
            </label>
          </div>
        </section>

        <section className="prayer-board-config-panel" aria-labelledby="display-modules-title">
          <div className="prayer-board-config-panel__heading">
            <h3 id="display-modules-title">{text.modules}</h3>
            <span>{text.optional}</span>
          </div>
          <p className="prayer-board-config-panel__help">{text.modulesHelp}</p>

          <div className="prayer-board-module-list">
            {PRAYER_BOARD_CORE_MODULES.map((moduleId) => (
              <div className="prayer-board-module-row is-locked" key={moduleId}>
                <span>{moduleLabels[locale][moduleId]}</span>
                <strong>{text.coreLocked}</strong>
              </div>
            ))}
            {optionalModules.map((moduleId) => (
              <label className="prayer-board-module-row" key={moduleId}>
                <span>{moduleLabels[locale][moduleId]}</span>
                <input
                  type="checkbox"
                  checked={draftConfig.moduleVisibility[moduleId]}
                  onChange={(event) => {
                    setModuleVisibility(moduleId, event.target.checked);
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="prayer-board-config-actions">
        <button type="button" className="secondary" onClick={openPreview}>
          {text.preview}
        </button>
        <button
          type="button"
          className="primary"
          disabled={!dirty || !previewedCurrentDraft}
          onClick={applyDraft}
        >
          {text.apply}
        </button>
        {dirty && !previewedCurrentDraft && <span role="status">{text.previewRequired}</span>}
        {status !== null && <span role="status">{status}</span>}
      </div>

      {previewOpen && (
        <div
          className="prayer-board-fullscreen-preview"
          role="dialog"
          aria-modal="true"
          aria-label={text.preview}
        >
          <div className="prayer-board-fullscreen-preview__toolbar">
            <div>
              <strong>{getPrayerBoardTemplate(draftConfig.templateId).label}</strong>
              <span>{scenarioLabels[locale][previewScenario]}</span>
            </div>
            <label>
              <span>{text.previewState}</span>
              <select
                value={previewScenario}
                onChange={(event) => {
                  setPreviewScenario(event.target.value as PrayerBoardPreviewScenario);
                }}
              >
                {(Object.keys(scenarioLabels.en) as PrayerBoardPreviewScenario[]).map((scenario) => (
                  <option key={scenario} value={scenario}>
                    {scenarioLabels[locale][scenario]}
                  </option>
                ))}
              </select>
            </label>
            <div className="prayer-board-fullscreen-preview__language" aria-label={text.previewLanguage}>
              <button
                type="button"
                aria-pressed={previewLocale === 'en'}
                onClick={() => {
                  setPreviewLocale('en');
                }}
              >
                English
              </button>
              <button
                type="button"
                aria-pressed={previewLocale === 'ar'}
                onClick={() => {
                  setPreviewLocale('ar');
                }}
              >
                العربية
              </button>
            </div>
            <button
              type="button"
              className="prayer-board-fullscreen-preview__close"
              onClick={() => {
                setPreviewOpen(false);
              }}
            >
              {text.close}
            </button>
          </div>
          <div
            className="prayer-board-fullscreen-preview__stage"
            dir={previewLocale === 'ar' ? 'rtl' : 'ltr'}
            lang={previewLocale}
          >
            <PrayerBoardRenderer data={previewData} config={previewConfig} />
          </div>
        </div>
      )}
    </section>
  );
}
