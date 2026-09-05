import { describe, expect, it } from 'vitest';

import type { QuranOfflineSearchResult } from '../domain/quranOfflineLibrary';
import {
  QURAN_VIRTUAL_ESTIMATED_ROW_HEIGHT,
  quranVirtualWindow,
} from './QuranVirtualizedAyahList';

function fixtureResults(count: number): readonly QuranOfflineSearchResult[] {
  return Array.from({ length: count }, (_, index) => ({
    surah: {
      surah: 2,
      nameArabic: 'البقرة',
      nameTransliteration: 'Al-Baqarah',
      nameEnglish: 'The Cow',
      revelationPlace: 'medinan' as const,
      ayahs: [],
    },
    ayah: {
      ayah: index + 1,
      key: `2:${String(index + 1)}`,
      arabic: 'آية',
      translations: { 'pickthall-1930': 'Verse' },
      juz: 1,
      page: 2,
    },
  }));
}

describe('Qur’an dependency-free virtualization', () => {
  it('keeps Al-Baqarah initial rendering to a bounded window instead of all 286 ayat', () => {
    const items = fixtureResults(286);
    const window = quranVirtualWindow(items, 0, 720);

    expect(window.start).toBe(0);
    expect(window.end).toBeLessThan(20);
    expect(window.end).toBeLessThan(items.length);
    expect(window.afterHeight).toBeGreaterThan(0);
  });

  it('moves the window continuously with scroll offset and honours measured row heights', () => {
    const items = fixtureResults(286);
    const measured = new Map<string, number>([['2:1', 560]]);
    const window = quranVirtualWindow(
      items,
      QURAN_VIRTUAL_ESTIMATED_ROW_HEIGHT * 20,
      720,
      measured,
    );

    expect(window.start).toBeGreaterThan(10);
    expect(window.end).toBeLessThan(40);
    expect(window.beforeHeight).toBeGreaterThan(0);
  });
});