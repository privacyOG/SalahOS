import { useEffect, useRef, useState, type ReactNode } from 'react';

import { applyDocumentLocale } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { installThemePreference } from '../platform/themePreference';
import { PrimaryNavigation } from './PrimaryNavigation';
import {
  readCongregationDestination,
  searchForCongregationDestination,
  type CongregationDestination,
} from './applicationRoute';

type CongregationShellProps = Readonly<{
  children: (destination: CongregationDestination) => ReactNode;
}>;

type NavigationCopy = Readonly<{
  navigation: string;
  today: string;
  mosques: string;
  qiblah: string;
  community: string;
  settings: string;
}>;

const navigationCopy: Readonly<Record<Locale, NavigationCopy>> = {
  en: {
    navigation: 'Primary navigation',
    today: 'Today',
    mosques: 'Mosques',
    qiblah: 'Qiblah',
    community: 'Community',
    settings: 'Settings',
  },
  ar: {
    navigation: 'التنقل الرئيسي',
    today: 'اليوم',
    mosques: 'المساجد',
    qiblah: 'القبلة',
    community: 'المجتمع',
    settings: 'الإعدادات',
  },
  tr: {
    navigation: 'Ana gezinme',
    today: 'Bugün',
    mosques: 'Camiler',
    qiblah: 'Kıble',
    community: 'Topluluk',
    settings: 'Ayarlar',
  },
  id: {
    navigation: 'Navigasi utama',
    today: 'Hari ini',
    mosques: 'Masjid',
    qiblah: 'Kiblat',
    community: 'Komunitas',
    settings: 'Pengaturan',
  },
};

function documentLocale(): Locale {
  const language = document.documentElement.lang.toLowerCase();
  if (language.startsWith('ar')) return 'ar';
  if (language.startsWith('tr')) return 'tr';
  if (language.startsWith('id')) return 'id';
  return 'en';
}

function persistedLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return documentLocale();
  }
}

function scrollToTop(target: HTMLElement | null): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
  target?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}

export function CongregationShell({ children }: CongregationShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<Locale>(persistedLocale);
  const [destination, setDestination] = useState<CongregationDestination>(() =>
    readCongregationDestination(window.location.search),
  );

  useEffect(() => {
    try {
      const settings = loadPersistedSettings(getApplicationStorage());
      applyDocumentLocale(document.documentElement, settings.locale);
      setLocale(settings.locale);
      return installThemePreference(settings.theme, {
        documentTarget: document,
        windowTarget: window,
      });
    } catch {
      return undefined;
    }
  }, []);

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

  useEffect(() => {
    const handlePopState = () => {
      setDestination(readCongregationDestination(window.location.search));
      window.requestAnimationFrame(() => {
        scrollToTop(contentRef.current);
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (nextDestination: CongregationDestination) => {
    if (nextDestination === destination) return;
    const search = searchForCongregationDestination(window.location.search, nextDestination);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${search}${window.location.hash}`,
    );
    setDestination(nextDestination);
    window.requestAnimationFrame(() => {
      scrollToTop(contentRef.current);
    });
  };

  const labels = navigationCopy[locale];

  return (
    <div className="congregation-shell" data-destination={destination}>
      <div ref={contentRef} className="congregation-shell-content" data-route={destination}>
        {children(destination)}
      </div>
      <PrimaryNavigation
        ariaLabel={labels.navigation}
        items={[
          {
            id: 'today',
            icon: 'today',
            label: labels.today,
            current: destination === 'today',
            onSelect: () => {
              navigate('today');
            },
          },
          {
            id: 'mosques',
            icon: 'mosques',
            label: labels.mosques,
            current: destination === 'mosques',
            onSelect: () => {
              navigate('mosques');
            },
          },
          {
            id: 'qiblah',
            icon: 'qiblah',
            label: labels.qiblah,
            current: destination === 'qiblah',
            onSelect: () => {
              navigate('qiblah');
            },
          },
          {
            id: 'community',
            icon: 'community',
            label: labels.community,
            current: destination === 'community',
            onSelect: () => {
              navigate('community');
            },
          },
          {
            id: 'settings',
            icon: 'settings',
            label: labels.settings,
            current: destination === 'settings',
            onSelect: () => {
              navigate('settings');
            },
          },
        ]}
      />
    </div>
  );
}
