import { describe, expect, it } from 'vitest';
import { requestBrowserLocation } from './browserGeolocation';

function position(): GeolocationPosition {
  return {
    coords: {
      latitude: -33.8688,
      longitude: 151.2093,
      accuracy: 25,
      altitude: 123,
      altitudeAccuracy: 5,
      heading: 180,
      speed: 8,
      toJSON: () => ({}),
    },
    timestamp: Date.parse('2026-08-16T00:00:00.000Z'),
    toJSON: () => ({}),
  };
}

function successfulGeolocation(): Geolocation {
  return {
    getCurrentPosition(success) {
      success(position());
    },
    watchPosition: () => 0,
    clearWatch: () => undefined,
  };
}

function failingGeolocation(code: 1 | 2 | 3): Geolocation {
  return {
    getCurrentPosition(_success, error) {
      error?.({
        code,
        message: 'test failure',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    },
    watchPosition: () => 0,
    clearWatch: () => undefined,
  };
}

describe('requestBrowserLocation', () => {
  it('retains only coordinates plus useful accuracy/freshness metadata', async () => {
    const result = await requestBrowserLocation(successfulGeolocation());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected successful location result');

    expect(result.location).toEqual({
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      source: 'browser-network-approximate',
      accuracyMeters: 25,
      capturedAtIso: '2026-08-16T00:00:00.000Z',
    });
    expect(Object.keys(result.location).sort()).toEqual([
      'accuracyMeters',
      'capturedAtIso',
      'coordinates',
      'source',
    ]);
  });

  it('uses one low-accuracy request by default and never starts a location watch', async () => {
    let currentRequests = 0;
    let watchRequests = 0;
    let receivedOptions: PositionOptions | undefined;
    const geolocation: Geolocation = {
      getCurrentPosition(success, _error, options) {
        currentRequests += 1;
        receivedOptions = options;
        success(position());
      },
      watchPosition() {
        watchRequests += 1;
        return 1;
      },
      clearWatch: () => undefined,
    };

    await requestBrowserLocation(geolocation);

    expect(currentRequests).toBe(1);
    expect(watchRequests).toBe(0);
    expect(receivedOptions).toEqual({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 300_000,
    });
  });

  it('marks explicitly requested high accuracy as GPS-preferred', async () => {
    let receivedOptions: PositionOptions | undefined;
    const geolocation: Geolocation = {
      getCurrentPosition(success, _error, options) {
        receivedOptions = options;
        success(position());
      },
      watchPosition: () => 0,
      clearWatch: () => undefined,
    };

    const result = await requestBrowserLocation(geolocation, { enableHighAccuracy: true });

    expect(receivedOptions?.enableHighAccuracy).toBe(true);
    expect(result).toMatchObject({ ok: true, location: { source: 'browser-gps' } });
  });

  it('handles unsupported geolocation without throwing', async () => {
    await expect(requestBrowserLocation(undefined)).resolves.toEqual({
      ok: false,
      reason: 'unsupported',
    });
  });

  it.each([
    [1, 'permission-denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ] as const)('maps browser error %s to %s', async (code, reason) => {
    await expect(requestBrowserLocation(failingGeolocation(code))).resolves.toEqual({
      ok: false,
      reason,
    });
  });
});
