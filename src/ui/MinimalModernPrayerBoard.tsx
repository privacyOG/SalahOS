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
import { BidiText } from './BidiText';

import '../minimal-modern.css';
import '../minimal-modern-display.css';

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

export type MinimalModernVariant = 'light' | 'dark';

export interface MinimalModernPrayerBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly variant: MinimalModernVariant;
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

export function MinimalModernPrayerBoard({
  data,
  locale,
  timeFormat,
  variant,
}: MinimalModernPrayerBoardProps) {
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const nextPrayer = data.nextPrayer;
  const nextPrayerLabel =
    nextPrayer === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[nextPrayer.name]);

  return (
    <div
      className="minimal-modern-board"
      data-prayer-board-template="minimal-modern"
      data-minimal-variant={variant}
    >
      <header className="minimal-modern-board__masthead">
        <div className="minimal-modern-board__brand">
          <span>SalahOS</span>
          {data.mosqueName !== null && (
            <strong>
              <BidiText>{data.mosqueName}</BidiText>
            </strong>
          )}
        </div>
        <div className="minimal-modern-board__masthead-meta">
          <div className="minimal-modern-board__dates">
            <span>{formatGregorianCivilDate(civilDate, locale)}</span>
            <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
          </div>
          {data.offline && (
            <p className="smart-display-status minimal-modern-board__status" role="status">
              {translate(locale, 'offline')}
            </p>
          )}
        </div>
      </header>

      <section
        className="minimal-modern-board__hero"
        aria-label={translate(locale, 'nextPrayer')}
      >
        <div className="minimal-modern-board__clock">
          <span>{translate(locale, 'currentTime')}</span>
          <strong>{displayClock(data.clock, locale, timeFormat)}</strong>
        </div>

        <div className="minimal-modern-board__next">
          <div className="minimal-modern-board__next-label">
            <span>{translate(locale, 'nextPrayer')}</span>
            <strong>{nextPrayerLabel}</strong>
            {nextPrayer?.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
          </div>
          <div className="minimal-modern-board__countdown">
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
                {nextPrayer === null || nextPrayer.iqamahLocalMinutes === null
                  ? translate(locale, 'noIqamah')
                  : displayTime(nextPrayer.iqamahLocalMinutes, locale, timeFormat)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="minimal-modern-board__prayer-strip"
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
              className={`minimal-modern-prayer${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
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

      <div className="minimal-modern-board__lower">
        <section
          className="minimal-modern-board__solar"
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
            className="minimal-modern-board__jumuah"
            aria-label={translate(locale, 'jumuah')}
          >
            <span className="minimal-modern-board__module-title">
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

      <footer className="minimal-modern-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
