import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

import { Capacitor } from '@capacitor/core';

import manifest from '../data/quran-offline-manifest.json';
import {
  inspectQuranOfflinePreparation,
  prepareQuranOffline,
  QURAN_OFFLINE_CACHE_NAME,
  QURAN_OFFLINE_FONT_PATH,
} from './quranOfflinePreparation';

function completePack() {
  const counts = Array.from({ length: 114 }, (_, index) => (index < 80 ? 55 : 54));
  return {
    schemaVersion: 1,
    counts: { surahs: 114, ayahs: 6236 },
    sources: {
      arabic: { id: 'fixture', upstream: 'fixture', commit: 'fixture', license: 'fixture' },
      translations: {
        'pickthall-1930': {
          sourceId: 'fixture',
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
        revelationPlace: 'meccan',
        ayahs: Array.from({ length: ayahCount }, (_, ayahIndex) => {
          const ayah = ayahIndex + 1;
          return {
            ayah,
            key: `${String(surah)}:${String(ayah)}`,
            arabic: 'نص',
            translations: { 'pickthall-1930': 'Text' },
            juz: 1,
            page: 1,
          };
        }),
      };
    }),
  };
}

type CacheRecord = Map<string, Response>;

function requestKey(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function installCacheMock() {
  const stores = new Map<string, CacheRecord>();
  const cacheFor = (name: string) => {
    let store = stores.get(name);
    if (!store) {
      store = new Map();
      stores.set(name, store);
    }
    const resolvedStore = store;
    return {
      put: (path: RequestInfo | URL, response: Response) => {
        resolvedStore.set(requestKey(path), response);
        return Promise.resolve();
      },
    };
  };

  vi.stubGlobal('caches', {
    open: (name: string) => Promise.resolve(cacheFor(name)),
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name: string) => Promise.resolve(stores.delete(name)),
    match: (path: RequestInfo | URL) => {
      for (const store of stores.values()) {
        const response = store.get(requestKey(path));
        if (response) return Promise.resolve(response.clone());
      }
      return Promise.resolve(undefined);
    },
  });
  return stores;
}

beforeEach(() => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Qur’an offline preparation', () => {
  it('reports native builds as bundled without requiring browser caches', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    expect(await inspectQuranOfflinePreparation()).toBe('native-bundled');
    expect(await prepareQuranOffline()).toBe('native-bundled');
  });

  it('does not claim ready when browser cache support is unavailable', async () => {
    vi.stubGlobal('caches', undefined);
    expect(await inspectQuranOfflinePreparation()).toBe('unavailable');
  });

  it('prepares and verifies the corpus, font and shell before reporting ready', async () => {
    const stores = installCacheMock();
    const expectedDigest = Uint8Array.from(Buffer.from(manifest.sha256, 'hex')).buffer;
    vi.stubGlobal('crypto', {
      subtle: { digest: vi.fn(() => Promise.resolve(expectedDigest)) },
    });

    const pack = completePack();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const path = requestKey(input);
        if (path === manifest.packPath) {
          return Promise.resolve(
            new Response(JSON.stringify(pack), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }
        if (path === QURAN_OFFLINE_FONT_PATH || path === '/') {
          return Promise.resolve(new Response('asset', { status: 200 }));
        }
        return Promise.resolve(new Response('missing', { status: 404 }));
      }),
    );

    expect(await prepareQuranOffline()).toBe('ready');
    expect(await inspectQuranOfflinePreparation()).toBe('ready');
    expect(stores.get(QURAN_OFFLINE_CACHE_NAME)?.has(manifest.packPath)).toBe(true);
    expect(stores.get(QURAN_OFFLINE_CACHE_NAME)?.has(QURAN_OFFLINE_FONT_PATH)).toBe(true);
    expect(stores.get(QURAN_OFFLINE_CACHE_NAME)?.has('/')).toBe(true);
  });

  it('returns unavailable rather than ready after an interrupted preparation', async () => {
    installCacheMock();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))));
    expect(await prepareQuranOffline()).toBe('unavailable');
  });
});
