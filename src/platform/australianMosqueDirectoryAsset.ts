import {
  parseAustralianMosqueDirectory,
  type AustralianMosqueDirectory,
} from '../domain/australianMosqueDirectoryCombined';

export const AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL = '/data/australian-mosques-combined.json';

let pendingDirectory: Promise<AustralianMosqueDirectory> | null = null;

async function fetchAustralianMosqueDirectory(): Promise<AustralianMosqueDirectory> {
  const response = await fetch(AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, {
    cache: 'force-cache',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    throw new Error(
      `Australian mosque directory asset failed with HTTP ${String(response.status)}`,
    );
  }
  return parseAustralianMosqueDirectory((await response.json()) as unknown);
}

export function loadAustralianMosqueDirectoryAsset(): Promise<AustralianMosqueDirectory> {
  pendingDirectory ??= fetchAustralianMosqueDirectory().catch((error: unknown) => {
    pendingDirectory = null;
    throw error;
  });
  return pendingDirectory;
}
