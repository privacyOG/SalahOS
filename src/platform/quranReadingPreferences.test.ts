import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  QURAN_READING_PREFERENCES_STORAGE_KEY,
  defaultQuranReadingPreferences,
  loadQuranReadingPreferences,
  parseQuranReadingPreferences,
  saveQuranReadingPreferences,
  setQuranLastRead,
  toggleQuranBookmark,
} from './quranReadingPreferences';

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

describe('Quran reading preferences', () => {
  it('loads SalahOS 2026 as the safe offline default', () => {
    const storage = new MemoryStorage();
    expect(defaultQuranReadingPreferences.version).toBe(2);
    expect(defaultQuranReadingPreferences.translationMode).toBe('salahos-2026');
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
    storage.setItem(QURAN_READING_PREFERENCES_STORAGE_KEY, '{invalid');
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
  });

  it('round-trips translation, typography, reading mode, bookmarks and last-read state', () => {
    const storage = new MemoryStorage();
    const preferences = parseQuranReadingPreferences({
      version: 2,
      translationMode: 'salahos-2026',
      arabicFont: 'system',
      fontScale: 'large',
      readingMode: 'page',
      bookmarkedAyahIds: ['quran-prayer-remembrance', 'quran-prayer-remembrance'],
      lastReadAyahId: 'quran-patience-prayer',
    });
    saveQuranReadingPreferences(storage, preferences);
    expect(loadQuranReadingPreferences(storage)).toEqual({
      ...preferences,
      bookmarkedAyahIds: ['quran-prayer-remembrance'],
    });
  });

  it('migrates the legacy Pickthall default to SalahOS 2026 without losing reader state', () => {
    const migrated = parseQuranReadingPreferences({
      version: 1,
      translationMode: 'pickthall-1930',
      bookmarkedAyahIds: ['3:1'],
      lastReadAyahId: '3:2',
    });
    expect(migrated.version).toBe(2);
    expect(migrated.translationMode).toBe('salahos-2026');
    expect(migrated.bookmarkedAyahIds).toEqual(['3:1']);
    expect(migrated.lastReadAyahId).toBe('3:2');
  });

  it('preserves deliberate V2 Pickthall and Arabic-only choices while migrating typography', () => {
    expect(parseQuranReadingPreferences({ arabicFont: 'naskh' }).arabicFont).toBe('amiri-quran');
    expect(parseQuranReadingPreferences({ arabicFont: 'traditional' }).arabicFont).toBe(
      'amiri-quran',
    );
    expect(
      parseQuranReadingPreferences({ version: 2, translationMode: 'pickthall-1930' })
        .translationMode,
    ).toBe('pickthall-1930');
    expect(
      parseQuranReadingPreferences({ version: 1, translationMode: 'none' }).translationMode,
    ).toBe('none');
    expect(parseQuranReadingPreferences({ translationMode: 'none' }).readingMode).toBe('list');
    expect(parseQuranReadingPreferences({ translationMode: 'unknown' }).translationMode).toBe(
      'salahos-2026',
    );
  });

  it('toggles bookmarks without mutating the prior state', () => {
    const bookmarked = toggleQuranBookmark(
      defaultQuranReadingPreferences,
      'quran-prayer-remembrance',
    );
    expect(bookmarked.bookmarkedAyahIds).toEqual(['quran-prayer-remembrance']);
    expect(defaultQuranReadingPreferences.bookmarkedAyahIds).toEqual([]);
    expect(toggleQuranBookmark(bookmarked, 'quran-prayer-remembrance').bookmarkedAyahIds).toEqual(
      [],
    );
  });

  it('tracks the last-read ayah independently from bookmarks', () => {
    const updated = setQuranLastRead(defaultQuranReadingPreferences, 'quran-friday-prayer');
    expect(updated.lastReadAyahId).toBe('quran-friday-prayer');
    expect(updated.bookmarkedAyahIds).toEqual([]);
  });
});
