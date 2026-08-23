import type { PrayerBoardAnnouncement } from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import './prayer-board-announcements.css';

const label: Readonly<Record<Locale, string>> = {
  en: 'Mosque announcement',
  ar: 'إعلان المسجد',
  tr: 'Cami duyurusu',
  id: 'Pengumuman masjid',
};

export function PrayerBoardAnnouncementModule({
  announcement,
  locale,
}: Readonly<{
  announcement: PrayerBoardAnnouncement | null;
  locale: Locale;
}>) {
  if (announcement === null) return null;

  return (
    <aside
      className="prayer-board-announcement"
      aria-label={label[locale]}
      aria-live="polite"
      data-announcement-id={announcement.id}
    >
      <span className="prayer-board-announcement__label">{label[locale]}</span>
      <div className="prayer-board-announcement__copy">
        <strong dir="auto">{announcement.title}</strong>
        {announcement.body !== null && <span dir="auto">{announcement.body}</span>}
      </div>
    </aside>
  );
}
