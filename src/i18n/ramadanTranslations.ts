import type { Locale } from './translations';

export interface RamadanTranslationCopy {
  readonly eyebrow: string;
  readonly day: string;
  readonly yearSuffix: string;
  readonly message: string;
  readonly source: string;
  readonly suhurEnd: string;
  readonly suhurHelp: string;
  readonly iftar: string;
  readonly iftarHelp: string;
  readonly optionalImsak: string;
  readonly imsakOffset: string;
  readonly noExtraImsak: string;
  readonly minutesBeforeFajr: string;
  readonly imsakHelp: string;
  readonly savedLocally: string;
  readonly unavailable: string;
  readonly calculatedSource: string;
  readonly adjustedSource: string;
  readonly mosqueSource: string;
}

export const ramadanTranslations: Readonly<Record<Locale, RamadanTranslationCopy>> = {
  en: {
    eyebrow: 'Ramadan mode',
    day: 'Ramadan day',
    yearSuffix: 'AH',
    message: 'Ramadan presentation is active for the selected location.',
    source: 'Prayer times continue to use your selected calculation or mosque source.',
    suhurEnd: 'Suhur ends',
    suhurHelp: 'Fasting begins at the displayed Fajr time.',
    iftar: 'Iftar',
    iftarHelp: 'Iftar follows the displayed Maghrib time.',
    optionalImsak: 'Optional Imsak',
    imsakOffset: 'Imsak display offset',
    noExtraImsak: 'No extra Imsak cutoff',
    minutesBeforeFajr: 'minutes before Fajr',
    imsakHelp:
      'Optional precaution only. It does not move Fajr or replace Fajr as the fasting boundary.',
    savedLocally: 'This Ramadan display preference is stored only on this device.',
    unavailable: 'Unavailable',
    calculatedSource: 'Calculated locally',
    adjustedSource: 'Calculated locally + adjustments',
    mosqueSource: 'Local mosque timetable',
  },
  ar: {
    eyebrow: 'وضع رمضان',
    day: 'اليوم من رمضان',
    yearSuffix: 'هـ',
    message: 'تم تفعيل عرض رمضان للموقع المحدد.',
    source: 'تستمر مواقيت الصلاة باستخدام طريقة الحساب أو مصدر المسجد الذي اخترته.',
    suhurEnd: 'نهاية السحور',
    suhurHelp: 'يبدأ الصيام عند وقت الفجر المعروض.',
    iftar: 'الإفطار',
    iftarHelp: 'يتبع الإفطار وقت المغرب المعروض.',
    optionalImsak: 'الإمساك الاختياري',
    imsakOffset: 'فارق عرض الإمساك',
    noExtraImsak: 'لا يوجد إمساك إضافي',
    minutesBeforeFajr: 'دقائق قبل الفجر',
    imsakHelp: 'احتياط اختياري فقط. لا يغيّر وقت الفجر ولا يستبدل الفجر كبداية للصيام.',
    savedLocally: 'يُحفظ تفضيل عرض رمضان هذا على هذا الجهاز فقط.',
    unavailable: 'غير متاح',
    calculatedSource: 'محسوب محلياً',
    adjustedSource: 'محسوب محلياً مع التعديلات',
    mosqueSource: 'جدول المسجد المحلي',
  },
};
