import { useEffect } from 'react';

import type { Locale } from '../i18n/translations';

const confirmationCopy: Readonly<Record<Locale, string>> = {
  en: 'Revoke this display? It will stop receiving managed updates until it is enrolled again.',
  ar: 'هل تريد إلغاء هذه الشاشة؟ ستتوقف عن تلقي التحديثات المُدارة حتى يتم تسجيلها من جديد.',
  tr: 'Bu ekranın yetkisi kaldırılsın mı? Yeniden kaydedilene kadar yönetilen güncellemeleri alamaz.',
  id: 'Cabut akses layar ini? Layar tidak akan menerima pembaruan terkelola sampai didaftarkan kembali.',
};

const destructiveSelector = '.remote-display-card__actions button';

export function useAdminDestructiveActionSafety(locale: Locale): void {
  useEffect(() => {
    const markDestructiveButtons = () => {
      document.querySelectorAll<HTMLButtonElement>(destructiveSelector).forEach((button) => {
        button.classList.add('ds-button', 'ds-button--destructive');
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>(destructiveSelector);
      if (button === null || button.disabled) return;
      if (window.confirm(confirmationCopy[locale])) return;
      event.preventDefault();
      event.stopPropagation();
    };

    markDestructiveButtons();
    const root = document.querySelector('.admin-section-stack--displays') ?? document.body;
    const observer = new MutationObserver(markDestructiveButtons);
    observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', handleClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
    };
  }, [locale]);
}
