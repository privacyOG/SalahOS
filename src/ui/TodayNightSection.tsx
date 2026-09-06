import type { NightEndConvention } from '../domain/supplementaryTimes';
import type { NightPrayerPresentation } from '../domain/nightPrayerPresentation';
import { formatLocalTime } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import type { TimeFormatPreference } from '../platform/settingsStorage';

type NightCopy = Readonly<{
  eyebrow: string;
  title: string;
  active: string;
  upcoming: string;
  islamicMidnight: string;
  lastThird: string;
  ishraq: string;
  nightEndsFajr: string;
  nightEndsSunrise: string;
  basisFajr: string;
  basisSunrise: string;
  afterSunrise: (minutes: string) => string;
}>;

const copy: Readonly<Record<Locale, NightCopy>> = {
  en: {
    eyebrow: 'Night',
    title: 'Tahajjud & night times',
    active: 'Active night',
    upcoming: 'Upcoming night',
    islamicMidnight: 'Islamic midnight',
    lastThird: 'Tahajjud · last third begins',
    ishraq: 'Ishraq / Duha',
    nightEndsFajr: 'Night ends at Fajr',
    nightEndsSunrise: 'Night ends at sunrise',
    basisFajr: 'Calculated from Maghrib to the next Fajr',
    basisSunrise: 'Calculated from Maghrib to the next sunrise',
    afterSunrise: (minutes) => `${minutes} min after sunrise`,
  },
  ar: {
    eyebrow: 'الليل',
    title: 'التهجد وأوقات الليل',
    active: 'الليل الحالي',
    upcoming: 'الليل القادم',
    islamicMidnight: 'منتصف الليل الشرعي',
    lastThird: 'التهجد · بداية الثلث الأخير',
    ishraq: 'الإشراق / الضحى',
    nightEndsFajr: 'ينتهي الليل عند الفجر',
    nightEndsSunrise: 'ينتهي الليل عند الشروق',
    basisFajr: 'محسوب من المغرب إلى الفجر التالي',
    basisSunrise: 'محسوب من المغرب إلى الشروق التالي',
    afterSunrise: (minutes) => `بعد الشروق بـ ${minutes} دقيقة`,
  },
  tr: {
    eyebrow: 'Gece',
    title: 'Teheccüd ve gece vakitleri',
    active: 'Aktif gece',
    upcoming: 'Yaklaşan gece',
    islamicMidnight: 'İslami gece yarısı',
    lastThird: 'Teheccüd · son üçte bir başlar',
    ishraq: 'İşrak / Duha',
    nightEndsFajr: 'Gece sabah namazında biter',
    nightEndsSunrise: 'Gece güneş doğuşunda biter',
    basisFajr: 'Akşam namazından sonraki sabah namazına kadar hesaplanır',
    basisSunrise: 'Akşam namazından sonraki güneş doğuşuna kadar hesaplanır',
    afterSunrise: (minutes) => `Güneş doğuşundan ${minutes} dk sonra`,
  },
  id: {
    eyebrow: 'Malam',
    title: 'Tahajud & waktu malam',
    active: 'Malam aktif',
    upcoming: 'Malam berikutnya',
    islamicMidnight: 'Tengah malam Islami',
    lastThird: 'Tahajud · sepertiga malam terakhir dimulai',
    ishraq: 'Isyraq / Duha',
    nightEndsFajr: 'Malam berakhir saat Subuh',
    nightEndsSunrise: 'Malam berakhir saat matahari terbit',
    basisFajr: 'Dihitung dari Magrib hingga Subuh berikutnya',
    basisSunrise: 'Dihitung dari Magrib hingga matahari terbit berikutnya',
    afterSunrise: (minutes) => `${minutes} mnt setelah matahari terbit`,
  },
};

function conventionLabel(localeCopy: NightCopy, convention: NightEndConvention): string {
  return convention === 'fajr' ? localeCopy.nightEndsFajr : localeCopy.nightEndsSunrise;
}

function conventionBasis(localeCopy: NightCopy, convention: NightEndConvention): string {
  return convention === 'fajr' ? localeCopy.basisFajr : localeCopy.basisSunrise;
}

function timeLabel(
  localMinutes: number | null,
  locale: Locale,
  timeFormat: TimeFormatPreference,
): string {
  return localMinutes === null ? '—' : formatLocalTime(localMinutes, locale, timeFormat);
}

export function TodayNightSection({
  model,
  locale,
  timeFormat,
  promoted = false,
}: Readonly<{
  model: NightPrayerPresentation;
  locale: Locale;
  timeFormat: TimeFormatPreference;
  promoted?: boolean;
}>) {
  const l = copy[locale];
  const number = new Intl.NumberFormat(locale);
  return (
    <section
      className={`today-night${promoted ? ' today-night--promoted' : ''}`}
      aria-labelledby={promoted ? 'today-night-title-promoted' : 'today-night-title'}
      data-night-phase={model.phase}
      data-night-end-convention={model.nightEndConvention}
    >
      <div className="today-section-heading today-night__heading">
        <div>
          <p>{l.eyebrow}</p>
          <h2 id={promoted ? 'today-night-title-promoted' : 'today-night-title'}>{l.title}</h2>
        </div>
        <div className="today-night__meta">
          <span>{model.phase === 'active' ? l.active : l.upcoming}</span>
          <small>{conventionLabel(l, model.nightEndConvention)}</small>
        </div>
      </div>
      <div className="today-night__times">
        <div data-supplementary-provenance={model.islamicMidnight.provenance}>
          <span>{l.islamicMidnight}</span>
          <strong>{timeLabel(model.islamicMidnight.localMinutes, locale, timeFormat)}</strong>
          <small>{conventionBasis(l, model.nightEndConvention)}</small>
        </div>
        <div data-supplementary-provenance={model.lastThirdStart.provenance}>
          <span>{l.lastThird}</span>
          <strong>{timeLabel(model.lastThirdStart.localMinutes, locale, timeFormat)}</strong>
          <small>{conventionBasis(l, model.nightEndConvention)}</small>
        </div>
        {model.ishraq !== null && model.ishraqMinutesAfterSunrise !== null && (
          <div data-supplementary-provenance={model.ishraq.provenance}>
            <span>{l.ishraq}</span>
            <strong>{timeLabel(model.ishraq.localMinutes, locale, timeFormat)}</strong>
            <small>{l.afterSunrise(number.format(model.ishraqMinutesAfterSunrise))}</small>
          </div>
        )}
      </div>
    </section>
  );
}
