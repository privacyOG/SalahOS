import type { Locale } from './translations';

type LocalizedCopy<T> = Readonly<Record<Locale, Readonly<T>>>;

interface MosquesV2Copy {
  title: string;
  subtitle: string;
  followed: string;
  nearby: string;
  search: string;
  searchPlaceholder: string;
  noFollowed: string;
  noMatch: string;
  useMosque: string;
  selected: string;
  viewProfile: string;
  nearbyPrivacy: string;
  nearbyAction: string;
  nearbyUsingSaved: string;
  nearbyNeedsLocation: string;
  distance: string;
  profile: string;
  todayPrayerTimes: string;
  nextPrayer: string;
  iqamah: string;
  source: string;
  calculatedSource: string;
  localTimetableSource: string;
  localTimetableNotLinked: string;
  jumuah: string;
  noJumuah: string;
  announcements: string;
  noAnnouncements: string;
  events: string;
  noEvents: string;
  address: string;
  timezone: string;
  facilities: string;
  contact: string;
  noFacilities: string;
  noContact: string;
  unavailable: string;
  tomorrow: string;
}

interface CommunityV2Copy {
  title: string;
  subtitle: string;
  announcements: string;
  events: string;
  emptyAnnouncements: string;
  emptyEvents: string;
  pinned: string;
  priority: string;
  published: string;
  upcoming: string;
  source: string;
  availableUntil: string;
  starts: string;
  venue: string;
  allDay: string;
  openLink: string;
  eventInfo: string;
}

