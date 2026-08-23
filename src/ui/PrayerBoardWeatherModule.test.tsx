import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import { PrayerBoardWeatherModule } from './PrayerBoardWeatherModule';

function render(weather: PrayerBoardWeatherSnapshot | null, locale: 'en' | 'ar' = 'en'): string {
  return renderToStaticMarkup(<PrayerBoardWeatherModule weather={weather} locale={locale} />);
}

describe('PrayerBoardWeatherModule', () => {
  it('renders a compact ready snapshot', () => {
    const markup = render({
      state: 'ready',
      temperatureC: 18.4,
      summary: 'Partly cloudy',
      observedAtIso: '2026-08-22T01:00:00.000Z',
    });

    expect(markup).toContain('18°C');
    expect(markup).toContain('Partly cloudy');
    expect(markup).toContain('aria-label="Weather"');
  });

  it.each(['stale', 'error', 'loading'] as const)(
    'hides %s weather without a placeholder',
    (state) => {
      expect(
        render({
          state,
          temperatureC: 18,
          summary: 'Rain',
          observedAtIso: '2026-08-22T01:00:00.000Z',
        }),
      ).toBe('');
    },
  );

  it('hides missing weather', () => {
    expect(render(null)).toBe('');
  });

  it('localizes canonical provider summaries for Arabic display', () => {
    const markup = render(
      {
        state: 'ready',
        temperatureC: 21,
        summary: 'Rain',
        observedAtIso: '2026-08-22T01:00:00.000Z',
      },
      'ar',
    );

    expect(markup).toContain('21°C');
    expect(markup).toContain('مطر');
    expect(markup).toContain('aria-label="الطقس"');
  });
});
