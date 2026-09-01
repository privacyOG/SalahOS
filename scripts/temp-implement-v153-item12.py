from pathlib import Path
import re

root = Path('.')

(root / 'src/domain/prayerOnboarding.ts').write_text("""import type { Coordinates } from './coordinates';
import { getCalculationMethod, type CalculationMethodId } from './methods';
import {
  calculatePrayerSchedule,
  type AsrConvention,
  type HighLatitudeRule,
} from './prayerEngine';

export type BuiltInCalculationMethodId = Exclude<CalculationMethodId, 'custom'>;
export const PRAYER_ONBOARDING_FALLBACK_METHOD: BuiltInCalculationMethodId =
  'muslim-world-league';

/**
 * Offline first-run suggestions only. They select an existing SalahOS profile;
 * they are not claims of official national certification. Unmapped/unknown
 * countries fall back to Muslim World League (MWL).
 */
const COUNTRY_METHOD: Readonly<Partial<Record<string, BuiltInCalculationMethodId>>> = Object.freeze({
  AU: 'muslim-world-league',
  ID: 'muslim-world-league',
  MY: 'muslim-world-league',
  SA: 'umm-al-qura',
  EG: 'egyptian',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
  US: 'isna',
  CA: 'isna',
  TR: 'diyanet',
  SG: 'muis',
  AE: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
});

const TIME_ZONE_COUNTRY: Readonly<Record<string, string>> = Object.freeze({
  'Asia/Riyadh': 'SA',
  'Africa/Cairo': 'EG',
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Asia/Dhaka': 'BD',
  'Asia/Kabul': 'AF',
  'Europe/Istanbul': 'TR',
  'Asia/Singapore': 'SG',
  'Asia/Dubai': 'AE',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Winnipeg': 'CA',
  'America/Edmonton': 'CA',
  'America/Vancouver': 'CA',
});

export function countryCodeForPrayerMethodSuggestion(timeZone: string): string | null {
  if (timeZone.startsWith('Australia/')) return 'AU';
  if (timeZone.startsWith('Asia/Jakarta') || timeZone.startsWith('Asia/Makassar')) return 'ID';
  if (timeZone === 'Asia/Kuala_Lumpur' || timeZone === 'Asia/Kuching') return 'MY';
  return TIME_ZONE_COUNTRY[timeZone] ?? null;
}

export function suggestCalculationMethodForCountry(
  countryCode: string | null | undefined,
): BuiltInCalculationMethodId {
  const normalized = countryCode?.trim().toUpperCase();
  return normalized === undefined || normalized === ''
    ? PRAYER_ONBOARDING_FALLBACK_METHOD
    : (COUNTRY_METHOD[normalized] ?? PRAYER_ONBOARDING_FALLBACK_METHOD);
}

export interface AsrConventionPreviewInput {
  readonly date: Date;
  readonly coordinates: Coordinates;
  readonly utcOffsetMinutes: number;
  readonly methodId: BuiltInCalculationMethodId;
  readonly highLatitudeRule: HighLatitudeRule;
}

export type AsrConventionPreview = Readonly<Record<AsrConvention, number | null>>;

export function calculateAsrConventionPreview(
  input: AsrConventionPreviewInput,
): AsrConventionPreview {
  const method = getCalculationMethod(input.methodId);
  const calculate = (asrConvention: AsrConvention) =>
    calculatePrayerSchedule({
      date: input.date,
      latitude: input.coordinates.latitude,
      longitude: input.coordinates.longitude,
      utcOffsetMinutes: input.utcOffsetMinutes,
      method,
      asrConvention,
      highLatitudeRule: input.highLatitudeRule,
    }).prayers.asr.roundedLocalMinutes;
  return Object.freeze({ standard: calculate('standard'), hanafi: calculate('hanafi') });
}
""", encoding='utf-8')

(root / 'src/domain/prayerOnboarding.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import {
  calculateAsrConventionPreview,
  countryCodeForPrayerMethodSuggestion,
  PRAYER_ONBOARDING_FALLBACK_METHOD,
  suggestCalculationMethodForCountry,
} from './prayerOnboarding';

