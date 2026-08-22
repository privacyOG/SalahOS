import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { parsePrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import { initializeApplicationStorage } from '../platform/applicationStorage';
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

describe('MobilePrayerThemeSurface', () => {
  it('renders the selected prayer-board template and accent onto the Today presentation surface', async () => {
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

    const html = renderToStaticMarkup(
      <MobilePrayerThemeSurface>
        <main>Today</main>
      </MobilePrayerThemeSurface>,
    );

    expect(html).toContain('data-mobile-prayer-template="scenic-spiritual"');
    expect(html).toContain('data-mobile-prayer-accent="jewel"');
    expect(html).toContain('data-mobile-prayer-theme-version="1"');
  });

  it('falls back to Heritage Classic when no display theme is stored', async () => {
    const storage = new MemoryStorage();
    await initializeApplicationStorage(storage);

    const html = renderToStaticMarkup(
      <MobilePrayerThemeSurface>
        <main>Today</main>
      </MobilePrayerThemeSurface>,
    );

    expect(html).toContain('data-mobile-prayer-template="heritage-classic"');
  });
});
