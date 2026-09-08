import { useMemo, useState } from 'react';
import {
  buildPrayerCalendarDay,
  civilDatesForView,
  hijriCalendarLabel,
  type PrayerCalendarView,
  utcCivilDate,
} from '../domain/prayerCalendar';
import { formatLocalTime, localeTag } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { defaultPersistedSettings, loadPersistedSettings } from '../platform/settingsStorage';

const views: readonly PrayerCalendarView[] = ['daily', 'weekly', 'monthly', 'yearly'];
const prayerIds = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

type CalendarCopy = Readonly<{
  title: string;
  setLocation: string;
  calendarView: string;
  previousPeriod: string;
  current: string;
  nextPeriod: string;
  date: string;
  agenda: string;
  fullTimetable: string;
  calendar: string;
  note: string;
  views: Readonly<Record<PrayerCalendarView, string>>;
  prayers: Readonly<Record<(typeof prayerIds)[number], string>>;
}>;

const copy: Readonly<Record<Locale, CalendarCopy>> = {
  en: {
    title: 'Prayer Calendar',
    setLocation: 'Set a location to calculate prayer times',
    calendarView: 'Calendar view',
    previousPeriod: 'Previous period',
    current: 'Current',
    nextPeriod: 'Next period',
    date: 'Date',
    agenda: 'Prayer-time agenda',
    fullTimetable: 'Full timetable',
    calendar: 'calendar',
    note: 'Hijri dates use Umm al-Qura with your configured Hijri correction. Prayer times use the same location, calculation method, madhhab/Asr convention and adjustments as SalahOS.',
    views: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
    prayers: {
      fajr: 'Fajr',
      sunrise: 'Sunrise',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: "Isha'",
    },
  },
  ar: {
    title: 'تقويم الصلاة',
    setLocation: 'اضبط الموقع لحساب مواقيت الصلاة',
    calendarView: 'عرض التقويم',
    previousPeriod: 'الفترة السابقة',
    current: 'الحالي',
    nextPeriod: 'الفترة التالية',
    date: 'التاريخ',
    agenda: 'جدول مواقيت الصلاة',
    fullTimetable: 'الجدول الكامل',
    calendar: 'التقويم',
    note: 'تستخدم التواريخ الهجرية تقويم أم القرى مع التصحيح الهجري الذي اخترته. وتستخدم مواقيت الصلاة الموقع وطريقة الحساب ومذهب العصر والتعديلات نفسها في SalahOS.',
    views: { daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', yearly: 'سنوي' },
    prayers: {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    },
  },
  tr: {
    title: 'Namaz Takvimi',
    setLocation: 'Namaz vakitlerini hesaplamak için bir konum ayarlayın',
    calendarView: 'Takvim görünümü',
    previousPeriod: 'Önceki dönem',
    current: 'Güncel',
    nextPeriod: 'Sonraki dönem',
    date: 'Tarih',
    agenda: 'Namaz vakti gündemi',
    fullTimetable: 'Tam vakit çizelgesi',
    calendar: 'takvim',
    note: 'Hicrî tarihler, ayarladığınız Hicrî düzeltmeyle Ümmü’l-Kurâ takvimini kullanır. Namaz vakitleri SalahOS ile aynı konum, hesaplama yöntemi, mezhep/ikindi tercihi ve düzeltmeleri kullanır.',
    views: { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' },
    prayers: {
      fajr: 'Sabah',
      sunrise: 'Güneş',
      dhuhr: 'Öğle',
      asr: 'İkindi',
      maghrib: 'Akşam',
      isha: 'Yatsı',
    },
  },
  id: {
    title: 'Kalender Salat',
    setLocation: 'Atur lokasi untuk menghitung waktu salat',
    calendarView: 'Tampilan kalender',
    previousPeriod: 'Periode sebelumnya',
    current: 'Saat ini',
    nextPeriod: 'Periode berikutnya',
    date: 'Tanggal',
    agenda: 'Agenda waktu salat',
    fullTimetable: 'Jadwal lengkap',
    calendar: 'kalender',
    note: 'Tanggal Hijriah menggunakan Umm al-Qura dengan koreksi Hijriah yang Anda atur. Waktu salat memakai lokasi, metode perhitungan, mazhab/konvensi Asar, dan penyesuaian yang sama dengan SalahOS.',
    views: { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' },
    prayers: {
      fajr: 'Subuh',
      sunrise: 'Terbit',
      dhuhr: 'Zuhur',
      asr: 'Asar',
      maghrib: 'Magrib',
      isha: 'Isya',
    },
  },
};

function loadSettings() {
  try {
    return loadPersistedSettings(getApplicationStorage());
  } catch {
    return defaultPersistedSettings;
  }
}

function todayCivil() {
  const now = new Date();
  return utcCivilDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function calendarDateLabel(date: Date, locale: Locale, view: PrayerCalendarView): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: view === 'daily' ? 'long' : 'short',
  }).format(date);
}

export function PrayerCalendarScreen() {
  const config = useMemo(loadSettings, []);
  const [view, setView] = useState<PrayerCalendarView>('monthly');
  const [anchor, setAnchor] = useState(todayCivil);
  const locale = config.locale;
  const labels = copy[locale];

  const move = (delta: number) => {
    setAnchor((date) => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      if (view === 'yearly') return utcCivilDate(year + delta, month + 1, 1);
      if (view === 'monthly') return utcCivilDate(year, month + 1 + delta, 1);
      return new Date(date.getTime() + delta * (view === 'weekly' ? 7 : 1) * 86_400_000);
    });
  };

  const dates = useMemo(
    () => (view === 'yearly' ? [] : civilDatesForView(anchor, view)),
    [anchor, view],
  );
  const rows = useMemo(
    () => dates.map((date) => buildPrayerCalendarDay(date, config)),
    [dates, config],
  );
  const title =
    view === 'yearly'
      ? String(anchor.getUTCFullYear())
      : view === 'monthly'
        ? new Intl.DateTimeFormat(localeTag(locale), {
            timeZone: 'UTC',
            month: 'long',
            year: 'numeric',
          }).format(anchor)
        : new Intl.DateTimeFormat(localeTag(locale), {
            timeZone: 'UTC',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(anchor);

  return (
    <main className="prayer-calendar" data-calendar-view={view}>
      <header className="prayer-calendar__header">
        <p>{labels.title}</p>
        <h1>{title}</h1>
        <span>{config.location?.timeZone ?? labels.setLocation}</span>
      </header>

      <div className="prayer-calendar__views" role="tablist" aria-label={labels.calendarView}>
        {views.map((calendarView) => (
          <button
            type="button"
            key={calendarView}
            role="tab"
            aria-selected={view === calendarView}
            onClick={() => {
              setView(calendarView);
            }}
          >
            {labels.views[calendarView]}
          </button>
        ))}
      </div>

      <div className="prayer-calendar__pager">
        <button
          type="button"
          onClick={() => {
            move(-1);
          }}
          aria-label={labels.previousPeriod}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => {
            setAnchor(todayCivil());
          }}
        >
          {labels.current}
        </button>
        <button
          type="button"
          onClick={() => {
            move(1);
          }}
          aria-label={labels.nextPeriod}
        >
          ›
        </button>
      </div>

      {view === 'yearly' ? (
        <YearView
          year={anchor.getUTCFullYear()}
          correction={config.hijriCorrectionDays}
          locale={locale}
          labels={labels}
          onMonth={(month) => {
            setAnchor(utcCivilDate(anchor.getUTCFullYear(), month, 1));
            setView('monthly');
          }}
        />
      ) : (
        <>
          <section
            className="prayer-calendar__agenda"
            aria-label={labels.agenda}
            data-calendar-agenda
          >
            {rows.map((row, index) => {
              const date = dates[index];
              if (date === undefined) return null;
              return (
                <article
                  className="prayer-calendar__day-card"
                  data-calendar-day-card
                  key={date.toISOString()}
                >
                  <header>
                    <strong>{calendarDateLabel(date, locale, view)}</strong>
                    <small>
                      {row?.hijri.label ??
                        hijriCalendarLabel(date, config.hijriCorrectionDays).label}
                    </small>
                  </header>
                  <dl>
                    {prayerIds.map((name) => {
                      const prayer = row?.prayers.find((item) => item.name === name);
                      return (
                        <div key={name}>
                          <dt>{labels.prayers[name]}</dt>
                          <dd>
                            {prayer?.localMinutes == null
                              ? '—'
                              : formatLocalTime(prayer.localMinutes, locale, config.timeFormat)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              );
            })}
          </section>

          <section className="prayer-calendar__desktop-timetable" data-calendar-desktop-timetable>
            <PrayerTimetable
              rows={rows}
              dates={dates}
              view={view}
              labels={labels}
              locale={locale}
              config={config}
            />
          </section>

          <details className="prayer-calendar__mobile-timetable" data-calendar-full-timetable>
            <summary>{labels.fullTimetable}</summary>
            <PrayerTimetable
              rows={rows}
              dates={dates}
              view={view}
              labels={labels}
              locale={locale}
              config={config}
            />
          </details>
        </>
      )}

      <p className="prayer-calendar__note">{labels.note}</p>
    </main>
  );
}

function PrayerTimetable({
  rows,
  dates,
  view,
  labels,
  locale,
  config,
}: Readonly<{
  rows: readonly ReturnType<typeof buildPrayerCalendarDay>[];
  dates: readonly Date[];
  view: PrayerCalendarView;
  labels: CalendarCopy;
  locale: Locale;
  config: ReturnType<typeof loadSettings>;
}>) {
  return (
    <div className="prayer-calendar__table-wrap">
      <table>
        <thead>
          <tr>
            <th>{labels.date}</th>
            {prayerIds.map((name) => (
              <th key={name}>{labels.prayers[name]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const date = dates[index];
            if (date === undefined) return null;
            return (
              <tr key={date.toISOString()}>
                <th>
                  <strong>{calendarDateLabel(date, locale, view)}</strong>
                  <small>
                    {row?.hijri.label ?? hijriCalendarLabel(date, config.hijriCorrectionDays).label}
                  </small>
                </th>
                {prayerIds.map((name) => {
                  const prayer = row?.prayers.find((item) => item.name === name);
                  return (
                    <td key={name}>
                      {prayer?.localMinutes == null
                        ? '—'
                        : formatLocalTime(prayer.localMinutes, locale, config.timeFormat)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YearView({
  year,
  correction,
  locale,
  labels,
  onMonth,
}: Readonly<{
  year: number;
  correction: number;
  locale: Locale;
  labels: CalendarCopy;
  onMonth: (month: number) => void;
}>) {
  return (
    <section className="prayer-calendar__year" aria-label={`${String(year)} ${labels.calendar}`}>
      {Array.from({ length: 12 }, (_, index) => {
        const date = utcCivilDate(year, index + 1, 1);
        const start = hijriCalendarLabel(date, correction);
        const end = hijriCalendarLabel(utcCivilDate(year, index + 2, 0), correction);
        const monthShort = new Intl.DateTimeFormat(localeTag(locale), {
          timeZone: 'UTC',
          month: 'short',
        }).format(date);
        const monthLong = new Intl.DateTimeFormat(localeTag(locale), {
          timeZone: 'UTC',
          month: 'long',
        }).format(date);
        return (
          <button
            type="button"
            key={index}
            onClick={() => {
              onMonth(index + 1);
            }}
          >
            <span>{index + 1}</span>
            <strong>
              {locale === 'ar' ? monthShort : monthShort.toLocaleUpperCase(localeTag(locale))}
            </strong>
            <small>{monthLong}</small>
            <em>
              {start.monthName}
              {start.year !== end.year || start.month !== end.month ? ` – ${end.monthName}` : ''}
            </em>
            <small>
              {start.year === end.year
                ? [String(start.year), 'AH'].join(' ')
                : [String(start.year), '–', String(end.year), 'AH'].join(' ')}
            </small>
          </button>
        );
      })}
    </section>
  );
}