describe('first-run prayer preferences', () => {
  it('suggests built-in methods from explicit ISO country mappings with MWL fallback', () => {
    expect(suggestCalculationMethodForCountry('SA')).toBe('umm-al-qura');
    expect(suggestCalculationMethodForCountry('eg')).toBe('egyptian');
    expect(suggestCalculationMethodForCountry('PK')).toBe('karachi');
    expect(suggestCalculationMethodForCountry('TR')).toBe('diyanet');
    expect(suggestCalculationMethodForCountry('SG')).toBe('muis');
    expect(suggestCalculationMethodForCountry('AE')).toBe('dubai');
    expect(suggestCalculationMethodForCountry('KW')).toBe('kuwait');
    expect(suggestCalculationMethodForCountry('QA')).toBe('qatar');
    expect(suggestCalculationMethodForCountry('ZZ')).toBe(PRAYER_ONBOARDING_FALLBACK_METHOD);
    expect(suggestCalculationMethodForCountry(null)).toBe(PRAYER_ONBOARDING_FALLBACK_METHOD);
  });

  it('resolves supported location timezones to ISO country codes entirely offline', () => {
    expect(countryCodeForPrayerMethodSuggestion('Australia/Sydney')).toBe('AU');
    expect(countryCodeForPrayerMethodSuggestion('Asia/Riyadh')).toBe('SA');
    expect(countryCodeForPrayerMethodSuggestion('America/Toronto')).toBe('CA');
    expect(countryCodeForPrayerMethodSuggestion('Pacific/Auckland')).toBeNull();
  });

  it('computes both Standard and Hanafi Asr previews for the same location and method', () => {
    const preview = calculateAsrConventionPreview({
      date: new Date('2026-09-02T00:00:00.000Z'),
      coordinates: createCoordinates(-33.8688, 151.2093),
      utcOffsetMinutes: 600,
      methodId: 'muslim-world-league',
      highLatitudeRule: 'angle-based',
    });
    expect(preview.standard).not.toBeNull();
    expect(preview.hanafi).not.toBeNull();
    expect(preview.hanafi).toBeGreaterThan(preview.standard ?? 0);
  });
});
""", encoding='utf-8')

(root / 'src/platform/qiblaPermissionOnboarding.ts').write_text("""import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

export const QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY = 'salahos.qibla-permission-onboarding';
export const LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT =
  'salahos:location-permission-onboarding-complete';
export const PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT =
  'salahos:prayer-preferences-onboarding-complete';

export interface QiblaPermissionOnboardingState {
  readonly version: 3;
  readonly completed: boolean;
  readonly dismissed: boolean;
  readonly autoLocation: boolean;
  readonly prayerPreferencesCompleted: boolean;
}

const defaultState: QiblaPermissionOnboardingState = Object.freeze({
  version: 3,
  completed: false,
  dismissed: false,
  autoLocation: false,
  prayerPreferencesCompleted: false,
});
const migratedExistingInstallState: QiblaPermissionOnboardingState = Object.freeze({
  version: 3,
  completed: true,
  dismissed: true,
  autoLocation: true,
  prayerPreferencesCompleted: true,
});

export function loadQiblaPermissionOnboarding(
  storage: KeyValueStorage,
): QiblaPermissionOnboardingState {
  const serialized = storage.getItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY);
  if (serialized === null) {
    return storage.getItem(SETTINGS_STORAGE_KEY) === null
      ? defaultState
      : migratedExistingInstallState;
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    if (parsed.version === 1 && typeof parsed.completed === 'boolean') {
      return Object.freeze({
        version: 3,
        completed: parsed.completed,
        dismissed: parsed.completed,
        autoLocation: parsed.completed,
        prayerPreferencesCompleted: true,
      });
    }
    if (
      parsed.version === 2 &&
      typeof parsed.dismissed === 'boolean' &&
      typeof parsed.autoLocation === 'boolean'
    ) {
      return Object.freeze({
        version: 3,
        completed: parsed.autoLocation,
        dismissed: parsed.dismissed,
        autoLocation: parsed.autoLocation,
        prayerPreferencesCompleted: true,
      });
    }
    if (
      parsed.version !== 3 ||
      typeof parsed.dismissed !== 'boolean' ||
      typeof parsed.autoLocation !== 'boolean' ||
      typeof parsed.prayerPreferencesCompleted !== 'boolean'
    ) {
      return defaultState;
    }
    return Object.freeze({
      version: 3,
      completed: parsed.autoLocation,
      dismissed: parsed.dismissed,
      autoLocation: parsed.autoLocation,
      prayerPreferencesCompleted: parsed.prayerPreferencesCompleted,
    });
  } catch {
    return defaultState;
  }
}

