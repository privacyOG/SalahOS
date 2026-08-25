import { describe, expect, it } from 'vitest';

import {
  getQuranOfflineAyah,
  parseQuranVerseKey,
  searchQuranOfflinePack,
  type QuranOfflinePack,
} from './quranOfflineLibrary';

const fixture = {
  schemaVersion: 1,
  counts: { surahs: 114, ayahs: 6236 },
  sources: {
    arabic: {
      id: 'quran-uthmani-text',
      upstream: 'fixture',
      commit: 'fixture',
      license: 'fixture',
    },
    translations: {
      'pickthall-1930': {
        sourceId: 'quran-pickthall-1930',
        upstream: 'fixture',
        commit: 'fixture',
        translator: 'Mohammed Marmaduke Pickthall',
      },
    },
  },
  surahs: [
    {
      surah: 1,
      nameArabic: 'الفاتحة',
      nameTransliteration: 'Al-Fatihah',
      nameEnglish: 'The Opening',
      ayahs: [
        {
          ayah: 1,
          key: '1:1',
          arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translations: {
            'pickthall-1930': 'In the name of Allah, the Beneficent, the Merciful.',
          },
          juz: 1,
          page: 1,
        },
      ],
    },
    {
      surah: 114,
      nameArabic: 'الناس',
      nameTransliteration: 'An-Nas',
      nameEnglish: 'Mankind',
      ayahs: [
        {
          ayah: 6,
          key: '114:6',
          arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ',
          translations: { 'pickthall-1930': 'Of the jinn and of mankind.' },
          juz: 30,
          page: 604,
        },
      ],
    },
  ],
} as unknown as QuranOfflinePack;

describe('complete offline Qur’an library navigation', () => {
  it('parses canonical verse keys and rejects invalid positions', () => {
    expect(parseQuranVerseKey('114:6')).toEqual({ surah: 114, ayah: 6 });
    expect(parseQuranVerseKey('1:1')).toEqual({ surah: 1, ayah: 1 });
    expect(parseQuranVerseKey('115:1')).toBeNull();
    expect(parseQuranVerseKey('1:0')).toBeNull();
    expect(parseQuranVerseKey('not-a-verse')).toBeNull();
  });

  it('resolves exact ayat by canonical key', () => {
    expect(getQuranOfflineAyah(fixture, '114:6')?.ayah.arabic).toBe('مِنَ الْجِنَّةِ وَالنَّاسِ');
    expect(getQuranOfflineAyah(fixture, '2:255')).toBeNull();
  });

  it('searches exact keys, Arabic, translation and surah metadata', () => {
    expect(searchQuranOfflinePack(fixture, '114:6').map((result) => result.ayah.key)).toEqual([
      '114:6',
    ]);
    expect(searchQuranOfflinePack(fixture, 'Beneficent').map((result) => result.ayah.key)).toEqual([
      '1:1',
    ]);
    expect(searchQuranOfflinePack(fixture, 'الفاتحة').map((result) => result.ayah.key)).toEqual([
      '1:1',
    ]);
    expect(searchQuranOfflinePack(fixture, 'Mankind').map((result) => result.ayah.key)).toEqual([
      '114:6',
    ]);
  });
});
