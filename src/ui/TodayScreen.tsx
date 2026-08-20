import { useEffect, useMemo, useState } from 'react';

import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { displayedHighLatitudeRuleApplied } from '../domain/highLatitudeIndicators';
import { calculationMethods } from '../domain/methods';
import { isSupplementaryPrayer } from '../domain/prayerPresentation';
import { displayedManualPrayerAdjustmentMinutes } from '../domain/prayerAdjustments';
import type { PrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  formatZonedInstantTime,
  translate,
} from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { installRuntimeRefreshListeners } from '../platform/runtimeRefresh';
import {
  defaultPersistedSettings,
  loadPersistedSettings,
  type PersistedSettings,
} from '../platform/settingsStorage';
import { readSystemTime } from '../platform/systemTime';
import { BidiText } from './BidiText';
import { searchForCongregationDestination, type CongregationDestination } from './applicationRoute';

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

const destinationLabels: Readonly<
  Record<Locale, Readonly<Record<'mosques' | 'qiblah' | 'settings', string>>>
> = {
  en: { mosques: 'Mosques', qiblah: 'Qiblah', settings: 'Settings' },
  ar: { mosques: 'المساجد', qiblah: 'القبلة', settings: 'الإعدادات' },
  tr: { mosques: 'Camiler', qiblah: 'Kıble', settings: 'Ayarlar' },
  id: { mosques: 'Masjid', qiblah: 'Kiblat', settings: 'Pengaturan' },
};

