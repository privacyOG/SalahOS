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
  readonly locationUse: string;
  readonly save: string;
  readonly saved: string;
  readonly invalid: string;
}

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    title: 'Local weather',
    description:
      'Weather follows your best available SalahOS location automatically. Saved or manual coordinates are used only when live positioning is unavailable.',
    enabled: 'Enable local weather',
    phoneHomeEnabled: 'Show weather on Phone / Home',
    latitude: 'Manual fallback latitude',
    longitude: 'Manual fallback longitude',
    locationLabel: 'Manual fallback label',
    provider: 'Provider: Open-Meteo',
    locationUse:
      'When weather is enabled, SalahOS sends only the resolved coordinates needed for the forecast to Open-Meteo. Prayer calculations continue normally if weather or the network is unavailable.',
    save: 'Save weather settings',
    saved: 'Weather settings saved.',
    invalid: 'Enter both fallback coordinates, or leave both blank.',
  },
  ar: {
    title: 'الطقس المحلي',
    description:
      'يتبع الطقس أفضل موقع متاح في SalahOS تلقائياً. تُستخدم الإحداثيات المحفوظة أو اليدوية فقط عند تعذر تحديد الموقع المباشر.',
    enabled: 'تفعيل الطقس المحلي',
    phoneHomeEnabled: 'إظهار الطقس على الهاتف / الرئيسية',
    latitude: 'خط عرض احتياطي يدوي',
    longitude: 'خط طول احتياطي يدوي',
    locationLabel: 'اسم الموقع الاحتياطي',
    provider: 'المزوّد: Open-Meteo',
    locationUse:
      'عند تفعيل الطقس يرسل SalahOS فقط الإحداثيات اللازمة للتوقع إلى Open-Meteo. تستمر حسابات الصلاة بصورة طبيعية إذا تعذر الطقس أو الاتصال بالشبكة.',
    save: 'حفظ إعدادات الطقس',
    saved: 'تم حفظ إعدادات الطقس.',
    invalid: 'أدخل الإحداثيين الاحتياطيين معاً أو اتركهما فارغين.',
  },
  tr: {
    title: 'Yerel hava durumu',
    description:
      'Hava durumu otomatik olarak SalahOS içindeki en iyi kullanılabilir konumunuzu izler. Kayıtlı veya elle girilen koordinatlar yalnızca canlı konum kullanılamadığında devreye girer.',
    enabled: 'Yerel hava durumunu etkinleştir',
    phoneHomeEnabled: 'Telefon / Ana Sayfada hava durumunu göster',
    latitude: 'Elle yedek enlem',
    longitude: 'Elle yedek boylam',
    locationLabel: 'Elle yedek konum etiketi',
    provider: 'Sağlayıcı: Open-Meteo',
    locationUse:
      'Hava durumu etkinken SalahOS yalnızca tahmin için gereken çözülmüş koordinatları Open-Meteo’ya gönderir. Hava durumu veya ağ kullanılamazsa namaz hesaplamaları normal şekilde devam eder.',
    save: 'Hava durumu ayarlarını kaydet',
    saved: 'Hava durumu ayarları kaydedildi.',
    invalid: 'Her iki yedek koordinatı da girin veya ikisini de boş bırakın.',
  },
  id: {
    title: 'Cuaca lokal',
    description:
      'Cuaca otomatis mengikuti lokasi SalahOS terbaik yang tersedia. Koordinat tersimpan atau manual hanya digunakan saat posisi langsung tidak tersedia.',
    enabled: 'Aktifkan cuaca lokal',
    phoneHomeEnabled: 'Tampilkan cuaca di Ponsel / Beranda',
    latitude: 'Lintang cadangan manual',
    longitude: 'Bujur cadangan manual',
    locationLabel: 'Label lokasi cadangan',
    provider: 'Penyedia: Open-Meteo',
    locationUse:
      'Saat cuaca aktif, SalahOS hanya mengirim koordinat yang diperlukan untuk prakiraan ke Open-Meteo. Perhitungan salat tetap berjalan normal jika cuaca atau jaringan tidak tersedia.',
    save: 'Simpan pengaturan cuaca',
    saved: 'Pengaturan cuaca disimpan.',
    invalid: 'Masukkan kedua koordinat cadangan atau biarkan keduanya kosong.',
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
    const latitudeEmpty = latitude.trim() === '';
    const longitudeEmpty = longitude.trim() === '';
    const latitudeValue = latitudeEmpty ? null : Number(latitude);
    const longitudeValue = longitudeEmpty ? null : Number(longitude);
    const coordinatesValid =
      latitudeValue !== null &&
      longitudeValue !== null &&
      Number.isFinite(latitudeValue) &&
      Number.isFinite(longitudeValue) &&
      latitudeValue >= -90 &&
      latitudeValue <= 90 &&
      longitudeValue >= -180 &&
      longitudeValue <= 180;
    const coordinatesBlank = latitudeEmpty && longitudeEmpty;
    if (!coordinatesBlank && !coordinatesValid) {
      setStatus(text.invalid);
      return;
    }

    savePrayerBoardWeatherConfig(storage, {
      version: 1,
      enabled,
      provider: 'open-meteo',
      latitude: coordinatesValid ? latitudeValue : null,
      longitude: coordinatesValid ? longitudeValue : null,
      locationLabel: coordinatesValid ? locationLabel : '',
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
        <p className="prayer-board-config-panel__help">{text.locationUse}</p>
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
