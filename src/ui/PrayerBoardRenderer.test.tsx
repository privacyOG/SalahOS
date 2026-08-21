import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import { PrayerBoardRenderer, displayThemeForPrayerBoardConfig } from './PrayerBoardRenderer';
import { buildPrayerBoardPreviewData } from './prayerBoardPreviewData';

describe('configured prayer-board renderer', () => {
  it('renders the selected template with presentation-only module state and branding', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'family-classroom',
      primaryLocale: 'ar',
      timeFormat: 'h23',
      accentPreset: 'sandstone',
      moduleVisibility: {
        jumuah: false,
        'sunrise-sunset': false,
        dates: false,
      },
      branding: { mosqueName: { ar: 'مركز صلاح أو إس للتعلّم' } },
    });

    const markup = renderToStaticMarkup(
      <PrayerBoardRenderer data={buildPrayerBoardPreviewData('jumuah')} config={config} />,
    );

    expect(markup).toContain('data-prayer-board-template="family-classroom"');
    expect(markup).toContain('data-module-jumuah="off"');
    expect(markup).toContain('data-module-sunrise-sunset="off"');
    expect(markup).toContain('data-module-dates="off"');
    expect(markup).toContain('مركز صلاح أو إس للتعلّم');
    expect(markup).toContain('data-family-variant="sandstone"');
  });

  it('maps controlled accent presets onto validated display variants', () => {
    expect(
      displayThemeForPrayerBoardConfig(
        parsePrayerBoardTemplateConfig({ version: 1, accentPreset: 'neutral' }),
      ),
    ).toBe('classic');
    expect(
      displayThemeForPrayerBoardConfig(
        parsePrayerBoardTemplateConfig({ version: 1, accentPreset: 'jewel' }),
      ),
    ).toBe('emerald');
    expect(
      displayThemeForPrayerBoardConfig(
        parsePrayerBoardTemplateConfig({ version: 1, accentPreset: 'midnight' }),
      ),
    ).toBe('midnight');
  });

  it('keeps every representative preview state inside the same authoritative data shape', () => {
    for (const scenario of [
      'before-prayer',
      'near-athan',
      'between-athan-iqamah',
      'iqamah-now',
      'jumuah',
    ] as const) {
      const data = buildPrayerBoardPreviewData(scenario);
      expect(data.prayers.filter((prayer) => prayer.name !== 'sunrise')).toHaveLength(5);
      expect(data.sourceMode).toBe('calculated');
      expect(data.timeZone).toBe('Australia/Sydney');
      expect(data.nextPrayer).not.toBeNull();
    }
  });
});
