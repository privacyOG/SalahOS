import { useEffect, useMemo, useState } from 'react';
import { createCoordinates } from './domain/coordinates';
import type { Coordinates } from './domain/coordinates';
import { buildPrayerDashboard } from './domain/dashboard';
import { calculationMethods } from './domain/methods';
import type { PrayerName } from './domain/prayerEngine';
import {
  applyDocumentLocale,
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  formatZonedInstantTime,
  localeDirection,
  translate,
} from './i18n/i18n';
import type { Locale, TranslationKey } from './i18n/translations';
import { requestBrowserLocation } from './platform/browserGeolocation';
import type { BrowserLocationFailureReason } from './platform/browserGeolocation';
import {
  defaultPersistedSettings,
  exportPersistedSettings,
  importPersistedSettings,
  loadPersistedSettings,
  resetPersistedSettings,
  savePersistedSettings,
} from './platform/settingsStorage';
import type { PersistedSettings } from './platform/settingsStorage';

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const adjustablePrayers: readonly PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const locationFailureKeys: Readonly<Record<BrowserLocationFailureReason, TranslationKey>> = {
  'permission-denied': 'locationPermissionDenied',
  unavailable: 'locationUnavailable',
  timeout: 'locationTimeout',
  unsupported: 'locationUnsupported',
  unknown: 'locationUnknownError',
};

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(window.localStorage);
  } catch {
    return defaultPersistedSettings;
  }
}

