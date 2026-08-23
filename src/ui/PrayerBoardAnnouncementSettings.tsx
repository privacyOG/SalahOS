import { useMemo, useState } from 'react';

import {
  createPrayerBoardAnnouncementRotationConfig,
  defaultPrayerBoardAnnouncementRotationConfig,
} from '../domain/prayerBoardAnnouncementRotation';
import type { MosqueAnnouncement } from '../domain/mosqueAnnouncement';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadCommunityContentLibrary } from '../platform/communityContentStorage';
import {
  loadPrayerBoardAnnouncementRotationConfig,
  PRAYER_BOARD_ANNOUNCEMENT_ROTATION_CHANGE_EVENT,
  savePrayerBoardAnnouncementRotationConfig,
} from '../platform/prayerBoardAnnouncementRotation';
import { loadPersistedSettings } from '../platform/settingsStorage';

interface Copy {
  readonly title: string;
  readonly description: string;
  readonly enabled: string;
  readonly mosque: string;
  readonly dwell: string;
  readonly dwellHelp: string;
  readonly moduleHelp: string;
  readonly save: string;
  readonly saved: string;
  readonly noAnnouncements: string;
  readonly available: string;
}

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    title: 'Announcement rotation',
    description:
      'Rotate announcements already approved for the display surface using the existing SalahOS signage playlist and schedule engine.',
    enabled: 'Enable scheduled announcement rotation',
    mosque: 'Announcement mosque',
    dwell: 'Seconds per announcement',
    dwellHelp: 'Each eligible announcement is shown for 5–120 seconds before the next scene.',
    moduleHelp:
      'The per-display Announcements module remains the final switch. Turn that module off for prayer-board-only displays without deleting this schedule.',
    save: 'Save announcement rotation',
    saved: 'Announcement rotation saved.',
    noAnnouncements: 'No display-targeted announcements are available for the selected mosque.',
    available: 'display announcements available',
  },
  ar: {
    title: 'تدوير الإعلانات',
    description:
      'دوّر الإعلانات المعتمدة لواجهة العرض باستخدام محرك قوائم المشاهد والجدولة الموجود في SalahOS.',
    enabled: 'تفعيل تدوير الإعلانات المجدول',
    mosque: 'مسجد الإعلانات',
    dwell: 'ثوانٍ لكل إعلان',
    dwellHelp: 'يظهر كل إعلان مؤهل من 5 إلى 120 ثانية قبل المشهد التالي.',
    moduleHelp:
      'تبقى وحدة الإعلانات الخاصة بكل شاشة هي المفتاح النهائي. عطّلها لشاشات الصلاة فقط دون حذف الجدول.',
    save: 'حفظ تدوير الإعلانات',
    saved: 'تم حفظ تدوير الإعلانات.',
    noAnnouncements: 'لا توجد إعلانات مخصصة للشاشات لهذا المسجد.',
    available: 'إعلانات شاشة متاحة',
  },
  tr: {
    title: 'Duyuru rotasyonu',
    description:
      'Ekran yüzeyi için onaylanmış duyuruları mevcut SalahOS sahne listesi ve zamanlama motoruyla döndürün.',
    enabled: 'Zamanlanmış duyuru rotasyonunu etkinleştir',
    mosque: 'Duyuru camisi',
    dwell: 'Duyuru başına saniye',
    dwellHelp: 'Her uygun duyuru sonraki sahneden önce 5–120 saniye gösterilir.',
    moduleHelp:
      'Ekran başına Duyurular modülü son anahtar olarak kalır. Bu programı silmeden yalnızca namaz panosu ekranlarında kapatın.',
    save: 'Duyuru rotasyonunu kaydet',
    saved: 'Duyuru rotasyonu kaydedildi.',
    noAnnouncements: 'Seçilen cami için ekran hedefli duyuru yok.',
    available: 'ekran duyurusu mevcut',
  },
  id: {
    title: 'Rotasi pengumuman',
    description:
      'Putar pengumuman yang sudah disetujui untuk layar memakai mesin playlist dan jadwal signage SalahOS yang sudah ada.',
    enabled: 'Aktifkan rotasi pengumuman terjadwal',
    mosque: 'Masjid pengumuman',
    dwell: 'Detik per pengumuman',
    dwellHelp:
      'Setiap pengumuman yang memenuhi syarat tampil 5–120 detik sebelum adegan berikutnya.',
    moduleHelp:
      'Modul Pengumuman per layar tetap menjadi sakelar terakhir. Matikan untuk layar khusus papan salat tanpa menghapus jadwal ini.',
    save: 'Simpan rotasi pengumuman',
    saved: 'Rotasi pengumuman disimpan.',
    noAnnouncements: 'Tidak ada pengumuman bertarget layar untuk masjid yang dipilih.',
    available: 'pengumuman layar tersedia',
  },
};

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function displayAnnouncements(): readonly MosqueAnnouncement[] {
  try {
    return loadCommunityContentLibrary(getApplicationStorage()).announcements.filter(
      (announcement) => announcement.surfaces.includes('display'),
    );
  } catch {
    return [];
  }
}

