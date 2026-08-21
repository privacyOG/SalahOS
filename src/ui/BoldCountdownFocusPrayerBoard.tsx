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

import '../bold-countdown-focus.css';
import '../bold-countdown-focus-display.css';

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

export type BoldCountdownFocusState = 'next-prayer' | 'pre-iqamah' | 'iqamah-now';

export interface BoldCountdownFocusPrayerBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly displayTheme: SmartDisplayThemeId;
}

interface BoldFocusModel {
  readonly state: BoldCountdownFocusState;
  readonly prayerName: PrayerName | null;
  readonly secondsUntil: number | null;
  readonly startLocalMinutes: number | null;
  readonly iqamahLocalMinutes: number | null;
  readonly dayOffset: 0 | 1 | null;
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

export function deriveBoldCountdownFocus(data: PrayerBoardData): BoldFocusModel {
  const currentPrayer = data.prayers.find((prayer) => prayer.name === data.currentPrayer);
  const currentIqamah = currentPrayer?.iqamahLocalMinutes ?? null;
  const localMinutes = data.clock.localMinutes;

  if (
    currentPrayer !== undefined &&
    currentIqamah !== null &&
    Math.floor(localMinutes) === Math.floor(currentIqamah)
  ) {
    return {
      state: 'iqamah-now',
      prayerName: currentPrayer.name,
      secondsUntil: 0,
      startLocalMinutes: currentPrayer.startLocalMinutes,
      iqamahLocalMinutes: currentIqamah,
      dayOffset: 0,
    };
  }

  if (
    currentPrayer !== undefined &&
    currentIqamah !== null &&
    currentPrayer.startLocalMinutes !== null &&
    localMinutes >= currentPrayer.startLocalMinutes &&
    localMinutes < currentIqamah
  ) {
    return {
      state: 'pre-iqamah',
      prayerName: currentPrayer.name,
      secondsUntil: Math.max(0, Math.ceil((currentIqamah - localMinutes) * 60)),
      startLocalMinutes: currentPrayer.startLocalMinutes,
      iqamahLocalMinutes: currentIqamah,
      dayOffset: 0,
    };
  }

  return {
    state: 'next-prayer',
    prayerName: data.nextPrayer?.name ?? null,
    secondsUntil: data.nextPrayer?.secondsUntil ?? null,
    startLocalMinutes: data.nextPrayer?.startLocalMinutes ?? null,
    iqamahLocalMinutes: data.nextPrayer?.iqamahLocalMinutes ?? null,
    dayOffset: data.nextPrayer?.dayOffset ?? null,
  };
}

export function BoldCountdownFocusPrayerBoard({
  data,
  locale,
  timeFormat,
  displayTheme,
}: BoldCountdownFocusPrayerBoardProps) {
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const focus = deriveBoldCountdownFocus(data);
  const focusPrayerLabel =
    focus.prayerName === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[focus.prayerName]);
  const focusHeading = translate(locale, focus.state === 'next-prayer' ? 'nextPrayer' : 'iqamah');

  return (
    <div
      className="bold-countdown-board"
      data-prayer-board-template="bold-countdown-focus"
      data-bold-variant={displayTheme}
      data-focus-state={focus.state}
    >
      <header className="bold-countdown-board__masthead">
        <div className="bold-countdown-board__identity">
          <span className="bold-countdown-board__brand">SalahOS</span>
          {data.mosqueName !== null && (
            <strong>
              <BidiText>{data.mosqueName}</BidiText>
            </strong>
          )}
        </div>
        <div className="bold-countdown-board__dates">
          <span>{formatGregorianCivilDate(civilDate, locale)}</span>
          <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
        </div>
        {data.offline && (
          <p className="smart-display-status bold-countdown-board__status" role="status">
            {translate(locale, 'offline')}
          </p>
        )}
      </header>

      <section className="bold-countdown-board__hero" aria-label={focusHeading}>
        <div className="bold-countdown-board__clock">
          <span>{translate(locale, 'currentTime')}</span>
          <strong>{displayClock(data.clock, locale, timeFormat)}</strong>
        </div>

        <div className="bold-countdown-board__focus">
          <div className="bold-countdown-board__focus-heading">
            <span>{focusHeading}</span>
            <strong>{focusPrayerLabel}</strong>
            {focus.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
          </div>
          <div className="bold-countdown-board__countdown">
            <span>{translate(locale, 'countdown')}</span>
            <strong>
              {focus.secondsUntil === null ? '—' : formatCountdown(focus.secondsUntil, locale)}
            </strong>
          </div>
          <dl className="bold-countdown-board__focus-times">
            <div>
              <dt>{translate(locale, 'prayerStart')}</dt>
              <dd>{displayTime(focus.startLocalMinutes, locale, timeFormat)}</dd>
            </div>
            <div>
              <dt>{translate(locale, 'iqamah')}</dt>
              <dd>
                {focus.iqamahLocalMinutes === null
                  ? translate(locale, 'noIqamah')
                  : displayTime(focus.iqamahLocalMinutes, locale, timeFormat)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="bold-countdown-board__timetable"
        aria-label={translate(locale, 'dailyPrayers')}
      >
        {obligatoryPrayers.map((prayer) => {
          const stateLabel = prayer.isCurrent
            ? translate(locale, 'currentPrayer')
            : prayer.isNext
              ? translate(locale, 'nextPrayer')
              : null;
          return (
            <article
              className={`bold-countdown-prayer${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
              data-prayer={prayer.name}
              key={prayer.name}
            >
              <header>
                <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                {stateLabel !== null && <span>{stateLabel}</span>}
              </header>
              <dl>
                <div>
                  <dt>{translate(locale, 'prayerStart')}</dt>
                  <dd>{displayTime(prayer.startLocalMinutes, locale, timeFormat)}</dd>
                </div>
                <div>
                  <dt>{translate(locale, 'iqamah')}</dt>
                  <dd>
                    {prayer.iqamahLocalMinutes === null
                      ? translate(locale, 'noIqamah')
                      : displayTime(prayer.iqamahLocalMinutes, locale, timeFormat)}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <div className="bold-countdown-board__lower">
        <section className="bold-countdown-board__solar">
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
          <section className="bold-countdown-board__jumuah" aria-label={translate(locale, 'jumuah')}>
            <strong>{translate(locale, 'jumuah')}</strong>
            <div>
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
      </div>

      <footer className="bold-countdown-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
