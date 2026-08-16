export type RuntimeRefreshEvent = 'focus' | 'pageshow' | 'visibilitychange';
export type RuntimeVisibilityState = 'hidden' | 'visible';

export interface RuntimeEventTarget {
  addEventListener(type: RuntimeRefreshEvent, listener: () => void): void;
  removeEventListener(type: RuntimeRefreshEvent, listener: () => void): void;
}

export interface RuntimeDocumentTarget extends RuntimeEventTarget {
  readonly visibilityState: RuntimeVisibilityState;
}

export interface RuntimeRefreshTargets {
  readonly windowTarget: RuntimeEventTarget;
  readonly documentTarget: RuntimeDocumentTarget;
}

export function installRuntimeRefreshListeners(
  targets: RuntimeRefreshTargets,
  onRefresh: () => void,
): () => void {
  const refreshWhenVisible = () => {
    if (targets.documentTarget.visibilityState === 'visible') onRefresh();
  };

  targets.windowTarget.addEventListener('focus', onRefresh);
  targets.windowTarget.addEventListener('pageshow', onRefresh);
  targets.documentTarget.addEventListener('visibilitychange', refreshWhenVisible);

  return () => {
    targets.windowTarget.removeEventListener('focus', onRefresh);
    targets.windowTarget.removeEventListener('pageshow', onRefresh);
    targets.documentTarget.removeEventListener('visibilitychange', refreshWhenVisible);
  };
}
