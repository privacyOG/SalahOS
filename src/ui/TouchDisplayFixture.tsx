import {
  formatCountdown,
  formatGregorianCivilDate,
  formatHijriCivilDate,
  formatLocalTime,
  formatZonedInstantTime,
  localeDirection,
  translate,
} from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import { NextPrayerBlock } from './NextPrayerBlock';
import { PrayerCard } from './PrayerCard';

export type TouchDisplayFixtureSize = '5' | '7' | '10';
export type TouchDisplayFixtureOrientation = 'portrait' | 'landscape';

export interface TouchDisplayFixtureConfig {
  readonly size: TouchDisplayFixtureSize;
  readonly orientation: TouchDisplayFixtureOrientation;
  readonly locale: Locale;
}

interface DisplayProfile {
  readonly width: number;
  readonly height: number;
}

const portraitProfiles: Readonly<Record<TouchDisplayFixtureSize, DisplayProfile>> = {
  '5': { width: 720, height: 1280 },
  '7': { width: 720, height: 1280 },
  '10': { width: 1200, height: 1920 },
};

const prayerFixtures: readonly {
  readonly translationKey: TranslationKey;
  readonly startMinutes: number;
  readonly iqamahMinutes: number | null;
  readonly supplementary: boolean;
}[] = [
  {
    translationKey: 'prayerFajr',
    startMinutes: 5 * 60 + 21,
    iqamahMinutes: 5 * 60 + 45,
    supplementary: false,
  },
  {
    translationKey: 'prayerSunrise',
    startMinutes: 6 * 60 + 38,
    iqamahMinutes: null,
    supplementary: true,
  },
  {
    translationKey: 'prayerDhuhr',
    startMinutes: 12 * 60 + 4,
    iqamahMinutes: 12 * 60 + 30,
    supplementary: false,
  },
  {
    translationKey: 'prayerAsr',
    startMinutes: 15 * 60 + 17,
    iqamahMinutes: 15 * 60 + 35,
    supplementary: false,
  },
  {
    translationKey: 'prayerMaghrib',
    startMinutes: 17 * 60 + 31,
    iqamahMinutes: 17 * 60 + 41,
    supplementary: false,
  },
  {
    translationKey: 'prayerIsha',
    startMinutes: 18 * 60 + 51,
    iqamahMinutes: 19 * 60 + 15,
    supplementary: false,
  },
];

const fixtureDate = new Date(Date.UTC(2026, 7, 16));
const fixtureInstant = new Date('2026-08-16T05:20:00.000Z');

function isSize(value: string | null): value is TouchDisplayFixtureSize {
  return value === '5' || value === '7' || value === '10';
}

function isOrientation(value: string | null): value is TouchDisplayFixtureOrientation {
  return value === 'portrait' || value === 'landscape';
}

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'ar';
}

export function readTouchDisplayFixtureConfig(search: string): TouchDisplayFixtureConfig | null {
  const params = new URLSearchParams(search);
  if (params.get('fixture') !== 'touch-display-2') {
    return null;
  }

  const requestedSize = params.get('display');
  const requestedOrientation = params.get('orientation');
  const requestedLocale = params.get('locale');

  return {
    size: requestedSize === null ? '7' : isSize(requestedSize) ? requestedSize : '7',
    orientation:
      requestedOrientation === null
        ? 'portrait'
        : isOrientation(requestedOrientation)
          ? requestedOrientation
          : 'portrait',
    locale: requestedLocale === null ? 'en' : isLocale(requestedLocale) ? requestedLocale : 'en',
  };
}

export function touchDisplayFixtureDimensions(
  size: TouchDisplayFixtureSize,
  orientation: TouchDisplayFixtureOrientation,
): DisplayProfile {
  const profile = portraitProfiles[size];
  if (orientation === 'portrait') {
    return profile;
  }
  return { width: profile.height, height: profile.width };
}

export function TouchDisplayFixture({ size, orientation, locale }: TouchDisplayFixtureConfig) {
  const dimensions = touchDisplayFixtureDimensions(size, orientation);
  const direction = localeDirection(locale);
  const currentPrayerIndex = 3;
  const nextPrayerIndex = 4;

  return (
    <main
      className={`touch-display-fixture touch-display-fixture-${size}`}
      data-display-size={size}
      data-orientation={orientation}
      data-viewport={`${dimensions.width}x${dimensions.height}`}
      dir={direction}
      lang={locale}
    >
      <header className="touch-display-fixture-header">
        <div>
          <p className="eyebrow">{translate(locale, 'appName')}</p>
          <p className="touch-display-fixture-clock">
            {formatZonedInstantTime(fixtureInstant, 'Australia/Sydney', locale)}
          </p>
          <p className="touch-display-fixture-date">
            {formatGregorianCivilDate(fixtureDate, locale)}
          </p>
          <p className="touch-display-fixture-date">{formatHijriCivilDate(fixtureDate, locale)}</p>
        </div>
        <NextPrayerBlock
          nextPrayerLabel={translate(locale, 'prayerMaghrib')}
          countdown={formatCountdown(2 * 60 * 60 + 11 * 60 + 4, locale)}
          tomorrow={false}
          nextPrayerText={translate(locale, 'nextPrayer')}
          notConfiguredText={translate(locale, 'notConfigured')}
          tomorrowText={translate(locale, 'tomorrow')}
        />
      </header>

      <section
        className="touch-display-fixture-location"
        aria-label={translate(locale, 'currentLocation')}
      >
        <div>
          <p className="label">{translate(locale, 'currentLocation')}</p>
          <p className="value">Sydney, Australia</p>
        </div>
        <div>
          <p className="label">{translate(locale, 'timezone')}</p>
          <p className="value">Australia/Sydney</p>
        </div>
        <div>
          <p className="label">{translate(locale, 'calculationSource')}</p>
          <p className="value">{translate(locale, 'sourceCalculated')}</p>
        </div>
      </section>

      <section
        className="touch-display-fixture-prayers"
        aria-labelledby="touch-display-prayers-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">{translate(locale, 'today')}</p>
            <h1 id="touch-display-prayers-heading">{translate(locale, 'dailyPrayers')}</h1>
          </div>
        </div>
        <div className="prayer-grid">
          {prayerFixtures.map((prayer, index) => (
            <PrayerCard
              key={prayer.translationKey}
              prayerName={translate(locale, prayer.translationKey)}
              isCurrent={index === currentPrayerIndex}
              isNext={index === nextPrayerIndex}
              isSupplementary={prayer.supplementary}
              currentPrayerLabel={translate(locale, 'currentPrayer')}
              prayerStartLabel={translate(locale, 'prayerStart')}
              startTime={formatLocalTime(prayer.startMinutes, locale)}
              iqamahLabel={translate(locale, 'iqamah')}
              iqamahTime={
                prayer.iqamahMinutes === null
                  ? translate(locale, 'noIqamah')
                  : formatLocalTime(prayer.iqamahMinutes, locale)
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}