export function qiblaPermissionOnboardingRequired(storage: KeyValueStorage): boolean {
  return !loadQiblaPermissionOnboarding(storage).dismissed;
}

export function prayerPreferencesOnboardingRequired(storage: KeyValueStorage): boolean {
  const state = loadQiblaPermissionOnboarding(storage);
  return state.dismissed && !state.prayerPreferencesCompleted;
}

function saveState(storage: KeyValueStorage, state: QiblaPermissionOnboardingState): void {
  storage.setItem(
    QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
    JSON.stringify({
      version: 3,
      dismissed: state.dismissed,
      autoLocation: state.autoLocation,
      prayerPreferencesCompleted: state.prayerPreferencesCompleted,
    }),
  );
}

export function completeQiblaPermissionOnboarding(
  storage: KeyValueStorage,
  autoLocation = true,
): void {
  const current = loadQiblaPermissionOnboarding(storage);
  saveState(storage, {
    ...current,
    version: 3,
    completed: autoLocation,
    dismissed: true,
    autoLocation,
  });
}

export function completePrayerPreferencesOnboarding(storage: KeyValueStorage): void {
  const current = loadQiblaPermissionOnboarding(storage);
  saveState(storage, { ...current, version: 3, prayerPreferencesCompleted: true });
}
""", encoding='utf-8')

(root / 'src/platform/qiblaPermissionOnboarding.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import {
  completePrayerPreferencesOnboarding,
  completeQiblaPermissionOnboarding,
  loadQiblaPermissionOnboarding,
  prayerPreferencesOnboardingRequired,
  qiblaPermissionOnboardingRequired,
  QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
} from './qiblaPermissionOnboarding';
import { SETTINGS_STORAGE_KEY } from './settingsStorage';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('first-run onboarding persistence', () => {
  it('requires location then prayer preferences on a true first run', () => {
    const storage = new MemoryStorage();
    expect(loadQiblaPermissionOnboarding(storage)).toEqual({
      version: 3,
      completed: false,
      dismissed: false,
      autoLocation: false,
      prayerPreferencesCompleted: false,
    });
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(true);
    expect(prayerPreferencesOnboardingRequired(storage)).toBe(false);
    completeQiblaPermissionOnboarding(storage, false);
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(false);
    expect(prayerPreferencesOnboardingRequired(storage)).toBe(true);
    completePrayerPreferencesOnboarding(storage);
    expect(prayerPreferencesOnboardingRequired(storage)).toBe(false);
  });

  it('does not interrupt existing configured installations during upgrade', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 2 }));
    expect(loadQiblaPermissionOnboarding(storage).prayerPreferencesCompleted).toBe(true);
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(false);
    expect(prayerPreferencesOnboardingRequired(storage)).toBe(false);
  });

  it('migrates version 1 and 2 onboarding states with the new step already complete', () => {
    for (const payload of [
      { version: 1, completed: true },
      { version: 2, dismissed: true, autoLocation: true },
      { version: 2, dismissed: true, autoLocation: false },
    ]) {
      const storage = new MemoryStorage();
      storage.setItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
      expect(loadQiblaPermissionOnboarding(storage).prayerPreferencesCompleted).toBe(true);
      expect(prayerPreferencesOnboardingRequired(storage)).toBe(false);
    }
  });

  it('fails closed to first-run onboarding for invalid persisted data', () => {
    const storage = new MemoryStorage();
    storage.setItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY, '{invalid');
    expect(qiblaPermissionOnboardingRequired(storage)).toBe(true);
  });
});
""", encoding='utf-8')

