export type Locale = 'en' | 'ar';

export const translations = {
  en: {
    appName: 'SalahOS',
    heroTitle: 'Prayer times, locally calculated.',
    heroCopy: 'Privacy-first prayer times for mobile, Raspberry Pi, TV, and kiosk displays.',
    currentLocation: 'Current location',
    calculationSource: 'Calculation source',
    notConfigured: 'Not configured',
    today: 'Today',
    dailyPrayers: 'Daily prayers',
    configureLocation: 'Configure a location to begin',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    prayerFajr: 'Fajr',
    prayerDhuhr: 'Dhuhr',
    prayerAsr: 'Asr',
    prayerMaghrib: 'Maghrib',
    prayerIsha: 'Isha',
  },
  ar: {
    appName: 'صلاح أو إس',
    heroTitle: 'مواقيت الصلاة محسوبة محلياً.',
    heroCopy: 'مواقيت صلاة تراعي الخصوصية للهاتف وراسبيري باي والتلفاز وشاشات العرض.',
    currentLocation: 'الموقع الحالي',
    calculationSource: 'مصدر المواقيت',
    notConfigured: 'غير مُعدّ',
    today: 'اليوم',
    dailyPrayers: 'الصلوات اليومية',
    configureLocation: 'حدّد موقعاً للبدء',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    prayerFajr: 'الفجر',
    prayerDhuhr: 'الظهر',
    prayerAsr: 'العصر',
    prayerMaghrib: 'المغرب',
    prayerIsha: 'العشاء',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
