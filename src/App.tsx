import { useEffect, useMemo, useState } from 'react';
import { createCoordinates } from './domain/coordinates';
import type { Coordinates } from './domain/coordinates';
import { buildPrayerDashboard } from './domain/dashboard';
import { applyPrayerSourceToDashboard } from './domain/sourcedDashboard';
import { parseMosqueTimetableCsv, parseMosqueTimetableJson } from './domain/timetableImport';
import { calculationMethods } from './domain/methods';
import type { PrayerName } from './domain/prayerEngine';
import { isSupplementaryPrayer } from './domain/prayerPresentation';
import {
  displayedManualPrayerAdjustmentMinutes,
  hasManualPrayerAdjustments,
  resetManualPrayerAdjustments,
} from './domain/prayerAdjustments';
import { displayedHighLatitudeRuleApplied } from './domain/highLatitudeIndicators';
import {
  NOTIFICATION_PRAYERS,
  updatePrayerNotificationPreference,
} from './domain/notificationPreferences';
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
  loadMosqueLibrary,
  mosqueLibraryId,
  removeMosqueTimetable,
  saveMosqueLibrary,
  upsertMosqueTimetable,
} from './platform/mosqueLibrary';
import type { MosqueLibraryEntry } from './platform/mosqueLibrary';
import {
  loadSavedLocations,
  removeSavedLocation,
  saveSavedLocations,
  savedLocationId,
  upsertSavedLocation,
} from './platform/savedLocations';
import type { SavedLocation } from './platform/savedLocations';
import {
  defaultPersistedSettings,
  exportPersistedSettings,
  importPersistedSettings,
  loadPersistedSettings,
  resetPersistedSettings,
  savePersistedSettings,
} from './platform/settingsStorage';
import type { PersistedSettings } from './platform/settingsStorage';
import { installRuntimeRefreshListeners } from './platform/runtimeRefresh';
import { installThemePreference } from './platform/themePreference';

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const sourceTranslationKeys: Readonly<
  Record<PersistedSettings['prayerSourceMode'], TranslationKey>
> = {
  calculated: 'sourceCalculated',
  'calculated-adjustments': 'sourceCalculatedAdjustments',
  'local-mosque': 'sourceLocalMosque',
};

const highLatitudeRuleTranslationKeys: Readonly<
  Record<PersistedSettings['highLatitudeRule'], TranslationKey>
> = {
  'angle-based': 'highLatitudeAngle',
  'middle-of-the-night': 'highLatitudeMiddle',
  'one-seventh': 'highLatitudeSeventh',
};

