import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import {
  calculateMagneticDeclination,
  compassHeadingFromOrientation,
  installCompassHeadingListener,
  requestCompassPermission,
  trueHeadingFromNative,
} from './deviceCompass';

class FakeCompassTarget {
  readonly listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('device compass', () => {
  it('prefers the iOS WebKit compass heading when available', () => {
    expect(
      compassHeadingFromOrientation({
        alpha: 120,
        absolute: false,
        webkitCompassHeading: 277.5,
        webkitCompassAccuracy: 4,
      }),
    ).toEqual({
      headingDegrees: 277.5,
      accuracyDegrees: 4,
      source: 'webkit-compass',
    });
  });

  it('converts standards-based absolute alpha into a north-referenced heading', () => {
    expect(compassHeadingFromOrientation({ alpha: 90, absolute: true })).toEqual({
      headingDegrees: 270,
      accuracyDegrees: null,
      source: 'absolute-orientation',
    });
  });

  it('rejects relative orientation because it is not a reliable north reference', () => {
    expect(compassHeadingFromOrientation({ alpha: 90, absolute: false })).toBeNull();
  });

  it('installs and removes both supported orientation listeners', () => {
    const target = new FakeCompassTarget();
    const samples: number[] = [];
    const remove = installCompassHeadingListener(target, (sample) => {
      samples.push(sample.headingDegrees);
    });

    const event = Object.assign(new Event('deviceorientationabsolute'), {
      alpha: 45,
      absolute: true,
    });
    target.emit('deviceorientationabsolute', event);
    expect(samples).toEqual([315]);

    remove();
    target.emit('deviceorientationabsolute', event);
    expect(samples).toEqual([315]);
  });

  it('handles explicit permission APIs and denial without throwing', async () => {
    vi.stubGlobal('DeviceOrientationEvent', Object);
    await expect(requestCompassPermission(() => Promise.resolve('granted'))).resolves.toBe(
      'granted',
    );
    await expect(requestCompassPermission(() => Promise.resolve('denied'))).resolves.toBe('denied');
    await expect(
      requestCompassPermission(() => Promise.reject(new Error('blocked'))),
    ).resolves.toBe('denied');
  });

  it('uses native geographic heading directly and compensates screen rotation', () => {
    const sample = trueHeadingFromNative(
      { magneticHeading: 80, trueHeading: 100, accuracy: 3 },
      createCoordinates(-33.8688, 151.2093),
      90,
      new Date('2026-08-20T00:00:00.000Z'),
    );

    expect(sample).toEqual({
      headingDegrees: 190,
      accuracyDegrees: 3,
      source: 'native-true',
      reference: 'true-north',
    });
  });

  it('uses WMM2025 declination for magnetic-only headings', () => {
    const sydney = createCoordinates(-33.8688, 151.2093);
    const declination = calculateMagneticDeclination(
      sydney,
      new Date('2026-08-20T00:00:00.000Z'),
    );
    const sample = trueHeadingFromNative(
      { magneticHeading: 270, trueHeading: null, accuracy: 7 },
      sydney,
      0,
      new Date('2026-08-20T00:00:00.000Z'),
    );

    expect(declination).toBeGreaterThan(0);
    expect(declination).toBeLessThan(20);
    expect(sample.source).toBe('native-magnetic-wmm');
    expect(sample.reference).toBe('true-north');
    expect(sample.headingDegrees).toBeCloseTo((270 + declination) % 360, 2);
  });
});