function initialSettings(): PersistedSettings {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function destinationHref(destination: CongregationDestination): string {
  const search = searchForCongregationDestination(window.location.search, destination);
  return `${window.location.pathname}${search}${window.location.hash}`;
}

function localeClockTag(locale: Locale): string {
  switch (locale) {
    case 'ar':
      return 'ar';
    case 'tr':
      return 'tr-TR';
    case 'id':
      return 'id-ID';
    case 'en':
    default:
      return 'en-AU';
  }
}

export function TodayScreen() {
  const settings = useMemo(initialSettings, []);
  const locale = settings.locale;
  const coordinates = settings.location?.coordinates ?? null;
  const timeZoneOverride = settings.location?.timeZone ?? null;
  const [now, setNow] = useState<Date | null>(() => readSystemTime());
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const refreshNow = () => {
      setNow(readSystemTime());
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

  const currentClock =
    now === null
      ? '—'
      : dashboard === null
        ? new Intl.DateTimeFormat(localeClockTag(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);

  const nextPrayerRow =
    sourcedDashboard?.nextPrayer === null || sourcedDashboard?.nextPrayer === undefined
      ? null
      : (sourcedDashboard.prayers.find(
          (prayer) => prayer.name === sourcedDashboard.nextPrayer,
        ) ?? null);
  const nextPrayerLabel =
    sourcedDashboard?.nextPrayer === null || sourcedDashboard?.nextPrayer === undefined
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer]);
  const nextPrayerStart =
    sourcedDashboard?.nextPrayerLocalMinutes === null ||
    sourcedDashboard?.nextPrayerLocalMinutes === undefined
      ? '—'
      : formatLocalTime(sourcedDashboard.nextPrayerLocalMinutes, locale, settings.timeFormat);
  const nextPrayerIqamahMinutes =
    sourcedDashboard?.nextPrayerDayOffset === 0 && nextPrayerRow !== null
      ? nextPrayerRow.iqamahLocalMinutes
      : null;
  const nextPrayerIqamah =
    nextPrayerIqamahMinutes === null
      ? translate(locale, 'noIqamah')
      : formatLocalTime(nextPrayerIqamahMinutes, locale, settings.timeFormat);
  const contextLabel =
    sourcedDashboard?.mosqueName ?? settings.location?.timeZone ?? translate(locale, 'notConfigured');
  const quickLabels = destinationLabels[locale];

  return (
    <main className="today-screen">
      {!online && (
        <p className="today-screen__offline" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      <header className="today-appbar">
        <div className="today-appbar__brand">
          <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>{translate(locale, 'appName')}</strong>
            <span>
              <BidiText>{contextLabel}</BidiText>
            </span>
          </div>
        </div>
        <div className="today-appbar__meta">
          <span className="today-appbar__clock" aria-label={translate(locale, 'currentTime')}>
            {currentClock}
          </span>
          <a href={destinationHref('settings')} aria-label={translate(locale, 'language')}>
            {locale.toUpperCase()}
          </a>
        </div>
      </header>

      {now === null ? (
        <section className="today-state" role="alert">
          <p>{translate(locale, 'currentTime')}</p>
          <h1>{translate(locale, 'systemTimeInvalid')}</h1>
          <span>{translate(locale, 'systemTimeInvalidHelp')}</span>
        </section>
      ) : calculationUnavailable ? (
        <section className="today-state" role="alert">
          <p>{translate(locale, 'dailyPrayers')}</p>
          <h1>{translate(locale, 'calculationUnavailable')}</h1>
          <span>{translate(locale, 'calculationUnavailableHelp')}</span>
        </section>
      ) : sourcedDashboard === null ? (
        <section className="today-state">
          <p>{translate(locale, 'currentLocation')}</p>
          <h1>{translate(locale, 'configureLocation')}</h1>
          <a className="today-state__action" href={destinationHref('settings')}>
            {translate(locale, 'settings')}
          </a>
        </section>
      ) : (
        <>
          <section className="today-next" aria-labelledby="today-next-prayer">
            <div className="today-next__identity">
              <p>{translate(locale, 'nextPrayer')}</p>
              <h1 id="today-next-prayer">{nextPrayerLabel}</h1>
              {sourcedDashboard.nextPrayerDayOffset === 1 && (
                <span className="today-next__tomorrow">{translate(locale, 'tomorrow')}</span>
              )}
            </div>
            <div className="today-next__countdown">
              <span>{translate(locale, 'countdown')}</span>
              <strong>
                {sourcedDashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(sourcedDashboard.secondsUntilNextPrayer, locale)}
              </strong>
            </div>
            <dl className="today-next__times">
              <div>
                <dt>{translate(locale, 'prayerStart')}</dt>
                <dd>{nextPrayerStart}</dd>
              </div>
              <div>
                <dt>{translate(locale, 'iqamah')}</dt>
                <dd>{nextPrayerIqamah}</dd>
              </div>
            </dl>
          </section>

          <section className="today-dates" aria-label={translate(locale, 'today')}>
            <div>
              <span>{translate(locale, 'gregorianDate')}</span>
              <strong>{formatGregorianCivilDate(sourcedDashboard.base.civilDate, locale)}</strong>
            </div>
            <div>
              <span>{translate(locale, 'hijriDate')}</span>
              <strong>
                {formatHijriCivilDate(
                  sourcedDashboard.base.civilDate,
                  locale,
                  settings.hijriCorrectionDays,
                )}
              </strong>
            </div>
          </section>

          <section className="today-schedule" aria-labelledby="today-schedule-title">
            <div className="today-section-heading">
              <div>
                <p>{translate(locale, 'today')}</p>
                <h2 id="today-schedule-title">{translate(locale, 'dailyPrayers')}</h2>
              </div>
              <span>
                {translate(locale, 'sourceMode')} ·{' '}
                {translate(locale, sourceTranslationKeys[sourcedDashboard.sourceMode])}
              </span>
            </div>

            <div className="today-prayer-table" role="table" aria-label={translate(locale, 'dailyPrayers')}>
              <div className="today-prayer-row today-prayer-row--header" role="row">
                <span role="columnheader">{translate(locale, 'dailyPrayers')}</span>
                <span role="columnheader">{translate(locale, 'prayerStart')}</span>
                <span role="columnheader">{translate(locale, 'iqamah')}</span>
              </div>
              {sourcedDashboard.prayers.map((prayer) => {
                const supplementary = isSupplementaryPrayer(prayer.name);
                const manualAdjustmentMinutes = displayedManualPrayerAdjustmentMinutes(
                  prayer.name,
                  prayer.manualAdjustmentMinutes,
                  sourcedDashboard.sourceMode,
                );
                const highLatitudeApplied = displayedHighLatitudeRuleApplied(
                  prayer.name,
                  prayer.highLatitudeRuleApplied,
                  sourcedDashboard.sourceMode,
                );
                const stateLabel = prayer.isCurrent
                  ? translate(locale, 'currentPrayer')
                  : prayer.isNext
                    ? translate(locale, 'nextPrayer')
                    : null;
                return (
                  <div
                    className={`today-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}${supplementary ? ' is-supplementary' : ''}`}
                    role="row"
                    key={prayer.name}
                  >
                    <div className="today-prayer-row__name" role="cell">
                      <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                      {stateLabel !== null && <span>{stateLabel}</span>}
                      {highLatitudeApplied && (
                        <small>
                          {translate(locale, 'highLatitudeAdjustment')} ·{' '}
                          {translate(
                            locale,
                            highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule],
                          )}
                        </small>
                      )}
                      {manualAdjustmentMinutes !== null && (
                        <small>
                          {translate(locale, 'manualOffset')} {manualAdjustmentMinutes > 0 ? '+' : ''}
                          {String(manualAdjustmentMinutes)} {translate(locale, 'minutesShort')}
                        </small>
                      )}
                    </div>
                    <strong className="today-prayer-row__time" role="cell">
                      {prayer.localMinutes === null
                        ? '—'
                        : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}
                    </strong>
                    <strong className="today-prayer-row__time today-prayer-row__iqamah" role="cell">
                      {supplementary
                        ? '—'
                        : prayer.iqamahLocalMinutes === null
                          ? translate(locale, 'noIqamah')
                          : formatLocalTime(
                              prayer.iqamahLocalMinutes,
                              locale,
                              settings.timeFormat,
                            )}
                    </strong>
                  </div>
                );
              })}
            </div>

            {unavailablePrayers.length > 0 && (
              <p className="today-schedule__notice" role="status">
                {translate(locale, 'somePrayerTimesUnavailable')}
              </p>
            )}
          </section>

          {sourcedDashboard.jumuahSessions.length > 0 && (
            <section className="today-jumuah" aria-labelledby="today-jumuah-title">
              <div className="today-section-heading">
                <div>
                  <p>{translate(locale, 'today')}</p>
                  <h2 id="today-jumuah-title">{translate(locale, 'jumuah')}</h2>
                </div>
              </div>
              <div className="today-jumuah__sessions">
                {sourcedDashboard.jumuahSessions.map((session) => (
                  <div key={session.label}>
                    <strong>
                      <BidiText>{session.label}</BidiText>
                    </strong>
                    <span>
                      {translate(locale, 'khutbah')} ·{' '}
                      {formatLocalTime(session.khutbahLocalMinutes, locale, settings.timeFormat)}
                    </span>
                    <span>
                      {translate(locale, 'salah')} ·{' '}
                      {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <nav className="today-quick-actions" aria-label={translate(locale, 'today')}>
            <a href={destinationHref('qiblah')}>{quickLabels.qiblah}</a>
            <a href={destinationHref('mosques')}>{quickLabels.mosques}</a>
            <a href={destinationHref('settings')}>{quickLabels.settings}</a>
          </nav>

          <footer className="today-provenance">
            <span>
              {translate(locale, 'method')}: <BidiText>{sourcedDashboard.base.method.name}</BidiText>
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
          </footer>
        </>
      )}
    </main>
  );
}