const adjustablePrayers: readonly PrayerName[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

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
  const [savedLocations, setSavedLocations] = useState<readonly SavedLocation[]>(() => {
    try {
      return loadSavedLocations(window.localStorage);
    } catch {
      return [];
    }
  });
  const [savedLocationLabel, setSavedLocationLabel] = useState('');
  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);
  const [mosqueLibrary, setMosqueLibrary] = useState<readonly MosqueLibraryEntry[]>(() => {
    try {
      return loadMosqueLibrary(window.localStorage);
    } catch {
      return [];
    }
  });
  const [mosqueImportFormat, setMosqueImportFormat] = useState<'json' | 'csv'>('json');
  const [mosqueImportName, setMosqueImportName] = useState('');
  const [mosqueImportPayload, setMosqueImportPayload] = useState('');
  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);

  useEffect(() => {
    applyDocumentLocale(document.documentElement, locale);
  }, [locale]);

  useEffect(() => {
    return installThemePreference(settings.theme, {
      documentTarget: document,
      windowTarget: window,
    });
  }, [settings.theme]);

  useEffect(() => {
    const refreshNow = () => {
      setNow(new Date());
    };
    const timer = window.setInterval(refreshNow, 1_000);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
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
  const sourcedDashboard = useMemo(
    () =>
      dashboard === null
        ? null
        : applyPrayerSourceToDashboard({
            dashboard,
            sourceMode: settings.prayerSourceMode,
            mosqueTimetable: settings.mosqueTimetable,
          }),
    [dashboard, settings.mosqueTimetable, settings.prayerSourceMode],
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

  useEffect(() => {
    try {
      saveSavedLocations(window.localStorage, savedLocations);
    } catch {
      // Saved favourites remain usable in memory when storage is unavailable.
    }
  }, [savedLocations]);

  useEffect(() => {
    try {
      saveMosqueLibrary(window.localStorage, mosqueLibrary);
    } catch {
      // The validated mosque library remains usable in memory when storage is unavailable.
    }
  }, [mosqueLibrary]);

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

  function saveCurrentLocation(): void {
    const label = savedLocationLabel.trim();
    if (coordinates === null || label.length === 0) {
      setLocationMessage('savedLocationNeedsLabel');
      return;
    }

    const location: SavedLocation = {
      id: savedLocationId(coordinates),
      label,
      coordinates,
      ...(dashboard === null ? {} : { timeZone: dashboard.timeZone }),
    };
    setSavedLocations((current) => upsertSavedLocation(current, location));
    setSavedLocationLabel('');
    setLocationMessage('locationSaved');
  }

  function selectSavedLocation(id: string): void {
    const selected = savedLocations.find((location) => location.id === id);
    if (selected === undefined) return;
    setCoordinates(selected.coordinates);
    setLatitude(String(selected.coordinates.latitude));
    setLongitude(String(selected.coordinates.longitude));
    setLocationFailure(null);
    setManualError(false);
    setLocationMessage(null);
  }

  function removeCurrentSavedLocation(): void {
    if (coordinates === null) return;
    const id = savedLocationId(coordinates);
    setSavedLocations((current) => removeSavedLocation(current, id));
    setLocationMessage('savedLocationRemoved');
  }

  function importMosqueTimetable(): void {
    try {
      const timetable =
        mosqueImportFormat === 'json'
          ? parseMosqueTimetableJson(mosqueImportPayload)
          : parseMosqueTimetableCsv(mosqueImportPayload, mosqueImportName.trim());
      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));
      setSettings((current) => ({
        ...current,
        mosqueTimetable: timetable,
        prayerSourceMode: 'local-mosque',
      }));
      setMosqueImportName('');
      setMosqueImportPayload('');
      setMosqueMessage('mosqueTimetableImported');
    } catch {
      setMosqueMessage('mosqueTimetableImportError');
    }
  }

  function selectMosqueTimetable(id: string): void {
    const selected = mosqueLibrary.find((entry) => entry.id === id);
    if (selected === undefined) return;
    setSettings((current) => ({
      ...current,
      mosqueTimetable: selected.timetable,
      prayerSourceMode: 'local-mosque',
    }));
    setMosqueMessage(null);
  }

  function removeSelectedMosqueTimetable(): void {
    if (settings.mosqueTimetable === null) return;
    const id = mosqueLibraryId(settings.mosqueTimetable.mosqueName);
    setMosqueLibrary((current) => removeMosqueTimetable(current, id));
    setSettings((current) => ({
      ...current,
      mosqueTimetable: null,
      prayerSourceMode:
        current.prayerSourceMode === 'local-mosque' ? 'calculated' : current.prayerSourceMode,
    }));
    setMosqueMessage('mosqueTimetableRemoved');
  }

  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {
    setSettings((current) => {
      const nextAdjustments = { ...current.prayerAdjustments };
      if (rawValue.trim() === '') {
        Reflect.deleteProperty(nextAdjustments, prayer);
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

  function resetPrayerOffsets(): void {
    setSettings((current) => ({
      ...current,
      prayerAdjustments: resetManualPrayerAdjustments(),
    }));
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
      setLongitude(
        imported.location === null ? '' : String(imported.location.coordinates.longitude),
      );
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
        <div className="saved-location-controls">
          <label>
            <span>{translate(locale, 'savedLocations')}</span>
            <select
              value={
                coordinates === null ||
                !savedLocations.some((location) => location.id === savedLocationId(coordinates))
                  ? ''
                  : savedLocationId(coordinates)
              }
              onChange={(event) => {
                selectSavedLocation(event.target.value);
              }}
            >
              <option value="">{translate(locale, 'noSavedLocationSelected')}</option>
              {savedLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{translate(locale, 'savedLocationLabel')}</span>
            <input
              value={savedLocationLabel}
              maxLength={100}
              onChange={(event) => {
                setSavedLocationLabel(event.target.value);
                setLocationMessage(null);
              }}
            />
          </label>
          <button type="button" disabled={coordinates === null} onClick={saveCurrentLocation}>
            {translate(locale, 'saveCurrentLocation')}
          </button>
          <button
            type="button"
            disabled={
              coordinates === null ||
              !savedLocations.some((location) => location.id === savedLocationId(coordinates))
            }
            onClick={removeCurrentSavedLocation}
          >
            {translate(locale, 'removeSavedLocation')}
          </button>
        </div>
        {locationMessage !== null && (
          <p className="inline-message" role="status">
            {translate(locale, locationMessage)}
          </p>
        )}
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
            <span>{translate(locale, 'sourceMode')}</span>
            <select
              value={settings.prayerSourceMode}
              onChange={(event) => {
                setSettings((current) => ({
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
                setSettings((current) => ({
                  ...current,
                  calculationMethodId: event.target
                    .value as PersistedSettings['calculationMethodId'],
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
              aria-describedby="asr-convention-help"
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
            <small className="setting-help" id="asr-convention-help">
              {translate(locale, 'asrConventionExplanation')}
            </small>
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
                  {days > 0 ? `+${String(days)}` : String(days)}
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

        <section
          className="mosque-library-controls"
          aria-label={translate(locale, 'mosqueLibrary')}
        >
          <div className="mosque-library-row">
            <label>
              <span>{translate(locale, 'mosqueLibrary')}</span>
              <select
                value={
                  settings.mosqueTimetable === null
                    ? ''
                    : mosqueLibraryId(settings.mosqueTimetable.mosqueName)
                }
                onChange={(event) => {
                  selectMosqueTimetable(event.target.value);
                }}
              >
                <option value="">{translate(locale, 'selectMosque')}</option>
                {mosqueLibrary.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.timetable.mosqueName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={settings.mosqueTimetable === null}
              onClick={removeSelectedMosqueTimetable}
            >
              {translate(locale, 'removeMosque')}
            </button>
          </div>

          <div className="mosque-import-grid">
            <label>
              <span>{translate(locale, 'timetableFormat')}</span>
              <select
                value={mosqueImportFormat}
                onChange={(event) => {
                  setMosqueImportFormat(event.target.value as 'json' | 'csv');
                  setMosqueMessage(null);
                }}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </label>
            {mosqueImportFormat === 'csv' && (
              <label>
                <span>{translate(locale, 'mosqueName')}</span>
                <input
                  value={mosqueImportName}
                  maxLength={160}
                  onChange={(event) => {
                    setMosqueImportName(event.target.value);
                    setMosqueMessage(null);
                  }}
                />
              </label>
            )}
          </div>
          <label className="mosque-import-payload">
            <span>{translate(locale, 'timetableData')}</span>
            <textarea
              rows={7}
              value={mosqueImportPayload}
              onChange={(event) => {
                setMosqueImportPayload(event.target.value);
                setMosqueMessage(null);
              }}
            />
          </label>
          <button type="button" onClick={importMosqueTimetable}>
            {translate(locale, 'importMosqueTimetable')}
          </button>
          {mosqueMessage !== null && (
            <p className="inline-message" role="status">
              {translate(locale, mosqueMessage)}
            </p>
          )}
        </section>

        {settings.mosqueTimetable === null && (
          <p className="inline-message">{translate(locale, 'localMosqueUnavailable')}</p>
        )}

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
          <div className="offset-actions">
            <button
              type="button"
              disabled={!hasManualPrayerAdjustments(settings.prayerAdjustments)}
              onClick={resetPrayerOffsets}
            >
              {translate(locale, 'resetPrayerOffsets')}
            </button>
          </div>
        </fieldset>

        <fieldset className="notification-fieldset">
          <legend>{translate(locale, 'notificationSettings')}</legend>
          <div className="notification-grid">
            {NOTIFICATION_PRAYERS.map((prayer) => {
              const preference = settings.notifications[prayer];
              return (
                <article className="notification-card" key={prayer}>
                  <h3>{translate(locale, prayerTranslationKeys[prayer])}</h3>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={preference.enabled}
                      onChange={(event) => {
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { enabled: event.target.checked },
                          ),
                        }));
                      }}
                    />
                    <span>{translate(locale, 'notificationEnabled')}</span>
                  </label>
                  <label>
                    <span>{translate(locale, 'reminderMinutes')}</span>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      step="1"
                      value={preference.reminderMinutes ?? ''}
                      onChange={(event) => {
                        const raw = event.target.value.trim();
                        const reminderMinutes = raw === '' ? null : Number(raw);
                        if (
                          reminderMinutes !== null &&
                          (!Number.isInteger(reminderMinutes) ||
                            reminderMinutes < 1 ||
                            reminderMinutes > 180)
                        ) {
                          return;
                        }
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { reminderMinutes },
                          ),
                        }));
                      }}
                    />
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={preference.prayerTimeNotification}
                      onChange={(event) => {
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { prayerTimeNotification: event.target.checked },
                          ),
                        }));
                      }}
                    />
                    <span>{translate(locale, 'prayerTimeNotification')}</span>
                  </label>
                  <label>
                    <span>{translate(locale, 'notificationSound')}</span>
                    <select
                      value={preference.sound}
                      onChange={(event) => {
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { sound: event.target.value === 'silent' ? 'silent' : 'default' },
                          ),
                        }));
                      }}
                    >
                      <option value="default">{translate(locale, 'soundDefault')}</option>
                      <option value="silent">{translate(locale, 'soundSilent')}</option>
                    </select>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={preference.vibration}
                      onChange={(event) => {
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { vibration: event.target.checked },
                          ),
                        }));
                      }}
                    />
                    <span>{translate(locale, 'vibration')}</span>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={preference.adhanEnabled}
                      onChange={(event) => {
                        setSettings((current) => ({
                          ...current,
                          notifications: updatePrayerNotificationPreference(
                            current.notifications,
                            prayer,
                            { adhanEnabled: event.target.checked },
                          ),
                        }));
                      }}
                    />
                    <span>{translate(locale, 'adhanEnabled')}</span>
                  </label>
                </article>
              );
            })}
          </div>
          <p className="settings-note">{translate(locale, 'notificationDeliveryPending')}</p>
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
              : translate(locale, sourceTranslationKeys[settings.prayerSourceMode])}
          </p>
        </div>
        <div>
          <p className="label">
            {settings.prayerSourceMode === 'local-mosque'
              ? translate(locale, 'selectedMosque')
              : translate(locale, 'method')}
          </p>
          <p className="value">
            {settings.prayerSourceMode === 'local-mosque'
              ? (sourcedDashboard?.mosqueName ?? translate(locale, 'notConfigured'))
              : (dashboard?.method.name ?? translate(locale, 'notConfigured'))}
          </p>
        </div>
      </section>

      {dashboard === null || sourcedDashboard === null ? (
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
                {sourcedDashboard.nextPrayer === null
                  ? translate(locale, 'notConfigured')
                  : translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer])}
              </strong>
              {sourcedDashboard.nextPrayerDayOffset === 1 && (
                <span>{translate(locale, 'tomorrow')}</span>
              )}
              <p className="countdown">
                {sourcedDashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(sourcedDashboard.secondsUntilNextPrayer, locale)}
              </p>
            </div>
          </div>

          <div className="prayer-grid">
            {sourcedDashboard.prayers.map((prayer) => {
              const displayedAdjustment = displayedManualPrayerAdjustmentMinutes(
                prayer.name,
                prayer.manualAdjustmentMinutes,
                prayer.source,
              );
              const displayedHighLatitude = displayedHighLatitudeRuleApplied(
                prayer.name,
                prayer.highLatitudeRuleApplied,
                prayer.source,
              );
              return (
                <article
                  className={`prayer-card${prayer.isCurrent ? ' prayer-card-current' : ''}${prayer.isNext ? ' prayer-card-next' : ''}${isSupplementaryPrayer(prayer.name) ? ' prayer-card-supplementary' : ''}`}
                  key={prayer.name}
                >
                  <div className="prayer-card-heading">
                    <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                    <div className="prayer-indicators">
                      {prayer.isCurrent && (
                        <span className="current-prayer-badge">
                          {translate(locale, 'currentPrayer')}
                        </span>
                      )}
                      {displayedHighLatitude && (
                        <span className="adjustment-badge high-latitude-badge">
                          {translate(locale, 'highLatitudeAdjustment')} ·{' '}
                          {translate(
                            locale,
                            highLatitudeRuleTranslationKeys[settings.highLatitudeRule],
                          )}
                        </span>
                      )}
                      {displayedAdjustment !== null && (
                        <span className="adjustment-badge">
                          {translate(locale, 'manualOffset')} {displayedAdjustment > 0 ? '+' : ''}
                          {String(displayedAdjustment)} {translate(locale, 'minutesShort')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="prayer-times">
                    <span className="prayer-time-label">{translate(locale, 'prayerStart')}</span>
                    <strong>
                      {prayer.localMinutes === null
                        ? '—'
                        : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}
                    </strong>
                    {prayer.name !== 'sunrise' && prayer.iqamahLocalMinutes !== null && (
                      <>
                        <span className="prayer-time-label">{translate(locale, 'iqamah')}</span>
                        <strong className="iqamah-time">
                          {formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat)}
                        </strong>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {sourcedDashboard.jumuahSessions.length > 0 && (
            <section className="jumuah-panel" aria-label={translate(locale, 'jumuah')}>
              <h3>{translate(locale, 'jumuah')}</h3>
              <div className="jumuah-grid">
                {sourcedDashboard.jumuahSessions.map((session) => (
                  <article key={`${session.label}-${String(session.salahLocalMinutes)}`}>
                    <strong>{session.label}</strong>
                    <span>
                      {translate(locale, 'khutbah')}:{' '}
                      {formatLocalTime(session.khutbahLocalMinutes, locale, settings.timeFormat)}
                    </span>
                    <span>
                      {translate(locale, 'salah')}:{' '}
                      {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(sourcedDashboard.prayers.some((prayer) =>
            displayedHighLatitudeRuleApplied(
              prayer.name,
              prayer.highLatitudeRuleApplied,
              prayer.source,
            ),
          ) ||
            sourcedDashboard.prayers.some(
              (prayer) =>
                displayedManualPrayerAdjustmentMinutes(
                  prayer.name,
                  prayer.manualAdjustmentMinutes,
                  prayer.source,
                ) !== null,
            )) && (
            <div className="provenance-note" role="status">
              {sourcedDashboard.prayers.some((prayer) =>
                displayedHighLatitudeRuleApplied(
                  prayer.name,
                  prayer.highLatitudeRuleApplied,
                  prayer.source,
                ),
              ) && (
                <span>
                  {translate(locale, 'highLatitudeAdjustment')}:{' '}
                  {translate(locale, highLatitudeRuleTranslationKeys[settings.highLatitudeRule])}
                </span>
              )}
              {sourcedDashboard.prayers.some(
                (prayer) =>
                  displayedManualPrayerAdjustmentMinutes(
                    prayer.name,
                    prayer.manualAdjustmentMinutes,
                    prayer.source,
                  ) !== null,
              ) && <span>{translate(locale, 'manualAdjustment')}</span>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
