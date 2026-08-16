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
      Promise.resolve({ coords: { latitude: -33.8688, longitude: 151.2093 } }),
    requestBrowser: () =>
      Promise.resolve({
        ok: true,
        location: {
          coordinates: { latitude: 51.5072, longitude: -0.1276 },
          source: 'browser',
        },
      }),
    ...overrides,
  };
}

describe('requestCurrentLocation', () => {
  it('keeps the existing browser adapter outside native shells', async () => {
    const requestBrowser = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        location: {
          coordinates: { latitude: 51.5072, longitude: -0.1276 },
          source: 'browser' as const,
        },
      }),
    );
    const result = await requestCurrentLocation(
      dependencies({ isNativePlatform: () => false, requestBrowser }),
    );

    expect(requestBrowser).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ok: true,
      location: {
        coordinates: { latitude: 51.5072, longitude: -0.1276 },
        source: 'browser',
      },
    });
  });

  it('uses a granted native permission and retains only coordinates', async () => {
    const requestNativePermissions = vi.fn(() => Promise.resolve({ location: 'granted' }));
    const getNativeCurrentPosition = vi.fn(() =>
      Promise.resolve({
        coords: {
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 4,
          altitude: 12,
          heading: 90,
          speed: 1,
        },
        timestamp: 123,
      }),
    );
    const result = await requestCurrentLocation(
      dependencies({ requestNativePermissions, getNativeCurrentPosition }),
    );

    expect(requestNativePermissions).not.toHaveBeenCalled();
    expect(getNativeCurrentPosition).toHaveBeenCalledWith({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 300_000,
    });
    expect(result).toEqual({
      ok: true,
      location: {
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
        source: 'native',
      },
    });
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

  it('normalizes native timeout failures', async () => {
    const result = await requestCurrentLocation(
      dependencies({
        getNativeCurrentPosition: () => Promise.reject(new Error('Location request timeout')),
      }),
    );

    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });
});
