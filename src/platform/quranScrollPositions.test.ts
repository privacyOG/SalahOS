import { describe, expect, it } from 'vitest';

import {
  persistQuranScrollPosition,
  quranScrollPositionForSurah,
  type QuranScrollPositionStorage,
} from './quranScrollPositions';

function memoryStorage(): QuranScrollPositionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('Qur’an per-surah scroll positions', () => {
  it('persists and restores independent offsets by surah', () => {
    const storage = memoryStorage();
    persistQuranScrollPosition(2, 1840, storage);
    persistQuranScrollPosition(36, 420, storage);

    expect(quranScrollPositionForSurah(2, storage)).toBe(1840);
    expect(quranScrollPositionForSurah(36, storage)).toBe(420);
    expect(quranScrollPositionForSurah(1, storage)).toBe(0);
  });

  it('ignores invalid values and corrupted storage', () => {
    const storage = memoryStorage();
    storage.setItem('salahos.quran.scroll-positions.v1', '{bad-json');

    expect(quranScrollPositionForSurah(2, storage)).toBe(0);
    persistQuranScrollPosition(0, 50, storage);
    persistQuranScrollPosition(2, -1, storage);
    expect(quranScrollPositionForSurah(2, storage)).toBe(0);
  });
});