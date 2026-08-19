import { useEffect, useState, type ChangeEvent } from 'react';

import { calendarDate } from '../domain/calendar';
import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { createLocationPrayerContext } from '../domain/locationPrayerContext';
import { calculationMethods } from '../domain/methods';
import type { PrayerSourceMode } from '../domain/mosqueTimetable';
import { deriveRamadanMode } from '../domain/ramadan';
import { deriveRamadanMealTimes, type RamadanMealTimes } from '../domain/ramadanMealTimes';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { formatLocalTime } from '../i18n/i18n';
import { ramadanTranslations, type RamadanTranslationCopy } from '../i18n/ramadanTranslations';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  RAMADAN_IMSAK_OFFSET_OPTIONS,
  loadRamadanPresentationPreferences,
  saveRamadanPresentationPreferences,
  type RamadanImsakOffset,
  type RamadanPresentationPreferences,
} from '../platform/ramadanPresentationPreferences';
import { loadPersistedSettings, type PersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

function readPanelState(): PersistedSettings {
  return loadPersistedSettings(getApplicationStorage());
}

function readPresentationPreferences(): RamadanPresentationPreferences {
  return loadRamadanPresentationPreferences(getApplicationStorage());
}

export function RamadanModePanel() {
  const [panelState, setPanelState] = useState(readPanelState);
  const [presentationPreferences, setPresentationPreferences] = useState(
    readPresentationPreferences,
  );
  const [instant, setInstant] = useState(() => new Date());
  const locale: Locale = panelState.locale;
  const text = ramadanTranslations[locale];
  const ramadan = getCurrentRamadanMode(panelState, instant);
  const mealTimes = getCurrentRamadanMealTimes(
    panelState,
    instant,
    presentationPreferences.imsakMinutesBeforeFajr,
  );
  const active = ramadan?.active === true;

  useEffect(() => {
    if (active) {
      document.documentElement.dataset.ramadanMode = 'active';
    } else {
      delete document.documentElement.dataset.ramadanMode;
    }

    return () => {
      delete document.documentElement.dataset.ramadanMode;
    };
  }, [active]);

  useEffect(() => {
    const refresh = () => {
      setPanelState(readPanelState());
      setPresentationPreferences(readPresentationPreferences());
      setInstant(new Date());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const timer = window.setInterval(refresh, 1_000);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (ramadan?.active !== true || smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  const handleImsakOffsetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;
    const imsakMinutesBeforeFajr = value === 'none' ? null : (Number(value) as RamadanImsakOffset);
    const nextPreferences: RamadanPresentationPreferences = {
      version: 1,
      imsakMinutesBeforeFajr,
    };

    setPresentationPreferences(nextPreferences);
    saveRamadanPresentationPreferences(getApplicationStorage(), nextPreferences);
  };

  return (
    <section
      className="ramadan-mode-panel"
      aria-labelledby="ramadan-mode-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="ramadan-mode-symbol" aria-hidden="true">
        ☾
      </div>
      <div className="ramadan-mode-copy">
        <p className="ramadan-mode-eyebrow">{text.eyebrow}</p>
        <h2 id="ramadan-mode-title">
          {text.day} {ramadan.ramadanDay}
        </h2>
        <p>{text.message}</p>
        <small>{text.source}</small>
      </div>
      <strong className="ramadan-mode-year" dir="ltr">
        {ramadan.hijriYear} {text.yearSuffix}
      </strong>

      <div className="ramadan-meal-grid">
        <RamadanMealTimeCard
          label={text.suhurEnd}
          localMinutes={mealTimes?.suhurEnd.localMinutes ?? null}
          help={text.suhurHelp}
          source={mealTimes?.suhurEnd.source ?? panelState.prayerSourceMode}
          locale={locale}
          timeFormat={panelState.timeFormat}
          text={text}
        />
        <RamadanMealTimeCard
          label={text.iftar}
          localMinutes={mealTimes?.iftar.localMinutes ?? null}
          help={text.iftarHelp}
          source={mealTimes?.iftar.source ?? panelState.prayerSourceMode}
          locale={locale}
          timeFormat={panelState.timeFormat}
          text={text}
        />
        <article className="ramadan-meal-card ramadan-imsak-card">
          <div className="ramadan-meal-card-heading">
            <span>{text.optionalImsak}</span>
            <strong dir="ltr">
              {formatMealTime(
                mealTimes?.imsak.localMinutes ?? null,
                locale,
                panelState.timeFormat,
                text,
              )}
            </strong>
          </div>
          <label className="ramadan-imsak-control">
            <span>{text.imsakOffset}</span>
            <select
              value={presentationPreferences.imsakMinutesBeforeFajr ?? 'none'}
              onChange={handleImsakOffsetChange}
            >
              <option value="none">{text.noExtraImsak}</option>
              {RAMADAN_IMSAK_OFFSET_OPTIONS.map((offset) => (
                <option key={offset} value={offset}>
                  {offset} {text.minutesBeforeFajr}
                </option>
              ))}
            </select>
          </label>
          <small>{text.imsakHelp}</small>
          <small>{text.savedLocally}</small>
        </article>
      </div>
    </section>
  );
}

interface RamadanMealTimeCardProps {
  readonly label: string;
  readonly localMinutes: number | null;
  readonly help: string;
  readonly source: PrayerSourceMode;
  readonly locale: Locale;
  readonly timeFormat: PersistedSettings['timeFormat'];
  readonly text: RamadanTranslationCopy;
}

export function RamadanMealTimeCard({
  label,
  localMinutes,
  help,
  source,
  locale,
  timeFormat,
  text,
}: RamadanMealTimeCardProps) {
  return (
    <article className="ramadan-meal-card">
      <div className="ramadan-meal-card-heading">
        <span>{label}</span>
        <strong dir="ltr">{formatMealTime(localMinutes, locale, timeFormat, text)}</strong>
      </div>
      <small>{help}</small>
      <small className="ramadan-meal-source">{sourceLabel(source, text)}</small>
    </article>
  );
}

function formatMealTime(
  localMinutes: number | null,
  locale: Locale,
  timeFormat: PersistedSettings['timeFormat'],
  text: RamadanTranslationCopy,
): string {
  return localMinutes === null
    ? text.unavailable
    : formatLocalTime(localMinutes, locale, timeFormat);
}

function sourceLabel(source: PrayerSourceMode, text: RamadanTranslationCopy): string {
  switch (source) {
    case 'local-mosque':
      return text.mosqueSource;
    case 'calculated-adjustments':
      return text.adjustedSource;
    case 'calculated':
      return text.calculatedSource;
  }
}

function getCurrentRamadanMode(
  panelState: PersistedSettings,
  instant: Date,
): ReturnType<typeof deriveRamadanMode> | null {
  if (panelState.location === null) {
    return null;
  }

  const context = createLocationPrayerContext(
    instant,
    panelState.location.coordinates,
    panelState.location.timeZone,
  );
  const hijri = calendarDate(context.civilDate, panelState.hijriCorrectionDays).hijri;
  return deriveRamadanMode(hijri);
}

function getCurrentRamadanMealTimes(
  panelState: PersistedSettings,
  instant: Date,
  imsakMinutesBeforeFajr: RamadanImsakOffset | null,
): RamadanMealTimes | null {
  if (panelState.location === null) {
    return null;
  }

  const dashboardInput = {
    instant,
    coordinates: panelState.location.coordinates,
    method: calculationMethods[panelState.calculationMethodId],
    asrConvention: panelState.asrConvention,
    highLatitudeRule: panelState.highLatitudeRule,
    adjustments: panelState.prayerAdjustments,
    hijriCorrectionDays: panelState.hijriCorrectionDays,
    ...(panelState.location.timeZone === undefined
      ? {}
      : { timeZone: panelState.location.timeZone }),
  };
  const dashboardResult = buildPrayerDashboardResult(dashboardInput);

  if (!dashboardResult.ok) {
    return null;
  }

  try {
    const sourced = applyPrayerSourceToDashboard({
      dashboard: dashboardResult.dashboard,
      sourceMode: panelState.prayerSourceMode,
      mosqueTimetable: panelState.mosqueTimetable,
    });
    const fajr = sourced.prayers.find((prayer) => prayer.name === 'fajr');
    const maghrib = sourced.prayers.find((prayer) => prayer.name === 'maghrib');

    if (fajr === undefined || maghrib === undefined) {
      return null;
    }

    return deriveRamadanMealTimes({
      fajr: { localMinutes: fajr.localMinutes, source: fajr.source },
      maghrib: { localMinutes: maghrib.localMinutes, source: maghrib.source },
      imsakMinutesBeforeFajr,
    });
  } catch {
    return null;
  }
}
