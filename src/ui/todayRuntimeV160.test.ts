import { describe, expect, it, vi } from 'vitest';

import {
  installRuntimeRefreshListeners,
  type RuntimeDocumentTarget,
  type RuntimeEventTarget,
  type RuntimeRefreshEvent,
} from '../platform/runtimeRefresh';
import { todayPrayerCivilDateIso } from './todayLiveTickModel';

class FakeRuntimeTarget implements RuntimeEventTarget {
  private readonly listeners = new Map<RuntimeRefreshEvent, Set<() => void>>();

  public addEventListener(type: RuntimeRefreshEvent, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  public removeEventListener(type: RuntimeRefreshEvent, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  public dispatch(type: RuntimeRefreshEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

class FakeRuntimeDocumentTarget extends FakeRuntimeTarget implements RuntimeDocumentTarget {
  public visibilityState: 'hidden' | 'visible' = 'visible';
}

describe('V1.6.0 Today runtime boundaries', () => {
  it('changes the Sydney civil date at local midnight in standard time', () => {
    expect(todayPrayerCivilDateIso(new Date('2026-08-16T13:59:59.999Z'), 'Australia/Sydney')).toBe(
      '2026-08-16',
    );
    expect(todayPrayerCivilDateIso(new Date('2026-08-16T14:00:00.000Z'), 'Australia/Sydney')).toBe(
      '2026-08-17',
    );
  });

  it('changes the Sydney civil date at local midnight in daylight-saving time', () => {
    expect(todayPrayerCivilDateIso(new Date('2026-12-15T12:59:59.999Z'), 'Australia/Sydney')).toBe(
      '2026-12-15',
    );
    expect(todayPrayerCivilDateIso(new Date('2026-12-15T13:00:00.000Z'), 'Australia/Sydney')).toBe(
      '2026-12-16',
    );
  });

  it('refreshes after focus, pageshow and visible resume but not while hidden', () => {
    const windowTarget = new FakeRuntimeTarget();
    const documentTarget = new FakeRuntimeDocumentTarget();
    const refresh = vi.fn();
    const remove = installRuntimeRefreshListeners({ windowTarget, documentTarget }, refresh);

    windowTarget.dispatch('focus');
    windowTarget.dispatch('pageshow');
    documentTarget.visibilityState = 'hidden';
    documentTarget.dispatch('visibilitychange');
    documentTarget.visibilityState = 'visible';
    documentTarget.dispatch('visibilitychange');

    expect(refresh).toHaveBeenCalledTimes(3);

    remove();
    windowTarget.dispatch('focus');
    documentTarget.dispatch('visibilitychange');
    expect(refresh).toHaveBeenCalledTimes(3);
  });
});
