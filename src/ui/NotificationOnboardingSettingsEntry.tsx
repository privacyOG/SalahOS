import type { Locale } from '../i18n/translations';
import { NOTIFICATION_ONBOARDING_OPEN_EVENT } from '../platform/notificationOnboarding';

const copy: Readonly<
  Record<Locale, Readonly<{ title: string; body: string; action: string }>>
> = {
  en: {
    title: 'Notification setup',
    body: 'Review the first-run prayer notification choices and platform limitations.',
    action: 'Review notification setup',
  },
  ar: {
    title: 'إعداد الإشعارات',
    body: 'راجع اختيارات إشعارات الصلاة الأولية وقيود المنصة.',
    action: 'مراجعة إعداد الإشعارات',
  },
  tr: {
    title: 'Bildirim kurulumu',
    body: 'İlk kurulum namaz bildirimi seçimlerini ve platform sınırlarını yeniden gözden geçirin.',
    action: 'Bildirim kurulumunu gözden geçir',
  },
  id: {
    title: 'Pengaturan notifikasi',
    body: 'Tinjau kembali pilihan notifikasi salat saat pengaturan awal dan batas platform.',
    action: 'Tinjau pengaturan notifikasi',
  },
};

export function NotificationOnboardingSettingsEntry({ locale }: Readonly<{ locale: Locale }>) {
  const text = copy[locale];
  return (
    <section className="settings-focus-panel notification-onboarding-settings-entry">
      <div>
        <h2>{text.title}</h2>
        <p>{text.body}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event(NOTIFICATION_ONBOARDING_OPEN_EVENT));
        }}
      >
        {text.action}
      </button>
    </section>
  );
}
