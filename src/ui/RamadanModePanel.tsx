import { useEffect, useState } from 'react';

import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import { deriveRamadanMode } from '../domain/ramadan';
import {
  buildRamadanFastTimes,
  RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES,
} from '../domain/ramadanTimes';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { formatLocalTime } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { ramadanModeCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings, type PersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = ramadanModeCopy;

export interface RamadanPanelModel {
  readonly ramadan: ReturnType<typeof deriveRamadanMode>;
  readonly imsakLocalMinutes: number | null;
  readonly suhurEndsAtLocalMinutes: number | null;
  readonly iftarLocalMinutes: number | null;
}

function readSettings(): PersistedSettings {
  return loadPersistedSettings(getApplicationStorage());
}

export function buildRamadanPanelModel(
  settings: PersistedSettings,
  instant: Date,
): RamadanPanelModel | null {
  if (settings.location === null) {
    return null;
  }

  const dashboardResult = buildPrayerDashboardResult({
    instant,
    coordinates: settings.location.coordinates,
    ...(settings.location.timeZone === undefined ? {} : { timeZone: settings.location.timeZone }),
    method: calculationMethods[settings.calculationMethodId],
    asrConvention: settings.asrConvention,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.prayerAdjustments,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  });

  if (!dashboardResult.ok) {
    return null;
  }

  const ramadan = deriveRamadanMode(dashboardResult.dashboard.hijri);
  const sourcedDashboard = applyPrayerSourceToDashboard({
    dashboard: dashboardResult.dashboard,
    sourceMode: settings.prayerSourceMode,
    mosqueTimetable: settings.mosqueTimetable,
  });
  const displayedFajr = sourcedDashboard.prayers.find((prayer) => prayer.name === 'fajr');
  const displayedMaghrib = sourcedDashboard.prayers.find((prayer) => prayer.name === 'maghrib');
  const fastTimes = buildRamadanFastTimes({
    displayedFajrLocalMinutes: displayedFajr?.localMinutes ?? null,
    displayedMaghribLocalMinutes: displayedMaghrib?.localMinutes ?? null,
    imsakOffsetMinutes: RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES,
  });

  return Object.freeze({
    ramadan,
    imsakLocalMinutes: fastTimes.imsakLocalMinutes,
    suhurEndsAtLocalMinutes: fastTimes.suhurEndsAtLocalMinutes,
    iftarLocalMinutes: fastTimes.iftarLocalMinutes,
  });
}

export function RamadanModePanel() {
  const [settings, setSettings] = useState(readSettings);
  const [instant, setInstant] = useState(() => new Date());
  const locale: Locale = settings.locale;
  const text = copy[locale];
  const panel = buildRamadanPanelModel(settings, instant);
  const active = panel?.ramadan.active === true;

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
      setSettings(readSettings());
      setInstant(new Date());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const timer = window.setInterval(() => {
      setInstant(new Date());
    }, 60_000);

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (panel?.ramadan.active !== true || smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  const formatTime = (localMinutes: number | null) =>
    localMinutes === null
      ? text.unavailable
      : formatLocalTime(localMinutes, locale, settings.timeFormat);

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
          {text.day} {panel.ramadan.ramadanDay}
        </h2>
        <p>{text.message}</p>
        <small>{text.source}</small>

        <div className="ramadan-fast-times" aria-label={text.eyebrow}>
          <div className="ramadan-fast-time">
            <span>{text.imsak}</span>
            <strong dir="ltr">{formatTime(panel.imsakLocalMinutes)}</strong>
            <small>{text.imsakDetail}</small>
          </div>
          <div className="ramadan-fast-time">
            <span>{text.suhur}</span>
            <strong dir="ltr">{formatTime(panel.suhurEndsAtLocalMinutes)}</strong>
          </div>
          <div className="ramadan-fast-time">
            <span>{text.iftar}</span>
            <strong dir="ltr">{formatTime(panel.iftarLocalMinutes)}</strong>
          </div>
        </div>
        <small className="ramadan-fast-guidance">{text.guidance}</small>
      </div>
      <strong className="ramadan-mode-year" dir="ltr">
        {panel.ramadan.hijriYear} {text.yearSuffix}
      </strong>
    </section>
  );
}
