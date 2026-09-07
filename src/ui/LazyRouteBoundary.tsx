import { Component, type ErrorInfo, type ReactNode } from 'react';

function routeFailureCopy(): Readonly<{ message: string; retry: string }> {
  const language = typeof document === 'undefined' ? 'en' : document.documentElement.lang.toLowerCase();
  if (language.startsWith('ar')) {
    return { message: 'تعذر تحميل هذا القسم.', retry: 'إعادة التحميل والمحاولة مجدداً' };
  }
  if (language.startsWith('tr')) {
    return { message: 'Bu bölüm yüklenemedi.', retry: 'Yeniden yükle ve tekrar dene' };
  }
  if (language.startsWith('id')) {
    return { message: 'Bagian ini tidak dapat dimuat.', retry: 'Muat ulang dan coba lagi' };
  }
  return { message: 'This section could not be loaded.', retry: 'Reload and try again' };
}

export class LazyRouteBoundary extends Component<
  Readonly<{ children: ReactNode }>,
  Readonly<{ failed: boolean }>
> {
  public state: Readonly<{ failed: boolean }> = { failed: false };

  public static getDerivedStateFromError(): Readonly<{ failed: boolean }> {
    return { failed: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SalahOS deferred surface failed to load.', error, info.componentStack);
  }

  public render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const copy = routeFailureCopy();
    return (
      <div className="surface-entry-card" role="alert" data-lazy-route-failure>
        <p className="surface-entry-card__eyebrow">SalahOS</p>
        <p>{copy.message}</p>
        <button
          type="button"
          data-lazy-route-retry
          onClick={() => {
            window.location.reload();
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }
}
