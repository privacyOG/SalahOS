export type RuntimeRefreshEvent = 'focus' | 'pageshow' | 'visibilitychange';

export interface RuntimeEventTarget {
  addEventListener(type: RuntimeRefreshEvent, listener: () => void): void;
  removeEventListener(type: RuntimeRefreshEvent, listener: () => void): void;
}

export interface RuntimeRefreshTargets {
  readonly windowTarget: RuntimeEventTarget;
  readonly documentTarget: RuntimeEventTarget;
}

export function installRuntimeRefreshListeners(
  targets: RuntimeRefreshTargets,
  onRefresh: () => void,
): () => void {
  targets.windowTarget.addEventListener('focus', onRefresh);
  targets.windowTarget.addEventListener('pageshow', onRefresh);
  targets.documentTarget.addEventListener('visibilitychange', onRefresh);

  return () => {
    targets.windowTarget.removeEventListener('focus', onRefresh);
    targets.windowTarget.removeEventListener('pageshow', onRefresh);
    targets.documentTarget.removeEventListener('visibilitychange', onRefresh);
  };
}
