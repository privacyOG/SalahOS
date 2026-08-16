import { describe, expect, it, vi } from 'vitest';
import { installRuntimeRefreshListeners } from './runtimeRefresh';
import type {
  RuntimeDocumentTarget,
  RuntimeEventTarget,
  RuntimeRefreshEvent,
  RuntimeVisibilityState,
} from './runtimeRefresh';

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

class FakeDocumentTarget extends FakeEventTarget implements RuntimeDocumentTarget {
  visibilityState: RuntimeVisibilityState = 'visible';
}

describe('installRuntimeRefreshListeners', () => {
  it('refreshes immediately on focus, page restore and visible document changes', () => {
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const onRefresh = vi.fn();

    installRuntimeRefreshListeners({ windowTarget, documentTarget }, onRefresh);

    windowTarget.dispatch('focus');
    windowTarget.dispatch('pageshow');
    documentTarget.dispatch('visibilitychange');

    expect(onRefresh).toHaveBeenCalledTimes(3);
  });

  it('does not refresh while hidden and refreshes immediately when the app becomes visible', () => {
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const onRefresh = vi.fn();

    installRuntimeRefreshListeners({ windowTarget, documentTarget }, onRefresh);

    documentTarget.visibilityState = 'hidden';
    documentTarget.dispatch('visibilitychange');
    expect(onRefresh).not.toHaveBeenCalled();

    documentTarget.visibilityState = 'visible';
    documentTarget.dispatch('visibilitychange');
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('removes every listener during cleanup', () => {
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const onRefresh = vi.fn();
    const cleanup = installRuntimeRefreshListeners({ windowTarget, documentTarget }, onRefresh);

    cleanup();
    windowTarget.dispatch('focus');
    windowTarget.dispatch('pageshow');
    documentTarget.dispatch('visibilitychange');

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