export const mosquesV2Copy = {
  en: {
    title: 'Mosques',
    subtitle:
      'Followed mosque profiles, today’s prayer context and private on-device nearby sorting.',
    followed: 'Followed',
    nearby: 'Nearby',
    search: 'Search followed mosques',
    searchPlaceholder: 'Mosque name, address or facility',
    noFollowed: 'No followed mosque profiles are stored on this device yet.',
    noMatch: 'No followed mosques match this search.',
    useMosque: 'Use mosque',
    selected: 'Selected',
    viewProfile: 'View profile',
    nearbyPrivacy:
      'Nearby sorting uses only the location already saved in SalahOS and mosque coordinates stored on this device. It does not request GPS or contact a remote directory.',
    nearbyAction: 'Show nearby followed mosques',
    nearbyUsingSaved: 'Sorted locally from your saved SalahOS location.',
    nearbyNeedsLocation: 'Save a location in Settings before using nearby sorting.',
    distance: 'Distance',
    profile: 'Mosque profile',
    todayPrayerTimes: 'Today’s prayer times',
    nextPrayer: 'Next prayer',
    iqamah: 'Iqamah',
    source: 'Prayer source',
    calculatedSource: 'Calculated locally at this mosque’s coordinates',
    localTimetableSource: 'Linked local mosque timetable',
    localTimetableNotLinked: 'No matching local timetable is linked to this mosque profile.',
    jumuah: 'Jumu‘ah',
    noJumuah: 'No Jumu‘ah sessions are available for today.',
    announcements: 'Announcements',
    noAnnouncements: 'No current announcements for this mosque.',
    events: 'Upcoming events',
    noEvents: 'No upcoming events for this mosque.',
    address: 'Address',
    timezone: 'Timezone',
    facilities: 'Facilities',
    contact: 'Contact',
    noFacilities: 'No facilities are listed.',
    noContact: 'No public contact details are listed.',
    unavailable: 'Unavailable',
    tomorrow: 'tomorrow',
  },
  ar: {
    title: 'المساجد',
    subtitle:
      'ملفات المساجد المتابَعة وسياق صلاة اليوم وترتيب القرب محلياً مع الحفاظ على الخصوصية.',
    followed: 'المتابَعة',
    nearby: 'القريبة',
    search: 'البحث في المساجد المتابَعة',
    searchPlaceholder: 'اسم المسجد أو العنوان أو المرفق',
    noFollowed: 'لا توجد ملفات مساجد متابَعة محفوظة على هذا الجهاز بعد.',
    noMatch: 'لا توجد مساجد متابَعة تطابق هذا البحث.',
    useMosque: 'استخدام المسجد',
    selected: 'محدد',
    viewProfile: 'عرض الملف',
    nearbyPrivacy:
      'يستخدم ترتيب القرب فقط الموقع المحفوظ مسبقاً في SalahOS وإحداثيات المساجد المخزنة على هذا الجهاز. لا يطلب GPS ولا يتصل بدليل خارجي.',
    nearbyAction: 'عرض المساجد المتابَعة القريبة',
    nearbyUsingSaved: 'تم الترتيب محلياً من موقع SalahOS المحفوظ.',
    nearbyNeedsLocation: 'احفظ موقعاً في الإعدادات قبل استخدام ترتيب القرب.',
    distance: 'المسافة',
    profile: 'ملف المسجد',
    todayPrayerTimes: 'أوقات صلاة اليوم',
    nextPrayer: 'الصلاة القادمة',
    iqamah: 'الإقامة',
    source: 'مصدر أوقات الصلاة',
    calculatedSource: 'محسوبة محلياً عند إحداثيات هذا المسجد',
    localTimetableSource: 'جدول مسجد محلي مرتبط',
    localTimetableNotLinked: 'لا يوجد جدول مسجد محلي مطابق مرتبط بهذا الملف.',
    jumuah: 'الجمعة',
    noJumuah: 'لا توجد جلسات جمعة متاحة لليوم.',
    announcements: 'الإعلانات',
    noAnnouncements: 'لا توجد إعلانات حالية لهذا المسجد.',
    events: 'الفعاليات القادمة',
    noEvents: 'لا توجد فعاليات قادمة لهذا المسجد.',
    address: 'العنوان',
    timezone: 'المنطقة الزمنية',
    facilities: 'المرافق',
    contact: 'التواصل',
    noFacilities: 'لا توجد مرافق مدرجة.',
    noContact: 'لا توجد بيانات تواصل عامة مدرجة.',
    unavailable: 'غير متاح',
    tomorrow: 'غداً',
  },
  tr: {
    title: 'Camiler',
    subtitle:
      'Takip edilen cami profilleri, bugünün namaz bağlamı ve cihaz üzerinde özel yakınlık sıralaması.',
    followed: 'Takip edilen',
    nearby: 'Yakındaki',
    search: 'Takip edilen camilerde ara',
    searchPlaceholder: 'Cami adı, adres veya tesis',
    noFollowed: 'Bu cihazda henüz takip edilen cami profili yok.',
    noMatch: 'Bu aramayla eşleşen takip edilen cami yok.',
    useMosque: 'Camiyi kullan',
    selected: 'Seçili',
    viewProfile: 'Profili görüntüle',
    nearbyPrivacy:
      'Yakınlık sıralaması yalnızca SalahOS’ta kayıtlı konumu ve bu cihazdaki cami koordinatlarını kullanır. GPS istemez ve uzak bir dizine bağlanmaz.',
    nearbyAction: 'Yakındaki takip edilen camileri göster',
    nearbyUsingSaved: 'Kayıtlı SalahOS konumunuzdan yerel olarak sıralandı.',
    nearbyNeedsLocation: 'Yakınlık sıralamasını kullanmadan önce Ayarlar’da bir konum kaydedin.',
    distance: 'Mesafe',
    profile: 'Cami profili',
    todayPrayerTimes: 'Bugünün namaz vakitleri',
    nextPrayer: 'Sonraki namaz',
    iqamah: 'Kamet',
    source: 'Namaz kaynağı',
    calculatedSource: 'Bu caminin koordinatlarında yerel olarak hesaplandı',
    localTimetableSource: 'Bağlı yerel cami takvimi',
    localTimetableNotLinked: 'Bu cami profiline bağlı eşleşen yerel takvim yok.',
    jumuah: 'Cuma',
    noJumuah: 'Bugün için Cuma oturumu bulunmuyor.',
    announcements: 'Duyurular',
    noAnnouncements: 'Bu cami için güncel duyuru yok.',
    events: 'Yaklaşan etkinlikler',
    noEvents: 'Bu cami için yaklaşan etkinlik yok.',
    address: 'Adres',
    timezone: 'Saat dilimi',
    facilities: 'Tesisler',
    contact: 'İletişim',
    noFacilities: 'Tesis bilgisi listelenmemiş.',
    noContact: 'Genel iletişim bilgisi listelenmemiş.',
    unavailable: 'Kullanılamıyor',
    tomorrow: 'yarın',
  },
  id: {
    title: 'Masjid',
    subtitle:
      'Profil masjid yang diikuti, konteks salat hari ini, dan pengurutan terdekat secara privat di perangkat.',
    followed: 'Diikuti',
    nearby: 'Terdekat',
    search: 'Cari masjid yang diikuti',
    searchPlaceholder: 'Nama masjid, alamat, atau fasilitas',
    noFollowed: 'Belum ada profil masjid yang diikuti tersimpan di perangkat ini.',
    noMatch: 'Tidak ada masjid yang diikuti cocok dengan pencarian ini.',
    useMosque: 'Gunakan masjid',
    selected: 'Dipilih',
    viewProfile: 'Lihat profil',
    nearbyPrivacy:
      'Pengurutan terdekat hanya memakai lokasi yang sudah tersimpan di SalahOS dan koordinat masjid di perangkat ini. Fitur ini tidak meminta GPS atau menghubungi direktori jarak jauh.',
    nearbyAction: 'Tampilkan masjid diikuti terdekat',
    nearbyUsingSaved: 'Diurutkan secara lokal dari lokasi SalahOS yang tersimpan.',
    nearbyNeedsLocation: 'Simpan lokasi di Pengaturan sebelum memakai pengurutan terdekat.',
    distance: 'Jarak',
    profile: 'Profil masjid',
    todayPrayerTimes: 'Waktu salat hari ini',
    nextPrayer: 'Salat berikutnya',
    iqamah: 'Iqamah',
    source: 'Sumber waktu salat',
    calculatedSource: 'Dihitung lokal pada koordinat masjid ini',
    localTimetableSource: 'Jadwal masjid lokal tertaut',
    localTimetableNotLinked: 'Tidak ada jadwal masjid lokal yang cocok tertaut ke profil ini.',
    jumuah: 'Jumat',
    noJumuah: 'Tidak ada sesi Jumat untuk hari ini.',
    announcements: 'Pengumuman',
    noAnnouncements: 'Tidak ada pengumuman aktif untuk masjid ini.',
    events: 'Acara mendatang',
    noEvents: 'Tidak ada acara mendatang untuk masjid ini.',
    address: 'Alamat',
    timezone: 'Zona waktu',
    facilities: 'Fasilitas',
    contact: 'Kontak',
    noFacilities: 'Tidak ada fasilitas yang tercantum.',
    noContact: 'Tidak ada detail kontak publik yang tercantum.',
    unavailable: 'Tidak tersedia',
    tomorrow: 'besok',
  },
} as const satisfies LocalizedCopy<MosquesV2Copy>;

