import { useEffect, useState, type ReactNode } from 'react';

import type { Locale } from '../i18n/translations';
import {
  readAdminDestination,
  searchForAdminDestination,
  searchForCongregationDestination,
  type AdminDestination,
} from './applicationRoute';

type AdminShellProps = Readonly<{
  children: (
    destination: AdminDestination,
    navigate: (destination: AdminDestination) => void,
  ) => ReactNode;
}>;

type AdminCopy = Readonly<{
  title: string;
  subtitle: string;
  back: string;
  navigation: string;
  overview: string;
  displays: string;
  themes: string;
  remote: string;
}>;

const copy: Readonly<Record<Locale, AdminCopy>> = {
  en: {
    title: 'Managed mosque administration',
    subtitle: 'Display configuration and managed operations',
    back: 'Back to SalahOS',
    navigation: 'Administration navigation',
    overview: 'Overview',
    displays: 'Displays',
    themes: 'Themes',
    remote: 'Remote',
  },
  ar: {
    title: 'إدارة المسجد',
    subtitle: 'إعداد الشاشات والعمليات المُدارة',
    back: 'العودة إلى صلاح أو إس',
    navigation: 'التنقل في الإدارة',
    overview: 'نظرة عامة',
    displays: 'الشاشات',
    themes: 'القوالب',
    remote: 'التحكم عن بُعد',
  },
  tr: {
    title: 'Yönetilen cami yönetimi',
    subtitle: 'Ekran yapılandırması ve yönetilen işlemler',
    back: "SalahOS'a dön",
    navigation: 'Yönetim gezinmesi',
    overview: 'Genel bakış',
    displays: 'Ekranlar',
    themes: 'Temalar',
    remote: 'Uzaktan',
  },
  id: {
    title: 'Administrasi masjid terkelola',
    subtitle: 'Konfigurasi layar dan operasi terkelola',
    back: 'Kembali ke SalahOS',
    navigation: 'Navigasi administrasi',
    overview: 'Ringkasan',
    displays: 'Layar',
    themes: 'Tema',
    remote: 'Jarak jauh',
  },
};

function documentLocale(): Locale {
  const language = document.documentElement.lang.toLowerCase();
  if (language.startsWith('ar')) return 'ar';
  if (language.startsWith('tr')) return 'tr';
  if (language.startsWith('id')) return 'id';
  return 'en';
}

export function AdminShell({ children }: AdminShellProps) {
  const [locale, setLocale] = useState<Locale>(documentLocale);
  const [destination, setDestination] = useState<AdminDestination>(() =>
    readAdminDestination(window.location.search),
  );

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
      setDestination(readAdminDestination(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (nextDestination: AdminDestination) => {
    if (nextDestination === destination) return;
    const search = searchForAdminDestination(window.location.search, nextDestination);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${search}${window.location.hash}`,
    );
    setDestination(nextDestination);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const text = copy[locale];
  const congregationHref = `${window.location.pathname}${searchForCongregationDestination(
    window.location.search,
    'settings',
  )}${window.location.hash}`;

  return (
    <div className="admin-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <aside className="admin-shell-sidebar">
        <div className="admin-shell-brand">
          <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>SalahOS</strong>
            <span>{text.title}</span>
          </div>
        </div>
        <nav className="admin-shell-nav" aria-label={text.navigation}>
          {(
            [
              ['overview', text.overview],
              ['displays', text.displays],
              ['themes', text.themes],
              ['remote', text.remote],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-current={destination === id ? 'page' : undefined}
              onClick={() => {
                navigate(id);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <a className="admin-shell-back" href={congregationHref}>
          {text.back}
        </a>
      </aside>

      <main className="admin-shell-main">
        <header className="admin-shell-header">
          <p>SalahOS</p>
          <h1>{text.title}</h1>
          <span>{text.subtitle}</span>
        </header>
        <div className="admin-shell-content" data-admin-route={destination}>
          {children(destination, navigate)}
        </div>
      </main>
    </div>
  );
}
