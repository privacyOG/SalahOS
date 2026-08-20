import { useEffect, useState } from 'react';

import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { calculationMethods } from '../domain/methods';
import { mosqueDayForDate, taraweehSessionsForDate } from '../domain/mosqueTimetable';
import type { TaraweehSession } from '../domain/mosqueTimetable';
import { formatLocalTime } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { taraweehCopy } from '../i18n/featureTranslations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings, type PersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = taraweehCopy;

export interface TaraweehPanelModel {
  readonly mosqueName: string;
  readonly date: string;
  readonly sessions: readonly TaraweehSession[];
}

function readSettings(): PersistedSettings {
  return loadPersistedSettings(getApplicationStorage());
}

export function buildTaraweehPanelModel(
  settings: PersistedSettings,
  instant: Date,
): TaraweehPanelModel | null {
  if (
    settings.prayerSourceMode !== 'local-mosque' ||
    settings.location === null ||
    settings.mosqueTimetable === null
  ) {
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

  const date = dashboardResult.dashboard.today.date;
  const mosqueDay = mosqueDayForDate(settings.mosqueTimetable, date);
  if (mosqueDay === null) {
    return null;
  }

  const sessions = taraweehSessionsForDate(mosqueDay);
  if (sessions.length === 0) {
    return null;
  }

  return Object.freeze({
    mosqueName: settings.mosqueTimetable.mosqueName,
    date,
    sessions,
  });
}

export function TaraweehPanel() {
  const [settings, setSettings] = useState(readSettings);
  const [instant, setInstant] = useState(() => new Date());
  const locale: Locale = settings.locale;
  const text = copy[locale];
  const panel = buildTaraweehPanelModel(settings, instant);

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

  if (panel === null || smartDisplayModeRequested(window.location.search)) {
    return null;
  }

  return (
    <section
      className="taraweeh-panel"
      aria-labelledby="taraweeh-panel-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="taraweeh-panel-heading">
        <div>
          <p className="taraweeh-panel-eyebrow">{text.eyebrow}</p>
          <h2 id="taraweeh-panel-title">{text.title}</h2>
        </div>
        <div className="taraweeh-panel-mosque">
          <span>{text.source}</span>
          <strong>{panel.mosqueName}</strong>
        </div>
      </div>

      <div className="taraweeh-session-grid">
        {panel.sessions.map((session, index) => (
          <article className="taraweeh-session" key={`${session.label}-${String(index)}`}>
            <span>{session.label}</span>
            <strong dir="ltr">
              {formatLocalTime(session.startLocalMinutes, locale, settings.timeFormat)}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}
