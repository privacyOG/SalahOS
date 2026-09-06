import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { NightPrayerPresentation } from '../domain/nightPrayerPresentation';
import type { Locale } from '../i18n/translations';
import { TodayNightSection } from './TodayNightSection';

const baseModel: NightPrayerPresentation = {
  phase: 'active',
  prominent: true,
  nightEndConvention: 'fajr',
  islamicMidnight: {
    localMinutes: 10.5,
    provenance: 'Midpoint from displayed Maghrib to next fajr',
  },
  lastThirdStart: {
    localMinutes: 90 + 2 / 3,
    provenance: 'Start of final third from displayed Maghrib to next fajr',
  },
  ishraq: {
    localMinutes: 410,
    provenance: 'Configured 15 minutes after displayed sunrise',
  },
  ishraqMinutesAfterSunrise: 15,
};

const locales: readonly Locale[] = ['en', 'ar', 'tr', 'id'];

describe('TodayNightSection', () => {
  it.each(locales)('renders localized night content for %s without losing provenance', (locale) => {
    const markup = renderToStaticMarkup(
      <TodayNightSection model={baseModel} locale={locale} timeFormat="h23" promoted />,
    );

    expect(markup).toContain('data-night-phase="active"');
    expect(markup).toContain('data-night-end-convention="fajr"');
    expect(markup).toContain('data-supplementary-provenance=');
    expect(markup).toContain('Midpoint from displayed Maghrib to next fajr');
    expect(markup).toContain('Configured 15 minutes after displayed sunrise');
    expect(markup).not.toContain('undefined');
  });

  it('rounds fractional calculated night times only at the display boundary', () => {
    const markup = renderToStaticMarkup(
      <TodayNightSection model={baseModel} locale="en" timeFormat="h23" promoted />,
    );

    expect(markup).toContain('00:11');
    expect(markup).toContain('01:31');
    expect(baseModel.islamicMidnight.localMinutes).toBe(10.5);
    expect(baseModel.lastThirdStart.localMinutes).toBe(90 + 2 / 3);
  });

  it('hides Ishraq when the offset is explicitly unset', () => {
    const markup = renderToStaticMarkup(
      <TodayNightSection
        model={{ ...baseModel, ishraq: null, ishraqMinutesAfterSunrise: null }}
        locale="en"
        timeFormat="h23"
      />,
    );

    expect(markup).not.toContain('Ishraq / Duha');
    expect(markup).toContain('Islamic midnight');
    expect(markup).toContain('Tahajjud');
  });

  it('labels the alternate sunrise night-end convention', () => {
    const markup = renderToStaticMarkup(
      <TodayNightSection
        model={{ ...baseModel, nightEndConvention: 'sunrise' }}
        locale="en"
        timeFormat="h23"
      />,
    );

    expect(markup).toContain('Night ends at sunrise');
    expect(markup).toContain('Calculated from Maghrib to the next sunrise');
  });
});
