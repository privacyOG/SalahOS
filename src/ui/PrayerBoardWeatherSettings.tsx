import { useState } from 'react';

import { defaultPrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadMobilePrayerBoardDisplayConfig,
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
  saveMobilePrayerBoardDisplayConfig,
} from '../platform/mobilePrayerBoardDisplayConfig';
import {
  loadPrayerBoardWeatherConfig,
  PRAYER_BOARD_WEATHER_CHANGE_EVENT,
  savePrayerBoardWeatherConfig,
} from '../platform/prayerBoardWeather';
import { loadPersistedSettings } from '../platform/settingsStorage';

interface Copy {
  readonly title: string;
  readonly description: string;
  readonly enabled: string;
  readonly phoneHomeEnabled: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly locationLabel: string;
  readonly provider: string;
  readonly privacy: string;
  readonly save: string;
  readonly saved: string;
  readonly invalid: string;
}

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    title: 'Optional weather',
    description:
      'Weather stays off unless a prayer-board surface enables the Weather module and this fixed-location feed is enabled.',
    enabled: 'Enable fixed-location weather feed',
    phoneHomeEnabled: 'Show weather on Phone / Home',
    latitude: 'Fixed latitude',
    longitude: 'Fixed longitude',
    locationLabel: 'Location label',
    provider: 'Provider: Open-Meteo current weather',
    privacy:
      'SalahOS never reads or transmits device GPS for weather. When enabled, only the fixed coordinates entered here are sent to Open-Meteo. The provider also receives normal request metadata such as the device public IP address.',
    save: 'Save weather configuration',
    saved: 'Weather configuration saved.',
    invalid: 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180).',
  },
  ar: {
    title: 'الطقس الاختياري',
    description:
      'يبقى الطقس متوقفاً ما لم تُفعّل وحدة الطقس على واجهة مواقيت الصلاة ويُفعّل موجز الموقع الثابت هنا.',
    enabled: 'تفعيل موجز الطقس لموقع ثابت',
    phoneHomeEnabled: 'إظهار الطقس على الهاتف / الرئيسية',
    latitude: 'خط العرض الثابت',
    longitude: 'خط الطول الثابت',
    locationLabel: 'اسم الموقع',
    provider: 'المزوّد: Open-Meteo للطقس الحالي',
    privacy:
      'لا يقرأ SalahOS موقع GPS للجهاز ولا يرسله من أجل الطقس. عند التفعيل، تُرسل فقط الإحداثيات الثابتة المُدخلة هنا إلى Open-Meteo، كما يستقبل المزوّد بيانات الطلب المعتادة مثل عنوان IP العام.',
    save: 'حفظ إعدادات الطقس',
    saved: 'تم حفظ إعدادات الطقس.',
    invalid: 'أدخل خط عرض صالحاً من -90 إلى 90 وخط طول من -180 إلى 180.',
  },
  tr: {
    title: 'İsteğe bağlı hava durumu',
    description:
      'Hava durumu yalnızca bir namaz panosu Hava modülünü ve buradaki sabit konum beslemesini birlikte etkinleştirdiğinde çalışır.',
    enabled: 'Sabit konum hava durumu beslemesini etkinleştir',
    phoneHomeEnabled: 'Telefon / Ana Sayfada hava durumunu göster',
    latitude: 'Sabit enlem',
    longitude: 'Sabit boylam',
    locationLabel: 'Konum etiketi',
    provider: 'Sağlayıcı: Open-Meteo güncel hava durumu',
    privacy:
      'SalahOS hava durumu için cihaz GPS konumunu okumaz veya göndermez. Etkinleştirildiğinde yalnızca burada girilen sabit koordinatlar Open-Meteo’ya gönderilir; sağlayıcı ayrıca genel IP gibi olağan istek metadatasını görür.',
    save: 'Hava durumu ayarlarını kaydet',
    saved: 'Hava durumu ayarları kaydedildi.',
    invalid: 'Geçerli enlem (-90–90) ve boylam (-180–180) girin.',
  },
  id: {
    title: 'Cuaca opsional',
    description:
      'Cuaca hanya aktif saat permukaan papan salat mengaktifkan modul Cuaca dan feed lokasi tetap ini juga diaktifkan.',
    enabled: 'Aktifkan feed cuaca lokasi tetap',
    phoneHomeEnabled: 'Tampilkan cuaca di Ponsel / Beranda',
    latitude: 'Lintang tetap',
    longitude: 'Bujur tetap',
    locationLabel: 'Label lokasi',
    provider: 'Penyedia: cuaca terkini Open-Meteo',
    privacy:
      'SalahOS tidak membaca atau mengirim GPS perangkat untuk cuaca. Saat diaktifkan, hanya koordinat tetap yang dimasukkan di sini yang dikirim ke Open-Meteo; penyedia juga menerima metadata permintaan biasa seperti alamat IP publik.',
    save: 'Simpan konfigurasi cuaca',
    saved: 'Konfigurasi cuaca disimpan.',
    invalid: 'Masukkan lintang valid (-90 sampai 90) dan bujur (-180 sampai 180).',
  },
};

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

