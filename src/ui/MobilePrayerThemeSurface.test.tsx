import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import { initializeApplicationStorage } from '../platform/applicationStorage';
import {
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY,
  saveMobilePrayerBoardDisplayConfig,
} from '../platform/mobilePrayerBoardDisplayConfig';
import { savePrayerBoardDisplayConfig } from '../platform/prayerBoardDisplayConfig';
import type { KeyValueStorage } from '../platform/settingsStorage';
import { MobilePrayerThemeSurface } from './MobilePrayerThemeSurface';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function renderToday(): string {
  return renderToStaticMarkup(
    <MobilePrayerThemeSurface>
      <main>Today</main>
    </MobilePrayerThemeSurface>,
  );
}

describe('MobilePrayerThemeSurface', () => {
  it('migrates a legacy display selection once and then keeps Phone/Home independent', async () => {
    const storage = new MemoryStorage();
    savePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({
        version: 1,
        templateId: 'scenic-spiritual',
        accentPreset: 'jewel',
      }),
    );

    await initializeApplicationStorage(storage);

    expect(renderToday()).toContain('data-mobile-prayer-template="scenic-spiritual"');
    expect(renderToday()).toContain('data-mobile-prayer-accent="jewel"');

    savePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({ version: 1, templateId: 'structured-split-board' }),
    );

    expect(renderToday()).toContain('data-mobile-prayer-template="scenic-spiritual"');
    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'scenic-spiritual',
    );
    expect(storage.getItem('salahos.prayerBoardDisplayConfig')).toContain('structured-split-board');
  });

  it('uses the dedicated Phone/Home selection without changing the TV/Kiosk selection', async () => {
    const storage = new MemoryStorage();
    await initializeApplicationStorage(storage);
    savePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({ version: 1, templateId: 'structured-split-board' }),
    );
    saveMobilePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({
        version: 1,
        templateId: 'family-classroom',
        accentPreset: 'sandstone',
      }),
    );

    const html = renderToday();

    expect(html).toContain('data-mobile-prayer-template="family-classroom"');
    expect(html).toContain('data-mobile-prayer-accent="sandstone"');
    expect(storage.getItem('salahos.prayerBoardDisplayConfig')).toContain('structured-split-board');
  });

  it('seeds an independent Heritage Classic Phone/Home default when no legacy theme exists', async () => {
    const storage = new MemoryStorage();
    await initializeApplicationStorage(storage);

    expect(renderToday()).toContain('data-mobile-prayer-template="heritage-classic"');
    expect(storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY)).toContain(
      'heritage-classic',
    );
  });
});
