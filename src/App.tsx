import { useEffect, useMemo, useState } from 'react';
import { createCoordinates } from './domain/coordinates';
import type { Coordinates } from './domain/coordinates';
import { buildPrayerDashboard } from './domain/dashboard';
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

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const locationFailureKeys: Readonly<Record<BrowserLocationFailureReason, TranslationKey>> = {
  'permission-denied': 'locationPermissionDenied',
  unavailable: 'locationUnavailable',
  timeout: 'locationTimeout',
  unsupported: 'locationUnsupported',
  unknown: 'locationUnknownError',
};

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationFailure, setLocationFailure] = useState<BrowserLocationFailureReason | null>(null);
  const [manualError, setManualError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    applyDocumentLocale(document.documentElement, locale);
  }, [locale]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const dashboard = useMemo(
    () => (coordinates === null ? null : buildPrayerDashboard({ instant: now, coordinates })),
    [coordinates, now],
  );
  const direction = localeDirection(locale);

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

  const currentClock =
    dashboard === null
      ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
      : formatZonedInstantTime(now, dashboard.timeZone, locale);

  return (
    <main className="app-shell" dir={direction}>
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
            {dashboard === null ? translate(locale, 'notConfigured') : translate(locale, 'sourceCalculated')}
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
              <p className="value">{formatHijriCivilDate(dashboard.civilDate, locale)}</p>
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
                  {prayer.localMinutes === null ? '—' : formatLocalTime(prayer.localMinutes, locale)}
                </strong>
              </article>
            ))}
          </div>

          {(dashboard.hasHighLatitudeFallback || dashboard.hasManualAdjustments) && (
            <div className="provenance-note" role="status">
              {dashboard.hasHighLatitudeFallback && (
                <span>{translate(locale, 'highLatitudeAdjustment')}</span>
              )}
              {dashboard.hasManualAdjustments && <span>{translate(locale, 'manualAdjustment')}</span>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