export const communityV2Copy = {
  en: {
    title: 'Community',
    subtitle:
      'Published mosque announcements and upcoming events, separated from administration tools.',
    announcements: 'Announcements',
    events: 'Events',
    emptyAnnouncements: 'No published announcements are available for the selected mosque.',
    emptyEvents: 'No upcoming events are available for the selected mosque.',
    pinned: 'Pinned',
    priority: 'Priority',
    published: 'Published',
    upcoming: 'Upcoming',
    source: 'Mosque',
    availableUntil: 'Available until',
    starts: 'Starts',
    venue: 'Venue',
    allDay: 'All day',
    openLink: 'Open announcement',
    eventInfo: 'Event information',
  },
  ar: {
    title: 'المجتمع',
    subtitle: 'إعلانات المساجد المنشورة والفعاليات القادمة بعيداً عن أدوات الإدارة.',
    announcements: 'الإعلانات',
    events: 'الفعاليات',
    emptyAnnouncements: 'لا توجد إعلانات منشورة متاحة للمسجد المحدد.',
    emptyEvents: 'لا توجد فعاليات قادمة متاحة للمسجد المحدد.',
    pinned: 'مثبّت',
    priority: 'مهم',
    published: 'منشور',
    upcoming: 'قادم',
    source: 'المسجد',
    availableUntil: 'متاح حتى',
    starts: 'يبدأ',
    venue: 'المكان',
    allDay: 'طوال اليوم',
    openLink: 'فتح الإعلان',
    eventInfo: 'معلومات الفعالية',
  },
  tr: {
    title: 'Topluluk',
    subtitle: 'Yönetim araçlarından ayrı yayımlanmış cami duyuruları ve yaklaşan etkinlikler.',
    announcements: 'Duyurular',
    events: 'Etkinlikler',
    emptyAnnouncements: 'Seçili cami için yayımlanmış duyuru yok.',
    emptyEvents: 'Seçili cami için yaklaşan etkinlik yok.',
    pinned: 'Sabitlenmiş',
    priority: 'Öncelikli',
    published: 'Yayımlandı',
    upcoming: 'Yaklaşan',
    source: 'Cami',
    availableUntil: 'Şu tarihe kadar',
    starts: 'Başlangıç',
    venue: 'Yer',
    allDay: 'Tüm gün',
    openLink: 'Duyuruyu aç',
    eventInfo: 'Etkinlik bilgileri',
  },
  id: {
    title: 'Komunitas',
    subtitle:
      'Pengumuman masjid yang diterbitkan dan acara mendatang, terpisah dari alat administrasi.',
    announcements: 'Pengumuman',
    events: 'Acara',
    emptyAnnouncements: 'Tidak ada pengumuman terbit untuk masjid yang dipilih.',
    emptyEvents: 'Tidak ada acara mendatang untuk masjid yang dipilih.',
    pinned: 'Disematkan',
    priority: 'Prioritas',
    published: 'Terbit',
    upcoming: 'Mendatang',
    source: 'Masjid',
    availableUntil: 'Tersedia hingga',
    starts: 'Mulai',
    venue: 'Tempat',
    allDay: 'Sepanjang hari',
    openLink: 'Buka pengumuman',
    eventInfo: 'Informasi acara',
  },
} as const satisfies LocalizedCopy<CommunityV2Copy>;
