import { useEffect, useMemo, useState } from 'react';

import '../today-contextual-v2.css';

import { buildPrayerDashboardResult } from '../domain/dashboardResult';
import { displayedHighLatitudeRuleApplied } from '../domain/highLatitudeIndicators';
import { calculationMethods } from '../domain/methods';
import { buildPrayerBoardData, type PrayerBoardData } from '../domain/prayerBoardTemplate';
import { isSupplementaryPrayer } from '../domain/prayerPresentation';
import { displayedManualPrayerAdjustmentMinutes } from '../domain/prayerAdjustments';
import type { PrayerName } from '../domain/prayerEngine';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  translate,
} from '../i18n/i18n';
import { todayContextCopy } from '../i18n/todayContextV2Translations';
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
import { TodayContextualSections } from './TodayContextualSections';
import { useMobilePrayerThemeConfig } from './MobilePrayerThemeSurface';
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

function formatPrayerBoardClock(
  clock: PrayerBoardData['clock'],
  locale: Locale,
  hourCycle: PersistedSettings['timeFormat'],
): string {
  const instant = new Date(Date.UTC(2000, 0, 1, clock.hour, clock.minute, clock.second));
  return new Intl.DateTimeFormat(localeClockTag(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle,
  }).format(instant);
}

function prayerBoardCivilDate(data: PrayerBoardData): Date {
  const value = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  if (!Number.isFinite(value.getTime())) {
    throw new RangeError('Prayer-board civil date is invalid');
  }
  return value;
}

