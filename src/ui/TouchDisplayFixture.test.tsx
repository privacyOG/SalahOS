import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  readTouchDisplayFixtureConfig,
  TouchDisplayFixture,
  touchDisplayFixtureDimensions,
} from './TouchDisplayFixture';

describe('TouchDisplayFixture', () => {
  it('does not activate without the explicit fixture query', () => {
    expect(readTouchDisplayFixtureConfig('')).toBeNull();
    expect(readTouchDisplayFixtureConfig('?fixture=other')).toBeNull();
  });

  it('defaults to the 7-inch portrait English profile', () => {
    expect(readTouchDisplayFixtureConfig('?fixture=touch-display-2')).toEqual({
      size: '7',
      orientation: 'portrait',
      locale: 'en',
    });
  });

  it('accepts a 10-inch landscape Arabic fixture and safely falls back on invalid options', () => {
    expect(
      readTouchDisplayFixtureConfig(
        '?fixture=touch-display-2&display=10&orientation=landscape&locale=ar',
      ),
    ).toEqual({ size: '10', orientation: 'landscape', locale: 'ar' });

    expect(
      readTouchDisplayFixtureConfig(
        '?fixture=touch-display-2&display=99&orientation=diagonal&locale=invalid',
      ),
    ).toEqual({ size: '7', orientation: 'portrait', locale: 'en' });
  });

  it('exposes the documented portrait and landscape pixel profiles', () => {
    expect(touchDisplayFixtureDimensions('5', 'portrait')).toEqual({ width: 720, height: 1280 });
    expect(touchDisplayFixtureDimensions('7', 'landscape')).toEqual({ width: 1280, height: 720 });
    expect(touchDisplayFixtureDimensions('10', 'portrait')).toEqual({ width: 1200, height: 1920 });
    expect(touchDisplayFixtureDimensions('10', 'landscape')).toEqual({ width: 1920, height: 1200 });
  });

  it('renders deterministic production prayer components for the target profile', () => {
    const html = renderToStaticMarkup(
      <TouchDisplayFixture size="7" orientation="portrait" locale="en" />,
    );

    expect(html).toContain('data-display-size="7"');
    expect(html).toContain('data-orientation="portrait"');
    expect(html).toContain('data-viewport="720x1280"');
    expect(html).toContain('class="next-prayer-block"');
    expect(html).toContain('prayer-card-current');
    expect(html).toContain('prayer-card-next');
    expect(html).toContain('Fajr');
    expect(html).toContain('Maghrib');
    expect(html).toContain('Australia/Sydney');
  });

  it('renders the same fixture in Arabic RTL without changing the viewport contract', () => {
    const html = renderToStaticMarkup(
      <TouchDisplayFixture size="10" orientation="landscape" locale="ar" />,
    );

    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('data-viewport="1920x1200"');
    expect(html).toContain('الفجر');
    expect(html).toContain('المغرب');
  });
});
