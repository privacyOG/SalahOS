import rawDirectory from '../../public/data/australian-mosques-combined.json';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('Australian mosque directory asset', () => {
  it('loads and validates the fixed same-origin offline catalogue', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(rawDirectory), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, loadAustralianMosqueDirectoryAsset } =
      await import('./australianMosqueDirectoryAsset');

    const directory = await loadAustralianMosqueDirectoryAsset();

    expect(AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL).toBe('/data/australian-mosques-combined.json');
    expect(directory.source.recordCount).toBe(254);
    expect(directory.records).toHaveLength(254);
    expect(fetchMock).toHaveBeenCalledWith(AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, {
      cache: 'force-cache',
      credentials: 'same-origin',
    });
  });

  it('fails closed when the packaged catalogue cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const { loadAustralianMosqueDirectoryAsset } = await import('./australianMosqueDirectoryAsset');

    await expect(loadAustralianMosqueDirectoryAsset()).rejects.toThrow('HTTP 503');
  });

  it('clears a rejected pending request so the packaged catalogue can be retried', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const { AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, loadAustralianMosqueDirectoryAsset } =
      await import('./australianMosqueDirectoryAsset');

    await expect(loadAustralianMosqueDirectoryAsset()).rejects.toThrow('offline');
    await expect(loadAustralianMosqueDirectoryAsset()).rejects.toThrow('HTTP 503');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, {
      cache: 'force-cache',
      credentials: 'same-origin',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, AUSTRALIAN_MOSQUE_DIRECTORY_ASSET_URL, {
      cache: 'force-cache',
      credentials: 'same-origin',
    });
  });
});
