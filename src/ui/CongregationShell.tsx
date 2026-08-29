import { useEffect, useRef, useState, type ReactNode } from 'react';
import { applyDocumentLocale } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { requestCompassPermission } from '../platform/deviceCompass';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { installThemePreference } from '../platform/themePreference';
import { PrimaryNavigation } from './PrimaryNavigation';
import {
  readCongregationDestination,
  searchForCongregationDestination,
  type CongregationDestination,
} from './applicationRoute';
type Props = Readonly<{ children: (destination: CongregationDestination) => ReactNode }>;
type CongregationCopy = Readonly<{
  navigation: string;
  today: string;
  calendar: string;
  mosques: string;
  qiblah: string;
  knowledge: string;
  community: string;
  settings: string;
}>;
const copy: Readonly<Record<Locale, CongregationCopy>> = {
  en: {
    navigation: 'Primary navigation',
    today: 'Today',
    calendar: 'Calendar',
    mosques: 'Mosques',
    qiblah: 'Qiblah',
    knowledge: 'Knowledge',
    community: 'Community',
    settings: 'Settings',
  },
  ar: {
    navigation: 'التنقل الرئيسي',
    today: 'اليوم',
    calendar: 'التقويم',
    mosques: 'المساجد',
    qiblah: 'القبلة',
    knowledge: 'المعرفة',
    community: 'المجتمع',
    settings: 'الإعدادات',
  },
  tr: {
    navigation: 'Ana gezinme',
    today: 'Bugün',
    calendar: 'Takvim',
    mosques: 'Camiler',
    qiblah: 'Kıble',
    knowledge: 'Bilgi',
    community: 'Topluluk',
    settings: 'Ayarlar',
  },
  id: {
    navigation: 'Navigasi utama',
    today: 'Hari ini',
    calendar: 'Kalender',
    mosques: 'Masjid',
    qiblah: 'Kiblat',
    knowledge: 'Pengetahuan',
    community: 'Komunitas',
    settings: 'Pengaturan',
  },
};
function documentLocale(): Locale {
  const l = document.documentElement.lang.toLowerCase();
  return l.startsWith('ar') ? 'ar' : l.startsWith('tr') ? 'tr' : l.startsWith('id') ? 'id' : 'en';
}
function persistedLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return documentLocale();
  }
}
function scrollTop(target: HTMLElement | null) {
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
  target?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}
export function CongregationShell({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<Locale>(persistedLocale);
  const [destination, setDestination] = useState<CongregationDestination>(() =>
    readCongregationDestination(window.location.search),
  );
  useEffect(() => {
    try {
      const s = loadPersistedSettings(getApplicationStorage());
      applyDocumentLocale(document.documentElement, s.locale);
      setLocale(s.locale);
      return installThemePreference(s.theme, { documentTarget: document, windowTarget: window });
    } catch {
      return undefined;
    }
  }, []);
  useEffect(() => {
    const o = new MutationObserver(() => {
      setLocale(documentLocale());
    });
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => {
      o.disconnect();
    };
  }, []);
  useEffect(() => {
    const h = () => {
      setDestination(readCongregationDestination(window.location.search));
      requestAnimationFrame(() => {
        scrollTop(ref.current);
      });
    };
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('popstate', h);
    };
  }, []);
  const navigate = (next: CongregationDestination) => {
    if (next === destination) return;
    const search = searchForCongregationDestination(window.location.search, next);
    history.pushState(null, '', `${location.pathname}${search}${location.hash}`);
    setDestination(next);
    requestAnimationFrame(() => {
      scrollTop(ref.current);
    });
  };
  const l = copy[locale];
  return (
    <div className="congregation-shell" data-destination={destination}>
      <div ref={ref} className="congregation-shell-content" data-route={destination}>
        {children(destination)}
      </div>
      <PrimaryNavigation
        ariaLabel={l.navigation}
        items={[
          {
            id: 'today',
            icon: 'today',
            label: l.today,
            current: destination === 'today',
            onSelect: () => {
              navigate('today');
            },
          },
          {
            id: 'calendar',
            icon: 'calendar',
            label: l.calendar,
            current: destination === 'calendar',
            onSelect: () => {
              navigate('calendar');
            },
          },
          {
            id: 'mosques',
            icon: 'mosques',
            label: l.mosques,
            current: destination === 'mosques',
            onSelect: () => {
              navigate('mosques');
            },
          },
          {
            id: 'qiblah',
            icon: 'qiblah',
            label: l.qiblah,
            current: destination === 'qiblah',
            onSelect: () => {
              void requestCompassPermission();
              navigate('qiblah');
            },
          },
          {
            id: 'knowledge',
            icon: 'knowledge',
            label: l.knowledge,
            current: destination === 'knowledge',
            onSelect: () => {
              navigate('knowledge');
            },
          },
          {
            id: 'community',
            icon: 'community',
            label: l.community,
            current: destination === 'community',
            onSelect: () => {
              navigate('community');
            },
          },
          {
            id: 'settings',
            icon: 'settings',
            label: l.settings,
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