function sceneTitle(announcement: MosqueAnnouncement): string {
  return announcement.english?.title ?? announcement.arabic?.title ?? announcement.announcementId;
}

export function PrayerBoardAnnouncementSettings() {
  const storage = getApplicationStorage();
  const locale = readLocale();
  const text = copy[locale];
  const current = loadPrayerBoardAnnouncementRotationConfig(storage);
  const announcements = useMemo(displayAnnouncements, []);
  const mosqueIds = useMemo(
    () => [...new Set(announcements.map((announcement) => announcement.mosqueId))].sort(),
    [announcements],
  );
  const [enabled, setEnabled] = useState(current.enabled);
  const [mosqueId, setMosqueId] = useState(current.playlist?.mosqueId ?? mosqueIds[0] ?? '');
  const [dwellSeconds, setDwellSeconds] = useState(current.playlist?.scenes[0]?.dwellSeconds ?? 12);
  const [status, setStatus] = useState<string | null>(null);
  const eligible = announcements.filter((announcement) => announcement.mosqueId === mosqueId);

  const save = () => {
    if (!enabled) {
      savePrayerBoardAnnouncementRotationConfig(
        storage,
        defaultPrayerBoardAnnouncementRotationConfig,
      );
      setStatus(text.saved);
      window.dispatchEvent(new Event(PRAYER_BOARD_ANNOUNCEMENT_ROTATION_CHANGE_EVENT));
      return;
    }

    if (
      mosqueId === '' ||
      eligible.length === 0 ||
      !Number.isInteger(dwellSeconds) ||
      dwellSeconds < 5 ||
      dwellSeconds > 120
    ) {
      setStatus(text.noAnnouncements);
      return;
    }

    const playlistId = `prayer-board-announcements:${mosqueId}`;
    const revision = current.playlist?.mosqueId === mosqueId ? current.playlist.revision + 1 : 1;
    const scenes = eligible.map((announcement) => ({
      sceneId: `announcement:${announcement.announcementId}`,
      mosqueId,
      kind: 'announcement' as const,
      title: sceneTitle(announcement),
      offlineFallback: 'prayer-board' as const,
      announcementId: announcement.announcementId,
    }));
    const config = createPrayerBoardAnnouncementRotationConfig({
      version: 1,
      enabled: true,
      playlist: {
        playlistId,
        mosqueId,
        title: 'Prayer board announcements',
        revision,
        scenes: scenes.map((scene) => ({ sceneId: scene.sceneId, dwellSeconds })),
      },
      rules: [
        {
          kind: 'time-window',
          ruleId: `prayer-board-announcements-all-day:${mosqueId}`,
          playlistId,
          priority: 100,
          context: 'all',
          startDate: null,
          endDate: null,
          weekdays: [],
          startsAt: '00:00',
          endsAt: '00:00',
        },
      ],
      scenes,
    });
    savePrayerBoardAnnouncementRotationConfig(storage, config);
    setStatus(text.saved);
    window.dispatchEvent(new Event(PRAYER_BOARD_ANNOUNCEMENT_ROTATION_CHANGE_EVENT));
  };

  return (
    <section
      className="prayer-board-announcement-settings prayer-board-config-editor"
      aria-labelledby="announcement-rotation-title"
    >
      <header className="prayer-board-config-editor__header">
        <div>
          <h2 id="announcement-rotation-title">{text.title}</h2>
          <p>{text.description}</p>
        </div>
        <span className="prayer-board-config-editor__orientation">
          {eligible.length} {text.available}
        </span>
      </header>
      <section className="prayer-board-config-panel">
        <label className="prayer-board-module-row">
          <span>{text.enabled}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setStatus(null);
            }}
          />
        </label>
        <div className="prayer-board-config-fields">
          <label>
            <span>{text.mosque}</span>
            <select
              value={mosqueId}
              onChange={(event) => {
                setMosqueId(event.target.value);
                setStatus(null);
              }}
            >
              {mosqueIds.length === 0 && <option value="">—</option>}
              {mosqueIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{text.dwell}</span>
            <input
              type="number"
              min={5}
              max={120}
              step={1}
              value={dwellSeconds}
              onChange={(event) => {
                setDwellSeconds(Number(event.target.value));
                setStatus(null);
              }}
            />
          </label>
        </div>
        <p className="prayer-board-config-panel__help">{text.dwellHelp}</p>
        <p className="prayer-board-config-panel__help">{text.moduleHelp}</p>
        {enabled && eligible.length === 0 && (
          <p className="inline-message" role="status">
            {text.noAnnouncements}
          </p>
        )}
        <div className="prayer-board-config-actions">
          <button type="button" className="primary" onClick={save}>
            {text.save}
          </button>
          {status !== null && <span role="status">{status}</span>}
        </div>
      </section>
    </section>
  );
}