export function PrayerBoardWeatherSettings() {
  const storage = getApplicationStorage();
  const initial = loadPrayerBoardWeatherConfig(storage);
  const mobileInitial =
    loadMobilePrayerBoardDisplayConfig(storage) ?? defaultPrayerBoardTemplateConfig;
  const locale = readLocale();
  const text = copy[locale];
  const [enabled, setEnabled] = useState(initial.enabled);
  const [phoneHomeEnabled, setPhoneHomeEnabled] = useState(mobileInitial.moduleVisibility.weather);
  const [latitude, setLatitude] = useState(initial.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial.longitude?.toString() ?? '');
  const [locationLabel, setLocationLabel] = useState(initial.locationLabel ?? '');
  const [status, setStatus] = useState<string | null>(null);

  const save = () => {
    const latitudeValue = latitude.trim() === '' ? null : Number(latitude);
    const longitudeValue = longitude.trim() === '' ? null : Number(longitude);
    const coordinatesValid =
      latitudeValue !== null &&
      longitudeValue !== null &&
      Number.isFinite(latitudeValue) &&
      Number.isFinite(longitudeValue) &&
      latitudeValue >= -90 &&
      latitudeValue <= 90 &&
      longitudeValue >= -180 &&
      longitudeValue <= 180;
    if (enabled && !coordinatesValid) {
      setStatus(text.invalid);
      return;
    }

    savePrayerBoardWeatherConfig(storage, {
      version: 1,
      enabled,
      provider: 'open-meteo',
      latitude: coordinatesValid ? latitudeValue : null,
      longitude: coordinatesValid ? longitudeValue : null,
      locationLabel,
    });

    const mobileConfig =
      loadMobilePrayerBoardDisplayConfig(storage) ?? defaultPrayerBoardTemplateConfig;
    saveMobilePrayerBoardDisplayConfig(storage, {
      ...mobileConfig,
      moduleVisibility: {
        ...mobileConfig.moduleVisibility,
        weather: phoneHomeEnabled,
      },
    });

    setStatus(text.saved);
    window.dispatchEvent(new Event(PRAYER_BOARD_WEATHER_CHANGE_EVENT));
    window.dispatchEvent(new Event(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT));
  };

  return (
    <section
      className="prayer-board-weather-settings prayer-board-config-editor"
      aria-labelledby="weather-settings-title"
    >
      <header className="prayer-board-config-editor__header">
        <div>
          <h2 id="weather-settings-title">{text.title}</h2>
          <p>{text.description}</p>
        </div>
        <span className="prayer-board-config-editor__orientation">{text.provider}</span>
      </header>
      <section className="prayer-board-config-panel">
        <label className="prayer-board-module-row">
          <span>{text.enabled}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setStatus(null);
            }}
          />
        </label>
        <label className="prayer-board-module-row">
          <span>{text.phoneHomeEnabled}</span>
          <input
            type="checkbox"
            data-weather-phone-home
            checked={phoneHomeEnabled}
            onChange={(event) => {
              setPhoneHomeEnabled(event.target.checked);
              setStatus(null);
            }}
          />
        </label>
        <div className="prayer-board-config-fields">
          <label>
            <span>{text.latitude}</span>
            <input
              type="number"
              min={-90}
              max={90}
              step="0.0001"
              value={latitude}
              onChange={(event) => {
                setLatitude(event.target.value);
                setStatus(null);
              }}
            />
          </label>
          <label>
            <span>{text.longitude}</span>
            <input
              type="number"
              min={-180}
              max={180}
              step="0.0001"
              value={longitude}
              onChange={(event) => {
                setLongitude(event.target.value);
                setStatus(null);
              }}
            />
          </label>
          <label className="prayer-board-config-fields__wide">
            <span>{text.locationLabel}</span>
            <input
              type="text"
              maxLength={120}
              value={locationLabel}
              onChange={(event) => {
                setLocationLabel(event.target.value);
                setStatus(null);
              }}
            />
          </label>
        </div>
        <p className="prayer-board-config-panel__help">{text.privacy}</p>
        <div className="prayer-board-config-actions">
          <button type="button" className="primary" onClick={save}>
            {text.save}
          </button>
          {status !== null && <span role="status">{status}</span>}
        </div>
      </section>
    </section>
  );
}
