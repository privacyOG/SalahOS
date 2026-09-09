import { afterEach, describe, expect, it } from 'vitest';

import {
  loadQuranOfflinePack,
  resetQuranOfflinePackCache,
  type QuranOfflinePack,
  type QuranPackFetcher,
} from './quranOfflineLibrary';

function completePack(): QuranOfflinePack {
  const counts = Array.from({ length: 114 }, (_, index) => (index < 80 ? 55 : 54));
  return {
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
    surahs: counts.map((ayahCount, index) => {
      const surah = index + 1;
      return {
        surah,
        nameArabic: `سورة ${String(surah)}`,
        nameTransliteration: `Surah ${String(surah)}`,
        nameEnglish: `Surah ${String(surah)}`,
        revelationPlace: 'meccan' as const,
        ayahs: Array.from({ length: ayahCount }, (_, ayahIndex) => {
          const ayah = ayahIndex + 1;
          return {
            ayah,
            key: `${String(surah)}:${String(ayah)}`,
            arabic: 'نص',
            translations: { 'pickthall-1930': 'Text' },
            juz: Math.min(30, Math.ceil(surah / 4)),
            page: Math.min(604, surah),
          };
        }),
      };
    }),
  };
}

function okResponse(pack: QuranOfflinePack) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(pack) });
}

afterEach(() => {
  resetQuranOfflinePackCache();
});

describe('offline Qur’an pack retry recovery', () => {
  it('performs a fresh request after an HTTP failure', async () => {
    const pack = completePack();
    let calls = 0;
    const fetcher: QuranPackFetcher = async () => {
      calls += 1;
      if (calls === 1) return { ok: false, status: 503, json: () => Promise.resolve({}) };
      return okResponse(pack);
    };

    await expect(loadQuranOfflinePack(fetcher)).rejects.toThrow('HTTP 503');
    await expect(loadQuranOfflinePack(fetcher)).resolves.toBe(pack);
    expect(calls).toBe(2);
  });

  it('performs a fresh request after a network rejection', async () => {
    const pack = completePack();
    let calls = 0;
    const fetcher: QuranPackFetcher = async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('offline');
      return okResponse(pack);
    };

    await expect(loadQuranOfflinePack(fetcher)).rejects.toThrow('offline');
    await expect(loadQuranOfflinePack(fetcher)).resolves.toBe(pack);
    expect(calls).toBe(2);
  });

  it('performs a fresh request after malformed packaged data', async () => {
    const pack = completePack();
    let calls = 0;
    const fetcher: QuranPackFetcher = async () => {
      calls += 1;
      return calls === 1
        ? { ok: true, status: 200, json: () => Promise.resolve({ schemaVersion: 99 }) }
        : okResponse(pack);
    };

    await expect(loadQuranOfflinePack(fetcher)).rejects.toThrow('schema version');
    await expect(loadQuranOfflinePack(fetcher)).resolves.toBe(pack);
    expect(calls).toBe(2);
  });

  it('still shares one successful in-flight request between concurrent callers', async () => {
    const pack = completePack();
    let calls = 0;
    const fetcher: QuranPackFetcher = async () => {
      calls += 1;
      return okResponse(pack);
    };

    const [first, second] = await Promise.all([
      loadQuranOfflinePack(fetcher),
      loadQuranOfflinePack(fetcher),
    ]);

    expect(first).toBe(pack);
    expect(second).toBe(pack);
    expect(calls).toBe(1);
  });
});