(root / 'src/ui/QiblaPermissionOnboarding.tsx').write_text("""import { useEffect, useMemo, useRef, useState } from 'react';

import { calculationMethods } from '../domain/methods';
import {
  calculateAsrConventionPreview,
  countryCodeForPrayerMethodSuggestion,
  suggestCalculationMethodForCountry,
  type BuiltInCalculationMethodId,
} from '../domain/prayerOnboarding';
import { createLocationPrayerContext } from '../domain/locationPrayerContext';
import type { AsrConvention } from '../domain/prayerEngine';
import { formatLocalTime, translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  LOCATION_CONTEXT_CHANGE_EVENT,
  persistBestAvailableLocation,
  resolveBestAvailableLocation,
  type LocationFallback,
} from '../platform/bestAvailableLocation';
import { requestCompassPermission } from '../platform/deviceCompass';
import {
  completePrayerPreferencesOnboarding,
  completeQiblaPermissionOnboarding,
  loadQiblaPermissionOnboarding,
  LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT,
  PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT,
} from '../platform/qiblaPermissionOnboarding';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  savePersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';

type Step = 'location' | 'prayer' | null;
type LocationCopy = Readonly<{
  eyebrow: string; title: string; body: string; detail: string; enable: string; enabling: string; later: string;
}>;
type PrayerCopy = Readonly<{
  eyebrow: string; title: string; body: string; suggested: string; preview: string; save: string; defaults: string;
}>;

const locationCopy: Readonly<Record<Locale, LocationCopy>> = {
  en: { eyebrow: 'SalahOS · Location', title: 'Make SalahOS local to you', body: 'Allow location while using SalahOS to automatically calculate local prayer times, find nearby mosques, provide Qiblah guidance and show local weather.', detail: 'Your operating system chooses the best available source, including GPS, Wi-Fi or cellular positioning. Manual and saved locations remain available if you prefer not to enable it.', enable: 'Enable location & compass', enabling: 'Requesting permissions…', later: 'Not now' },
  ar: { eyebrow: 'SalahOS · الموقع', title: 'اجعل SalahOS محلياً لك', body: 'اسمح بالموقع أثناء استخدام SalahOS لحساب مواقيت الصلاة المحلية تلقائياً والعثور على المساجد القريبة وتوجيه القبلة وعرض الطقس المحلي.', detail: 'يختار نظام التشغيل أفضل مصدر متاح، بما في ذلك GPS أو Wi-Fi أو الشبكة الخلوية. تبقى المواقع اليدوية والمحفوظة متاحة إذا فضّلت عدم التفعيل.', enable: 'تفعيل الموقع والبوصلة', enabling: 'جارٍ طلب الأذونات…', later: 'ليس الآن' },
  tr: { eyebrow: 'SalahOS · Konum', title: 'SalahOS bulunduğunuz yere uyum sağlasın', body: 'Yerel namaz vakitlerini otomatik hesaplamak, yakındaki camileri bulmak, Kıble yönünü göstermek ve yerel hava durumunu sunmak için kullanım sırasında konuma izin verin.', detail: 'İşletim sisteminiz GPS, Wi-Fi veya hücresel konum dahil en iyi mevcut kaynağı seçer. Etkinleştirmemeyi tercih ederseniz elle ve kayıtlı konumlar kullanılabilir.', enable: 'Konum ve pusulayı etkinleştir', enabling: 'İzinler isteniyor…', later: 'Şimdi değil' },
  id: { eyebrow: 'SalahOS · Lokasi', title: 'Sesuaikan SalahOS dengan lokasi Anda', body: 'Izinkan lokasi saat menggunakan SalahOS agar waktu salat lokal, masjid terdekat, arah Kiblat, dan cuaca lokal dapat ditentukan secara otomatis.', detail: 'Sistem operasi memilih sumber terbaik yang tersedia, termasuk GPS, Wi-Fi, atau jaringan seluler. Lokasi manual dan tersimpan tetap tersedia jika Anda memilih untuk tidak mengaktifkannya.', enable: 'Aktifkan lokasi & kompas', enabling: 'Meminta izin…', later: 'Nanti' },
};

const prayerCopy: Readonly<Record<Locale, PrayerCopy>> = {
  en: { eyebrow: 'SalahOS · Prayer', title: 'Choose your prayer calculation', body: 'Choose a calculation method and Asr convention. You can change both later in Settings.', suggested: 'Suggested for your location', preview: "Today's Asr preview", save: 'Save choices', defaults: 'Use defaults' },
  ar: { eyebrow: 'SalahOS · الصلاة', title: 'اختر طريقة حساب الصلاة', body: 'اختر طريقة الحساب ومذهب العصر. يمكنك تغييرهما لاحقاً من الإعدادات.', suggested: 'مقترح لموقعك', preview: 'معاينة عصر اليوم', save: 'حفظ الاختيارات', defaults: 'استخدم الافتراضيات' },
  tr: { eyebrow: 'SalahOS · Namaz', title: 'Namaz hesaplamanızı seçin', body: 'Hesaplama yöntemini ve ikindi yaklaşımını seçin. İkisini de daha sonra Ayarlar bölümünden değiştirebilirsiniz.', suggested: 'Konumunuz için önerilen', preview: 'Bugünün ikindi önizlemesi', save: 'Seçimleri kaydet', defaults: 'Varsayılanları kullan' },
  id: { eyebrow: 'SalahOS · Salat', title: 'Pilih perhitungan salat', body: 'Pilih metode perhitungan dan aturan Asar. Keduanya dapat diubah nanti di Pengaturan.', suggested: 'Disarankan untuk lokasi Anda', preview: 'Pratinjau Asar hari ini', save: 'Simpan pilihan', defaults: 'Gunakan default' },
};

function methodSuggestion(settings: PersistedSettings): BuiltInCalculationMethodId {
  if (settings.location === null) return suggestCalculationMethodForCountry(null);
  const context = createLocationPrayerContext(
    new Date(),
    settings.location.coordinates,
    settings.location.timeZone,
  );
  return suggestCalculationMethodForCountry(
    countryCodeForPrayerMethodSuggestion(context.timeZone),
  );
}

function initialState(): {
  locale: Locale; step: Step; methodId: BuiltInCalculationMethodId; asrConvention: AsrConvention;
} {
  const storage = getApplicationStorage();
  const onboarding = loadQiblaPermissionOnboarding(storage);
  const settings = loadPersistedSettings(storage);
  return {
    locale: settings.locale,
    step: !onboarding.dismissed
      ? 'location'
      : onboarding.prayerPreferencesCompleted
        ? null
        : 'prayer',
    methodId: methodSuggestion(settings),
    asrConvention: settings.asrConvention,
  };
}

function savedLocationFallback(): LocationFallback | undefined {
  const settings = loadPersistedSettings(getApplicationStorage());
  return settings.location === null
    ? undefined
    : {
        coordinates: settings.location.coordinates,
        source: 'saved',
        ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
      };
}

export function QiblaPermissionOnboarding() {
  const initial = useMemo(initialState, []);
  const [step, setStep] = useState<Step>(initial.step);
  const [requesting, setRequesting] = useState(false);
  const [methodId, setMethodId] = useState(initial.methodId);
  const [asrConvention, setAsrConvention] = useState(initial.asrConvention);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const locale = initial.locale;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (step === null || dialog === null || dialog.open) return;
    dialog.showModal();
  }, [step]);

  if (step === null) return null;

  const startPrayerStep = () => {
    const settings = loadPersistedSettings(getApplicationStorage());
    setMethodId(methodSuggestion(settings));
    setAsrConvention(settings.asrConvention);
    setStep('prayer');
  };

  const finishLocation = (autoLocation: boolean) => {
    completeQiblaPermissionOnboarding(getApplicationStorage(), autoLocation);
    window.dispatchEvent(new Event(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT));
    if (autoLocation) window.dispatchEvent(new Event('salahos:qibla-permission-onboarding-complete'));
    startPrayerStep();
  };

  const requestPermissions = async () => {
    if (requesting) return;
    setRequesting(true);
    let locationEnabled = false;
    try {
      await requestCompassPermission();
      const storage = getApplicationStorage();
      const saved = savedLocationFallback();
      const location = await resolveBestAvailableLocation(storage, { ...(saved === undefined ? {} : { saved }) });
      if (location !== null && location.freshness === 'live') {
        locationEnabled = true;
        if (persistBestAvailableLocation(storage, location)) {
          window.dispatchEvent(new Event(LOCATION_CONTEXT_CHANGE_EVENT));
        }
      }
    } finally {
      setRequesting(false);
      finishLocation(locationEnabled);
    }
  };

  const settings = loadPersistedSettings(getApplicationStorage());
  const preview =
    step !== 'prayer' || settings.location === null
      ? null
      : (() => {
          const context = createLocationPrayerContext(
            new Date(),
            settings.location.coordinates,
            settings.location.timeZone,
          );
          return calculateAsrConventionPreview({
            date: context.civilDate,
            coordinates: context.coordinates,
            utcOffsetMinutes: context.utcOffsetMinutes,
            methodId,
            highLatitudeRule: settings.highLatitudeRule,
          });
        })();

  const finishPrayer = (defaults: boolean) => {
    const storage = getApplicationStorage();
    const current = loadPersistedSettings(storage);
    savePersistedSettings(storage, {
      ...current,
      calculationMethodId: defaults ? defaultPersistedSettings.calculationMethodId : methodId,
      asrConvention: defaults ? defaultPersistedSettings.asrConvention : asrConvention,
    });
    completePrayerPreferencesOnboarding(storage);
    dialogRef.current?.close();
    setStep(null);
    window.dispatchEvent(new Event(PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT));
  };

  const locationText = locationCopy[locale];
  const prayerText = prayerCopy[locale];
  return (
    <dialog
      ref={dialogRef}
      className="qibla-permission-onboarding"
      aria-labelledby="qibla-permission-title"
      data-qibla-permission-onboarding
      data-onboarding-step={step}
    >
      <div className="qibla-permission-onboarding__content">
        <p className="qibla-permission-onboarding__eyebrow">
          {step === 'location' ? locationText.eyebrow : prayerText.eyebrow}
        </p>
        <h2 id="qibla-permission-title">
          {step === 'location' ? locationText.title : prayerText.title}
        </h2>
        {step === 'location' ? (
          <>
            <p>{locationText.body}</p>
            <p className="qibla-permission-onboarding__privacy">{locationText.detail}</p>
            <div className="qibla-permission-onboarding__actions">
              <button type="button" className="qibla-permission-onboarding__primary" autoFocus disabled={requesting} onClick={() => { void requestPermissions(); }}>
                {requesting ? locationText.enabling : locationText.enable}
              </button>
              <button type="button" disabled={requesting} onClick={() => { finishLocation(false); }}>
                {locationText.later}
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{prayerText.body}</p>
            <div className="qibla-permission-onboarding__fields">
              <label>
                <span>{translate(locale, 'calculationMethod')}</span>
                <select value={methodId} onChange={(event) => { setMethodId(event.target.value as BuiltInCalculationMethodId); }}>
                  {Object.values(calculationMethods).map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                </select>
                <small>{prayerText.suggested}: {calculationMethods[methodSuggestion(settings)].name}</small>
              </label>
              <label>
                <span>{translate(locale, 'asrMethod')}</span>
                <select value={asrConvention} onChange={(event) => { setAsrConvention(event.target.value as AsrConvention); }}>
                  <option value="standard">{translate(locale, 'asrStandard')}</option>
                  <option value="hanafi">{translate(locale, 'asrHanafi')}</option>
                </select>
              </label>
            </div>
            <div className="qibla-permission-onboarding__privacy" aria-live="polite">
              <strong>{prayerText.preview}</strong>
              <p>{translate(locale, 'asrStandard')}: {preview?.standard == null ? '—' : formatLocalTime(preview.standard, locale, settings.timeFormat)}</p>
              <p>{translate(locale, 'asrHanafi')}: {preview?.hanafi == null ? '—' : formatLocalTime(preview.hanafi, locale, settings.timeFormat)}</p>
            </div>
            <div className="qibla-permission-onboarding__actions">
              <button type="button" className="qibla-permission-onboarding__primary" autoFocus onClick={() => { finishPrayer(false); }}>{prayerText.save}</button>
              <button type="button" onClick={() => { finishPrayer(true); }}>{prayerText.defaults}</button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
""", encoding='utf-8')

