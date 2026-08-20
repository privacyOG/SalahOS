import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  DEFAULT_SMART_DISPLAY_THEME,
  loadSmartDisplayTheme,
  parseSmartDisplayTheme,
  saveSmartDisplayTheme,
  SMART_DISPLAY_THEME_STORAGE_KEY,
  smartDisplayThemes,
} from './smartDisplayTheme';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

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

describe('smart-display themes', () => {
  it('publishes a deterministic unique preset registry', () => {
    expect(smartDisplayThemes.map((theme) => theme.id)).toEqual([
      'classic',
      'midnight',
      'sandstone',
      'emerald',
    ]);
    expect(new Set(smartDisplayThemes.map((theme) => theme.id)).size).toBe(
      smartDisplayThemes.length,
    );
  });

  it('defaults invalid or missing persisted values to Classic', () => {
    expect(parseSmartDisplayTheme(null)).toBe(DEFAULT_SMART_DISPLAY_THEME);
    expect(parseSmartDisplayTheme('unknown')).toBe(DEFAULT_SMART_DISPLAY_THEME);
  });

  it('persists and reloads an explicit display theme independently', () => {
    const storage = new MemoryStorage();

    saveSmartDisplayTheme(storage, 'midnight');

    expect(storage.getItem(SMART_DISPLAY_THEME_STORAGE_KEY)).toBe('midnight');
    expect(loadSmartDisplayTheme(storage)).toBe('midnight');
  });
});
