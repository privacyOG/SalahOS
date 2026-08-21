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

import '../structured-split-board.css';

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

export interface StructuredSplitBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly displayTheme: SmartDisplayThemeId;
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

export function StructuredSplitBoard({
  data,
  locale,
  timeFormat,
  displayTheme,
}: StructuredSplitBoardProps) {
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const nextPrayerLabel =
    data.nextPrayer === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[data.nextPrayer.name]);

  return (
    <div
      className="structured-split-board"
      data-prayer-board-template="structured-split-board"
      data-structured-variant={displayTheme}
    >
      <header className="structured-split-board__masthead">
        <div className="structured-split-board__identity">
          <span className="structured-split-board__brand">SalahOS</span>
          {data.mosqueName !== null && (
            <strong>
              <BidiText>{data.mosqueName}</BidiText>
            </strong>
          )}
        </div>
        {data.offline && (
          <p className="smart-display-status structured-split-board__status" role="status">
            {translate(locale, 'offline')}
          </p>
        )}
      </header>

      <div className="structured-split-board__layout">
        <section
          className="structured-split-board__timetable"
          aria-label={translate(locale, 'dailyPrayers')}
        >
          <div className="structured-prayer-table__head" aria-hidden="true">
            <span />
            <strong>{translate(locale, 'prayerStart')}</strong>
            <strong>{translate(locale, 'iqamah')}</strong>
          </div>

          <div className="structured-prayer-table__rows">
            {obligatoryPrayers.map((prayer) => {
              const stateLabel = prayer.isCurrent
                ? translate(locale, 'currentPrayer')
                : prayer.isNext
                  ? translate(locale, 'nextPrayer')
                  : null;
              return (
                <article
                  className={`structured-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
                  data-prayer={prayer.name}
                  key={prayer.name}
                >
                  <div className="structured-prayer-row__name">
                    <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                    {stateLabel !== null && <span>{stateLabel}</span>}
                  </div>
                  <div className="structured-prayer-row__start">
                    <strong>{displayTime(prayer.startLocalMinutes, locale, timeFormat)}</strong>
                  </div>
                  <div className="structured-prayer-row__iqamah">
                    <strong>
                      {prayer.iqamahLocalMinutes === null
                        ? translate(locale, 'noIqamah')
                        : displayTime(prayer.iqamahLocalMinutes, locale, timeFormat)}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="structured-split-board__rail">
          <section className="structured-split-board__clock" aria-label={translate(locale, 'currentTime')}>
            <span>{translate(locale, 'currentTime')}</span>
            <strong>{displayClock(data.clock, locale, timeFormat)}</strong>
            <div className="structured-split-board__dates">
              <span>{formatGregorianCivilDate(civilDate, locale)}</span>
              <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
            </div>
          </section>

          <section className="structured-split-board__next" aria-label={translate(locale, 'nextPrayer')}>
            <div className="structured-split-board__next-heading">
              <span>{translate(locale, 'nextPrayer')}</span>
              <strong>{nextPrayerLabel}</strong>
              {data.nextPrayer?.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
            </div>
            <div className="structured-split-board__countdown">
              <span>{translate(locale, 'countdown')}</span>
              <strong>
                {data.nextPrayer === null
                  ? '—'
                  : formatCountdown(data.nextPrayer.secondsUntil, locale)}
              </strong>
            </div>
            <dl className="structured-split-board__next-times">
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
          </section>

          <section className="structured-split-board__solar">
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
              className="structured-split-board__jumuah"
              aria-label={translate(locale, 'jumuah')}
            >
              <strong>{translate(locale, 'jumuah')}</strong>
              <div className="structured-split-board__jumuah-sessions">
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
            </section>
          )}
        </aside>
      </div>

      <footer className="structured-split-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
