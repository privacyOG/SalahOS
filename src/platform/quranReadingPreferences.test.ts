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
  it('loads safe offline defaults from empty or malformed storage', () => {
    const storage = new MemoryStorage();
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
    storage.setItem(QURAN_READING_PREFERENCES_STORAGE_KEY, '{invalid');
    expect(loadQuranReadingPreferences(storage)).toEqual(defaultQuranReadingPreferences);
  });

  it('round-trips translation, typography, reading mode, bookmarks and last-read state', () => {
    const storage = new MemoryStorage();
    const preferences = parseQuranReadingPreferences({
      version: 1,
      translationMode: 'none',
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

  it('migrates legacy preferences to the bundled font and List reading mode', () => {
    expect(parseQuranReadingPreferences({ arabicFont: 'naskh' }).arabicFont).toBe('amiri-quran');
    expect(parseQuranReadingPreferences({ arabicFont: 'traditional' }).arabicFont).toBe(
      'amiri-quran',
    );
    expect(parseQuranReadingPreferences({ translationMode: 'none' }).readingMode).toBe('list');
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
