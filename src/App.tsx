import { useEffect, useMemo, useState } from 'react';
import { createCoordinates } from './domain/coordinates';
import type { Coordinates } from './domain/coordinates';
import { buildPrayerDashboardResult } from './domain/dashboardResult';
import { searchLocations, type LocationSearchResult } from './domain/locationSearch';
import {
  buildManualMosqueDay,
  MANUAL_MOSQUE_PRAYERS,
  upsertManualMosqueDay,
} from './domain/manualMosqueEntry';
import type { ManualIqamahMode, ManualMosquePrayerDrafts } from './domain/manualMosqueEntry';
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
import { buildNotificationIntents } from './domain/notificationSchedule';
import { resolveNotificationScheduleInstants } from './domain/notificationInstant';
import { buildNotificationPrayerInputs } from './domain/notificationPrayerInputs';
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
import { requestCurrentLocation } from './platform/currentLocation';
import { synchronizeAndroidPrayerNotifications } from './platform/androidNotificationScheduler';
import { synchronizeIosPrayerNotifications } from './platform/iosNotificationScheduler';
import { getApplicationStorage } from './platform/applicationStorage';
import type { LocationFailureReason } from './platform/currentLocation';
import { createStructuredErrorLogger } from './platform/errorLog';
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
import { createSystemClockChangeDetector } from './platform/systemClockChange';
import { createSystemSleepWakeDetector } from './platform/systemSleepWake';
import { readSystemTime, systemTimeFromMilliseconds } from './platform/systemTime';
import { smartDisplayExitPath } from './platform/smartDisplayNavigation';
import { installThemePreference } from './platform/themePreference';
import { BidiText } from './ui/BidiText';
import { NextPrayerBlock } from './ui/NextPrayerBlock';
import { PrayerCard } from './ui/PrayerCard';
import { LocalAdhanAudioSettings } from './ui/LocalAdhanAudioSettings';
import {
  AndroidExactAlarmNotice,
  ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT,
} from './ui/AndroidExactAlarmNotice';
import { SmartDisplay, smartDisplayModeRequested } from './ui/SmartDisplay';

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

const locationFailureKeys: Readonly<Record<LocationFailureReason, TranslationKey>> = {
  'permission-denied': 'locationPermissionDenied',
  unavailable: 'locationUnavailable',
  timeout: 'locationTimeout',
  unsupported: 'locationUnsupported',
  unknown: 'locationUnknownError',
};

function emptyManualMosqueDrafts(): ManualMosquePrayerDrafts {
  return {
    fajr: { start: '', iqamahMode: 'none', iqamah: '' },
    dhuhr: { start: '', iqamahMode: 'none', iqamah: '' },
    asr: { start: '', iqamahMode: 'none', iqamah: '' },
    maghrib: { start: '', iqamahMode: 'none', iqamah: '' },
    isha: { start: '', iqamahMode: 'none', iqamah: '' },
  };
}

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

