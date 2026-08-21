import type { Locale } from './translations';

export interface TodayContextCopy {
  readonly ramadanEyebrow: string;
  readonly ramadanDay: string;
  readonly imsak: string;
  readonly suhurEnds: string;
  readonly iftar: string;
  readonly taraweeh: string;
  readonly noSelectedMosqueTitle: string;
  readonly noSelectedMosqueBody: string;
  readonly chooseMosque: string;
  readonly missingTimetableTitle: string;
  readonly missingTimetableBody: string;
  readonly staleTimetableTitle: string;
  readonly staleTimetableBody: string;
  readonly offlineManagedTitle: string;
  readonly offlineManagedBody: string;
  readonly astronomicalUnavailableTitle: string;
  readonly astronomicalUnavailableBody: string;
  readonly communityEyebrow: string;
  readonly communityTitle: string;
  readonly announcement: string;
  readonly event: string;
  readonly viewCommunity: string;
  readonly starts: string;
  readonly venue: string;
}

export const todayContextCopy: Readonly<Record<Locale, TodayContextCopy>> = {
  en: {
    ramadanEyebrow: 'Ramadan today',
    ramadanDay: 'Ramadan day',
    imsak: 'Imsak',
    suhurEnds: 'Suhur ends',
    iftar: 'Iftar',
    taraweeh: 'Taraweeh',
    noSelectedMosqueTitle: 'Choose a mosque for local timetable mode',
    noSelectedMosqueBody:
      'Local mosque prayer mode is selected, but no mosque profile is currently selected.',
    chooseMosque: 'Choose mosque',
    missingTimetableTitle: 'No local timetable stored',
    missingTimetableBody:
      'This mosque does not have a saved timetable available on this device yet.',
    staleTimetableTitle: "Today's mosque timetable is unavailable",
    staleTimetableBody:
      'The saved mosque timetable does not contain a row for today, so managed prayer times may be unavailable.',
    offlineManagedTitle: 'Using stored mosque timetable offline',
    offlineManagedBody:
      'Prayer and Iqamah times are being read from the timetable already saved on this device.',
    astronomicalUnavailableTitle: 'Some astronomical times are unavailable',
    astronomicalUnavailableBody:
      'One or more calculated astronomical events could not be resolved for this location and date.',
    communityEyebrow: 'From your mosque',
    communityTitle: 'Community update',
    announcement: 'Announcement',
    event: 'Upcoming event',
    viewCommunity: 'View Community',
    starts: 'Starts',
    venue: 'Venue',
  },
  ar: {
    ramadanEyebrow: 'رمضان اليوم',
    ramadanDay: 'اليوم من رمضان',
    imsak: 'الإمساك',
    suhurEnds: 'نهاية السحور',
    iftar: 'الإفطار',
    taraweeh: 'التراويح',
    noSelectedMosqueTitle: 'اختر مسجدًا لوضع مواقيت المسجد المحلي',
    noSelectedMosqueBody: 'تم اختيار مواقيت المسجد المحلي، لكن لا يوجد ملف مسجد محدد حاليًا.',
    chooseMosque: 'اختر المسجد',
    missingTimetableTitle: 'لا يوجد جدول مسجد محفوظ',
    missingTimetableBody: 'لا يتوفر لهذا المسجد جدول مواقيت محفوظ على هذا الجهاز حتى الآن.',
    staleTimetableTitle: 'جدول المسجد لليوم غير متوفر',
    staleTimetableBody:
      'الجدول المحفوظ لا يحتوي على صف لتاريخ اليوم، لذلك قد لا تتوفر أوقات الصلاة المُدارة.',
    offlineManagedTitle: 'استخدام جدول المسجد المحفوظ دون اتصال',
    offlineManagedBody: 'تُقرأ أوقات الصلاة والإقامة من الجدول المحفوظ مسبقًا على هذا الجهاز.',
    astronomicalUnavailableTitle: 'بعض الأوقات الفلكية غير متوفرة',
    astronomicalUnavailableBody:
      'تعذر تحديد حدث فلكي واحد أو أكثر لهذا الموقع والتاريخ.',
    communityEyebrow: 'من مسجدك',
    communityTitle: 'تحديث المجتمع',
    announcement: 'إعلان',
    event: 'فعالية قادمة',
    viewCommunity: 'عرض المجتمع',
    starts: 'يبدأ',
    venue: 'المكان',
  },
  tr: {
    ramadanEyebrow: 'Bugün Ramazan',
    ramadanDay: 'Ramazan günü',
    imsak: 'İmsak',
    suhurEnds: 'Sahur bitişi',
    iftar: 'İftar',
    taraweeh: 'Teravih',
    noSelectedMosqueTitle: 'Yerel takvim modu için bir cami seçin',
    noSelectedMosqueBody: 'Yerel cami modu seçili, ancak şu anda seçili bir cami profili yok.',
    chooseMosque: 'Cami seç',
    missingTimetableTitle: 'Kayıtlı yerel takvim yok',
    missingTimetableBody: 'Bu cami için bu cihazda henüz kayıtlı bir vakit çizelgesi yok.',
    staleTimetableTitle: 'Bugünün cami takvimi kullanılamıyor',
    staleTimetableBody:
      'Kayıtlı takvim bugünün tarihini içermiyor; yönetilen namaz vakitleri kullanılamayabilir.',
    offlineManagedTitle: 'Kayıtlı cami takvimi çevrimdışı kullanılıyor',
    offlineManagedBody: 'Namaz ve ikamet vakitleri bu cihazda kayıtlı takvimden okunuyor.',
    astronomicalUnavailableTitle: 'Bazı astronomik vakitler kullanılamıyor',
    astronomicalUnavailableBody:
      'Bu konum ve tarih için bir veya daha fazla astronomik olay hesaplanamadı.',
    communityEyebrow: 'Caminizden',
    communityTitle: 'Topluluk güncellemesi',
    announcement: 'Duyuru',
    event: 'Yaklaşan etkinlik',
    viewCommunity: 'Topluluğu görüntüle',
    starts: 'Başlangıç',
    venue: 'Yer',
  },
  id: {
    ramadanEyebrow: 'Ramadan hari ini',
    ramadanDay: 'Hari Ramadan',
    imsak: 'Imsak',
    suhurEnds: 'Sahur berakhir',
    iftar: 'Iftar',
    taraweeh: 'Tarawih',
    noSelectedMosqueTitle: 'Pilih masjid untuk mode jadwal lokal',
    noSelectedMosqueBody: 'Mode masjid lokal dipilih, tetapi belum ada profil masjid yang dipilih.',
    chooseMosque: 'Pilih masjid',
    missingTimetableTitle: 'Tidak ada jadwal lokal tersimpan',
    missingTimetableBody: 'Belum ada jadwal masjid ini yang tersimpan di perangkat.',
    staleTimetableTitle: 'Jadwal masjid hari ini tidak tersedia',
    staleTimetableBody:
      'Jadwal tersimpan tidak memiliki data untuk hari ini, sehingga waktu salat terkelola mungkin tidak tersedia.',
    offlineManagedTitle: 'Menggunakan jadwal masjid tersimpan secara offline',
    offlineManagedBody: 'Waktu salat dan iqamah dibaca dari jadwal yang sudah tersimpan di perangkat ini.',
    astronomicalUnavailableTitle: 'Sebagian waktu astronomi tidak tersedia',
    astronomicalUnavailableBody:
      'Satu atau lebih peristiwa astronomi tidak dapat ditentukan untuk lokasi dan tanggal ini.',
    communityEyebrow: 'Dari masjid Anda',
    communityTitle: 'Pembaruan komunitas',
    announcement: 'Pengumuman',
    event: 'Acara mendatang',
    viewCommunity: 'Lihat Komunitas',
    starts: 'Mulai',
    venue: 'Lokasi',
  },
};
