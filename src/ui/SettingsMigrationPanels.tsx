import { useEffect, useMemo, useState } from 'react';

import { createCoordinates } from '../domain/coordinates';
import type { Coordinates } from '../domain/coordinates';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { searchLocations, type LocationSearchResult } from '../domain/locationSearch';
import {
  buildManualMosqueDay,
  MANUAL_MOSQUE_PRAYERS,
  upsertManualMosqueDay,
} from '../domain/manualMosqueEntry';
import type { ManualIqamahMode, ManualMosquePrayerDrafts } from '../domain/manualMosqueEntry';
import { calculationMethods } from '../domain/methods';
import {
  NOTIFICATION_PRAYERS,
  updatePrayerNotificationPreference,
} from '../domain/notificationPreferences';
import { buildNotificationIntents } from '../domain/notificationSchedule';
import { resolveNotificationScheduleInstants } from '../domain/notificationInstant';
import { buildNotificationPrayerInputs } from '../domain/notificationPrayerInputs';
import {
  hasManualPrayerAdjustments,
  resetManualPrayerAdjustments,
} from '../domain/prayerAdjustments';
import type { PrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { translate } from '../i18n/i18n';
import type { TranslationKey } from '../i18n/translations';
import { synchronizeAndroidPrayerNotifications } from '../platform/androidNotificationScheduler';
import { getApplicationStorage } from '../platform/applicationStorage';
import { requestCurrentLocation, type LocationFailureReason } from '../platform/currentLocation';
import { createStructuredErrorLogger } from '../platform/errorLog';
import { synchronizeIosPrayerNotifications } from '../platform/iosNotificationScheduler';
import {
  loadMosqueLibrary,
  mosqueLibraryId,
  removeMosqueTimetable,
  saveMosqueLibrary,
  upsertMosqueTimetable,
} from '../platform/mosqueLibrary';
import type { MosqueLibraryEntry } from '../platform/mosqueLibrary';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import {
  loadSavedLocations,
  removeSavedLocation,
  saveSavedLocations,
  savedLocationId,
  upsertSavedLocation,
} from '../platform/savedLocations';
import type { SavedLocation } from '../platform/savedLocations';
import type { PersistedLocation, PersistedSettings } from '../platform/settingsStorage';
import { readSystemTime } from '../platform/systemTime';
import {
  AndroidExactAlarmNotice,
  ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT,
} from './AndroidExactAlarmNotice';
import { LocalAdhanAudioSettings } from './LocalAdhanAudioSettings';

type SettingsUpdater = (update: (current: PersistedSettings) => PersistedSettings) => void;

type SharedSettingsPanelProps = Readonly<{
  settings: PersistedSettings;
  updateSettings: SettingsUpdater;
}>;

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
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

function initialSavedLocations(): readonly SavedLocation[] {
  try {
    return loadSavedLocations(getApplicationStorage());
  } catch {
    return [];
  }
}

function initialMosqueLibrary(): readonly MosqueLibraryEntry[] {
  try {
    return loadMosqueLibrary(getApplicationStorage());
  } catch {
    return [];
  }
}

function useSavedLocationsState() {
  const [savedLocations, setSavedLocations] =
    useState<readonly SavedLocation[]>(initialSavedLocations);

  useEffect(() => {
    try {
      saveSavedLocations(getApplicationStorage(), savedLocations);
    } catch {
      // Saved locations remain usable in memory when storage is unavailable.
    }
  }, [savedLocations]);

  return [savedLocations, setSavedLocations] as const;
}

function useMosqueLibraryState() {
  const [mosqueLibrary, setMosqueLibrary] =
    useState<readonly MosqueLibraryEntry[]>(initialMosqueLibrary);

  useEffect(() => {
    try {
      saveMosqueLibrary(getApplicationStorage(), mosqueLibrary);
    } catch {
      // Validated mosque timetables remain usable in memory when storage is unavailable.
    }
  }, [mosqueLibrary]);

  return [mosqueLibrary, setMosqueLibrary] as const;
}

function resolveLocation(
  settings: PersistedSettings,
  coordinates: Coordinates,
  explicitTimeZone?: string,
): PersistedLocation {
  if (explicitTimeZone !== undefined) {
    return { coordinates, timeZone: explicitTimeZone };
  }

  const instant = readSystemTime();
  if (instant !== null) {
    const result = buildPrayerDashboardResult({
      instant,
      coordinates,
      method: calculationMethods[settings.calculationMethodId],
      asrConvention: settings.asrConvention,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.prayerAdjustments,
      hijriCorrectionDays: settings.hijriCorrectionDays,
    });
    if (result.ok) {
      return { coordinates, timeZone: result.dashboard.timeZone };
    }
  }

  return { coordinates };
}

export function LocationSettingsPanel({ settings, updateSettings }: SharedSettingsPanelProps) {
  const locale = settings.locale;
  const [savedLocations, setSavedLocations] = useSavedLocationsState();
  const [latitude, setLatitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.latitude),
  );
  const [longitude, setLongitude] = useState(
    settings.location === null ? '' : String(settings.location.coordinates.longitude),
  );
  const [locationQuery, setLocationQuery] = useState('');
  const [savedLocationLabel, setSavedLocationLabel] = useState('');
  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);
  const [locationFailure, setLocationFailure] = useState<LocationFailureReason | null>(null);
  const [manualError, setManualError] = useState(false);
  const locationSearchResults = useMemo(
    () => searchLocations(locationQuery, { locale, limit: 8 }),
    [locale, locationQuery],
  );

  useEffect(() => {
    setLatitude(settings.location === null ? '' : String(settings.location.coordinates.latitude));
    setLongitude(settings.location === null ? '' : String(settings.location.coordinates.longitude));
  }, [settings.location]);

  const setLocation = (location: PersistedLocation) => {
    updateSettings((current) => ({ ...current, location }));
    setLocationFailure(null);
    setManualError(false);
  };

  const refreshLocation = async () => {
    const result = await requestCurrentLocation();
    if (!result.ok) {
      setLocationFailure(result.reason);
      return;
    }
    const location = resolveLocation(settings, result.location.coordinates);
    setLocation(location);
    setLatitude(String(location.coordinates.latitude));
    setLongitude(String(location.coordinates.longitude));
  };

  const applyManualCoordinates = () => {
    try {
      const coordinates = createCoordinates(Number(latitude), Number(longitude));
      setLocation(resolveLocation(settings, coordinates));
    } catch {
      setManualError(true);
    }
  };

  const selectSearchedLocation = (result: LocationSearchResult) => {
    setLocation(resolveLocation(settings, result.coordinates, result.timeZone));
    setLatitude(String(result.coordinates.latitude));
    setLongitude(String(result.coordinates.longitude));
    setLocationQuery('');
    setLocationMessage('locationSearchSelected');
  };

  const selectSavedLocation = (id: string) => {
    const selected = savedLocations.find((location) => location.id === id);
    if (selected === undefined) return;
    setLocation(resolveLocation(settings, selected.coordinates, selected.timeZone ?? undefined));
    setLatitude(String(selected.coordinates.latitude));
    setLongitude(String(selected.coordinates.longitude));
    setLocationMessage(null);
  };

  const saveCurrentLocation = () => {
    const label = savedLocationLabel.trim();
    if (settings.location === null || label.length === 0) {
      setLocationMessage('savedLocationNeedsLabel');
      return;
    }
    const location: SavedLocation = {
      id: savedLocationId(settings.location.coordinates),
      label,
      coordinates: settings.location.coordinates,
      ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
    };
    setSavedLocations((current) => upsertSavedLocation(current, location));
    setSavedLocationLabel('');
    setLocationMessage('locationSaved');
  };

  const removeCurrentSavedLocation = () => {
    if (settings.location === null) return;
    const id = savedLocationId(settings.location.coordinates);
    setSavedLocations((current) => removeSavedLocation(current, id));
    setLocationMessage('savedLocationRemoved');
  };

  const currentCoordinates = settings.location?.coordinates ?? null;
  const selectedSavedLocationId =
    currentCoordinates !== null &&
    savedLocations.some((location) => location.id === savedLocationId(currentCoordinates))
      ? savedLocationId(currentCoordinates)
      : '';

  return (
    <section
      className="settings-feature-panel settings-location-panel"
      aria-label={translate(locale, 'currentLocation')}
    >
      <div className="location-actions">
        <button
          type="button"
          onClick={() => {
            void refreshLocation();
          }}
        >
          {translate(locale, settings.location === null ? 'useCurrentLocation' : 'refreshLocation')}
        </button>
        <div className="manual-location">
          <label>
            <span>{translate(locale, 'latitude')}</span>
            <input
              inputMode="decimal"
              value={latitude}
              onChange={(event) => {
                setLatitude(event.target.value);
                setManualError(false);
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
                setManualError(false);
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
            value={selectedSavedLocationId}
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
        <button type="button" disabled={settings.location === null} onClick={saveCurrentLocation}>
          {translate(locale, 'saveCurrentLocation')}
        </button>
        <button
          type="button"
          disabled={selectedSavedLocationId.length === 0}
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
  );
}

export function MosqueIqamahSettingsPanel({ settings, updateSettings }: SharedSettingsPanelProps) {
  const locale = settings.locale;
  const [mosqueLibrary, setMosqueLibrary] = useMosqueLibraryState();
  const selectedId =
    settings.mosqueTimetable === null ? '' : mosqueLibraryId(settings.mosqueTimetable.mosqueName);
  const [message, setMessage] = useState<TranslationKey | null>(null);

  const selectMosqueTimetable = (id: string) => {
    const selected = mosqueLibrary.find((entry) => entry.id === id);
    if (selected === undefined) return;
    updateSettings((current) => ({
      ...current,
      mosqueTimetable: selected.timetable,
      prayerSourceMode: 'local-mosque',
    }));
    setMessage(null);
  };

  const removeSelectedMosqueTimetable = () => {
    if (settings.mosqueTimetable === null) return;
    const id = mosqueLibraryId(settings.mosqueTimetable.mosqueName);
    setMosqueLibrary((current) => removeMosqueTimetable(current, id));
    updateSettings((current) => ({
      ...current,
      mosqueTimetable: null,
      prayerSourceMode:
        current.prayerSourceMode === 'local-mosque' ? 'calculated' : current.prayerSourceMode,
    }));
    setMessage('mosqueTimetableRemoved');
  };

  return (
    <section className="settings-feature-panel" aria-label={translate(locale, 'mosqueLibrary')}>
      <div className="mosque-library-row">
        <label>
          <span>{translate(locale, 'mosqueLibrary')}</span>
          <select
            value={selectedId}
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
      {settings.mosqueTimetable === null && (
        <p className="inline-message">{translate(locale, 'localMosqueUnavailable')}</p>
      )}
      {message !== null && (
        <p className="inline-message" role="status">
          {translate(locale, message)}
        </p>
      )}
    </section>
  );
}

export function AdvancedPrayerSettingsPanel({
  settings,
  updateSettings,
}: SharedSettingsPanelProps) {
  const locale = settings.locale;
  const [mosqueLibrary, setMosqueLibrary] = useMosqueLibraryState();
  const [manualMosqueName, setManualMosqueName] = useState(
    settings.mosqueTimetable?.mosqueName ?? '',
  );
  const [manualMosqueDate, setManualMosqueDate] = useState('');
  const [manualMosqueDrafts, setManualMosqueDrafts] =
    useState<ManualMosquePrayerDrafts>(emptyManualMosqueDrafts);
  const [mosqueImportFormat, setMosqueImportFormat] = useState<'json' | 'csv'>('json');
  const [mosqueImportName, setMosqueImportName] = useState('');
  const [mosqueImportPayload, setMosqueImportPayload] = useState('');
  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (settings.mosqueTimetable !== null) {
      setManualMosqueName(settings.mosqueTimetable.mosqueName);
    }
  }, [settings.mosqueTimetable]);

  const updateManualMosqueDraft = (
    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],
    field: 'start' | 'iqamah',
    value: string,
  ) => {
    setManualMosqueDrafts((current) => ({
      ...current,
      [prayer]: { ...current[prayer], [field]: value },
    }));
    setMosqueMessage(null);
  };

  const updateManualIqamahMode = (
    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],
    iqamahMode: ManualIqamahMode,
  ) => {
    setManualMosqueDrafts((current) => ({
      ...current,
      [prayer]: { ...current[prayer], iqamahMode, iqamah: '' },
    }));
    setMosqueMessage(null);
  };

  const saveManualMosqueDay = () => {
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
      updateSettings((current) => ({
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
  };

  const importMosqueTimetable = async () => {
    try {
      const { parseMosqueTimetableCsv, parseMosqueTimetableJson } =
        await import('../domain/timetableImport');
      const timetable =
        mosqueImportFormat === 'json'
          ? parseMosqueTimetableJson(mosqueImportPayload)
          : parseMosqueTimetableCsv(mosqueImportPayload, mosqueImportName.trim());
      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));
      updateSettings((current) => ({
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
  };

  const updatePrayerOffset = (prayer: PrayerName, rawValue: string) => {
    updateSettings((current) => {
      const nextAdjustments = { ...current.prayerAdjustments };
      if (rawValue.trim() === '') {
        Reflect.deleteProperty(nextAdjustments, prayer);
      } else {
        const value = Number(rawValue);
        if (!Number.isInteger(value) || value < -180 || value > 180) return current;
        nextAdjustments[prayer] = value;
      }
      return { ...current, prayerAdjustments: nextAdjustments };
    });
  };

  return (
    <section className="settings-feature-panel settings-advanced-panel">
      <div className="settings-subpanel mosque-library-controls">
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
                <h3>{translate(locale, prayerTranslationKeys[prayer])}</h3>
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
        <button
          type="button"
          onClick={() => {
            void importMosqueTimetable();
          }}
        >
          {translate(locale, 'importMosqueTimetable')}
        </button>
        {mosqueMessage !== null && (
          <p className="inline-message" role="status">
            {translate(locale, mosqueMessage)}
          </p>
        )}
      </div>

      <fieldset className="settings-subpanel offsets-fieldset">
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
            onClick={() => {
              updateSettings((current) => ({
                ...current,
                prayerAdjustments: resetManualPrayerAdjustments(),
              }));
            }}
          >
            {translate(locale, 'resetPrayerOffsets')}
          </button>
        </div>
      </fieldset>
    </section>
  );
}

export type SettingsNotificationRuntime = Readonly<{
  date: string | null;
  localMinutes: number | null;
  prayers: ReturnType<typeof applyPrayerSourceToDashboard>['prayers'] | readonly [];
}>;

export function useSettingsNotificationSynchronization(
  settings: PersistedSettings,
): SettingsNotificationRuntime {
  const errorLogger = useMemo(() => createStructuredErrorLogger(), []);
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const [syncRevision, setSyncRevision] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setNow(readSystemTime());
      setSyncRevision((current) => current + 1);
    };
    const timer = window.setInterval(() => {
      setNow(readSystemTime());
    }, 60_000);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refresh,
    );
    window.addEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
      window.removeEventListener(ANDROID_EXACT_ALARM_CAPABILITY_CHANGE_EVENT, refresh);
    };
  }, []);

  const dashboardResult = useMemo(() => {
    if (settings.location === null || now === null) return null;
    return buildPrayerDashboardResult({
      instant: now,
      coordinates: settings.location.coordinates,
      ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
      method: calculationMethods[settings.calculationMethodId],
      asrConvention: settings.asrConvention,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.prayerAdjustments,
      hijriCorrectionDays: settings.hijriCorrectionDays,
    });
  }, [now, settings]);
  const dashboard = dashboardResult?.ok === true ? dashboardResult.dashboard : null;
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

  useEffect(() => {
    if (dashboard === null) return;
    const inputs = buildNotificationPrayerInputs({
      dashboard,
      sourceMode: settings.prayerSourceMode,
      mosqueTimetable: settings.mosqueTimetable,
    });
    const intents = buildNotificationIntents(inputs, settings.notifications);
    const resolutions = resolveNotificationScheduleInstants(intents, dashboard.timeZone);
    void synchronizeAndroidPrayerNotifications(resolutions, settings.locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
    void synchronizeIosPrayerNotifications(resolutions, settings.locale).catch(() => {
      errorLogger.log('notification-scheduling-unavailable');
    });
  }, [
    dashboard?.today.date,
    dashboard?.tomorrow.date,
    dashboard?.timeZone,
    errorLogger,
    settings.locale,
    settings.mosqueTimetable,
    settings.notifications,
    settings.prayerSourceMode,
    syncRevision,
  ]);

  return {
    date: sourcedDashboard?.base.today.date ?? null,
    localMinutes: sourcedDashboard?.base.clock.localMinutes ?? null,
    prayers: sourcedDashboard?.prayers ?? [],
  };
}

