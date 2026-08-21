import type { PrayerBoardData, PrayerBoardTimeFormat } from '../domain/prayerBoardTemplate';
import type { PrayerName } from '../domain/prayerEngine';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  translate,
} from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { BidiText } from './BidiText';

import '../heritage-classic.css';

const prayerTranslationKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

const sourceTranslationKeys: Readonly<Record<PrayerBoardData['sourceMode'], TranslationKey>> = {
  calculated: 'sourceCalculated',
  'calculated-adjustments': 'sourceCalculatedAdjustments',
  'local-mosque': 'sourceLocalMosque',
};

export interface HeritageClassicPrayerBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly displayTheme: SmartDisplayThemeId;
}

function displayTime(
  minutes: number | null,
  locale: Locale,
  timeFormat: PrayerBoardTimeFormat,
): string {
  return minutes === null ? '—' : formatLocalTime(minutes, locale, timeFormat);
}

export function HeritageClassicPrayerBoard({
  data,
  locale,
  timeFormat,
  displayTheme,
}: HeritageClassicPrayerBoardProps) {
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const nextPrayer = data.nextPrayer;
  const nextPrayerLabel =
    nextPrayer === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[nextPrayer.name]);

  return (
    <div
      className="heritage-classic-board"
      data-prayer-board-template="heritage-classic"
      data-heritage-variant={displayTheme}
    >
      <div className="heritage-classic-board__pattern" aria-hidden="true" />

      <header className="heritage-classic-board__masthead">
        <div className="heritage-classic-board__brand">
          <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
          <div>
            <span>SalahOS</span>
            {data.mosqueName !== null && (
              <strong>
                <BidiText>{data.mosqueName}</BidiText>
              </strong>
            )}
          </div>
        </div>

        <div className="heritage-classic-board__dates">
          <span>{formatGregorianCivilDate(civilDate, locale)}</span>
          <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
        </div>
      </header>

      {data.offline && (
        <p className="heritage-classic-board__status" role="status">
          {translate(locale, 'offline')}
        </p>
      )}

      <section
        className="heritage-classic-board__hero"
        aria-label={translate(locale, 'nextPrayer')}
      >
        <div className="heritage-classic-board__clock">
          <span>{translate(locale, 'currentTime')}</span>
          <strong>{formatLocalTime(data.clock.localMinutes, locale, timeFormat)}</strong>
        </div>

        <div className="heritage-classic-board__next">
          <div>
            <span>{translate(locale, 'nextPrayer')}</span>
            <strong>{nextPrayerLabel}</strong>
            {nextPrayer?.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
          </div>
          <div className="heritage-classic-board__countdown">
            <span>{translate(locale, 'countdown')}</span>
            <strong>
              {nextPrayer === null ? '—' : formatCountdown(nextPrayer.secondsUntil, locale)}
            </strong>
          </div>
          <dl>
            <div>
              <dt>{translate(locale, 'prayerStart')}</dt>
              <dd>{displayTime(nextPrayer?.startLocalMinutes ?? null, locale, timeFormat)}</dd>
            </div>
            <div>
              <dt>{translate(locale, 'iqamah')}</dt>
              <dd>
                {nextPrayer?.iqamahLocalMinutes === null || nextPrayer === null
                  ? translate(locale, 'noIqamah')
                  : displayTime(nextPrayer.iqamahLocalMinutes, locale, timeFormat)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="heritage-classic-board__timetable"
        aria-label={translate(locale, 'dailyPrayers')}
      >
        <div className="heritage-classic-board__table-heading" role="row">
          <span>{translate(locale, 'dailyPrayers')}</span>
          <span>{translate(locale, 'prayerStart')}</span>
          <span>{translate(locale, 'iqamah')}</span>
        </div>
        {obligatoryPrayers.map((prayer) => {
          const stateLabel = prayer.isCurrent
            ? translate(locale, 'currentPrayer')
            : prayer.isNext
              ? translate(locale, 'nextPrayer')
              : null;
          return (
            <div
              className={`heritage-classic-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
              role="row"
              key={prayer.name}
            >
              <div className="heritage-classic-prayer-row__name" role="cell">
                <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                {stateLabel !== null && <span>{stateLabel}</span>}
              </div>
              <strong role="cell">
                {displayTime(prayer.startLocalMinutes, locale, timeFormat)}
              </strong>
              <strong role="cell">
                {prayer.iqamahLocalMinutes === null
                  ? translate(locale, 'noIqamah')
                  : displayTime(prayer.iqamahLocalMinutes, locale, timeFormat)}
              </strong>
            </div>
          );
        })}
      </section>

      <div className="heritage-classic-board__lower-grid">
        <section
          className="heritage-classic-board__solar"
          aria-label={translate(locale, 'prayerSunrise')}
        >
          <div>
            <span>{translate(locale, 'prayerSunrise')}</span>
            <strong>{displayTime(data.solarEvents.sunriseLocalMinutes, locale, timeFormat)}</strong>
          </div>
          <div data-solar-event="sunset">
            <span>{translate(locale, 'prayerMaghrib')}</span>
            <strong>{displayTime(data.solarEvents.sunsetLocalMinutes, locale, timeFormat)}</strong>
          </div>
        </section>

        {data.jumuahSessions.length > 0 && (
          <section
            className="heritage-classic-board__jumuah"
            aria-label={translate(locale, 'jumuah')}
          >
            <span className="heritage-classic-board__module-title">
              {translate(locale, 'jumuah')}
            </span>
            <div>
              {data.jumuahSessions.map((session) => (
                <article key={session.label}>
                  <strong>
                    <BidiText>{session.label}</BidiText>
                  </strong>
                  <span>
                    {translate(locale, 'khutbah')} ·{' '}
                    {formatLocalTime(session.khutbahLocalMinutes, locale, timeFormat)}
                  </span>
                  <span>
                    {translate(locale, 'salah')} ·{' '}
                    {formatLocalTime(session.salahLocalMinutes, locale, timeFormat)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="heritage-classic-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
