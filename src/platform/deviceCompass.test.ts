import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  compassHeadingFromOrientation,
  installCompassHeadingListener,
  requestCompassPermission,
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
});
