import { describe, expect, it, vi } from 'vitest';
import { installRuntimeRefreshListeners } from './runtimeRefresh';
import type { RuntimeEventTarget, RuntimeRefreshEvent } from './runtimeRefresh';

class FakeEventTarget implements RuntimeEventTarget {
  private readonly listeners = new Map<RuntimeRefreshEvent, Set<() => void>>();

  addEventListener(type: RuntimeRefreshEvent, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: RuntimeRefreshEvent, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: RuntimeRefreshEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

describe('installRuntimeRefreshListeners', () => {
  it('refreshes immediately on focus, page restore and visibility changes', () => {
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeEventTarget();
    const onRefresh = vi.fn();

    installRuntimeRefreshListeners({ windowTarget, documentTarget }, onRefresh);

    windowTarget.dispatch('focus');
    windowTarget.dispatch('pageshow');
    documentTarget.dispatch('visibilitychange');

    expect(onRefresh).toHaveBeenCalledTimes(3);
  });

  it('removes every listener during cleanup', () => {
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeEventTarget();
    const onRefresh = vi.fn();
    const cleanup = installRuntimeRefreshListeners({ windowTarget, documentTarget }, onRefresh);

    cleanup();
    windowTarget.dispatch('focus');
    windowTarget.dispatch('pageshow');
    documentTarget.dispatch('visibilitychange');

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
