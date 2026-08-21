import { describe, expect, it } from 'vitest';

import { createCoordinates } from './coordinates';
import { buildPrayerDashboard } from './dashboard';
import {
  PRAYER_BOARD_CORE_MODULES,
  PRAYER_BOARD_TEMPLATE_CONFIG_VERSION,
  buildPrayerBoardData,
  getPrayerBoardTemplate,
  parsePrayerBoardTemplateConfig,
  prayerBoardTemplateRegistry,
} from './prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from './sourcedDashboard';

function sourcedSydneyDashboard() {
  const base = buildPrayerDashboard({
    instant: new Date('2026-08-21T06:00:00.000Z'),
    coordinates: createCoordinates(-33.8688, 151.2093),
    timeZone: 'Australia/Sydney',
  });
  return applyPrayerSourceToDashboard({
    dashboard: base,
    sourceMode: 'calculated',
    mosqueTimetable: null,
  });
}

describe('prayer-board template engine', () => {
  it('publishes the six required stable versioned templates', () => {
    expect(prayerBoardTemplateRegistry.map((template) => template.id)).toEqual([
      'heritage-classic',
      'minimal-modern',
      'bold-countdown-focus',
      'structured-split-board',
      'scenic-spiritual',
      'family-classroom',
    ]);
    expect(new Set(prayerBoardTemplateRegistry.map((template) => template.id)).size).toBe(6);
    expect(prayerBoardTemplateRegistry.every((template) => template.version === 1)).toBe(true);
    expect(
      prayerBoardTemplateRegistry.every(
        (template) =>
          JSON.stringify(template.supportedLocales) === JSON.stringify(['en', 'ar', 'tr', 'id']),
      ),
    ).toBe(true);
  });

  it('forces core prayer modules visible while allowing optional modules to be hidden', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: PRAYER_BOARD_TEMPLATE_CONFIG_VERSION,
      templateId: 'minimal-modern',
      moduleVisibility: {
        'current-time': false,
        'next-prayer': false,
        countdown: false,
        'prayer-timetable': false,
        announcements: false,
        weather: true,
      },
    });

    for (const moduleId of PRAYER_BOARD_CORE_MODULES) {
      expect(config.moduleVisibility[moduleId]).toBe(true);
    }
    expect(config.moduleVisibility.announcements).toBe(false);
    expect(config.moduleVisibility.weather).toBe(true);
  });

  it('normalizes versioned configuration, bilingual mode, accents and safe local imagery', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      primaryLocale: 'ar',
      languageMode: 'en-ar',
      timeFormat: 'h12',
      accentPreset: 'jewel',
      branding: {
        mosqueName: { en: 'Example Masjid', ar: 'مسجد المثال' },
        logo: {
          assetId: 'logo-1',
          mimeType: 'image/png',
          byteSize: 20_000,
          width: 512,
          height: 512,
        },
      },
      background: {
        kind: 'local-image',
        asset: {
          assetId: 'background-1',
          mimeType: 'image/webp',
          byteSize: 2_000_000,
          width: 3840,
          height: 2160,
        },
        focalPoint: { x: 0.2, y: 0.8 },
      },
    });

    expect(config.primaryLocale).toBe('ar');
    expect(config.languageMode).toBe('en-ar');
    expect(config.timeFormat).toBe('h12');
    expect(config.accentPreset).toBe('jewel');
    expect(config.branding.mosqueName).toEqual({ en: 'Example Masjid', ar: 'مسجد المثال' });
    expect(config.background).toMatchObject({
      kind: 'local-image',
      crop: 'cover',
      focalPoint: { x: 0.2, y: 0.8 },
      contrastScrim: 'auto',
    });
  });

  it('rejects remote-looking image identifiers from imported configuration', () => {
    const remoteAssetId = ['https:', '', 'example.invalid', 'background.webp'].join('/');
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: {
        kind: 'local-image',
        asset: {
          assetId: remoteAssetId,
          mimeType: 'image/webp',
          byteSize: 2_000_000,
          width: 3840,
          height: 2160,
        },
      },
    });

    expect(config.background).toEqual({ kind: 'builtin', artworkId: 'scenic-gradient' });
  });

  it('falls back to built-in artwork when custom image metadata is invalid', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'heritage-classic',
      background: {
        kind: 'local-image',
        asset: { assetId: '', mimeType: 'image/svg+xml', byteSize: 0, width: 0, height: 0 },
      },
    });

    expect(config.background).toEqual({ kind: 'builtin', artworkId: 'geometric-heritage' });
  });

  it('builds presentation data only from the already-resolved prayer dashboard', () => {
    const dashboard = sourcedSydneyDashboard();
    const before = dashboard.prayers.map((prayer) => ({
      name: prayer.name,
      localMinutes: prayer.localMinutes,
      iqamahLocalMinutes: prayer.iqamahLocalMinutes,
      source: prayer.source,
    }));

    const heritage = parsePrayerBoardTemplateConfig({ version: 1, templateId: 'heritage-classic' });
    const bold = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'bold-countdown-focus',
    });
    const data = buildPrayerBoardData({ dashboard });

    expect(heritage.templateId).not.toBe(bold.templateId);
    expect(
      data.prayers.map((prayer) => ({
        name: prayer.name,
        localMinutes: prayer.startLocalMinutes,
        iqamahLocalMinutes: prayer.iqamahLocalMinutes,
        source: prayer.source,
      })),
    ).toEqual(before);
    expect(dashboard.prayers.map((prayer) => prayer.localMinutes)).toEqual(
      before.map((prayer) => prayer.localMinutes),
    );
    expect(data.sourceMode).toBe(dashboard.sourceMode);
    expect(data.timeZone).toBe('Australia/Sydney');
  });

  it('keeps optional weather isolated from authoritative prayer data', () => {
    const dashboard = sourcedSydneyDashboard();
    const core = buildPrayerBoardData({ dashboard, weather: null });
    const withWeather = buildPrayerBoardData({
      dashboard,
      weather: {
        state: 'stale',
        temperatureC: 18,
        summary: 'Cloudy',
        observedAtIso: '2026-08-21T05:30:00.000Z',
      },
    });

    expect(withWeather.weather).toMatchObject({ state: 'stale', temperatureC: 18 });
    expect(withWeather.prayers).toEqual(core.prayers);
    expect(withWeather.nextPrayer).toEqual(core.nextPrayer);
    expect(withWeather.sourceMode).toBe(core.sourceMode);
  });

  it('keeps template definitions addressable by stable id', () => {
    expect(getPrayerBoardTemplate('structured-split-board').label).toBe('Structured Split Board');
  });
});