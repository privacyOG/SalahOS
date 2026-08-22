import type { PrayerBoardData, PrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import type { PrayerName } from '../domain/prayerEngine';
import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  translate,
} from '../i18n/i18n';
import { todayContextCopy } from '../i18n/todayContextV2Translations';
import type { TranslationKey } from '../i18n/translations';

const prayerKeys: Readonly<Record<PrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  sunrise: 'prayerSunrise',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

function clockText(data: PrayerBoardData, config: PrayerBoardTemplateConfig): string {
  return formatLocalTime(data.clock.localMinutes, config.primaryLocale, config.timeFormat);
}

function civilDate(data: PrayerBoardData): Date {
  return new Date(`${data.civilDateIso}T00:00:00.000Z`);
}

export function MobilePrayerThemePreview({
  data,
  config,
}: Readonly<{
  data: PrayerBoardData;
  config: PrayerBoardTemplateConfig;
}>) {
  const locale = config.primaryLocale;
  const next = data.nextPrayer;
  const obligatory = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const modules = config.moduleVisibility;
  const contextual = todayContextCopy[locale];
  const date = civilDate(data);

  return (
    <div
      className="mobile-prayer-theme-surface mobile-prayer-theme-preview-surface"
      data-mobile-prayer-template={config.templateId}
      data-mobile-prayer-accent={config.accentPreset}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      lang={locale}
    >
      <main className="today-screen mobile-prayer-theme-preview">
        <header className="today-appbar">
          <div className="today-appbar__brand">
            <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
            <div>
              <strong>SalahOS</strong>
              {modules['mosque-branding'] && <span>{data.mosqueName ?? data.timeZone}</span>}
            </div>
          </div>
          <div className="today-appbar__meta">
            <span className="today-appbar__clock">{clockText(data, config)}</span>
          </div>
        </header>

        <section className="today-next">
          <div className="today-next__identity">
            <p>{translate(locale, 'nextPrayer')}</p>
            <h1>{next === null ? '—' : translate(locale, prayerKeys[next.name])}</h1>
          </div>
          <div className="today-next__countdown">
            <span>{translate(locale, 'countdown')}</span>
            <strong>{next === null ? '—' : formatCountdown(next.secondsUntil, locale)}</strong>
          </div>
          <dl className="today-next__times">
            <div>
              <dt>{translate(locale, 'prayerStart')}</dt>
              <dd>
                {next === null
                  ? '—'
                  : formatLocalTime(next.startLocalMinutes, locale, config.timeFormat)}
              </dd>
            </div>
            <div>
              <dt>{translate(locale, 'iqamah')}</dt>
              <dd>
                {next?.iqamahLocalMinutes === null || next?.iqamahLocalMinutes === undefined
                  ? '—'
                  : formatLocalTime(next.iqamahLocalMinutes, locale, config.timeFormat)}
              </dd>
            </div>
          </dl>
        </section>

        {modules.dates && (
          <section className="today-dates" aria-label={translate(locale, 'today')}>
            <div>
              <span>{translate(locale, 'gregorianDate')}</span>
              <strong>{formatGregorianCivilDate(date, locale)}</strong>
            </div>
            <div>
              <span>{translate(locale, 'hijriDate')}</span>
              <strong>{formatHijriCivilDate(date, locale, data.hijri.correctionDays)}</strong>
            </div>
          </section>
        )}

        <section className="today-schedule" aria-label={translate(locale, 'dailyPrayers')}>
          <div className="today-prayer-table" role="table">
            <div className="today-prayer-row today-prayer-row--header" role="row">
              <span role="columnheader">{translate(locale, 'dailyPrayers')}</span>
              <span role="columnheader">{translate(locale, 'prayerStart')}</span>
              <span role="columnheader">{translate(locale, 'iqamah')}</span>
            </div>
            {obligatory.map((prayer) => (
              <div
                className={`today-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
                role="row"
                key={prayer.name}
              >
                <div className="today-prayer-row__name" role="cell">
                  <strong>{translate(locale, prayerKeys[prayer.name])}</strong>
                  {prayer.isNext && <span>{translate(locale, 'nextPrayer')}</span>}
                </div>
                <strong className="today-prayer-row__time" role="cell">
                  {prayer.startLocalMinutes === null
                    ? '—'
                    : formatLocalTime(prayer.startLocalMinutes, locale, config.timeFormat)}
                </strong>
                <strong className="today-prayer-row__time today-prayer-row__iqamah" role="cell">
                  {prayer.iqamahLocalMinutes === null
                    ? '—'
                    : formatLocalTime(prayer.iqamahLocalMinutes, locale, config.timeFormat)}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {modules['sunrise-sunset'] && (
          <section className="today-solar" aria-label={contextual.solarTitle}>
            <div>
              <span>{translate(locale, 'prayerSunrise')}</span>
              <strong>
                {data.solarEvents.sunriseLocalMinutes === null
                  ? '—'
                  : formatLocalTime(
                      data.solarEvents.sunriseLocalMinutes,
                      locale,
                      config.timeFormat,
                    )}
              </strong>
            </div>
            <div>
              <span>{contextual.sunset}</span>
              <strong>
                {data.solarEvents.sunsetLocalMinutes === null
                  ? '—'
                  : formatLocalTime(data.solarEvents.sunsetLocalMinutes, locale, config.timeFormat)}
              </strong>
            </div>
          </section>
        )}

        {modules.jumuah && data.jumuahSessions.length > 0 && (
          <section className="today-jumuah" aria-label={translate(locale, 'jumuah')}>
            <div className="today-jumuah__sessions">
              {data.jumuahSessions.map((session) => (
                <div key={session.label}>
                  <strong>{session.label}</strong>
                  <span>
                    {translate(locale, 'khutbah')} ·{' '}
                    {formatLocalTime(session.khutbahLocalMinutes, locale, config.timeFormat)}
                  </span>
                  <span>
                    {translate(locale, 'salah')} ·{' '}
                    {formatLocalTime(session.salahLocalMinutes, locale, config.timeFormat)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {modules.announcements && (
          <section className="today-community-preview mobile-theme-preview-community">
            <header>
              <div>
                <p>{contextual.communityEyebrow}</p>
                <h2>{contextual.communityTitle}</h2>
              </div>
            </header>
            <div className="today-community-preview__grid">
              <article>
                <span>{contextual.announcement}</span>
                <strong>{contextual.communityTitle}</strong>
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
