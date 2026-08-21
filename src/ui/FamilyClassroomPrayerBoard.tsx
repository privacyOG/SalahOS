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

import '../family-classroom.css';

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

interface FamilyClassroomCopy {
  readonly learningTitle: string;
  readonly startHint: string;
  readonly iqamahHint: string;
  readonly daylightTitle: string;
  readonly sunriseHint: string;
  readonly sunsetHint: string;
}

const familyClassroomCopy: Readonly<Record<Locale, FamilyClassroomCopy>> = {
  en: {
    learningTitle: 'Learn the prayer schedule',
    startHint: 'Athan / Start: the prayer time has begun.',
    iqamahHint: 'Iqamah: the congregation stands to begin the prayer.',
    daylightTitle: 'Daylight guide',
    sunriseHint: 'Sunrise begins the daylight period after Fajr.',
    sunsetHint: 'Sunset marks the beginning of Maghrib.',
  },
  ar: {
    learningTitle: 'تعلّم جدول الصلاة',
    startHint: 'الأذان / البداية: دخل وقت الصلاة.',
    iqamahHint: 'الإقامة: يقف المصلون لبدء الصلاة جماعة.',
    daylightTitle: 'دليل النهار',
    sunriseHint: 'الشروق يبدأ فترة النهار بعد الفجر.',
    sunsetHint: 'غروب الشمس يعلن دخول وقت المغرب.',
  },
  tr: {
    learningTitle: 'Namaz vakitlerini öğren',
    startHint: 'Ezan / Başlangıç: namaz vakti girmiştir.',
    iqamahHint: 'Kamet: cemaat namaza başlamak için saf tutar.',
    daylightTitle: 'Gün ışığı rehberi',
    sunriseHint: 'Güneş doğuşu, sabah namazından sonraki gündüz dönemini başlatır.',
    sunsetHint: 'Gün batımı akşam namazı vaktinin başlangıcını gösterir.',
  },
  id: {
    learningTitle: 'Pelajari jadwal salat',
    startHint: 'Azan / Mulai: waktu salat telah masuk.',
    iqamahHint: 'Iqamah: jamaah berdiri untuk memulai salat.',
    daylightTitle: 'Panduan cahaya siang',
    sunriseHint: 'Matahari terbit memulai periode siang setelah Subuh.',
    sunsetHint: 'Matahari terbenam menandai masuknya waktu Magrib.',
  },
};

export interface FamilyClassroomPrayerBoardProps {
  readonly data: PrayerBoardData;
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly displayTheme: SmartDisplayThemeId;
  readonly educationalHintsEnabled?: boolean;
  readonly daylightCuesEnabled?: boolean;
}

type LearningIconKind = 'clock' | 'start' | 'iqamah' | 'sunrise' | 'sunset';