export function NotificationAdhanSettingsPanel({
  settings,
  updateSettings,
  runtime,
}: SharedSettingsPanelProps & Readonly<{ runtime: SettingsNotificationRuntime }>) {
  const locale = settings.locale;

  return (
    <fieldset className="settings-feature-panel notification-fieldset">
      <legend>{translate(locale, 'notificationSettings')}</legend>
      <div className="notification-grid">
        {NOTIFICATION_PRAYERS.map((prayer) => {
          const preference = settings.notifications[prayer];
          return (
            <article className="notification-card" key={prayer}>
              <h2>{translate(locale, prayerTranslationKeys[prayer])}</h2>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={preference.enabled}
                  onChange={(event) => {
                    updateSettings((current) => ({
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
                    updateSettings((current) => ({
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
                    updateSettings((current) => ({
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
                    updateSettings((current) => ({
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
                    updateSettings((current) => ({
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
                    updateSettings((current) => ({
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
        date={runtime.date}
        localMinutes={runtime.localMinutes}
        prayers={runtime.prayers}
        notifications={settings.notifications}
      />
      <p className="setting-help">{translate(locale, 'adhanDeliveryPolicy')}</p>
      <AndroidExactAlarmNotice locale={locale} />
      <p className="setting-help">{translate(locale, 'notificationDeliveryPending')}</p>
    </fieldset>
  );
}
