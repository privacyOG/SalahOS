import { useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '../i18n/translations';
import { smartDisplayModeRequested } from './SmartDisplay';
import { PrimaryNavigation } from './PrimaryNavigation';

type CongregationShellProps = Readonly<{
  children: ReactNode;
}>;

type CongregationDestination = 'today' | 'settings';

function documentLocale(): Locale {
  return document.documentElement.lang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

function scrollToElement(element: Element | null): void {
  if (!(element instanceof HTMLElement)) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function scrollAfterViewChange(selector: string): void {
  window.requestAnimationFrame(() => {
    scrollToElement(document.querySelector(selector));
  });
}

export function CongregationShell({ children }: CongregationShellProps) {
  const [locale, setLocale] = useState<Locale>(documentLocale);
  const [destination, setDestination] = useState<CongregationDestination>('today');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setLocale(documentLocale());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) {
    return children;
  }

  const labels =
    locale === 'ar'
      ? { navigation: 'التنقل الرئيسي', today: 'اليوم', settings: 'الإعدادات' }
      : { navigation: 'Primary navigation', today: 'Today', settings: 'Settings' };

  return (
    <div className="congregation-shell" data-destination={destination}>
      <div className="congregation-shell-content">{children}</div>
      <PrimaryNavigation
        ariaLabel={labels.navigation}
        items={[
          {
            id: 'today',
            label: labels.today,
            current: destination === 'today',
            onSelect: () => {
              setDestination('today');
              scrollAfterViewChange('.prayer-panel, .status-card, .hero');
            },
          },
          {
            id: 'settings',
            label: labels.settings,
            current: destination === 'settings',
            onSelect: () => {
              const settings = document.querySelector<HTMLDetailsElement>('.settings-panel');
              if (settings !== null) settings.open = true;
              setDestination('settings');
              scrollAfterViewChange('.location-panel, .settings-panel');
            },
          },
        ]}
      />
    </div>
  );
}
