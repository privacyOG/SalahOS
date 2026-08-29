import { useEffect, useMemo, useState } from 'react';
import { calculationMethods } from '../domain/methods';
import { applyDocumentLocale, translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  defaultPersistedSettings,
  exportPersistedSettings,
  importPersistedSettings,
  loadPersistedSettings,
  resetPersistedSettings,
  savePersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import { installThemePreference } from '../platform/themePreference';
import { applyThemePalette, themePaletteLabels, themePalettes } from '../platform/themePalette';
import { MobilePrayerThemeSettings } from './MobilePrayerThemeSettings';
import { PrayerBoardWeatherSettings } from './PrayerBoardWeatherSettings';
import { PrivacyDiagnosticsSettings } from './PrivacyDiagnosticsSettings';
import { RamadanModePanel } from './RamadanModePanel';
import {
  AdvancedPrayerSettingsPanel,
  LocationSettingsPanel,
  MosqueIqamahSettingsPanel,
  NotificationAdhanSettingsPanel,
  useSettingsNotificationSynchronization,
} from './SettingsMigrationPanels';
import { TaraweehPanel } from './TaraweehPanel';
import {
  readSettingsCategory,
  searchForAdminDestination,
  searchForSettingsCategory,
  type SettingsCategory,
} from './applicationRoute';

type SettingsCopy = Readonly<{
  heading: string;
  intro: string;
  back: string;
  prayerTitle: string;
  prayerDescription: string;
  locationTitle: string;
  locationDescription: string;
  mosqueTitle: string;
  mosqueDescription: string;
  notificationsTitle: string;
  notificationsDescription: string;
  appearanceTitle: string;
  appearanceDescription: string;
  dataTitle: string;
  dataDescription: string;
  displayTitle: string;
  displayDescription: string;
  advancedTitle: string;
  advancedDescription: string;
  displayAction: string;
  exportHelp: string;
  imported: string;
  importError: string;
  reset: string;
  palette: string;
}>;

const base = { palette: 'Colour palette' };
const settingsCopy: Readonly<Record<Locale, SettingsCopy>> = {
  en: {
    ...base,
    heading: 'Settings',
    intro:
      'Choose a category. Everyday controls stay focused while uncommon tools remain out of the way.',
    back: 'All settings',
    prayerTitle: 'Prayer settings',
    prayerDescription:
      'Prayer source, calculation method, Asr convention and high-latitude handling.',
    locationTitle: 'Location',
    locationDescription:
      'Current location, offline city search, saved places and manual coordinates.',
    mosqueTitle: 'Mosques',
    mosqueDescription: 'Local mosque timetables, Iqamah, Ramadan and Taraweeh configuration.',
    notificationsTitle: 'Adhan',
    notificationsDescription:
      'Prayer reminders, prayer-time alerts, vibration, sound and local Adhan options.',
    appearanceTitle: 'Appearance & language',
    appearanceDescription: 'Language, clock format, appearance and colour palette.',
    dataTitle: 'Privacy & data',
    dataDescription: 'Manage local data, privacy controls and optional diagnostics.',
    displayTitle: 'Display',
    displayDescription:
      'Open managed-display configuration without mixing credentials or fleet controls into daily settings.',
    advancedTitle: 'Advanced',
    advancedDescription:
      'Manual timetable import, prayer offsets and less common prayer configuration.',
    displayAction: 'Open managed displays',
    exportHelp:
      'Import, export or reset device settings here. Optional diagnostics are controlled separately below.',
    imported: 'Settings imported successfully.',
    importError: 'Settings data is invalid or unsupported.',
    reset: 'Settings reset to defaults.',
  },
  ar: {
    ...base,
    palette: 'لوحة الألوان',
    heading: 'الإعدادات',
    intro:
      'اختر فئة. تبقى الإعدادات اليومية واضحة بينما توضع الأدوات غير الشائعة بعيداً عن الواجهة الأساسية.',
    back: 'كل الإعدادات',
    prayerTitle: 'إعدادات الصلاة',
    prayerDescription: 'مصدر المواقيت وطريقة الحساب ومذهب العصر ومعالجة خطوط العرض العليا.',
    locationTitle: 'الموقع',
    locationDescription:
      'الموقع الحالي والبحث المحلي دون اتصال والمواقع المحفوظة والإحداثيات اليدوية.',
    mosqueTitle: 'المساجد',
    mosqueDescription: 'جداول المسجد والإقامة وإعدادات رمضان والتراويح.',
    notificationsTitle: 'الأذان',
    notificationsDescription:
      'التذكيرات وإشعارات وقت الصلاة والاهتزاز والصوت وخيارات الأذان المحلي.',
    appearanceTitle: 'المظهر واللغة',
    appearanceDescription: 'اللغة وتنسيق الساعة والمظهر ولوحة الألوان.',
    dataTitle: 'الخصوصية والبيانات',
    dataDescription: 'إدارة البيانات المحلية وضوابط الخصوصية والتشخيصات الاختيارية.',
    displayTitle: 'العرض',
    displayDescription:
      'افتح إدارة الشاشات من دون إظهار بيانات الدخول أو الأسطول في الإعدادات اليومية.',
    advancedTitle: 'متقدم',
    advancedDescription: 'استيراد الجداول يدوياً وتعديلات أوقات الصلاة والإعدادات الأقل استخداماً.',
    displayAction: 'افتح الشاشات المُدارة',
    exportHelp: 'استورد إعدادات الجهاز أو صدّرها أو أعد ضبطها هنا.',
    imported: 'تم استيراد الإعدادات بنجاح.',
    importError: 'بيانات الإعدادات غير صالحة أو غير مدعومة.',
    reset: 'تمت إعادة الإعدادات إلى القيم الافتراضية.',
  },
  tr: {
    ...base,
    palette: 'Renk paleti',
    heading: 'Ayarlar',
    intro:
      'Bir kategori seçin. Günlük kontroller odaklı kalırken seyrek kullanılan araçlar geri planda tutulur.',
    back: 'Tüm ayarlar',
    prayerTitle: 'Namaz ayarları',
    prayerDescription: 'Vakit kaynağı, hesaplama yöntemi, ikindi yaklaşımı ve yüksek enlem kuralı.',
    locationTitle: 'Konum',
    locationDescription:
      'Mevcut konum, çevrimdışı şehir araması, kayıtlı yerler ve elle koordinatlar.',
    mosqueTitle: 'Camiler',
    mosqueDescription: 'Yerel cami vakitleri, ikamet, Ramazan ve teravih yapılandırması.',
    notificationsTitle: 'Ezan',
    notificationsDescription:
      'Hatırlatmalar, vakit bildirimleri, titreşim, ses ve yerel ezan seçenekleri.',
    appearanceTitle: 'Görünüm ve dil',
    appearanceDescription: 'Dil, saat biçimi, görünüm ve renk paleti.',
    dataTitle: 'Gizlilik ve veri',
    dataDescription: 'Yerel verileri, gizlilik kontrollerini ve isteğe bağlı tanılamayı yönetin.',
    displayTitle: 'Ekran',
    displayDescription: 'Yönetilen ekranları açın.',
    advancedTitle: 'Gelişmiş',
    advancedDescription: 'Elle vakit içe aktarma ve daha seyrek kullanılan ayarlar.',
    displayAction: 'Yönetilen ekranları aç',
    exportHelp: 'Cihaz ayarlarını burada içe aktarın, dışa aktarın veya sıfırlayın.',
    imported: 'Ayarlar başarıyla içe aktarıldı.',
    importError: 'Ayar verileri geçersiz veya desteklenmiyor.',
    reset: 'Ayarlar varsayılanlara sıfırlandı.',
  },
  id: {
    ...base,
    palette: 'Palet warna',
    heading: 'Pengaturan',
    intro:
      'Pilih kategori. Kontrol harian tetap fokus sementara alat yang jarang dipakai tidak mengganggu.',
    back: 'Semua pengaturan',
    prayerTitle: 'Pengaturan salat',
    prayerDescription: 'Sumber waktu, metode perhitungan, aturan Asar, dan lintang tinggi.',
    locationTitle: 'Lokasi',
    locationDescription:
      'Lokasi saat ini, pencarian kota luring, lokasi tersimpan, dan koordinat manual.',
    mosqueTitle: 'Masjid',
    mosqueDescription: 'Jadwal masjid lokal, Iqamah, Ramadan, dan konfigurasi Tarawih.',
    notificationsTitle: 'Adzan',
    notificationsDescription:
      'Pengingat, notifikasi waktu salat, getaran, suara, dan opsi Adzan lokal.',
    appearanceTitle: 'Tampilan & bahasa',
    appearanceDescription: 'Bahasa, format jam, tampilan, dan palet warna.',
    dataTitle: 'Privasi & data',
    dataDescription: 'Kelola data lokal, kontrol privasi, dan diagnostik opsional.',
    displayTitle: 'Tampilan',
    displayDescription: 'Buka layar terkelola.',
    advancedTitle: 'Lanjutan',
    advancedDescription: 'Impor jadwal manual dan pengaturan yang lebih jarang digunakan.',
    displayAction: 'Buka layar terkelola',
    exportHelp: 'Impor, ekspor, atau atur ulang pengaturan perangkat di sini.',
    imported: 'Pengaturan berhasil diimpor.',
    importError: 'Data pengaturan tidak valid atau tidak didukung.',
    reset: 'Pengaturan dikembalikan ke default.',
  },
};

type CategoryDefinition = Readonly<{
  id: SettingsCategory;
  title: keyof SettingsCopy;
  description: keyof SettingsCopy;
}>;

const categories: readonly CategoryDefinition[] = [
  { id: 'location', title: 'locationTitle', description: 'locationDescription' },
  { id: 'prayer', title: 'prayerTitle', description: 'prayerDescription' },
  { id: 'adhan', title: 'notificationsTitle', description: 'notificationsDescription' },
  { id: 'display', title: 'displayTitle', description: 'displayDescription' },
  { id: 'mosques', title: 'mosqueTitle', description: 'mosqueDescription' },
  { id: 'privacy-data', title: 'dataTitle', description: 'dataDescription' },
  { id: 'advanced', title: 'advancedTitle', description: 'advancedDescription' },
];

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function categorySearch(category: SettingsCategory | null) {
  return searchForSettingsCategory(window.location.search, category);
}

function administrationDisplaysHref() {
  const search = searchForAdminDestination(window.location.search, 'displays');
  return `${window.location.pathname}${search}${window.location.hash}`;
}

function PrayerSettingsForm({
  settings,
  updateSettings,
}: Readonly<{
  settings: PersistedSettings;
  updateSettings: (update: (current: PersistedSettings) => PersistedSettings) => void;
}>) {
  const locale = settings.locale;
  return (
    <div className="settings-focus-grid">
      <label>
        <span>{translate(locale, 'sourceMode')}</span>
        <select
          value={settings.prayerSourceMode}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              prayerSourceMode: event.target.value as PersistedSettings['prayerSourceMode'],
            }));
          }}
        >
          <option value="calculated">{translate(locale, 'sourceCalculated')}</option>
          <option value="calculated-adjustments">
            {translate(locale, 'sourceCalculatedAdjustments')}
          </option>
          <option value="local-mosque" disabled={settings.mosqueTimetable === null}>
            {translate(locale, 'sourceLocalMosque')}
          </option>
        </select>
      </label>
      <label>
        <span>{translate(locale, 'calculationMethod')}</span>
        <select
          value={settings.calculationMethodId}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              calculationMethodId: event.target.value as PersistedSettings['calculationMethodId'],
            }));
          }}
        >
          {Object.values(calculationMethods).map((method) => (
            <option dir="auto" key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{translate(locale, 'asrMethod')}</span>
        <select
          value={settings.asrConvention}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              asrConvention: event.target.value as PersistedSettings['asrConvention'],
            }));
          }}
        >
          <option value="standard">{translate(locale, 'asrStandard')}</option>
          <option value="hanafi">{translate(locale, 'asrHanafi')}</option>
        </select>
        <small>{translate(locale, 'asrConventionExplanation')}</small>
      </label>
      <label>
        <span>{translate(locale, 'highLatitudeRule')}</span>
        <select
          value={settings.highLatitudeRule}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              highLatitudeRule: event.target.value as PersistedSettings['highLatitudeRule'],
            }));
          }}
        >
          <option value="angle-based">{translate(locale, 'highLatitudeAngle')}</option>
          <option value="middle-of-the-night">{translate(locale, 'highLatitudeMiddle')}</option>
          <option value="one-seventh">{translate(locale, 'highLatitudeSeventh')}</option>
        </select>
      </label>
      <label>
        <span>{translate(locale, 'hijriCorrection')}</span>
        <select
          value={settings.hijriCorrectionDays}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              hijriCorrectionDays: Number(event.target.value),
            }));
          }}
        >
          {[-2, -1, 0, 1, 2].map((day) => (
            <option key={day} value={day}>
              {day > 0 ? `+${String(day)}` : day}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function AppearanceSettingsForm({
  settings,
  updateSettings,
}: Readonly<{
  settings: PersistedSettings;
  updateSettings: (update: (current: PersistedSettings) => PersistedSettings) => void;
}>) {
  const locale = settings.locale;
  return (
    <div className="settings-focus-grid">
      <label>
        <span>{translate(locale, 'language')}</span>
        <select
          value={settings.locale}
          onChange={(event) => {
            updateSettings((current) => ({ ...current, locale: event.target.value as Locale }));
          }}
        >
          <option value="en">{translate(locale, 'english')}</option>
          <option value="ar">{translate(locale, 'arabic')}</option>
          <option value="tr">{translate(locale, 'turkish')}</option>
          <option value="id">{translate(locale, 'indonesian')}</option>
        </select>
      </label>
      <label>
        <span>{translate(locale, 'timeFormat')}</span>
        <select
          value={settings.timeFormat}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              timeFormat: event.target.value as PersistedSettings['timeFormat'],
            }));
          }}
        >
          <option value="h23">{translate(locale, 'time24')}</option>
          <option value="h12">{translate(locale, 'time12')}</option>
        </select>
      </label>
      <label>
        <span>{translate(locale, 'theme')}</span>
        <select
          value={settings.theme}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              theme: event.target.value as PersistedSettings['theme'],
            }));
          }}
        >
          <option value="system">{translate(locale, 'themeSystem')}</option>
          <option value="light">{translate(locale, 'themeLight')}</option>
          <option value="dark">{translate(locale, 'themeDark')}</option>
        </select>
      </label>
      <label>
        <span>{settingsCopy[locale].palette}</span>
        <select
          value={settings.palette}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              palette: event.target.value as PersistedSettings['palette'],
            }));
          }}
        >
          {themePalettes.map((palette) => (
            <option key={palette} value={palette}>
              {themePaletteLabels[palette]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function SettingsScreen() {
  const [settings, setSettings] = useState(initialSettings);
  const [category, setCategory] = useState<SettingsCategory | null>(() =>
    readSettingsCategory(window.location.search),
  );
  const [settingsPayload, setSettingsPayload] = useState('');
  const [dataMessage, setDataMessage] = useState<'imported' | 'importError' | 'reset' | null>(null);
  const copy = settingsCopy[settings.locale];
  const selectedDefinition = useMemo(
    () => categories.find((definition) => definition.id === category) ?? null,
    [category],
  );
  const notificationRuntime = useSettingsNotificationSynchronization(settings);

  useEffect(() => {
    applyDocumentLocale(document.documentElement, settings.locale);
    applyThemePalette(settings.palette, document);
    try {
      savePersistedSettings(getApplicationStorage(), settings);
    } catch {
      // Keep settings usable in memory when storage is unavailable.
    }
    return installThemePreference(settings.theme, {
      documentTarget: document,
      windowTarget: window,
    });
  }, [settings]);

  useEffect(() => {
    const handlePopState = () => {
      setCategory(readSettingsCategory(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    try {
      setSettings(loadPersistedSettings(getApplicationStorage()));
    } catch {
      // Keep current in-memory settings.
    }
  }, [category]);

  const updateSettings = (update: (current: PersistedSettings) => PersistedSettings) => {
    setSettings((current) => update(current));
    setDataMessage(null);
  };
  const navigateCategory = (next: SettingsCategory | null) => {
    const search = categorySearch(next);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${search}${window.location.hash}`,
    );
    setCategory(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const exportSettings = () => {
    setSettingsPayload(exportPersistedSettings(settings));
    setDataMessage(null);
  };
  const importSettings = () => {
    try {
      setSettings(importPersistedSettings(settingsPayload));
      setDataMessage('imported');
    } catch {
      setDataMessage('importError');
    }
  };
  const resetSettings = () => {
    try {
      resetPersistedSettings(getApplicationStorage());
    } catch {
      // In-memory reset still applies.
    }
    setSettings(defaultPersistedSettings);
    setSettingsPayload('');
    setDataMessage('reset');
  };

  if (category === null || selectedDefinition === null) {
    return (
      <main
        className="settings-screen settings-screen--index"
        data-stage8-settings-categories={String(categories.length)}
      >
        <header className="settings-screen__header">
          <p className="settings-screen__eyebrow">SalahOS</p>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
        </header>
        <div className="settings-category-grid">
          {categories.map((definition) => (
            <button
              type="button"
              className="settings-category-card"
              key={definition.id}
              onClick={() => {
                navigateCategory(definition.id);
              }}
            >
              <span>
                <strong>{copy[definition.title]}</strong>
                <small>{copy[definition.description]}</small>
              </span>
              <span className="settings-category-card__arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="settings-screen settings-screen--detail">
      <header className="settings-screen__detail-header">
        <button
          type="button"
          className="settings-screen__back"
          onClick={() => {
            navigateCategory(null);
          }}
        >
          <span aria-hidden="true">←</span>
          <span>{copy.back}</span>
        </button>
        <p className="settings-screen__eyebrow">{copy.heading}</p>
        <h1>{copy[selectedDefinition.title]}</h1>
        <p>{copy[selectedDefinition.description]}</p>
      </header>

      {category === 'prayer' && (
        <section className="settings-focus-panel">
          <PrayerSettingsForm settings={settings} updateSettings={updateSettings} />
        </section>
      )}

      {category === 'privacy-data' && (
        <section className="settings-focus-panel settings-data-panel">
          <p>{copy.exportHelp}</p>
          <label>
            <span>{translate(settings.locale, 'settingsPayload')}</span>
            <textarea
              rows={8}
              value={settingsPayload}
              onChange={(event) => {
                setSettingsPayload(event.target.value);
                setDataMessage(null);
              }}
            />
          </label>
          <div className="settings-data-actions">
            <button type="button" onClick={exportSettings}>
              {translate(settings.locale, 'exportSettings')}
            </button>
            <button type="button" onClick={importSettings}>
              {translate(settings.locale, 'importSettings')}
            </button>
            <button type="button" onClick={resetSettings}>
              {translate(settings.locale, 'resetSettings')}
            </button>
          </div>
          {dataMessage !== null && <p className="inline-message">{copy[dataMessage]}</p>}
          <PrivacyDiagnosticsSettings />
        </section>
      )}

      {category === 'display' && (
        <section className="settings-focus-panel settings-display-entry">
          <div className="settings-display-preferences">
            <h2>{copy.appearanceTitle}</h2>
            <AppearanceSettingsForm settings={settings} updateSettings={updateSettings} />
          </div>
          <MobilePrayerThemeSettings />
          <PrayerBoardWeatherSettings />
          <a className="surface-entry-card__action" href={administrationDisplaysHref()}>
            {copy.displayAction}
          </a>
        </section>
      )}

      {category === 'location' && (
        <LocationSettingsPanel settings={settings} updateSettings={updateSettings} />
      )}

      {category === 'adhan' && (
        <NotificationAdhanSettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          runtime={notificationRuntime}
        />
      )}

      {category === 'mosques' && (
        <>
          <MosqueIqamahSettingsPanel settings={settings} updateSettings={updateSettings} />
          <RamadanModePanel />
          <TaraweehPanel />
        </>
      )}

      {category === 'advanced' && (
        <AdvancedPrayerSettingsPanel settings={settings} updateSettings={updateSettings} />
      )}
    </main>
  );
}