# Main: remount app surfaces after prayer preferences are persisted.
main_path = root / 'src/main.tsx'
main = main_path.read_text(encoding='utf-8')
main = main.replace(
    "import { loadPersistedSettings } from './platform/settingsStorage';",
    "import { PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT } from './platform/qiblaPermissionOnboarding';\nimport { loadPersistedSettings } from './platform/settingsStorage';",
    1,
)
main = main.replace(
    "    window.addEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);",
    "    window.addEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);\n    window.addEventListener(PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT, handleLocationChange);",
    1,
)
main = main.replace(
    "      window.removeEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);",
    "      window.removeEventListener(LOCATION_CONTEXT_CHANGE_EVENT, handleLocationChange);\n      window.removeEventListener(PRAYER_PREFERENCES_ONBOARDING_COMPLETE_EVENT, handleLocationChange);",
    1,
)
main_path.write_text(main, encoding='utf-8')

# Buy bundle headroom by reusing the shared great-circle implementation from Item 11.
best_path = root / 'src/platform/bestAvailableLocation.ts'
best = best_path.read_text(encoding='utf-8')
best = best.replace(
    "import { createCoordinates } from '../domain/coordinates';",
    "import { createCoordinates } from '../domain/coordinates';\nimport { greatCircleDistanceKilometers } from '../domain/greatCircleDistance';",
    1,
)
best = re.sub(r"\nfunction radians\([\s\S]*?\n}\n\nexport function locationDistanceMeters\(left: Coordinates, right: Coordinates\): number \{[\s\S]*?\n}\n", "\nexport function locationDistanceMeters(left: Coordinates, right: Coordinates): number {\n  return greatCircleDistanceKilometers(left, right) * 1_000;\n}\n", best, count=1)
best_path.write_text(best, encoding='utf-8')