function LearningIcon({ kind }: { readonly kind: LearningIconKind }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'family-classroom-icon',
    viewBox: '0 0 24 24',
  } as const;

  if (kind === 'clock') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (kind === 'start') {
    return (
      <svg {...commonProps}>
        <path d="M7 9v6" />
        <path d="M10 7v10" />
        <path d="M13 5v14" />
        <path d="M16 8v8" />
        <path d="M19 10v4" />
      </svg>
    );
  }
  if (kind === 'iqamah') {
    return (
      <svg {...commonProps}>
        <circle cx="8" cy="8" r="2" />
        <circle cx="16" cy="8" r="2" />
        <path d="M5 18v-3c0-2 1.4-3 3-3s3 1 3 3v3" />
        <path d="M13 18v-3c0-2 1.4-3 3-3s3 1 3 3v3" />
      </svg>
    );
  }
  if (kind === 'sunrise') {
    return (
      <svg {...commonProps}>
        <path d="M4 17h16" />
        <path d="M7 17a5 5 0 0 1 10 0" />
        <path d="M12 4v3" />
        <path d="M5 9l2 2" />
        <path d="M19 9l-2 2" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M4 17h16" />
      <path d="M7 17a5 5 0 0 0 10 0" />
      <path d="M12 5v3" />
      <path d="M5 10l2 2" />
      <path d="M19 10l-2 2" />
    </svg>
  );
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

export function FamilyClassroomPrayerBoard({
  data,
  locale,
  timeFormat,
  displayTheme,
  educationalHintsEnabled = false,
  daylightCuesEnabled = true,
}: FamilyClassroomPrayerBoardProps) {
  const copy = familyClassroomCopy[locale];
  const civilDate = new Date(`${data.civilDateIso}T00:00:00.000Z`);
  const obligatoryPrayers = data.prayers.filter((prayer) => prayer.name !== 'sunrise');
  const nextPrayerLabel =
    data.nextPrayer === null
      ? translate(locale, 'notConfigured')
      : translate(locale, prayerTranslationKeys[data.nextPrayer.name]);

  return (
    <div
      className="family-classroom-board"
      data-prayer-board-template="family-classroom"
      data-family-variant={displayTheme}
      data-educational-hints={educationalHintsEnabled ? 'on' : 'off'}
      data-daylight-cues={daylightCuesEnabled ? 'on' : 'off'}
    >
      <header className="family-classroom-board__masthead">
        <div className="family-classroom-board__identity">
          <span className="family-classroom-board__brand">SalahOS</span>
          {data.mosqueName !== null && (
            <strong>
              <BidiText>{data.mosqueName}</BidiText>
            </strong>
          )}
        </div>
        <div className="family-classroom-board__dates">
          <span>{formatGregorianCivilDate(civilDate, locale)}</span>
          <span>{formatHijriCivilDate(civilDate, locale, data.hijri.correctionDays)}</span>
          {data.offline && (
            <span className="family-classroom-board__status" role="status">
              {translate(locale, 'offline')}
            </span>
          )}
        </div>
      </header>

      <div className="family-classroom-board__content">
        <section
          className="family-classroom-board__focus"
          aria-label={translate(locale, 'nextPrayer')}
        >
          <div className="family-classroom-board__clock">
            <div className="family-classroom-board__eyebrow">
              <LearningIcon kind="clock" />
              <span>{translate(locale, 'currentTime')}</span>
            </div>
            <strong>{displayClock(data.clock, locale, timeFormat)}</strong>
          </div>

          <div className="family-classroom-board__next">
            <div className="family-classroom-board__next-label">
              <span>{translate(locale, 'nextPrayer')}</span>
              {data.nextPrayer?.dayOffset === 1 && <small>{translate(locale, 'tomorrow')}</small>}
            </div>
            <strong>{nextPrayerLabel}</strong>
            <div className="family-classroom-board__next-times">
              <div>
                <LearningIcon kind="start" />
                <span>{translate(locale, 'prayerStart')}</span>
                <strong>
                  {displayTime(
                    data.nextPrayer?.startLocalMinutes ?? null,
                    locale,
                    timeFormat,
                  )}
                </strong>
              </div>
              <div>
                <LearningIcon kind="iqamah" />
                <span>{translate(locale, 'iqamah')}</span>
                <strong>
                  {data.nextPrayer?.iqamahLocalMinutes === null || data.nextPrayer === null
                    ? translate(locale, 'noIqamah')
                    : displayTime(data.nextPrayer.iqamahLocalMinutes, locale, timeFormat)}
                </strong>
              </div>
            </div>
          </div>

          <div className="family-classroom-board__countdown">
            <span>{translate(locale, 'countdown')}</span>
            <strong>
              {data.nextPrayer === null
                ? '—'
                : formatCountdown(data.nextPrayer.secondsUntil, locale)}
            </strong>
          </div>

          {educationalHintsEnabled && (
            <aside className="family-classroom-board__learning" aria-label={copy.learningTitle}>
              <strong>{copy.learningTitle}</strong>
              <p>
                <LearningIcon kind="start" />
                {copy.startHint}
              </p>
              <p>
                <LearningIcon kind="iqamah" />
                {copy.iqamahHint}
              </p>
            </aside>
          )}
        </section>

        <section
          className="family-classroom-board__schedule"
          aria-label={translate(locale, 'dailyPrayers')}
        >
          <div className="family-classroom-board__schedule-head" aria-hidden="true">
            <span>{translate(locale, 'dailyPrayers')}</span>
            <span className="family-classroom-board__column-label">
              <LearningIcon kind="start" />
              {translate(locale, 'prayerStart')}
            </span>
            <span className="family-classroom-board__column-label">
              <LearningIcon kind="iqamah" />
              {translate(locale, 'iqamah')}
            </span>
          </div>

          <div className="family-classroom-board__prayers">
            {obligatoryPrayers.map((prayer, index) => {
              const stateLabel = prayer.isCurrent
                ? translate(locale, 'currentPrayer')
                : prayer.isNext
                  ? translate(locale, 'nextPrayer')
                  : null;
              return (
                <article
                  className={`family-classroom-prayer-row${prayer.isCurrent ? ' is-current' : ''}${prayer.isNext ? ' is-next' : ''}`}
                  data-prayer={prayer.name}
                  key={prayer.name}
                >
                  <div className="family-classroom-prayer-row__name">
                    <span className="family-classroom-prayer-row__number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div>
                      <strong>{translate(locale, prayerTranslationKeys[prayer.name])}</strong>
                      {stateLabel !== null && <span>{stateLabel}</span>}
                    </div>
                  </div>
                  <strong className="family-classroom-prayer-row__time family-classroom-prayer-row__start">
                    {displayTime(prayer.startLocalMinutes, locale, timeFormat)}
                  </strong>
                  <strong className="family-classroom-prayer-row__time family-classroom-prayer-row__iqamah">
                    {prayer.iqamahLocalMinutes === null
                      ? translate(locale, 'noIqamah')
                      : displayTime(prayer.iqamahLocalMinutes, locale, timeFormat)}
                  </strong>
                </article>
              );
            })}
          </div>

          <div className="family-classroom-board__adjuncts">
            {daylightCuesEnabled && (
              <section
                className="family-classroom-board__daylight"
                aria-label={copy.daylightTitle}
              >
                <div className="family-classroom-board__daylight-heading">
                  <strong>{copy.daylightTitle}</strong>
                </div>
                <div className="family-classroom-board__daylight-items">
                  <div>
                    <LearningIcon kind="sunrise" />
                    <span>{translate(locale, 'prayerSunrise')}</span>
                    <strong>
                      {displayTime(data.solarEvents.sunriseLocalMinutes, locale, timeFormat)}
                    </strong>
                    {educationalHintsEnabled && <small>{copy.sunriseHint}</small>}
                  </div>
                  <div data-solar-event="sunset">
                    <LearningIcon kind="sunset" />
                    <span>{translate(locale, 'prayerMaghrib')}</span>
                    <strong>
                      {displayTime(data.solarEvents.sunsetLocalMinutes, locale, timeFormat)}
                    </strong>
                    {educationalHintsEnabled && <small>{copy.sunsetHint}</small>}
                  </div>
                </div>
              </section>
            )}

            {data.jumuahSessions.length > 0 && (
              <section className="family-classroom-board__jumuah">
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
        </section>
      </div>

      <footer className="family-classroom-board__footer">
        <span>{translate(locale, sourceTranslationKeys[data.sourceMode])}</span>
        <span>
          {translate(locale, 'timezone')}: <BidiText>{data.timeZone}</BidiText>
        </span>
      </footer>
    </div>
  );
}
