import type { Locale } from './translations';

export interface SharedMosqueDirectoryCopy {
  readonly title: string;
  readonly subtitle: string;
  readonly shared: string;
  readonly search: string;
  readonly searchPlaceholder: string;
  readonly searchAction: string;
  readonly nearby: string;
  readonly nearbyHint: string;
  readonly cached: string;
  readonly online: string;
  readonly offline: string;
  readonly noResults: string;
  readonly useMosque: string;
  readonly selected: string;
  readonly distance: string;
  readonly unverified: string;
  readonly verified: string;
  readonly claimed: string;
  readonly contribute: string;
  readonly submitMosque: string;
  readonly name: string;
  readonly address: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly timeZone: string;
  readonly submit: string;
  readonly pending: string;
  readonly duplicate: string;
  readonly suggestEdit: string;
  readonly suggestionPlaceholder: string;
  readonly claim: string;
  readonly claimContact: string;
  readonly send: string;
  readonly contributionQueued: string;
  readonly contributionReceived: string;
  readonly privacy: string;
}

export const sharedMosqueDirectoryCopy: Readonly<Record<Locale, SharedMosqueDirectoryCopy>> = {
  en: {
    title: 'Community mosque directory',
    subtitle: 'Search shared mosque listings, use nearby results, and contribute corrections.',
    shared: 'Shared directory',
    search: 'Search community directory',
    searchPlaceholder: 'Mosque, suburb or address',
    searchAction: 'Search',
    nearby: 'Near me',
    nearbyHint: 'Uses your saved SalahOS location only when you request nearby results.',
    cached: 'Cached results',
    online: 'Connected',
    offline: 'Offline cache',
    noResults: 'No shared mosque results match this search.',
    useMosque: 'Use mosque',
    selected: 'Selected',
    distance: 'Distance',
    unverified: 'Unverified',
    verified: 'Verified',
    claimed: 'Claimed',
    contribute: 'Contribute',
    submitMosque: 'Submit a mosque',
    name: 'Mosque name',
    address: 'Address',
    latitude: 'Latitude',
    longitude: 'Longitude',
    timeZone: 'Timezone',
    submit: 'Submit for review',
    pending: 'Pending moderation',
    duplicate: 'A likely duplicate already exists in the directory.',
    suggestEdit: 'Suggest edit',
    suggestionPlaceholder: 'Corrected name or address',
    claim: 'Request claim',
    claimContact: 'Mosque contact email or phone',
    send: 'Send for review',
    contributionQueued: 'Saved locally and queued until the shared service is reachable.',
    contributionReceived: 'Received for moderation.',
    privacy: 'Search and contribution requests use the configured SalahOS directory service. Nearby search sends coordinates only after you choose Near me.',
  },
  ar: {
    title: 'دليل المساجد المجتمعي',
    subtitle: 'ابحث في المساجد المشتركة واعرض القريبة وساهم بالتصحيحات.',
    shared: 'الدليل المشترك',
    search: 'بحث في دليل المجتمع',
    searchPlaceholder: 'مسجد أو ضاحية أو عنوان',
    searchAction: 'بحث',
    nearby: 'بالقرب مني',
    nearbyHint: 'يستخدم موقع صلاحOS المحفوظ فقط عند طلب النتائج القريبة.',
    cached: 'نتائج مخزنة',
    online: 'متصل',
    offline: 'ذاكرة محلية',
    noResults: 'لا توجد نتائج مطابقة في الدليل المشترك.',
    useMosque: 'استخدم المسجد',
    selected: 'محدد',
    distance: 'المسافة',
    unverified: 'غير موثق',
    verified: 'موثق',
    claimed: 'تحت إدارة المسجد',
    contribute: 'ساهم',
    submitMosque: 'أضف مسجداً',
    name: 'اسم المسجد',
    address: 'العنوان',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    timeZone: 'المنطقة الزمنية',
    submit: 'أرسل للمراجعة',
    pending: 'بانتظار الإشراف',
    duplicate: 'يوجد مسجد مشابه على الأرجح في الدليل.',
    suggestEdit: 'اقترح تعديلاً',
    suggestionPlaceholder: 'الاسم أو العنوان المصحح',
    claim: 'طلب إدارة الصفحة',
    claimContact: 'بريد أو هاتف جهة المسجد',
    send: 'أرسل للمراجعة',
    contributionQueued: 'حُفظ محلياً وسيُرسل عند توفر خدمة الدليل.',
    contributionReceived: 'تم الاستلام للمراجعة.',
    privacy: 'تستخدم عمليات البحث والمساهمة خدمة دليل صلاحOS المهيأة. لا تُرسل الإحداثيات إلا بعد اختيار بالقرب مني.',
  },
  tr: {
    title: 'Topluluk cami dizini',
    subtitle: 'Paylaşılan camileri arayın, yakındakileri bulun ve düzeltme önerin.',
    shared: 'Paylaşılan dizin',
    search: 'Topluluk dizininde ara',
    searchPlaceholder: 'Cami, semt veya adres',
    searchAction: 'Ara',
    nearby: 'Yakınımda',
    nearbyHint: 'Yakın sonuçları istediğinizde yalnızca kayıtlı SalahOS konumunu kullanır.',
    cached: 'Önbellek sonuçları',
    online: 'Bağlı',
    offline: 'Çevrimdışı önbellek',
    noResults: 'Bu aramayla eşleşen ortak cami bulunamadı.',
    useMosque: 'Camiyi kullan',
    selected: 'Seçili',
    distance: 'Mesafe',
    unverified: 'Doğrulanmamış',
    verified: 'Doğrulanmış',
    claimed: 'Cami tarafından sahiplenilmiş',
    contribute: 'Katkıda bulun',
    submitMosque: 'Cami gönder',
    name: 'Cami adı',
    address: 'Adres',
    latitude: 'Enlem',
    longitude: 'Boylam',
    timeZone: 'Saat dilimi',
    submit: 'İncelemeye gönder',
    pending: 'Moderasyon bekliyor',
    duplicate: 'Dizinde olası bir kopya zaten var.',
    suggestEdit: 'Düzeltme öner',
    suggestionPlaceholder: 'Düzeltilmiş ad veya adres',
    claim: 'Sahiplenme isteği',
    claimContact: 'Cami iletişim e-postası veya telefonu',
    send: 'İncelemeye gönder',
    contributionQueued: 'Yerel olarak kaydedildi; hizmet erişilebilir olduğunda gönderilebilir.',
    contributionReceived: 'Moderasyon için alındı.',
    privacy: 'Arama ve katkılar yapılandırılmış SalahOS dizin hizmetini kullanır. Koordinatlar yalnızca Yakınımda seçildiğinde gönderilir.',
  },
  id: {
    title: 'Direktori masjid komunitas',
    subtitle: 'Cari masjid bersama, temukan yang terdekat, dan kirim koreksi.',
    shared: 'Direktori bersama',
    search: 'Cari direktori komunitas',
    searchPlaceholder: 'Masjid, daerah, atau alamat',
    searchAction: 'Cari',
    nearby: 'Di dekat saya',
    nearbyHint: 'Hanya memakai lokasi SalahOS tersimpan saat Anda meminta hasil terdekat.',
    cached: 'Hasil tersimpan',
    online: 'Terhubung',
    offline: 'Cache offline',
    noResults: 'Tidak ada hasil masjid bersama yang cocok.',
    useMosque: 'Gunakan masjid',
    selected: 'Dipilih',
    distance: 'Jarak',
    unverified: 'Belum diverifikasi',
    verified: 'Terverifikasi',
    claimed: 'Dikelola masjid',
    contribute: 'Kontribusi',
    submitMosque: 'Kirim masjid',
    name: 'Nama masjid',
    address: 'Alamat',
    latitude: 'Lintang',
    longitude: 'Bujur',
    timeZone: 'Zona waktu',
    submit: 'Kirim untuk ditinjau',
    pending: 'Menunggu moderasi',
    duplicate: 'Kemungkinan duplikat sudah ada di direktori.',
    suggestEdit: 'Sarankan perubahan',
    suggestionPlaceholder: 'Nama atau alamat yang diperbaiki',
    claim: 'Minta klaim',
    claimContact: 'Email atau telepon kontak masjid',
    send: 'Kirim untuk ditinjau',
    contributionQueued: 'Disimpan lokal dan diantrikan sampai layanan direktori tersedia.',
    contributionReceived: 'Diterima untuk moderasi.',
    privacy: 'Pencarian dan kontribusi memakai layanan direktori SalahOS yang dikonfigurasi. Koordinat hanya dikirim setelah Anda memilih Di dekat saya.',
  },
};
