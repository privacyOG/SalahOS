import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import type { PrayerBoardWeatherDetails } from '../platform/prayerBoardWeather';
import { PrayerBoardWeatherModule } from './PrayerBoardWeatherModule';

type WeatherView = PrayerBoardWeatherSnapshot & Partial<PrayerBoardWeatherDetails>;

function render(weather: WeatherView | null, locale: 'en' | 'ar' = 'en'): string {
  return renderToStaticMarkup(<PrayerBoardWeatherModule weather={weather} locale={locale} />);
}

function richWeather(state: 'ready' | 'stale' = 'ready'): PrayerBoardWeatherDetails {
  return {
    state,
    temperatureC: 18.4,
    summary: 'Partly cloudy',
    observedAtIso: '2026-08-25T01:00:00.000Z',
    feelsLikeC: 16.9,
    highC: 20,
    lowC: 11,
    precipitationProbabilityPercent: 65,
    humidityPercent: 72,
    windSpeedKmh: 21,
    uvIndex: 5,
    sunriseAtIso: '2026-08-24T20:25:00.000Z',
    sunsetAtIso: '2026-08-25T07:37:00.000Z',
    locationSource: 'native-gps',
    locationAccuracyMeters: 8,
    locationLabel: 'Sydney',
    fetchedAtIso: '2026-08-25T01:05:00.000Z',
  };
}

describe('PrayerBoardWeatherModule', () => {
  it('renders current conditions and useful daily/prayer context', () => {
    const markup = render(richWeather());

    expect(markup).toContain('18°C');
    expect(markup).toContain('Partly cloudy');
    expect(markup).toContain('Feels');
    expect(markup).toContain('High / low');
    expect(markup).toContain('65%');
    expect(markup).toContain('Humidity');
    expect(markup).toContain('21 km/h');
    expect(markup).toContain('UV');
    expect(markup).toContain('Sunrise');
    expect(markup).toContain('Sunset');
    expect(markup).toContain('aria-label="Weather"');
    expect(markup).toContain('data-weather-state="ready"');
  });

  it('keeps stale cached weather visible and explicitly labels it', () => {
    const markup = render(richWeather('stale'));
    expect(markup).toContain('data-weather-state="stale"');
    expect(markup).toContain('Cached');
    expect(markup).toContain('18°C');
  });

  it.each(['error', 'loading'] as const)('hides %s weather without a placeholder', (state) => {
    expect(
      render({
        state,
        temperatureC: 18,
        summary: 'Rain',
        observedAtIso: '2026-08-25T01:00:00.000Z',
      }),
    ).toBe('');
  });

  it('hides missing weather', () => {
    expect(render(null)).toBe('');
  });

  it('localizes canonical provider summaries for Arabic display', () => {
    const markup = render({ ...richWeather(), summary: 'Rain' }, 'ar');

    expect(markup).toContain('18°C');
    expect(markup).toContain('مطر');
    expect(markup).toContain('الرطوبة');
    expect(markup).toContain('الشروق');
    expect(markup).toContain('aria-label="الطقس"');
  });

  it('labels approximate positioning when accuracy is coarse', () => {
    const markup = render({
      ...richWeather(),
      locationSource: 'browser-network-approximate',
      locationAccuracyMeters: 1_500,
    });
    expect(markup).toContain('Approx. location');
  });
});