css_path = root / 'src/qibla-permission-onboarding.css'
css = css_path.read_text(encoding='utf-8')
css += """

.qibla-permission-onboarding__fields {
  display: grid;
  gap: var(--salah-space-4);
}

.qibla-permission-onboarding__fields label {
  display: grid;
  gap: var(--salah-space-2);
  font-weight: 700;
}

.qibla-permission-onboarding__fields select {
  min-height: 3rem;
  border: 1px solid var(--salah-border-default);
  border-radius: var(--salah-radius-sm);
  background: var(--salah-bg-control);
  color: var(--salah-fg-primary);
  padding: 0.65rem 0.75rem;
  font: inherit;
}

.qibla-permission-onboarding__fields small {
  color: var(--salah-fg-secondary);
  font-weight: 500;
}
"""
css_path.write_text(css, encoding='utf-8')

doc_path = root / 'docs/PRAYER_METHOD_REFERENCES.md'
doc = doc_path.read_text(encoding='utf-8')
doc += """

## First-run country suggestions

The first-run prayer setup uses a small explicit offline ISO-country-to-method table. It is a convenience suggestion only and does not represent institutional certification. Countries without an explicit mapping, and locations whose country cannot be resolved by the compact offline timezone mapping, use **Muslim World League (MWL)** as the documented fallback. Users can always choose another built-in method or select **Use defaults**, which persists MWL with Standard Asr through the normal settings store.
"""
doc_path.write_text(doc, encoding='utf-8')