export function App() {
  const [settings, setSettings] = useState(initialSettings);
  const errorLogger = useMemo(() => createStructuredErrorLogger(), []);
  const [locale, setLocale] = useState<Locale>(settings.locale);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    settings.location?.coordinates ?? null,
  );
  const [timeZoneOverride, setTimeZoneOverride] = useState<string | null>(
    settings.location?.timeZone ?? null,
  );
  const [latitude, setLatitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.latitude),
  );
  const [longitude, setLongitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.longitude),
  );
  const [locationFailure, setLocationFailure] = useState<LocationFailureReason | null>(null);
  const [manualError, setManualError] = useState(false);
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [settingsPayload, setSettingsPayload] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<TranslationKey | null>(null);
  const [savedLocations, setSavedLocations] = useState<readonly SavedLocation[]>(() => {
    try {
      return loadSavedLocations(getApplicationStorage());
    } catch {
      return [];
    }
  });
  const [savedLocationLabel, setSavedLocationLabel] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);
  const locationSearchResults = useMemo(
    () => searchLocations(locationQuery, { locale, limit: 8 }),
    [locale, locationQuery],
  );
  const [mosqueLibrary, setMosqueLibrary] = useState<readonly MosqueLibraryEntry[]>(() => {
    try {
      return loadMosqueLibrary(getApplicationStorage());
    } catch {
      return [];
    }
  });
  const [mosqueImportFormat, setMosqueImportFormat] = useState<'json' | 'csv'>('json');
  const [mosqueImportName, setMosqueImportName] = useState('');
  const [mosqueImportPayload, setMosqueImportPayload] = useState('');
  const [manualMosqueName, setManualMosqueName] = useState(
    settings.mosqueTimetable?.mosqueName ?? '',
  );
  const [manualMosqueDate, setManualMosqueDate] = useState('');
  const [manualMosqueDrafts, setManualMosqueDrafts] =
    useState<ManualMosquePrayerDrafts>(emptyManualMosqueDrafts);
  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);
  const [notificationSyncRevision, setNotificationSyncRevision] = useState(0);

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
    let clockChangeDetector: ReturnType<typeof createSystemClockChangeDetector> | null = null;
    let sleepWakeDetector: ReturnType<typeof createSystemSleepWakeDetector> | null = null;
    let invalidSystemTimeActive = false;

    const sampleNow = () => {
      const wallTimeMs = Date.now();
      const monotonicTimeMs = performance.now();
      const instant = systemTimeFromMilliseconds(wallTimeMs);
      if (instant === null || !Number.isFinite(monotonicTimeMs)) {
        return null;
      }
      return { wallTimeMs, monotonicTimeMs, instant };
    };
    const invalidateRuntimeClock = () => {
      if (!invalidSystemTimeActive) {
        errorLogger.log('invalid-system-time');
        invalidSystemTimeActive = true;
      }
      clockChangeDetector = null;
      sleepWakeDetector = null;
      setNow(null);
    };
    const resetFromSample = (sample: NonNullable<ReturnType<typeof sampleNow>>) => {
      invalidSystemTimeActive = false;
      if (clockChangeDetector === null) {
        clockChangeDetector = createSystemClockChangeDetector(sample);
      } else {
        clockChangeDetector.reset(sample);
      }
      if (sleepWakeDetector === null) {
        sleepWakeDetector = createSystemSleepWakeDetector({ wallTimeMs: sample.wallTimeMs });
      } else {
        sleepWakeDetector.reset({ wallTimeMs: sample.wallTimeMs });
      }
      setNow(sample.instant);
    };
    const refreshNow = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      resetFromSample(sample);
    };
    const tick = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      if (clockChangeDetector === null || sleepWakeDetector === null) {
        resetFromSample(sample);
        return;
      }
      const resumedFromSleep = sleepWakeDetector.sample({ wallTimeMs: sample.wallTimeMs });
      if (resumedFromSleep) {
        clockChangeDetector.reset(sample);
      } else {
        clockChangeDetector.sample(sample);
      }
      setNow(sample.instant);
    };

    refreshNow();
    const timer = window.setInterval(tick, 1_000);
    const refreshRuntimeAndNotifications = () => {
      refreshNow();
      setNotificationSyncRevision((current) => current + 1);
    };
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshRuntimeAndNotifications,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, [errorLogger]);

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

  useEffect(() => {
    const resynchronize = () => {
      setNotificationSyncRevision((current) => current + 1);
    };
    window.addEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, resynchronize);
    return () => {
      window.removeEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, resynchronize);
    };
  }, []);

  const dashboardResult = useMemo(
    () =>
      coordinates === null || now === null
        ? null
        : buildPrayerDashboardResult({
            instant: now,
            coordinates,
            ...(timeZoneOverride === null ? {} : { timeZone: timeZoneOverride }),
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [coordinates, now, settings, timeZoneOverride],
  );
  const dashboard = dashboardResult?.ok === true ? dashboardResult.dashboard : null;
  const calculationUnavailable = dashboardResult?.ok === false;
  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];

  useEffect(() => {
    if (calculationUnavailable) {
      errorLogger.log('prayer-calculation-unavailable');
    }
  }, [calculationUnavailable, errorLogger]);
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

  useEffect(() => {
    if (dashboard === null) return;

    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: settings.prayerSourceMode,
      mosqueTimetable: settings.mosqueTimetable,
    });
    const intents = buildNotificationIntents(inputs, settings.notifications);
    const resolutions = resolveNotificationScheduleInstants(intents, dashboard.timeZone);

    void synchronizeAndroidPrayerNotifications(resolutions, locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
    void synchronizeIosPrayerNotifications(resolutions, locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
  }, [
    dashboard?.today.date,
    dashboard?.tomorrow.date,
    dashboard?.timeZone,
    coordinates?.latitude,
    coordinates?.longitude,
    locale,
    settings.asrConvention,
    settings.calculationMethodId,
    settings.highLatitudeRule,
    settings.mosqueTimetable,
    settings.notifications,
    settings.prayerAdjustments,
    settings.prayerSourceMode,
    errorLogger,
    notificationSyncRevision,
  ]);

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
      savePersistedSettings(getApplicationStorage(), effectiveSettings);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [effectiveSettings]);

  useEffect(() => {
    try {
      saveSavedLocations(getApplicationStorage(), savedLocations);
    } catch {
      // Saved favourites remain usable in memory when storage is unavailable.
    }
  }, [savedLocations]);

  useEffect(() => {
    try {
      saveMosqueLibrary(getApplicationStorage(), mosqueLibrary);
    } catch {
      // The validated mosque library remains usable in memory when storage is unavailable.
    }
  }, [mosqueLibrary]);

  async function refreshLocation(): Promise<void> {
    const result = await requestCurrentLocation();
    if (result.ok) {
      setCoordinates(result.location.coordinates);
      setTimeZoneOverride(null);
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
      setTimeZoneOverride(null);
      setLocationFailure(null);
      setManualError(false);
    } catch {
      setManualError(true);
    }
  }

  function selectSearchedLocation(result: LocationSearchResult): void {
    setCoordinates(result.coordinates);
    setTimeZoneOverride(result.timeZone);
    setLatitude(String(result.coordinates.latitude));
    setLongitude(String(result.coordinates.longitude));
    setLocationQuery('');
    setLocationFailure(null);
    setManualError(false);
    setLocationMessage('locationSearchSelected');
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
    setTimeZoneOverride(selected.timeZone ?? null);
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

  function updateManualMosqueDraft(
    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],
    field: 'start' | 'iqamah',
    value: string,
  ): void {
    setManualMosqueDrafts((current) => ({
      ...current,
      [prayer]: { ...current[prayer], [field]: value },
    }));
    setMosqueMessage(null);
  }

  function updateManualIqamahMode(
    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],
    iqamahMode: ManualIqamahMode,
  ): void {
    setManualMosqueDrafts((current) => ({
      ...current,
      [prayer]: { ...current[prayer], iqamahMode, iqamah: '' },
    }));
    setMosqueMessage(null);
  }

  function saveManualMosqueDay(): void {
    try {
      const name = manualMosqueName.trim();
      const id = mosqueLibraryId(name);
      const libraryTimetable = mosqueLibrary.find((entry) => entry.id === id)?.timetable ?? null;
      const selectedTimetable =
        settings.mosqueTimetable !== null &&
        mosqueLibraryId(settings.mosqueTimetable.mosqueName) === id
          ? settings.mosqueTimetable
          : null;
      const day = buildManualMosqueDay(manualMosqueDate, manualMosqueDrafts);
      const timetable = upsertManualMosqueDay(libraryTimetable ?? selectedTimetable, name, day);
      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));
      setSettings((current) => ({
        ...current,
        mosqueTimetable: timetable,
        prayerSourceMode: 'local-mosque',
      }));
      setManualMosqueName(timetable.mosqueName);
      setManualMosqueDate('');
      setManualMosqueDrafts(emptyManualMosqueDrafts());
      setMosqueMessage('manualMosqueDaySaved');
    } catch {
      setMosqueMessage('manualMosqueDayError');
    }
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
      setManualMosqueName(timetable.mosqueName);
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
    setManualMosqueName(selected.timetable.mosqueName);
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
      setTimeZoneOverride(imported.location?.timeZone ?? null);
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
      resetPersistedSettings(getApplicationStorage());
    } catch {
      // Reset still applies in memory when browser storage is unavailable.
    }
    setSettings(defaultPersistedSettings);
    setLocale(defaultPersistedSettings.locale);
    setCoordinates(null);
    setTimeZoneOverride(null);
    setLatitude('');
    setLongitude('');
    setLocationFailure(null);
    setManualError(false);
    setSettingsPayload('');
    setSettingsMessage('settingsReset');
  }

  useEffect(() => {
    if (!smartDisplayModeRequested(window.location.search)) {
      return;
    }

    const handleDisplayExitKey = (event: KeyboardEvent) => {
      const target = smartDisplayExitPath(window.location.href, event.key);
      if (target === null) {
        return;
      }
      event.preventDefault();
      window.location.assign(target);
    };

    window.addEventListener('keydown', handleDisplayExitKey);
    return () => {
      window.removeEventListener('keydown', handleDisplayExitKey);
    };
  }, []);

  const currentClock =
    now === null
      ? '—'
      : dashboard === null
        ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);

  if (smartDisplayModeRequested(window.location.search)) {
    return (
      <SmartDisplay
        locale={locale}
        currentClock={currentClock}
        dashboard={sourcedDashboard}
        timeFormat={settings.timeFormat}
        hijriCorrectionDays={settings.hijriCorrectionDays}
        offline={!online}
        systemTimeUnavailable={now === null}
        calculationUnavailable={calculationUnavailable}
      />
    );
  }

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
        <div className="location-search">
          <label>
            <span>{translate(locale, 'locationSearch')}</span>
            <input
              value={locationQuery}
              dir="auto"
              autoComplete="off"
              placeholder={translate(locale, 'locationSearchPlaceholder')}
              onChange={(event) => {
                setLocationQuery(event.target.value);
                setLocationMessage(null);
              }}
            />
          </label>
          <p className="location-search-help">{translate(locale, 'locationSearchHelp')}</p>
          {locationSearchResults.length > 0 && (
            <div className="location-search-results" role="list">
              {locationSearchResults.map((result) => (
                <button
                  type="button"
                  className="location-search-result"
                  key={result.id}
                  role="listitem"
                  onClick={() => {
                    selectSearchedLocation(result);
                  }}
                >
                  <span dir="auto">
                    {result.city} — {result.countryNames.join(', ')}
                  </span>
                  <small dir="ltr">{result.timeZone}</small>
                </button>
              ))}
            </div>
          )}
          {locationQuery.trim().length >= 2 && locationSearchResults.length === 0 && (
            <p className="inline-message">{translate(locale, 'locationSearchNoResults')}</p>
          )}
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
                <option dir="auto" key={location.id} value={location.id}>
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
              dir="auto"
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
                <option dir="auto" key={method.id} value={method.id}>
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
                  <option dir="auto" key={entry.id} value={entry.id}>
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

          <fieldset className="manual-mosque-fieldset">
            <legend>{translate(locale, 'manualMosqueEntry')}</legend>
            <p className="setting-help">{translate(locale, 'manualMosqueEntryHelp')}</p>
            <div className="manual-mosque-header">
              <label>
                <span>{translate(locale, 'mosqueName')}</span>
                <input
                  value={manualMosqueName}
                  maxLength={160}
                  dir="auto"
                  onChange={(event) => {
                    setManualMosqueName(event.target.value);
                    setMosqueMessage(null);
                  }}
                />
              </label>
              <label>
                <span>{translate(locale, 'timetableDate')}</span>
                <input
                  type="date"
                  value={manualMosqueDate}
                  onChange={(event) => {
                    setManualMosqueDate(event.target.value);
                    setMosqueMessage(null);
                  }}
                />
              </label>
            </div>
            <div className="manual-mosque-prayer-grid">
              {MANUAL_MOSQUE_PRAYERS.map((prayer) => (
                <article className="manual-mosque-prayer" key={prayer}>
                  <h4>{translate(locale, prayerTranslationKeys[prayer])}</h4>
                  <label>
                    <span>{translate(locale, 'prayerStartTime')}</span>
                    <input
                      type="time"
                      step="60"
                      required
                      value={manualMosqueDrafts[prayer].start}
                      onChange={(event) => {
                        updateManualMosqueDraft(prayer, 'start', event.target.value);
                      }}
                    />
                  </label>
                  <label>
                    <span>{translate(locale, 'iqamahSetting')}</span>
                    <select
                      value={manualMosqueDrafts[prayer].iqamahMode}
                      onChange={(event) => {
                        updateManualIqamahMode(prayer, event.target.value as ManualIqamahMode);
                      }}
                    >
                      <option value="none">{translate(locale, 'noIqamah')}</option>
                      <option value="fixed">{translate(locale, 'iqamahFixed')}</option>
                      <option value="offset">{translate(locale, 'iqamahOffset')}</option>
                    </select>
                  </label>
                  {manualMosqueDrafts[prayer].iqamahMode === 'fixed' && (
                    <label>
                      <span>{translate(locale, 'iqamahFixedTime')}</span>
                      <input
                        type="time"
                        step="60"
                        required
                        value={manualMosqueDrafts[prayer].iqamah}
                        onChange={(event) => {
                          updateManualMosqueDraft(prayer, 'iqamah', event.target.value);
                        }}
                      />
                    </label>
                  )}
                  {manualMosqueDrafts[prayer].iqamahMode === 'offset' && (
                    <label>
                      <span>{translate(locale, 'iqamahOffsetMinutes')}</span>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        required
                        inputMode="numeric"
                        value={manualMosqueDrafts[prayer].iqamah}
                        onChange={(event) => {
                          updateManualMosqueDraft(prayer, 'iqamah', event.target.value);
                        }}
                      />
                    </label>
                  )}
                </article>
              ))}
            </div>
            <button type="button" onClick={saveManualMosqueDay}>
              {translate(locale, 'saveManualMosqueDay')}
            </button>
          </fieldset>

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
                  dir="auto"
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
          <LocalAdhanAudioSettings
            locale={locale}
            date={sourcedDashboard?.base.today.date ?? null}
            localMinutes={sourcedDashboard?.base.clock.localMinutes ?? null}
            prayers={sourcedDashboard?.prayers ?? []}
            notifications={settings.notifications}
          />
          <p className="setting-help">{translate(locale, 'adhanDeliveryPolicy')}</p>
          <AndroidExactAlarmNotice locale={locale} />
          <p className="setting-help">{translate(locale, 'notificationDeliveryPending')}</p>
        </fieldset>

        <section className="settings-transfer">
          <label>
            <span>{translate(locale, 'settingsPayload')}</span>
            <textarea
              rows={6}
              value={settingsPayload}
              onChange={(event) => {
                setSettingsPayload(event.target.value);
                setSettingsMessage(null);
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
        </section>
      </details>

      {now === null ? (
        <section className="status-card" role="alert">
          <div>
            <p className="label">{translate(locale, 'currentTime')}</p>
            <p className="value">{translate(locale, 'systemTimeInvalid')}</p>
          </div>
          <div>
            <p className="value">{translate(locale, 'systemTimeInvalidHelp')}</p>
          </div>
        </section>
      ) : calculationUnavailable ? (
        <section className="status-card" role="alert">
          <div>
            <p className="label">{translate(locale, 'dailyPrayers')}</p>
            <p className="value">{translate(locale, 'calculationUnavailable')}</p>
          </div>
          <div>
            <p className="value">{translate(locale, 'calculationUnavailableHelp')}</p>
          </div>
        </section>
      ) : sourcedDashboard === null ? (
        <section className="status-card">
          <div>
            <p className="label">{translate(locale, 'currentLocation')}</p>
            <p className="value">{translate(locale, 'notConfigured')}</p>
          </div>
          <div>
            <p className="label">{translate(locale, 'timezone')}</p>
            <p className="value">{translate(locale, 'notConfigured')}</p>
          </div>
          <div>
            <p className="label">{translate(locale, 'calculationMethod')}</p>
            <p className="value">
              <BidiText>{calculationMethods[settings.calculationMethodId].name}</BidiText>
            </p>
          </div>
          <div>
            <p className="label">{translate(locale, 'sourceMode')}</p>
            <p className="value">
              {translate(locale, sourceTranslationKeys[settings.prayerSourceMode])}
            </p>
          </div>
        </section>
      ) : (
        <section className="prayer-panel">
          <div className="date-strip">
            <div>
              <p className="label">{translate(locale, 'gregorianDate')}</p>
              <p className="value">
                {formatGregorianCivilDate(sourcedDashboard.base.civilDate, locale)}
              </p>
            </div>
            <div>
              <p className="label">{translate(locale, 'hijriDate')}</p>
              <p className="value">
                {formatHijriCivilDate(
                  sourcedDashboard.base.civilDate,
                  locale,
                  settings.hijriCorrectionDays,
                )}
              </p>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">{translate(locale, 'dailyPrayers')}</p>
              <h2>
                {translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer ?? 'fajr'])}
              </h2>
            </div>
            <NextPrayerBlock
              nextPrayerLabel={
                sourcedDashboard.nextPrayer === null
                  ? null
                  : translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer])
              }
              countdown={
                sourcedDashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(sourcedDashboard.secondsUntilNextPrayer, locale)
              }
              tomorrow={sourcedDashboard.nextPrayerDayOffset === 1}
              nextPrayerText={translate(locale, 'nextPrayer')}
              notConfiguredText={translate(locale, 'notConfigured')}
              tomorrowText={translate(locale, 'tomorrow')}
            />
          </div>

          <div className="prayer-grid">
            {sourcedDashboard.prayers.map((prayer) => {
              const isSupplementary = isSupplementaryPrayer(prayer.name);
              const manualPrayerAdjustmentMinutes = displayedManualPrayerAdjustmentMinutes(
                prayer.name,
                prayer.manualAdjustmentMinutes,
                sourcedDashboard.sourceMode,
              );
              const highLatitudeRuleApplied = displayedHighLatitudeRuleApplied(
                prayer.name,
                prayer.highLatitudeRuleApplied,
                sourcedDashboard.sourceMode,
              );
              const highLatitudeIndicator = highLatitudeRuleApplied
                ? `${translate(locale, 'highLatitudeAdjustment')} · ${translate(
                    locale,
                    highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule],
                  )}`
                : null;
              const manualAdjustmentIndicator =
                manualPrayerAdjustmentMinutes === null
                  ? null
                  : `${translate(locale, 'manualOffset')} ${
                      manualPrayerAdjustmentMinutes > 0 ? '+' : ''
                    }${String(manualPrayerAdjustmentMinutes)} ${translate(locale, 'minutesShort')}`;
              return (
                <PrayerCard
                  key={prayer.name}
                  prayerName={translate(locale, prayerTranslationKeys[prayer.name])}
                  isCurrent={prayer.isCurrent}
                  isNext={prayer.isNext}
                  isSupplementary={isSupplementary}
                  currentPrayerLabel={translate(locale, 'currentPrayer')}
                  prayerStartLabel={translate(locale, 'prayerStart')}
                  startTime={
                    prayer.localMinutes === null
                      ? '—'
                      : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)
                  }
                  iqamahLabel={translate(locale, 'iqamah')}
                  iqamahTime={
                    prayer.iqamahLocalMinutes === null
                      ? translate(locale, 'noIqamah')
                      : formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat)
                  }
                  highLatitudeIndicator={highLatitudeIndicator}
                  manualAdjustmentIndicator={manualAdjustmentIndicator}
                />
              );
            })}
          </div>

          {unavailablePrayers.length > 0 && (
            <p className="inline-message" role="status">
              {translate(locale, 'somePrayerTimesUnavailable')}
            </p>
          )}

          {sourcedDashboard.jumuahSessions.length > 0 && (
            <div className="jumuah-panel">
              <p className="label">{translate(locale, 'jumuah')}</p>
              {sourcedDashboard.jumuahSessions.map((session) => (
                <div className="jumuah-session" key={session.label}>
                  <strong>
                    <BidiText>{session.label}</BidiText>
                  </strong>
                  <span>
                    {translate(locale, 'khutbah')}:{' '}
                    {formatLocalTime(session.khutbahLocalMinutes, locale, settings.timeFormat)}
                  </span>
                  <span>
                    {translate(locale, 'salah')}:{' '}
                    {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="provenance-note">
            <span>
              {translate(locale, 'calculationSource')}:{' '}
              {translate(locale, sourceTranslationKeys[sourcedDashboard.sourceMode])}
            </span>
            <span>
              {translate(locale, 'method')}:{' '}
              <BidiText>{sourcedDashboard.base.method.name}</BidiText>
            </span>
            <span>
              {translate(locale, 'timezone')}: <BidiText>{sourcedDashboard.base.timeZone}</BidiText>
            </span>
            {sourcedDashboard.mosqueName !== null && (
              <span>
                {translate(locale, 'selectedMosque')}:{' '}
                <BidiText>{sourcedDashboard.mosqueName}</BidiText>
              </span>
            )}
            {sourcedDashboard.hasHighLatitudeFallback && (
              <span>
                {translate(locale, 'highLatitudeAdjustment')} ·{' '}
                {translate(
                  locale,
                  highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule],
                )}
              </span>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
