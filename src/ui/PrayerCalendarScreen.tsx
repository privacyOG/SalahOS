import { useMemo, useState } from 'react';
import {
  buildPrayerCalendarDay,
  civilDatesForView,
  hijriCalendarLabel,
  type PrayerCalendarView,
  utcCivilDate,
} from '../domain/prayerCalendar';
import { formatLocalTime, localeTag } from '../i18n/i18n';
import { getApplicationStorage } from '../platform/applicationStorage';
import { defaultPersistedSettings, loadPersistedSettings } from '../platform/settingsStorage';

const views: readonly PrayerCalendarView[] = ['daily', 'weekly', 'monthly', 'yearly'];
const prayerNames = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: "Isha'",
} as const;

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

function viewLabel(view: PrayerCalendarView) {
  return view.charAt(0).toUpperCase() + view.slice(1);
}

export function PrayerCalendarScreen() {
  const config = useMemo(loadSettings, []);
  const [view, setView] = useState<PrayerCalendarView>('monthly');
  const [anchor, setAnchor] = useState(todayCivil);
  const locale = config.locale;

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
        <p>Prayer Calendar</p>
        <h1>{title}</h1>
        <span>{config.location?.timeZone ?? 'Set a location to calculate prayer times'}</span>
      </header>

      <div className="prayer-calendar__views" role="tablist" aria-label="Calendar view">
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
            {viewLabel(calendarView)}
          </button>
        ))}
      </div>

      <div className="prayer-calendar__pager">
        <button
          type="button"
          onClick={() => {
            move(-1);
          }}
          aria-label="Previous period"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => {
            setAnchor(todayCivil());
          }}
        >
          Current
        </button>
        <button
          type="button"
          onClick={() => {
            move(1);
          }}
          aria-label="Next period"
        >
          ›
        </button>
      </div>

      {view === 'yearly' ? (
        <YearView
          year={anchor.getUTCFullYear()}
          correction={config.hijriCorrectionDays}
          onMonth={(month) => {
            setAnchor(utcCivilDate(anchor.getUTCFullYear(), month, 1));
            setView('monthly');
          }}
        />
      ) : (
        <section className="prayer-calendar__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {Object.values(prayerNames).map((name) => (
                  <th key={name}>{name}</th>
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
                      <strong>
                        {new Intl.DateTimeFormat(localeTag(locale), {
                          timeZone: 'UTC',
                          weekday: 'short',
                          day: 'numeric',
                          month: view === 'monthly' ? 'short' : undefined,
                        }).format(date)}
                      </strong>
                      <small>
                        {row?.hijri.label ??
                          hijriCalendarLabel(date, config.hijriCorrectionDays).label}
                      </small>
                    </th>
                    {Object.keys(prayerNames).map((name) => {
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
        </section>
      )}

      <p className="prayer-calendar__note">
        Hijri dates use Umm al-Qura with your configured Hijri correction. Prayer times use the same
        location, calculation method, madhhab/Asr convention and adjustments as SalahOS.
      </p>
    </main>
  );
}

function YearView({
  year,
  correction,
  onMonth,
}: {
  year: number;
  correction: number;
  onMonth: (month: number) => void;
}) {
  return (
    <section className="prayer-calendar__year" aria-label={[String(year), 'calendar'].join(' ')}>
      {Array.from({ length: 12 }, (_, index) => {
        const date = utcCivilDate(year, index + 1, 1);
        const start = hijriCalendarLabel(date, correction);
        const end = hijriCalendarLabel(utcCivilDate(year, index + 2, 0), correction);
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
              {new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'short' })
                .format(date)
                .toUpperCase()}
            </strong>
            <small>
              {new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', month: 'long' }).format(date)}
            </small>
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