export function TodayScreen() {
  const settings = useMemo(initialSettings, []);
  const mobileThemeConfig = useMobilePrayerThemeConfig();
  const modules = mobileThemeConfig.moduleVisibility;
  const locale = settings.locale;
  const contextualCopy = todayContextCopy[locale];
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
  const prayerBoardData = useMemo(
    () =>
      sourcedDashboard === null
        ? null
        : buildPrayerBoardData({
            dashboard: sourcedDashboard,
            offline: !online,
          }),
    [online, sourcedDashboard],
  );

  const currentClock =
    now === null
      ? '—'
      : prayerBoardData === null
        ? new Intl.DateTimeFormat(localeClockTag(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatPrayerBoardClock(prayerBoardData.clock, locale, settings.timeFormat);

  const nextPrayerLabel =
    prayerBoardData?.nextPrayer === null || prayerBoardData?.nextPrayer === undefined
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[prayerBoardData.nextPrayer.name]);
  const nextPrayerStart =
    prayerBoardData?.nextPrayer === null || prayerBoardData?.nextPrayer === undefined
      ? '—'
      : formatLocalTime(prayerBoardData.nextPrayer.startLocalMinutes, locale, settings.timeFormat);
  const nextPrayerIqamahMinutes = prayerBoardData?.nextPrayer?.iqamahLocalMinutes ?? null;
  const nextPrayerIqamah =
    nextPrayerIqamahMinutes === null
      ? translate(locale, 'noIqamah')
      : formatLocalTime(nextPrayerIqamahMinutes, locale, settings.timeFormat);
  const contextLabel =
    prayerBoardData?.mosqueName ??
    prayerBoardData?.timeZone ??
    settings.location?.timeZone ??
    translate(locale, 'notConfigured');
  const quickLabels = destinationLabels[locale];

  return (
    <main
      className="today-screen"
      data-prayer-board-data-version={prayerBoardData?.version}
      data-prayer-board-source={prayerBoardData?.sourceMode}
      data-mobile-module-dates={modules.dates ? 'visible' : 'hidden'}
      data-mobile-module-jumuah={modules.jumuah ? 'visible' : 'hidden'}
      data-mobile-module-sunrise-sunset={modules['sunrise-sunset'] ? 'visible' : 'hidden'}
      data-mobile-module-mosque-branding={modules['mosque-branding'] ? 'visible' : 'hidden'}
      data-mobile-module-announcements={modules.announcements ? 'visible' : 'hidden'}
    >
      {prayerBoardData?.offline === true && (
        <p className="today-screen__offline" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      <header className="today-appbar">
        <div className="today-appbar__brand">
          <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>{translate(locale, 'appName')}</strong>
            {modules['mosque-branding'] && (
              <span>
                <BidiText>{contextLabel}</BidiText>
              </span>
            )}
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
      ) : prayerBoardData === null || sourcedDashboard === null ? (
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
              {prayerBoardData.nextPrayer?.dayOffset === 1 && (
                <span className="today-next__tomorrow">{translate(locale, 'tomorrow')}</span>
              )}
            </div>
            <div className="today-next__countdown">
              <span>{translate(locale, 'countdown')}</span>
              <strong>
                {prayerBoardData.nextPrayer === null
                  ? '—'
                  : formatCountdown(prayerBoardData.nextPrayer.secondsUntil, locale)}
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

          {modules.dates && (
            <section className="today-dates" aria-label={translate(locale, 'today')}>
              <div>
                <span>{translate(locale, 'gregorianDate')}</span>
                <strong>
                  {formatGregorianCivilDate(prayerBoardCivilDate(prayerBoardData), locale)}
                </strong>
              </div>
              <div>
                <span>{translate(locale, 'hijriDate')}</span>
                <strong>
                  {formatHijriCivilDate(
                    prayerBoardCivilDate(prayerBoardData),
                    locale,
                    prayerBoardData.hijri.correctionDays,
                  )}
                </strong>
              </div>
            </section>
          )}

          <section className="today-schedule" aria-labelledby="today-schedule-title">
            <div className="today-section-heading">
              <div>
                <p>{translate(locale, 'today')}</p>
                <h2 id="today-schedule-title">{translate(locale, 'dailyPrayers')}</h2>
              </div>
              <span>
                {translate(locale, 'sourceMode')} ·{' '}
                {translate(locale, sourceTranslationKeys[prayerBoardData.sourceMode])}
              </span>
            </div>

            <div
              className="today-prayer-table"
              role="table"
              aria-label={translate(locale, 'dailyPrayers')}
            >
              <div className="today-prayer-row today-prayer-row--header" role="row">
                <span role="columnheader">{translate(locale, 'dailyPrayers')}</span>
                <span role="columnheader">{translate(locale, 'prayerStart')}</span>
                <span role="columnheader">{translate(locale, 'iqamah')}</span>
              </div>
              {prayerBoardData.prayers
                .filter((prayer) => !isSupplementaryPrayer(prayer.name))
                .map((prayer) => {
                  const sourcePrayer = sourcedDashboard.prayers.find(
                    (candidate) => candidate.name === prayer.name,
                  );
                  const manualAdjustmentMinutes =
                    sourcePrayer === undefined
                      ? null
                      : displayedManualPrayerAdjustmentMinutes(
                          prayer.name,
                          sourcePrayer.manualAdjustmentMinutes,
                          prayerBoardData.sourceMode,
                        );
                  const highLatitudeApplied =
                    sourcePrayer === undefined
                      ? false
                      : displayedHighLatitudeRuleApplied(
                          prayer.name,
                          sourcePrayer.highLatitudeRuleApplied,
                          prayerBoardData.sourceMode,
                        );
                  const stateLabel = prayer.isCurrent
                    ? translate(locale, 'currentPrayer')
                    : prayer.isNext
                      ? translate(locale, 'nextPrayer')
                      : null;
                  return (
                    <div
                      className={`today-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
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
                            {translate(locale, 'manualOffset')}{' '}
                            {manualAdjustmentMinutes > 0 ? '+' : ''}
                            {String(manualAdjustmentMinutes)} {translate(locale, 'minutesShort')}
                          </small>
                        )}
                      </div>
                      <strong className="today-prayer-row__time" role="cell">
                        {prayer.startLocalMinutes === null
                          ? '—'
                          : formatLocalTime(prayer.startLocalMinutes, locale, settings.timeFormat)}
                      </strong>
                      <strong className="today-prayer-row__time today-prayer-row__iqamah" role="cell">
                        {prayer.iqamahLocalMinutes === null
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
          </section>

          {modules['sunrise-sunset'] && (
            <section className="today-solar" aria-labelledby="today-solar-title">
              <div className="today-section-heading">
                <div>
                  <p>{contextualCopy.solarEyebrow}</p>
                  <h2 id="today-solar-title">{contextualCopy.solarTitle}</h2>
                </div>
              </div>
              <div className="today-solar__times">
                <div>
                  <span>{translate(locale, 'prayerSunrise')}</span>
                  <strong>
                    {prayerBoardData.solarEvents.sunriseLocalMinutes === null
                      ? '—'
                      : formatLocalTime(
                          prayerBoardData.solarEvents.sunriseLocalMinutes,
                          locale,
                          settings.timeFormat,
                        )}
                  </strong>
                </div>
                <div>
                  <span>{contextualCopy.sunset}</span>
                  <strong>
                    {prayerBoardData.solarEvents.sunsetLocalMinutes === null
                      ? '—'
                      : formatLocalTime(
                          prayerBoardData.solarEvents.sunsetLocalMinutes,
                          locale,
                          settings.timeFormat,
                        )}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {modules.jumuah && prayerBoardData.jumuahSessions.length > 0 && (
            <section className="today-jumuah" aria-labelledby="today-jumuah-title">
              <div className="today-section-heading">
                <div>
                  <p>{translate(locale, 'today')}</p>
                  <h2 id="today-jumuah-title">{translate(locale, 'jumuah')}</h2>
                </div>
              </div>
              <div className="today-jumuah__sessions">
                {prayerBoardData.jumuahSessions.map((session) => (
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

          <TodayContextualSections
            settings={settings}
            dashboard={sourcedDashboard}
            unavailablePrayers={unavailablePrayers}
            online={!prayerBoardData.offline}
            now={now}
            communityHref={destinationHref('community')}
            mosquesHref={destinationHref('mosques')}
            showCommunity={modules.announcements}
          />

          <nav className="today-quick-actions" aria-label={translate(locale, 'today')}>
            <a href={destinationHref('qiblah')}>{quickLabels.qiblah}</a>
            <a href={destinationHref('mosques')}>{quickLabels.mosques}</a>
            <a href={destinationHref('settings')}>{quickLabels.settings}</a>
          </nav>

          <footer className="today-provenance">
            <span>
              {translate(locale, 'method')}:{' '}
              <BidiText>{sourcedDashboard.base.method.name}</BidiText>
            </span>
            <span>
              {translate(locale, 'timezone')}: <BidiText>{prayerBoardData.timeZone}</BidiText>
            </span>
            {modules['mosque-branding'] && prayerBoardData.mosqueName !== null && (
              <span>
                {translate(locale, 'selectedMosque')}:{' '}
                <BidiText>{prayerBoardData.mosqueName}</BidiText>
              </span>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
