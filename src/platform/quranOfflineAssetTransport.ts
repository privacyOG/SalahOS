export function quranOfflineAssetTransportAvailable(): boolean {
  return typeof globalThis.fetch === 'function';
}

export async function fetchQuranOfflineAsset(path: string): Promise<Response> {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`Qur’an offline preparation only permits same-origin absolute paths: ${path}`);
  }

  return globalThis.fetch(path, {
    cache: 'reload',
    credentials: 'same-origin',
    redirect: 'error',
  });
}