export function App() {
  const [settings, setSettings] = useState(initialSettings);
  const [locale, setLocale] = useState<Locale>(settings.locale);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    settings.location?.coordinates ?? null,
  );
  const [latitude, setLatitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.latitude),
  );
  const [longitude, setLongitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.longitude),
  );
  const [locationFailure, setLocationFailure] = useState<BrowserLocationFailureReason | null>(null);
  const [manualError, setManualError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [settingsPayload, setSettingsPayload] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<TranslationKey | null>(null);

  useEffect(() => {
    applyDocumentLocale(document.documentElement, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const markOnline = () => {
      setOnline(true);
    };
    const markOffline = () => {
      setOnline(false);
    };
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  const dashboard = useMemo(
    () =>
      coordinates === null
        ? null
        : buildPrayerDashboard({
            instant: now,
            coordinates,
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [coordinates, now, settings],
  );
  const direction = localeDirection(locale);
  const resolvedTimeZone = dashboard?.timeZone;

  const effectiveSettings = useMemo<PersistedSettings>(
    () => ({
      ...settings,
      locale,
      location:
        coordinates === null
          ? null
          : {
              coordinates,
              ...(resolvedTimeZone === undefined ? {} : { timeZone: resolvedTimeZone }),
            },
    }),
    [coordinates, locale, resolvedTimeZone, settings],
  );

  useEffect(() => {
    try {
      savePersistedSettings(window.localStorage, effectiveSettings);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [effectiveSettings]);

  async function refreshLocation(): Promise<void> {
    const result = await requestBrowserLocation();
    if (result.ok) {
      setCoordinates(result.location.coordinates);
      setLatitude(String(result.location.coordinates.latitude));
      setLongitude(String(result.location.coordinates.longitude));
      setLocationFailure(null);
      setManualError(false);
      return;
    }
    setLocationFailure(result.reason);
  }

  function applyManualCoordinates(): void {
    try {
      const next = createCoordinates(Number(latitude), Number(longitude));
      setCoordinates(next);
      setLocationFailure(null);
      setManualError(false);
    } catch {
      setManualError(true);
    }
  }

  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {
    setSettings((current) => {
      const nextAdjustments = { ...current.prayerAdjustments };
      if (rawValue.trim() === '') {
        delete nextAdjustments[prayer];
      } else {
        const value = Number(rawValue);
        if (!Number.isInteger(value) || value < -180 || value > 180) {
          return current;
        }
        nextAdjustments[prayer] = value;
      }
      return { ...current, prayerAdjustments: nextAdjustments };
    });
  }

  function exportSettings(): void {
    setSettingsPayload(exportPersistedSettings(effectiveSettings));
    setSettingsMessage(null);
  }

  function importSettings(): void {
    try {
      const imported = importPersistedSettings(settingsPayload);
      setSettings(imported);
      setLocale(imported.locale);
      setCoordinates(imported.location?.coordinates ?? null);
      setLatitude(imported.location === null ? '' : String(imported.location.coordinates.latitude));
      setLongitude(imported.location === null ? '' : String(imported.location.coordinates.longitude));
      setLocationFailure(null);
      setManualError(false);
      setSettingsMessage('settingsImported');
    } catch {
      setSettingsMessage('settingsImportError');
    }
  }

  function resetSettings(): void {
    try {
      resetPersistedSettings(window.localStorage);
    } catch {
      // Reset still applies in memory when browser storage is unavailable.
    }
    setSettings(defaultPersistedSettings);
    setLocale(defaultPersistedSettings.locale);
    setCoordinates(null);
    setLatitude('');
    setLongitude('');
    setLocationFailure(null);
    setManualError(false);
    setSettingsPayload('');
    setSettingsMessage('settingsReset');
  }

  const currentClock =
    dashboard === null
      ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: settings.timeFormat,
        }).format(now)
      : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);

  return (
    <main className="app-shell" dir={direction}>
      {!online && (
        <p className="offline-banner" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      <header className="hero">
        <div className="hero-toolbar">
          <div>
            <p className="eyebrow">{translate(locale, 'appName')}</p>
            <p className="live-clock" aria-label={translate(locale, 'currentTime')}>
              {currentClock}
            </p>
          </div>
          <label className="language-control">
            <span>{translate(locale, 'language')}</span>
            <select
              aria-label={translate(locale, 'language')}
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value as Locale);
              }}
            >
              <option value="en">{translate(locale, 'english')}</option>
              <option value="ar">{translate(locale, 'arabic')}</option>
            </select>
          </label>
        </div>
        <h1>{translate(locale, 'heroTitle')}</h1>
        <p className="hero-copy">{translate(locale, 'heroCopy')}</p>
      </header>

      <section className="location-panel" aria-label={translate(locale, 'currentLocation')}>
        <div className="location-actions">
          <button
            type="button"
            onClick={() => {
              void refreshLocation();
            }}
          >
            {translate(locale, coordinates === null ? 'useCurrentLocation' : 'refreshLocation')}
          </button>
          <div className="manual-location">
            <label>
              <span>{translate(locale, 'latitude')}</span>
              <input
                inputMode="decimal"
                value={latitude}
                onChange={(event) => {
                  setLatitude(event.target.value);
                }}
              />
            </label>
            <label>
              <span>{translate(locale, 'longitude')}</span>
              <input
                inputMode="decimal"
                value={longitude}
                onChange={(event) => {
                  setLongitude(event.target.value);
                }}
              />
            </label>
            <button type="button" onClick={applyManualCoordinates}>
              {translate(locale, 'applyCoordinates')}
            </button>
          </div>
        </div>
        {locationFailure !== null && (
          <p className="inline-message" role="status">
            {translate(locale, locationFailureKeys[locationFailure])}
          </p>
        )}
        {manualError && (
          <p className="inline-message" role="alert">
            {translate(locale, 'invalidCoordinates')}
          </p>
        )}
      </section>

      <details className="settings-panel">
        <summary>{translate(locale, 'settings')}</summary>
        <div className="settings-grid">
          <label>
            <span>{translate(locale, 'calculationMethod')}</span>
            <select
              value={settings.calculationMethodId}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  calculationMethodId: event.target.value as PersistedSettings['calculationMethodId'],
                }));
              }}
            >
              {Object.values(calculationMethods).map((method) => (
                <option key={method.id} value={method.id}>
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
                setSettings((current) => ({
                  ...current,
                  asrConvention: event.target.value as PersistedSettings['asrConvention'],
                }));
              }}
            >
              <option value="standard">{translate(locale, 'asrStandard')}</option>
              <option value="hanafi">{translate(locale, 'asrHanafi')}</option>
            </select>
          </label>

          <label>
            <span>{translate(locale, 'highLatitudeRule')}</span>
            <select
              value={settings.highLatitudeRule}
              onChange={(event) => {
                setSettings((current) => ({
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
                setSettings((current) => ({
                  ...current,
                  hijriCorrectionDays: Number(event.target.value),
                }));
              }}
            >
              {[-2, -1, 0, 1, 2].map((days) => (
                <option key={days} value={days}>
                  {days > 0 ? `+${days}` : String(days)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{translate(locale, 'timeFormat')}</span>
            <select
              value={settings.timeFormat}
              onChange={(event) => {
                setSettings((current) => ({
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
                setSettings((current) => ({
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
        </div>

        <fieldset className="offsets-fieldset">
          <legend>{translate(locale, 'prayerOffsets')}</legend>
          <div className="offset-grid">
            {adjustablePrayers.map((prayer) => (
              <label key={prayer}>
                <span>{translate(locale, prayerTranslationKeys[prayer])}</span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={settings.prayerAdjustments[prayer] ?? ''}
                  onChange={(event) => {
                    updatePrayerOffset(prayer, event.target.value);
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="settings-transfer">
          <label>
            <span>{translate(locale, 'settingsPayload')}</span>
            <textarea
              rows={5}
              value={settingsPayload}
              onChange={(event) => {
                setSettingsPayload(event.target.value);
              }}
            />
          </label>
          <div className="settings-actions">
            <button type="button" onClick={exportSettings}>
              {translate(locale, 'exportSettings')}
            </button>
            <button type="button" onClick={importSettings}>
              {translate(locale, 'importSettings')}
            </button>
            <button type="button" onClick={resetSettings}>
              {translate(locale, 'resetSettings')}
            </button>
          </div>
          {settingsMessage !== null && (
            <p className="inline-message" role="status">
              {translate(locale, settingsMessage)}
            </p>
          )}
        </div>
      </details>

      <section className="status-card" aria-labelledby="today-heading">
        <div>
          <p className="label">{translate(locale, 'currentLocation')}</p>
          <p className="value">
            {dashboard === null
              ? translate(locale, 'notConfigured')
              : `${dashboard.coordinates.latitude.toFixed(4)}, ${dashboard.coordinates.longitude.toFixed(4)}`}
          </p>
        </div>
        <div>
          <p className="label">{translate(locale, 'timezone')}</p>
          <p className="value">{dashboard?.timeZone ?? translate(locale, 'notConfigured')}</p>
        </div>
        <div>
          <p className="label">{translate(locale, 'calculationSource')}</p>
          <p className="value">
            {dashboard === null
              ? translate(locale, 'notConfigured')
              : translate(locale, 'sourceCalculated')}
          </p>
        </div>
        <div>
          <p className="label">{translate(locale, 'method')}</p>
          <p className="value">{dashboard?.method.name ?? translate(locale, 'notConfigured')}</p>
        </div>
      </section>

      {dashboard === null ? (
        <section className="prayer-panel" aria-labelledby="today-heading">
          <p className="next-prayer">{translate(locale, 'configureLocation')}</p>
        </section>
      ) : (
        <section className="prayer-panel" aria-labelledby="today-heading">
          <div className="date-strip">
            <div>
              <p className="label">{translate(locale, 'gregorianDate')}</p>
              <p className="value">{formatGregorianCivilDate(dashboard.civilDate, locale)}</p>
            </div>
            <div>
              <p className="label">{translate(locale, 'hijriDate')}</p>
              <p className="value">
                {formatHijriCivilDate(dashboard.civilDate, locale, settings.hijriCorrectionDays)}
              </p>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">{translate(locale, 'today')}</p>
              <h2 id="today-heading">{translate(locale, 'dailyPrayers')}</h2>
            </div>
            <div className="next-prayer-block" aria-live="polite">
              <p className="label">{translate(locale, 'nextPrayer')}</p>
              <strong>
                {dashboard.nextPrayer === null
                  ? translate(locale, 'notConfigured')
                  : translate(locale, prayerTranslationKeys[dashboard.nextPrayer])}
              </strong>
              {dashboard.nextPrayerDayOffset === 1 && <span>{translate(locale, 'tomorrow')}</span>}
              <p className="countdown">
                {dashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(dashboard.secondsUntilNextPrayer, locale)}
              </p>
            </div>
          </div>

          <div className="prayer-grid">
            {dashboard.prayers.map((prayer) => (
              <article
                className={`prayer-card${prayer.isNext ? ' prayer-card-next' : ''}${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}`}
                key={prayer.name}
              >
                <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                <strong>
                  {prayer.localMinutes === null
                    ? '—'
                    : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}
                </strong>
              </article>
            ))}
          </div>

          {(dashboard.hasHighLatitudeFallback || dashboard.hasManualAdjustments) && (
            <div className="provenance-note" role="status">
              {dashboard.hasHighLatitudeFallback && (
                <span>{translate(locale, 'highLatitudeAdjustment')}</span>
              )}
              {dashboard.hasManualAdjustments && (
                <span>{translate(locale, 'manualAdjustment')}</span>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
