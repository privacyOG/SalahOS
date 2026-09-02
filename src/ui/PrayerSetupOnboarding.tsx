import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateAsrConventionPreview,
  inferIsoCountryCodeFromTimeZone,
  suggestedCalculationMethodForCountry,
  type BuiltInCalculationMethodId,
} from '../domain/firstRunPrayerSetup';
import { calculationMethods } from '../domain/methods';
import type { AsrConvention } from '../domain/prayerEngine';
import { resolveIanaTimeZone } from '../domain/timezone';
import { formatLocalTime } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  initializePrayerSetupOnboarding,
  completePrayerSetupOnboarding,
  prayerSetupOnboardingRequired,
  PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT,
} from '../platform/prayerSetupOnboarding';
import {
  LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT,
  qiblaPermissionOnboardingRequired,
} from '../platform/qiblaPermissionOnboarding';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  savePersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';

type PrayerSetupCopy = Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  methodLabel: string;
  suggested: string;
  fallback: string;
  asrLabel: string;
  standard: string;
  standardDetail: string;
  hanafi: string;
  hanafiDetail: string;
  previewTitle: string;
  previewUnavailable: string;
  save: string;
  defaults: string;
}>;

const copy: Readonly<Record<Locale, PrayerSetupCopy>> = {
  en: {
    eyebrow: 'SalahOS · Prayer setup',
    title: 'Choose your calculation defaults',
    body: 'Set the calculation method and Asr convention used for calculated prayer times. You can change both later in Settings.',
    methodLabel: 'Calculation method',
    suggested: 'Suggested from your offline regional setting',
    fallback: 'MWL is used when no unambiguous offline country hint is available.',
    asrLabel: 'Asr convention',
    standard: 'Standard',
    standardDetail: 'Shafi‘i, Maliki and Hanbali · shadow factor 1',
    hanafi: 'Hanafi',
    hanafiDetail: 'Hanafi · shadow factor 2',
    previewTitle: 'Today’s Asr preview',
    previewUnavailable: 'Set a location to preview Standard and Hanafi Asr times.',
    save: 'Save choices',
    defaults: 'Use defaults',
  },
  ar: {
    eyebrow: 'SalahOS · إعداد الصلاة',
    title: 'اختر إعدادات الحساب الافتراضية',
    body: 'حدّد طريقة الحساب ومذهب وقت العصر للمواقيت المحسوبة. يمكنك تغييرهما لاحقاً من الإعدادات.',
    methodLabel: 'طريقة الحساب',
    suggested: 'اقتراح مبني على الإعداد الإقليمي دون اتصال بالإنترنت',
    fallback: 'يُستخدم منهج رابطة العالم الإسلامي عند عدم توفر دلالة بلد محلية واضحة.',
    asrLabel: 'طريقة حساب العصر',
    standard: 'المعياري',
    standardDetail: 'الشافعي والمالكي والحنبلي · معامل الظل 1',
    hanafi: 'الحنفي',
    hanafiDetail: 'الحنفي · معامل الظل 2',
    previewTitle: 'معاينة عصر اليوم',
    previewUnavailable: 'حدّد موقعاً لمعاينة وقت العصر بالمعيارين المعياري والحنفي.',
    save: 'حفظ الاختيارات',
    defaults: 'استخدام الافتراضيات',
  },
  tr: {
    eyebrow: 'SalahOS · Namaz ayarı',
    title: 'Hesaplama varsayılanlarını seçin',
    body: 'Hesaplanan namaz vakitleri için hesaplama yöntemini ve ikindi yaklaşımını seçin. İkisini de daha sonra Ayarlar’dan değiştirebilirsiniz.',
    methodLabel: 'Hesaplama yöntemi',
    suggested: 'Çevrimdışı bölgesel ayarınıza göre öneri',
    fallback: 'Kesin bir çevrimdışı ülke ipucu yoksa MWL kullanılır.',
    asrLabel: 'İkindi yaklaşımı',
    standard: 'Standart',
    standardDetail: 'Şafiî, Malikî ve Hanbelî · gölge katsayısı 1',
    hanafi: 'Hanefî',
    hanafiDetail: 'Hanefî · gölge katsayısı 2',
    previewTitle: 'Bugünün ikindi önizlemesi',
    previewUnavailable: 'Standart ve Hanefî ikindi vakitlerini görmek için bir konum ayarlayın.',
    save: 'Seçimleri kaydet',
    defaults: 'Varsayılanları kullan',
  },
  id: {
    eyebrow: 'SalahOS · Pengaturan salat',
    title: 'Pilih default perhitungan',
    body: 'Pilih metode perhitungan dan konvensi Asar untuk waktu salat yang dihitung. Keduanya dapat diubah nanti di Pengaturan.',
    methodLabel: 'Metode perhitungan',
    suggested: 'Disarankan dari pengaturan regional offline Anda',
    fallback: 'MWL digunakan bila petunjuk negara offline yang jelas tidak tersedia.',
    asrLabel: 'Konvensi Asar',
    standard: 'Standar',
    standardDetail: 'Syafi‘i, Maliki, dan Hanbali · faktor bayangan 1',
    hanafi: 'Hanafi',
    hanafiDetail: 'Hanafi · faktor bayangan 2',
    previewTitle: 'Pratinjau Asar hari ini',
    previewUnavailable: 'Atur lokasi untuk melihat pratinjau waktu Asar Standar dan Hanafi.',
    save: 'Simpan pilihan',
    defaults: 'Gunakan default',
  },
};

