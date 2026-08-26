import { describe, expect, it, vi } from 'vitest';
import { requestCurrentLocation, type CurrentLocationDependencies } from './currentLocation';

function dependencies(
  overrides: Partial<CurrentLocationDependencies> = {},
): CurrentLocationDependencies {
  return {
    isNativePlatform: () => true,
    checkNativePermissions: () => Promise.resolve({ location: 'granted' }),
    requestNativePermissions: () => Promise.resolve({ location: 'granted' }),
    getNativeCurrentPosition: () =>
      Promise.resolve({
        coords: { latitude: -33.8688, longitude: 151.2093, accuracy: 8 },
        timestamp: Date.parse('2026-08-25T00:00:00.000Z'),
      }),
    requestBrowser: (options) =>
      Promise.resolve({
        ok: true,
        location: {
          coordinates: { latitude: 51.5072, longitude: -0.1276 },
          source: options.enableHighAccuracy ? 'browser-gps' : 'browser-network-approximate',
          accuracyMeters: options.enableHighAccuracy ? 15 : 800,
          capturedAtIso: '2026-08-25T00:00:00.000Z',
        },
      }),
    ...overrides,
  };
}

describe('requestCurrentLocation', () => {
  it('prefers a high-accuracy browser fix outside native shells', async () => {
    const requestBrowser = vi.fn((options: { readonly enableHighAccuracy?: boolean }) =>
      Promise.resolve({
        ok: true as const,
        location: {
          coordinates: { latitude: 51.5072, longitude: -0.1276 },
          source: options.enableHighAccuracy
            ? ('browser-gps' as const)
            : ('browser-network-approximate' as const),
          accuracyMeters: 12,
          capturedAtIso: '2026-08-25T00:00:00.000Z',
        },
      }),
    );
    const result = await requestCurrentLocation(
      dependencies({ isNativePlatform: () => false, requestBrowser }),
    );

    expect(requestBrowser).toHaveBeenCalledOnce();
    expect(requestBrowser).toHaveBeenCalledWith({
      enableHighAccuracy: true,
      timeoutMilliseconds: 12_000,
      maximumAgeMilliseconds: 0,
    });
    expect(result).toMatchObject({
      ok: true,
      location: {
        coordinates: { latitude: 51.5072, longitude: -0.1276 },
        source: 'browser-gps',
        accuracyMeters: 12,
      },
    });
  });

  it('falls back to browser network-assisted positioning after a precise timeout', async () => {
    const requestBrowser = vi
      .fn<CurrentLocationDependencies['requestBrowser']>()
      .mockResolvedValueOnce({ ok: false, reason: 'timeout' })
      .mockResolvedValueOnce({
        ok: true,
        location: {
          coordinates: { latitude: 51.5, longitude: -0.12 },
          source: 'browser-network-approximate',
          accuracyMeters: 1_200,
          capturedAtIso: '2026-08-25T00:00:00.000Z',
        },
      });

    const result = await requestCurrentLocation(
      dependencies({ isNativePlatform: () => false, requestBrowser }),
    );

    expect(requestBrowser).toHaveBeenCalledTimes(2);
    expect(requestBrowser).toHaveBeenLastCalledWith({
      enableHighAccuracy: false,
      timeoutMilliseconds: 10_000,
      maximumAgeMilliseconds: 60_000,
    });
    expect(result).toMatchObject({
      ok: true,
      location: { source: 'browser-network-approximate', accuracyMeters: 1_200 },
    });
  });

  it('returns the approximate browser failure when both acquisition tiers fail', async () => {
    const requestBrowser = vi
      .fn<CurrentLocationDependencies['requestBrowser']>()
      .mockResolvedValueOnce({ ok: false, reason: 'timeout' })
      .mockResolvedValueOnce({ ok: false, reason: 'unavailable' });

    await expect(
      requestCurrentLocation(dependencies({ isNativePlatform: () => false, requestBrowser })),
    ).resolves.toEqual({ ok: false, reason: 'unavailable' });
    expect(requestBrowser).toHaveBeenCalledTimes(2);
  });

  it('does not retry after a terminal browser permission denial', async () => {
    const requestBrowser = vi
      .fn<CurrentLocationDependencies['requestBrowser']>()
      .mockResolvedValue({ ok: false, reason: 'permission-denied' });

    await expect(
      requestCurrentLocation(dependencies({ isNativePlatform: () => false, requestBrowser })),
    ).resolves.toEqual({ ok: false, reason: 'permission-denied' });
    expect(requestBrowser).toHaveBeenCalledOnce();
  });

  it('uses granted native permission and retains location-quality metadata', async () => {
    const requestNativePermissions = vi.fn(() => Promise.resolve({ location: 'granted' }));
    const getNativeCurrentPosition = vi.fn(() =>
      Promise.resolve({
        coords: {
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 4,
        },
        timestamp: Date.parse('2026-08-25T00:00:00.000Z'),
      }),
    );
    const result = await requestCurrentLocation(
      dependencies({ requestNativePermissions, getNativeCurrentPosition }),
    );

    expect(requestNativePermissions).not.toHaveBeenCalled();
    expect(getNativeCurrentPosition).toHaveBeenCalledWith({
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 0,
    });
    expect(result).toEqual({
      ok: true,
      location: {
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
        source: 'native-gps',
        accuracyMeters: 4,
        capturedAtIso: '2026-08-25T00:00:00.000Z',
      },
    });
  });

  it('falls back to approximate native positioning after a precise failure', async () => {
    const getNativeCurrentPosition = vi
      .fn<CurrentLocationDependencies['getNativeCurrentPosition']>()
      .mockRejectedValueOnce(new Error('Location request timeout'))
      .mockResolvedValueOnce({
        coords: { latitude: -33.86, longitude: 151.2, accuracy: 900 },
        timestamp: Date.parse('2026-08-25T00:01:00.000Z'),
      });

    const result = await requestCurrentLocation(dependencies({ getNativeCurrentPosition }));

    expect(getNativeCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getNativeCurrentPosition).toHaveBeenLastCalledWith({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 60_000,
    });
    expect(result).toMatchObject({
      ok: true,
      location: { source: 'native-network-approximate', accuracyMeters: 900 },
    });
  });

  it('retains the approximate native failure after both acquisition tiers fail', async () => {
    const getNativeCurrentPosition = vi
      .fn<CurrentLocationDependencies['getNativeCurrentPosition']>()
      .mockRejectedValueOnce(new Error('Location request timeout'))
      .mockRejectedValueOnce(new Error('Position unavailable'));

    await expect(
      requestCurrentLocation(dependencies({ getNativeCurrentPosition })),
    ).resolves.toEqual({ ok: false, reason: 'unavailable' });
    expect(getNativeCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('requests permission when needed and fails closed when denied', async () => {
    const requestNativePermissions = vi.fn(() => Promise.resolve({ location: 'denied' }));
    const getNativeCurrentPosition = vi.fn(() =>
      Promise.resolve({ coords: { latitude: -33.8688, longitude: 151.2093 } }),
    );
    const result = await requestCurrentLocation(
      dependencies({
        checkNativePermissions: () => Promise.resolve({ location: 'prompt' }),
        requestNativePermissions,
        getNativeCurrentPosition,
      }),
    );

    expect(requestNativePermissions).toHaveBeenCalledOnce();
    expect(getNativeCurrentPosition).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'permission-denied' });
  });
});
