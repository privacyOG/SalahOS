import type { SourcedPrayerDashboard } from '../domain/sourcedDashboard';
import type { PrayerName } from '../domain/prayerEngine';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  localeDirection,
  translate,
} from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import type { PersistedSettings } from '../platform/settingsStorage';
import { BidiText } from './BidiText';
import { NextPrayerBlock } from './NextPrayerBlock';
import { PrayerCard } from './PrayerCard';

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

export interface SmartDisplayProps {
  readonly locale: Locale;
  readonly currentClock: string;
  readonly dashboard: SourcedPrayerDashboard | null;
  readonly timeFormat: PersistedSettings['timeFormat'];
  readonly hijriCorrectionDays: number;
  readonly offline: boolean;
  readonly systemTimeUnavailable: boolean;
  readonly calculationUnavailable: boolean;
}

export function smartDisplayModeRequested(search: string): boolean {
  return new URLSearchParams(search).get('mode') === 'smart-display';
}

export function SmartDisplay({
  locale,
  currentClock,
  dashboard,
  timeFormat,
  hijriCorrectionDays,
  offline,
  systemTimeUnavailable,
  calculationUnavailable,
}: SmartDisplayProps) {
  const obligatoryPrayers = dashboard?.prayers.filter((prayer) => prayer.name !== 'sunrise') ?? [];

  return (
    <main
      className="smart-display"
      data-mode="smart-display"
      dir={localeDirection(locale)}
      lang={locale}
    >
      <header className="smart-display-header">
        <div className="smart-display-clock-block">
          <p className="eyebrow">{translate(locale, 'appName')}</p>
          <p className="smart-display-clock" aria-label={translate(locale, 'currentTime')}>
            {currentClock}
          </p>
          {dashboard !== null && (
            <div className="smart-display-dates">
              <span>{formatGregorianCivilDate(dashboard.base.civilDate, locale)}</span>
              <span>
                {formatHijriCivilDate(dashboard.base.civilDate, locale, hijriCorrectionDays)}
              </span>
            </div>
          )}
        </div>

        <NextPrayerBlock
          nextPrayerLabel={
            dashboard?.nextPrayer === null || dashboard === null
              ? null
              : translate(locale, prayerTranslationKeys[dashboard.nextPrayer])
          }
          countdown={
            dashboard?.secondsUntilNextPrayer === null || dashboard === null
              ? '—'
              : formatCountdown(dashboard.secondsUntilNextPrayer, locale)
          }
          tomorrow={dashboard?.nextPrayerDayOffset === 1}
          nextPrayerText={translate(locale, 'nextPrayer')}
          notConfiguredText={translate(locale, 'notConfigured')}
          tomorrowText={translate(locale, 'tomorrow')}
        />
      </header>

      {offline && (
        <p className="smart-display-status" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      {systemTimeUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(locale, 'systemTimeInvalid')}</strong>
          <span>{translate(locale, 'systemTimeInvalidHelp')}</span>
        </section>
      ) : calculationUnavailable ? (
        <section className="smart-display-empty" role="alert">
          <strong>{translate(locale, 'calculationUnavailable')}</strong>
          <span>{translate(locale, 'calculationUnavailableHelp')}</span>
        </section>
      ) : dashboard === null ? (
        <section className="smart-display-empty">
          <strong>{translate(locale, 'currentLocation')}</strong>
          <span>{translate(locale, 'notConfigured')}</span>
        </section>
      ) : (
        <>
          <section className="smart-display-prayers" aria-label={translate(locale, 'dailyPrayers')}>
            {obligatoryPrayers.map((prayer) => (
              <PrayerCard
                key={prayer.name}
                prayerName={translate(locale, prayerTranslationKeys[prayer.name])}
                isCurrent={prayer.isCurrent}
                isNext={prayer.isNext}
                isSupplementary={false}
                currentPrayerLabel={translate(locale, 'currentPrayer')}
                prayerStartLabel={translate(locale, 'prayerStart')}
                startTime={
                  prayer.localMinutes === null
                    ? '—'
                    : formatLocalTime(prayer.localMinutes, locale, timeFormat)
                }
                iqamahLabel={translate(locale, 'iqamah')}
                iqamahTime={
                  prayer.iqamahLocalMinutes === null
                    ? translate(locale, 'noIqamah')
                    : formatLocalTime(prayer.iqamahLocalMinutes, locale, timeFormat)
                }
              />
            ))}
          </section>

          {dashboard.jumuahSessions.length > 0 && (
            <section className="smart-display-jumuah" aria-label={translate(locale, 'jumuah')}>
              <p className="eyebrow">{translate(locale, 'jumuah')}</p>
              <div className="smart-display-jumuah-sessions">
                {dashboard.jumuahSessions.map((session) => (
                  <article key={session.label}>
                    <strong>
                      <BidiText>{session.label}</BidiText>
                    </strong>
                    <span>
                      {translate(locale, 'khutbah')}:{' '}
                      {formatLocalTime(session.khutbahLocalMinutes, locale, timeFormat)}
                    </span>
                    <span>
                      {translate(locale, 'salah')}:{' '}
                      {formatLocalTime(session.salahLocalMinutes, locale, timeFormat)}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}

          <footer className="smart-display-footer">
            <span>
              {translate(locale, 'calculationSource')}:{' '}
              {translate(locale, sourceTranslationKeys[dashboard.sourceMode])}
            </span>
            <span>
              {translate(locale, 'timezone')}: <BidiText>{dashboard.base.timeZone}</BidiText>
            </span>
            {dashboard.mosqueName !== null && (
              <span>
                {translate(locale, 'selectedMosque')}: <BidiText>{dashboard.mosqueName}</BidiText>
              </span>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
