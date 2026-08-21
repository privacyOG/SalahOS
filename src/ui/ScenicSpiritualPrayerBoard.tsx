import type { PrayerBoardData, PrayerBoardTimeFormat } from '../domain/prayerBoardTemplate';
import type { PrayerName } from '../domain/prayerEngine';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  localeTag,
  translate,
} from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import type { SmartDisplayThemeId } from '../platform/smartDisplayTheme';
import { BidiText } from './BidiText';

import '../scenic-spiritual.css';

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

export interface ScenicSpiritualPrayerBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly displayTheme: SmartDisplayThemeId;
  readonly artworkEnabled?: boolean;
}

function normalizedDisplayMinutes(minutes: number): number {
  const rounded = Math.round(minutes);
  return ((rounded % 1_440) + 1_440) % 1_440;
}

function displayTime(
  minutes: number | null,
  locale: Locale,
  timeFormat: PrayerBoardTimeFormat,
): string {
  return minutes === null
    ? '—'
    : formatLocalTime(normalizedDisplayMinutes(minutes), locale, timeFormat);
}

function displayClock(
  clock: PrayerBoardData['clock'],
  locale: Locale,
  timeFormat: PrayerBoardTimeFormat,
): string {
  const instant = new Date(Date.UTC(2000, 0, 1, clock.hour, clock.minute, clock.second));
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: timeFormat,
  }).format(instant);
}

export function ScenicSpiritualPrayerBoard({
  data,
  locale,
  timeFormat,
  displayTheme,
  artworkEnabled = true,
}: ScenicSpiritualPrayerBoardProps) {
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const nextPrayerLabel =
    data.nextPrayer === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[data.nextPrayer.name]);

  return (
    <div
      className="scenic-spiritual-board"
      data-prayer-board-template="scenic-spiritual"
      data-scenic-variant={displayTheme}
      data-artwork-mode={artworkEnabled ? 'scenic' : 'plain'}
    >
      <header className="scenic-spiritual-board__masthead">
        <div className="scenic-spiritual-board__identity">
          <span className="scenic-spiritual-board__brand">SalahOS</span>
          {data.mosqueName !== null && (
            <strong>
              <BidiText>{data.mosqueName}</BidiText>
            </strong>
          )}
        </div>
        <div className="scenic-spiritual-board__meta">
          <span>{formatGregorianCivilDate(civilDate, locale)}</span>
          <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
          {data.offline && (
            <span className="scenic-spiritual-board__status" role="status">
              {translate(locale, 'offline')}
            </span>
          )}
        </div>
      </header>

      <div className="scenic-spiritual-board__content">
        <section
          className="scenic-spiritual-board__focus"
          aria-label={translate(locale, 'nextPrayer')}
        >
          <div className="scenic-spiritual-board__clock">
            <span>{translate(locale, 'currentTime')}</span>
            <strong>{displayClock(data.clock, locale, timeFormat)}</strong>
          </div>

          <div className="scenic-spiritual-board__next">
            <div className="scenic-spiritual-board__next-heading">
              <span>{translate(locale, 'nextPrayer')}</span>
              {data.nextPrayer?.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
            </div>
            <strong>{nextPrayerLabel}</strong>
            <dl className="scenic-spiritual-board__next-times">
              <div>
                <dt>{translate(locale, 'prayerStart')}</dt>
                <dd>
                  {displayTime(data.nextPrayer?.startLocalMinutes ?? null, locale, timeFormat)}
                </dd>
              </div>
              <div>
                <dt>{translate(locale, 'iqamah')}</dt>
                <dd>
                  {data.nextPrayer?.iqamahLocalMinutes === null || data.nextPrayer === null
                    ? translate(locale, 'noIqamah')
                    : displayTime(data.nextPrayer.iqamahLocalMinutes, locale, timeFormat)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="scenic-spiritual-board__countdown">
            <span>{translate(locale, 'countdown')}</span>
            <strong>
              {data.nextPrayer === null
                ? '—'
                : formatCountdown(data.nextPrayer.secondsUntil, locale)}
            </strong>
          </div>
        </section>

        <section
          className="scenic-spiritual-board__schedule"
          aria-label={translate(locale, 'dailyPrayers')}
        >
          <div className="scenic-spiritual-board__schedule-head" aria-hidden="true">
            <span>{translate(locale, 'dailyPrayers')}</span>
            <span>{translate(locale, 'prayerStart')}</span>
            <span>{translate(locale, 'iqamah')}</span>
          </div>

          <div className="scenic-spiritual-board__prayers">
            {obligatoryPrayers.map((prayer) => {
              const stateLabel = prayer.isCurrent
                ? translate(locale, 'currentPrayer')
                : prayer.isNext
                  ? translate(locale, 'nextPrayer')
                  : null;
              return (
                <article
                  className={`scenic-spiritual-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
                  data-prayer={prayer.name}
                  key={prayer.name}
                >
                  <div className="scenic-spiritual-prayer-row__name">
                    <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                    {stateLabel !== null && <span>{stateLabel}</span>}
                  </div>
                  <strong className="scenic-spiritual-prayer-row__time scenic-spiritual-prayer-row__start">
                    {displayTime(prayer.startLocalMinutes, locale, timeFormat)}
                  </strong>
                  <strong className="scenic-spiritual-prayer-row__time scenic-spiritual-prayer-row__iqamah">
                    {prayer.iqamahLocalMinutes === null
                      ? translate(locale, 'noIqamah')
                      : displayTime(prayer.iqamahLocalMinutes, locale, timeFormat)}
                  </strong>
                </article>
              );
            })}
          </div>

          <div className="scenic-spiritual-board__adjuncts">
            <div className="scenic-spiritual-board__solar">
              <div>
                <span>{translate(locale, 'prayerSunrise')}</span>
                <strong>
                  {displayTime(data.solarEvents.sunriseLocalMinutes, locale, timeFormat)}
                </strong>
              </div>
              <div data-solar-event="sunset">
                <span>{translate(locale, 'prayerMaghrib')}</span>
                <strong>
                  {displayTime(data.solarEvents.sunsetLocalMinutes, locale, timeFormat)}
                </strong>
              </div>
            </div>

            {data.jumuahSessions.length > 0 && (
              <div className="scenic-spiritual-board__jumuah">
                <strong>{translate(locale, 'jumuah')}</strong>
                <div className="scenic-spiritual-board__jumuah-sessions">
                  {data.jumuahSessions.map((session) => (
                    <article key={session.label}>
                      <BidiText>{session.label}</BidiText>
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
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="scenic-spiritual-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
