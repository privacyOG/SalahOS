import { describe, expect, it } from 'vitest';
import { requestBrowserLocation } from './browserGeolocation';

function successfulGeolocation(): Geolocation {
  return {
    getCurrentPosition(success) {
      success({
        coords: {
          latitude: -33.8688,
          longitude: 151.2093,
          accuracy: 25,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.parse('2026-08-16T00:00:00.000Z'),
        toJSON: () => ({}),
      });
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
  it('returns an explicit browser location fix from a one-shot request', async () => {
    const result = await requestBrowserLocation(successfulGeolocation());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected successful location result');
    }

    expect(result.location.coordinates).toEqual({ latitude: -33.8688, longitude: 151.2093 });
    expect(result.location.accuracyMetres).toBe(25);
    expect(result.location.source).toBe('browser');
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
