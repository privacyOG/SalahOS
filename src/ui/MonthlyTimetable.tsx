import type { MonthlyTimetable as MonthlyTimetableModel } from '../domain/monthlyTimetable';

import './monthly-timetable.css';

interface MonthlyTimetableProps {
  readonly timetable: MonthlyTimetableModel;
  readonly monthLabel: string;
}

export function MonthlyTimetable({ timetable, monthLabel }: MonthlyTimetableProps) {
  return (
    <main className="monthly-timetable">
      <header className="monthly-timetable__header">
        <div>
          <p className="monthly-timetable__eyebrow">Monthly timetable</p>
          <h1>{timetable.mosqueName}</h1>
          <p>{monthLabel}</p>
        </div>
        <div className="monthly-timetable__source" aria-label="Timetable source">
          <span>{timetable.sourceLabel}</span>
          <span>Revision {String(timetable.revision)}</span>
        </div>
      </header>

      <div className="monthly-timetable__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Hijri</th>
              <th scope="col">Fajr</th>
              <th scope="col">Dhuhr</th>
              <th scope="col">Asr</th>
              <th scope="col">Maghrib</th>
              <th scope="col">Isha</th>
              <th scope="col">Jumu’ah</th>
            </tr>
          </thead>
          <tbody>
            {timetable.days.map((day) => (
              <tr key={day.date}>
                <th scope="row">{day.date}</th>
                <td>{day.hijriLabel ?? '—'}</td>
                <PrayerTimes iqamah={day.prayers.fajr.iqamah} start={day.prayers.fajr.start} />
                <PrayerTimes iqamah={day.prayers.dhuhr.iqamah} start={day.prayers.dhuhr.start} />
                <PrayerTimes iqamah={day.prayers.asr.iqamah} start={day.prayers.asr.start} />
                <PrayerTimes
                  iqamah={day.prayers.maghrib.iqamah}
                  start={day.prayers.maghrib.start}
                />
                <PrayerTimes iqamah={day.prayers.isha.iqamah} start={day.prayers.isha.start} />
                <td>
                  {day.jumuah.length === 0
                    ? '—'
                    : day.jumuah.map((session) => (
                        <span className="monthly-timetable__jumuah" key={session.label}>
                          {session.label} {session.start}
                        </span>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function PrayerTimes({
  start,
  iqamah,
}: {
  readonly start: string;
  readonly iqamah: string | null;
}) {
  return (
    <td>
      <strong>{start}</strong>
      <span>{iqamah === null ? '—' : `Iqamah ${iqamah}`}</span>
    </td>
  );
}
