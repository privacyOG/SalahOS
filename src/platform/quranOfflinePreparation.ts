import { Capacitor } from '@capacitor/core';

import manifest from '../data/quran-offline-manifest.json';
import { validateQuranOfflinePack } from '../domain/quranOfflineLibrary';
import {
  fetchQuranOfflineAsset,
  quranOfflineAssetTransportAvailable,
} from './quranOfflineAssetTransport';

export type QuranOfflinePreparationState = 'preparing' | 'ready' | 'unavailable' | 'native-bundled';

export const QURAN_OFFLINE_FONT_PATH = '/fonts/amiri-quran-arabic.woff2';
export const QURAN_OFFLINE_CACHE_PREFIX = 'salahos-quran-offline-';
export const QURAN_OFFLINE_CACHE_NAME = `${QURAN_OFFLINE_CACHE_PREFIX}${manifest.sha256.slice(0, 12)}`;

const CORE_URLS = Object.freeze(['/', manifest.packPath, QURAN_OFFLINE_FONT_PATH] as const);

function cacheApiAvailable(): boolean {
  return typeof globalThis.caches !== 'undefined' && quranOfflineAssetTransportAvailable();
}

function sameOriginAssetUrls(): readonly string[] {
  if (typeof document === 'undefined' || typeof location === 'undefined') return [];
  const origin = location.origin;
  const urls = new Set<string>();

  for (const node of document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
    'script[src], link[rel="stylesheet"][href]',
  )) {
    const raw = node instanceof HTMLScriptElement ? node.src : node.href;
    try {
      const url = new URL(raw, location.href);
      if (url.origin === origin) urls.add(`${url.pathname}${url.search}`);
    } catch {
      // Ignore malformed third-party DOM URLs; they are not required for offline preparation.
    }
  }

  if (typeof performance !== 'undefined') {
    for (const entry of performance.getEntriesByType('resource')) {
      try {
        const url = new URL(entry.name, location.href);
        if (url.origin === origin && url.pathname.startsWith('/assets/')) {
          urls.add(`${url.pathname}${url.search}`);
        }
      } catch {
        // Ignore malformed performance entries.
      }
    }
  }

  return Object.freeze([...urls]);
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const cryptoCandidate = Reflect.get(globalThis, 'crypto') as Crypto | undefined;
  if (cryptoCandidate === undefined) {
    throw new Error('Web Crypto is unavailable; Qur’an pack integrity cannot be verified.');
  }
  const digest = await cryptoCandidate.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchVerifiedPack(): Promise<Response> {
  const response = await fetchQuranOfflineAsset(manifest.packPath);
  if (!response.ok) {
    throw new Error(`Qur’an pack preparation failed (HTTP ${String(response.status)}).`);
  }

  const bytes = await response.clone().arrayBuffer();
  const actualHash = await sha256Hex(bytes);
  if (actualHash !== manifest.sha256) {
    throw new Error(
      `Qur’an pack integrity mismatch: expected ${manifest.sha256}, got ${actualHash}.`,
    );
  }
  validateQuranOfflinePack(await response.clone().json());
  return response;
}

async function fetchRequiredAsset(path: string): Promise<Response> {
  const response = await fetchQuranOfflineAsset(path);
  if (!response.ok)
    throw new Error(`Required offline asset ${path} returned HTTP ${String(response.status)}.`);
  return response;
}

async function prunePreviousQuranCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter(
        (name) => name.startsWith(QURAN_OFFLINE_CACHE_PREFIX) && name !== QURAN_OFFLINE_CACHE_NAME,
      )
      .map((name) => caches.delete(name)),
  );
}

export async function inspectQuranOfflinePreparation(): Promise<QuranOfflinePreparationState> {
  if (Capacitor.isNativePlatform()) return 'native-bundled';
  if (!cacheApiAvailable()) return 'unavailable';

  const required = await Promise.all(CORE_URLS.map((path) => caches.match(path)));
  return required.every(Boolean) ? 'ready' : 'unavailable';
}

export async function prepareQuranOffline(): Promise<QuranOfflinePreparationState> {
  if (Capacitor.isNativePlatform()) return 'native-bundled';
  if (!cacheApiAvailable()) return 'unavailable';

  try {
    const cache = await caches.open(QURAN_OFFLINE_CACHE_NAME);
    const packResponse = await fetchVerifiedPack();
    const fontResponse = await fetchRequiredAsset(QURAN_OFFLINE_FONT_PATH);
    const rootResponse = await fetchRequiredAsset('/');

    await Promise.all([
      cache.put(manifest.packPath, packResponse.clone()),
      cache.put(QURAN_OFFLINE_FONT_PATH, fontResponse.clone()),
      cache.put('/', rootResponse.clone()),
    ]);

    const routeAssets = sameOriginAssetUrls();
    await Promise.all(
      routeAssets.map(async (path) => {
        const response = await fetchRequiredAsset(path);
        await cache.put(path, response.clone());
      }),
    );

    await prunePreviousQuranCaches();
    return (await inspectQuranOfflinePreparation()) === 'ready' ? 'ready' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
