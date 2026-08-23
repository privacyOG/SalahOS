import { useEffect, useState, type ReactNode } from 'react';

import { applyDocumentLocale } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { installThemePreference } from '../platform/themePreference';
import {
  readAdminDestination,
  searchForAdminDestination,
  searchForCongregationDestination,
  type AdminDestination,
} from './applicationRoute';
import { SalahIcon, type SalahIconName } from './SalahIcon';

type AdminShellProps = Readonly<{
  children: (
    destination: AdminDestination,
    navigate: (destination: AdminDestination) => void,
  ) => ReactNode;
}>;

type AdminPageCopy = Readonly<{
  label: string;
  description: string;
}>;

type AdminCopy = Readonly<{
  title: string;
  subtitle: string;
  back: string;
  navigation: string;
  breadcrumb: string;
  pages: Readonly<Record<AdminDestination, AdminPageCopy>>;
}>;

const copy: Readonly<Record<Locale, AdminCopy>> = {
  en: {
    title: 'Mosque administration',
    subtitle: 'Prayer publishing, community content and managed displays',
    back: 'Back to SalahOS',
    navigation: 'Administration navigation',
    breadcrumb: 'Administration',
    pages: {
      overview: {
        label: 'Overview',
        description: 'Today’s operational status, upcoming work and issues that need attention.',
      },
      'prayer-iqamah': {
        label: 'Prayer & Iqamah',
        description: 'Review mosque prayer starts, Iqamah rules and publication state.',
      },
      'jumuah-ramadan': {
        label: "Jumu'ah & Ramadan",
        description: "Manage Friday sessions, Ramadan presentation and Taraweeh context.",
      },
      community: {
        label: 'Community content',
        description: 'Prepare announcements and events for congregation and display surfaces.',
      },
      displays: {
        label: 'Displays',
        description: 'Manage fleet connections, prayer-board configuration and remote operations.',
      },
      integrations: {
        label: 'Integrations',
        description: 'Review optional calendar, smart-home and managed-service connections.',
      },
      members: {
        label: 'Members & permissions',
        description: 'Keep administrative access and responsibility separate from congregation use.',
      },
      settings: {
        label: 'Administration settings',
        description: 'Configure administration-specific defaults without changing personal settings.',
      },
    },
  },
  ar: {
    title: 'إدارة المسجد',
    subtitle: 'نشر المواقيت ومحتوى المجتمع والشاشات المُدارة',
    back: 'العودة إلى صلاح أو إس',
    navigation: 'التنقل في الإدارة',
    breadcrumb: 'الإدارة',
    pages: {
      overview: {
        label: 'نظرة عامة',
        description: 'حالة التشغيل اليوم والمهام القادمة والمشكلات التي تحتاج إلى متابعة.',
      },
      'prayer-iqamah': {
        label: 'الصلاة والإقامة',
        description: 'مراجعة بدايات الصلوات وقواعد الإقامة وحالة النشر.',
      },
      'jumuah-ramadan': {
        label: 'الجمعة ورمضان',
        description: 'إدارة جلسات الجمعة وعرض رمضان وسياق التراويح.',
      },
      community: {
        label: 'محتوى المجتمع',
        description: 'إعداد الإعلانات والفعاليات للمصلين وشاشات العرض.',
      },
      displays: {
        label: 'الشاشات',
        description: 'إدارة اتصالات الشاشات وإعداد لوحة الصلاة والعمليات عن بُعد.',
      },
      integrations: {
        label: 'التكاملات',
        description: 'مراجعة تكاملات التقويم والمنزل الذكي وخدمة الإدارة الاختيارية.',
      },
      members: {
        label: 'الأعضاء والصلاحيات',
        description: 'فصل صلاحيات الإدارة ومسؤولياتها عن الاستخدام اليومي للمصلين.',
      },
      settings: {
        label: 'إعدادات الإدارة',
        description: 'ضبط الإعدادات الخاصة بالإدارة من دون تغيير الإعدادات الشخصية.',
      },
    },
  },
  tr: {
    title: 'Cami yönetimi',
    subtitle: 'Namaz yayını, topluluk içeriği ve yönetilen ekranlar',
    back: "SalahOS'a dön",
    navigation: 'Yönetim gezinmesi',
    breadcrumb: 'Yönetim',
    pages: {
      overview: {
        label: 'Genel bakış',
        description: 'Bugünkü çalışma durumu, yaklaşan işler ve ilgilenilmesi gereken sorunlar.',
      },
      'prayer-iqamah': {
        label: 'Namaz ve ikamet',
        description: 'Cami namaz başlangıçlarını, ikamet kurallarını ve yayın durumunu gözden geçirin.',
      },
      'jumuah-ramadan': {
        label: 'Cuma ve Ramazan',
        description: 'Cuma oturumlarını, Ramazan sunumunu ve teravih bağlamını yönetin.',
      },
      community: {
        label: 'Topluluk içeriği',
        description: 'Cemaat ve ekran yüzeyleri için duyuru ve etkinlikler hazırlayın.',
      },
      displays: {
        label: 'Ekranlar',
        description: 'Filo bağlantılarını, namaz panosu yapılandırmasını ve uzaktan işlemleri yönetin.',
      },
      integrations: {
        label: 'Entegrasyonlar',
        description: 'İsteğe bağlı takvim, akıllı ev ve yönetim hizmeti bağlantılarını gözden geçirin.',
      },
      members: {
        label: 'Üyeler ve izinler',
        description: 'Yönetim erişimini ve sorumluluğunu günlük cemaat kullanımından ayrı tutun.',
      },
      settings: {
        label: 'Yönetim ayarları',
        description: 'Kişisel ayarları değiştirmeden yönetime özel varsayılanları yapılandırın.',
      },
    },
  },
  id: {
    title: 'Administrasi masjid',
    subtitle: 'Publikasi salat, konten komunitas, dan layar terkelola',
    back: 'Kembali ke SalahOS',
    navigation: 'Navigasi administrasi',
    breadcrumb: 'Administrasi',
    pages: {
      overview: {
        label: 'Ringkasan',
        description: 'Status operasional hari ini, pekerjaan mendatang, dan masalah yang perlu ditangani.',
      },
      'prayer-iqamah': {
        label: 'Salat & Iqamah',
        description: 'Tinjau waktu mulai salat masjid, aturan Iqamah, dan status publikasi.',
      },
      'jumuah-ramadan': {
        label: 'Jumat & Ramadan',
        description: 'Kelola sesi Jumat, tampilan Ramadan, dan konteks Tarawih.',
      },
      community: {
        label: 'Konten komunitas',
        description: 'Siapkan pengumuman dan acara untuk jamaah serta layar.',
      },
      displays: {
        label: 'Layar',
        description: 'Kelola koneksi armada, konfigurasi papan salat, dan operasi jarak jauh.',
      },
      integrations: {
        label: 'Integrasi',
        description: 'Tinjau koneksi kalender, rumah pintar, dan layanan terkelola opsional.',
      },
      members: {
        label: 'Anggota & izin',
        description: 'Pisahkan akses administrasi dan tanggung jawab dari penggunaan jamaah.',
      },
      settings: {
        label: 'Pengaturan administrasi',
        description: 'Atur default khusus administrasi tanpa mengubah pengaturan pribadi.',
      },
    },
  },
};