const methodIds = Object.keys(calculationMethods) as BuiltInCalculationMethodId[];

function resolvedTimeZone(settings: PersistedSettings): string | null {
  const location = settings.location;
  if (location === null) return null;
  return location.timeZone ?? resolveIanaTimeZone(location.coordinates).timeZone;
}

function suggestedMethod(settings: PersistedSettings): BuiltInCalculationMethodId {
  const timeZone = resolvedTimeZone(settings);
  const countryCode = inferIsoCountryCodeFromTimeZone(timeZone ?? undefined);
  return suggestedCalculationMethodForCountry(countryCode);
}

function initialState() {
  const storage = getApplicationStorage();
  const onboarding = initializePrayerSetupOnboarding(storage);
  const settings = loadPersistedSettings(storage);
  return {
    settings,
    visible: !onboarding.completed && !qiblaPermissionOnboardingRequired(storage),
    methodId: suggestedMethod(settings),
    asrConvention: settings.asrConvention,
  };
}

export function PrayerSetupOnboarding() {
  const initial = useMemo(initialState, []);
  const [settings, setSettings] = useState(initial.settings);
  const [visible, setVisible] = useState(initial.visible);
  const [methodId, setMethodId] = useState<BuiltInCalculationMethodId>(initial.methodId);
  const [asrConvention, setAsrConvention] = useState<AsrConvention>(initial.asrConvention);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = copy[settings.locale];
  const timeZone = resolvedTimeZone(settings);
  const countryCode = inferIsoCountryCodeFromTimeZone(timeZone ?? undefined);
  const recommendation = suggestedCalculationMethodForCountry(countryCode);

  const preview = useMemo(() => {
    if (settings.location === null || timeZone === null) return null;
    return calculateAsrConventionPreview({
      instant: new Date(),
      coordinates: settings.location.coordinates,
      timeZone,
      methodId,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.prayerAdjustments,
    });
  }, [methodId, settings, timeZone]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!visible || dialog === null || dialog.open) return;
    dialog.showModal();
  }, [visible]);

  useEffect(() => {
    const continueAfterLocation = () => {
      const storage = getApplicationStorage();
      if (!prayerSetupOnboardingRequired(storage)) return;
      const nextSettings = loadPersistedSettings(storage);
      setSettings(nextSettings);
      setMethodId(suggestedMethod(nextSettings));
      setAsrConvention(nextSettings.asrConvention);
      setVisible(true);
    };
    window.addEventListener(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT, continueAfterLocation);
    return () => {
      window.removeEventListener(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT, continueAfterLocation);
    };
  }, []);

  if (!visible) return null;

  const finish = (nextMethodId: BuiltInCalculationMethodId, nextAsrConvention: AsrConvention) => {
    const storage = getApplicationStorage();
    const latest = loadPersistedSettings(storage);
    savePersistedSettings(storage, {
      ...latest,
      calculationMethodId: nextMethodId,
      asrConvention: nextAsrConvention,
    });
    completePrayerSetupOnboarding(storage);
    dialogRef.current?.close();
    setVisible(false);
    window.dispatchEvent(new Event(PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT));
  };

  const formatPreview = (minutes: number | null): string =>
    minutes === null ? '—' : formatLocalTime(minutes, settings.locale, settings.timeFormat);

  return (
    <dialog
      ref={dialogRef}
      className="prayer-setup-onboarding"
      aria-labelledby="prayer-setup-onboarding-title"
      data-prayer-setup-onboarding
    >
      <div className="prayer-setup-onboarding__content">
        <p className="prayer-setup-onboarding__eyebrow">{text.eyebrow}</p>
        <h2 id="prayer-setup-onboarding-title">{text.title}</h2>
        <p>{text.body}</p>

        <label className="prayer-setup-onboarding__field" htmlFor="prayer-setup-method">
          <span>{text.methodLabel}</span>
          <select
            id="prayer-setup-method"
            value={methodId}
            onChange={(event) => {
              setMethodId(event.currentTarget.value as BuiltInCalculationMethodId);
            }}
          >
            {methodIds.map((id) => (
              <option value={id} key={id}>
                {calculationMethods[id].name}
                {id === recommendation ? ` · ${text.suggested}` : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="prayer-setup-onboarding__hint">{text.fallback}</p>

        <fieldset className="prayer-setup-onboarding__asr">
          <legend>{text.asrLabel}</legend>
          <label>
            <input
              type="radio"
              name="prayer-setup-asr"
              value="standard"
              checked={asrConvention === 'standard'}
              onChange={() => {
                setAsrConvention('standard');
              }}
            />
            <span>
              <strong>{text.standard}</strong>
              <small>{text.standardDetail}</small>
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="prayer-setup-asr"
              value="hanafi"
              checked={asrConvention === 'hanafi'}
              onChange={() => {
                setAsrConvention('hanafi');
              }}
            />
            <span>
              <strong>{text.hanafi}</strong>
              <small>{text.hanafiDetail}</small>
            </span>
          </label>
        </fieldset>

        <section className="prayer-setup-onboarding__preview" aria-label={text.previewTitle}>
          <h3>{text.previewTitle}</h3>
          {preview === null ? (
            <p>{text.previewUnavailable}</p>
          ) : (
            <dl>
              <div>
                <dt>{text.standard}</dt>
                <dd>{formatPreview(preview.standardLocalMinutes)}</dd>
              </div>
              <div>
                <dt>{text.hanafi}</dt>
                <dd>{formatPreview(preview.hanafiLocalMinutes)}</dd>
              </div>
            </dl>
          )}
        </section>

        <div className="prayer-setup-onboarding__actions">
          <button
            type="button"
            className="prayer-setup-onboarding__primary"
            autoFocus
            onClick={() => {
              finish(methodId, asrConvention);
            }}
          >
            {text.save}
          </button>
          <button
            type="button"
            onClick={() => {
              finish(
                defaultPersistedSettings.calculationMethodId,
                defaultPersistedSettings.asrConvention,
              );
            }}
          >
            {text.defaults}
          </button>
        </div>
      </div>
    </dialog>
  );
}
