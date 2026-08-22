import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import { initializeApplicationStorage } from '../platform/applicationStorage';
import { saveMobilePrayerBoardDisplayConfig } from '../platform/mobilePrayerBoardDisplayConfig';
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
  it('uses the legacy display selection as an upgrade-compatible Phone/Home fallback', async () => {
    const storage = new MemoryStorage();
    await initializeApplicationStorage(storage);
    savePrayerBoardDisplayConfig(
      storage,
      parsePrayerBoardTemplateConfig({
        version: 1,
        templateId: 'scenic-spiritual',
        accentPreset: 'jewel',
      }),
    );

    const html = renderToday();

    expect(html).toContain('data-mobile-prayer-template="scenic-spiritual"');
    expect(html).toContain('data-mobile-prayer-accent="jewel"');
    expect(html).toContain('data-mobile-prayer-theme-version="1"');
  });

  it('prefers the dedicated Phone/Home selection without changing the TV/Kiosk selection', async () => {
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

  it('falls back to Heritage Classic when no display theme is stored', async () => {
    const storage = new MemoryStorage();
    await initializeApplicationStorage(storage);

    expect(renderToday()).toContain('data-mobile-prayer-template="heritage-classic"');
  });
});