const adminNavigation: readonly Readonly<{
  id: AdminDestination;
  icon: SalahIconName;
}>[] = [
  { id: 'overview', icon: 'administration' },
  { id: 'prayer-iqamah', icon: 'prayer' },
  { id: 'jumuah-ramadan', icon: 'iqamah' },
  { id: 'community', icon: 'community' },
  { id: 'displays', icon: 'display' },
  { id: 'integrations', icon: 'location' },
  { id: 'members', icon: 'mosques' },
  { id: 'settings', icon: 'settings' },
];

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

export function AdminShell({ children }: AdminShellProps) {
  const [locale, setLocale] = useState<Locale>(persistedLocale);
  const [destination, setDestination] = useState<AdminDestination>(() =>
    readAdminDestination(window.location.search),
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
  const page = text.pages[destination];
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
          {adminNavigation.map(({ id, icon }) => (
            <button
              type="button"
              key={id}
              aria-current={destination === id ? 'page' : undefined}
              onClick={() => {
                navigate(id);
              }}
            >
              <SalahIcon name={icon} />
              <span>{text.pages[id].label}</span>
            </button>
          ))}
        </nav>
        <a className="admin-shell-back" href={congregationHref}>
          {text.back}
        </a>
      </aside>

      <main className="admin-shell-main">
        <header className="admin-shell-header">
          <nav className="admin-shell-breadcrumb" aria-label={text.breadcrumb}>
            <span>{text.breadcrumb}</span>
            <span aria-hidden="true">/</span>
            <strong>{page.label}</strong>
          </nav>
          <div className="admin-shell-header__title">
            <div>
              <p>SalahOS</p>
              <h1>{page.label}</h1>
              <span>{page.description}</span>
            </div>
          </div>
        </header>
        <div className="admin-shell-content" data-admin-route={destination}>
          {children(destination, navigate)}
        </div>
      </main>
    </div>
  );
}
