import type { Locale } from './translations';

interface AustralianMosqueDirectoryCopy {
  title: string;
  subtitle: string;
  offline: string;
  search: string;
  searchPlaceholder: string;
  nearest: string;
  alphabetical: string;
  locationNeeded: string;
  nearbyStatus: string;
  results: string;
  distance: string;
  useMosque: string;
  selected: string;
  showAll: string;
  showLess: string;
  noMatch: string;
  attribution: string;
  snapshot: string;
}

export const australianMosqueDirectoryCopy = {
  en: {
    title: 'Australian mosque directory',
    subtitle: 'Preloaded mosque and musalla locations available offline across Australia.',
    offline: 'Offline',
    search: 'Search the Australian directory',
    searchPlaceholder: 'Mosque, suburb, address or state',
    nearest: 'Nearest first',
    alphabetical: 'Alphabetical',
    locationNeeded: 'Save a location in Settings to sort the directory by distance.',
    nearbyStatus: 'Distance is calculated privately on this device from your saved location.',
    results: 'results',
    distance: 'Distance',
    useMosque: 'Use mosque',
    selected: 'Selected',
    showAll: 'Show all results',
    showLess: 'Show fewer',
    noMatch: 'No Australian directory mosques match this search.',
    attribution: 'Directory data © OpenStreetMap contributors, licensed under ODbL 1.0.',
    snapshot: 'OSM snapshot',
  },
  ar: {
    title: 'دليل المساجد الأسترالية',
    subtitle: 'مواقع مساجد ومصليات محمّلة مسبقاً ومتاحة دون اتصال في أنحاء أستراليا.',
    offline: 'دون اتصال',
    search: 'البحث في دليل أستراليا',
    searchPlaceholder: 'المسجد أو الضاحية أو العنوان أو الولاية',
    nearest: 'الأقرب أولاً',
    alphabetical: 'أبجدي',
    locationNeeded: 'احفظ موقعاً في الإعدادات لترتيب الدليل حسب المسافة.',
    nearbyStatus: 'تُحسب المسافة بشكل خاص على هذا الجهاز من موقعك المحفوظ.',
    results: 'نتيجة',
    distance: 'المسافة',
    useMosque: 'استخدام المسجد',
    selected: 'محدد',
    showAll: 'عرض كل النتائج',
    showLess: 'عرض أقل',
    noMatch: 'لا توجد مساجد في دليل أستراليا تطابق هذا البحث.',
    attribution: 'بيانات الدليل © مساهمو OpenStreetMap، مرخّصة بموجب ODbL 1.0.',
    snapshot: 'لقطة OSM',
  },
  tr: {
    title: 'Avustralya cami dizini',
    subtitle:
      'Avustralya genelinde çevrimdışı kullanılabilen önceden yüklenmiş cami ve mescit konumları.',
    offline: 'Çevrimdışı',
    search: 'Avustralya dizininde ara',
    searchPlaceholder: 'Cami, semt, adres veya eyalet',
    nearest: 'En yakın önce',
    alphabetical: 'Alfabetik',
    locationNeeded: 'Dizini mesafeye göre sıralamak için Ayarlar’da bir konum kaydedin.',
    nearbyStatus: 'Mesafe, kayıtlı konumunuzdan yalnızca bu cihazda özel olarak hesaplanır.',
    results: 'sonuç',
    distance: 'Mesafe',
    useMosque: 'Camiyi kullan',
    selected: 'Seçili',
    showAll: 'Tüm sonuçları göster',
    showLess: 'Daha az göster',
    noMatch: 'Bu aramayla eşleşen Avustralya dizini camisi yok.',
    attribution: 'Dizin verileri © OpenStreetMap katkıcıları, ODbL 1.0 lisansı altındadır.',
    snapshot: 'OSM anlık görüntüsü',
  },
  id: {
    title: 'Direktori masjid Australia',
    subtitle:
      'Lokasi masjid dan musala yang dimuat sebelumnya dan tersedia luring di seluruh Australia.',
    offline: 'Luring',
    search: 'Cari direktori Australia',
    searchPlaceholder: 'Masjid, kawasan, alamat, atau negara bagian',
    nearest: 'Terdekat dahulu',
    alphabetical: 'Alfabetis',
    locationNeeded: 'Simpan lokasi di Pengaturan untuk mengurutkan direktori berdasarkan jarak.',
    nearbyStatus: 'Jarak dihitung secara privat di perangkat ini dari lokasi tersimpan Anda.',
    results: 'hasil',
    distance: 'Jarak',
    useMosque: 'Gunakan masjid',
    selected: 'Dipilih',
    showAll: 'Tampilkan semua hasil',
    showLess: 'Tampilkan lebih sedikit',
    noMatch: 'Tidak ada masjid direktori Australia yang cocok dengan pencarian ini.',
    attribution: 'Data direktori © kontributor OpenStreetMap, berlisensi ODbL 1.0.',
    snapshot: 'Snapshot OSM',
  },
} as const satisfies Readonly<Record<Locale, Readonly<AustralianMosqueDirectoryCopy>>>;
