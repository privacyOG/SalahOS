import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createMonthlyTimetable } from '../domain/monthlyTimetable';
import { MonthlyTimetable } from './MonthlyTimetable';

const timetable = createMonthlyTimetable({
  mosqueId: 'example-masjid',
  mosqueName: 'Example Masjid',
  month: '2026-08',
  sourceLabel: 'Mosque-published timetable',
  revision: 3,
  days: [
    {
      date: '2026-08-07',
      hijriLabel: '24 Safar 1448',
      prayers: {
        fajr: { start: '05:21', iqamah: '05:45' },
        dhuhr: { start: '12:04', iqamah: '12:30' },
        asr: { start: '15:11', iqamah: '15:30' },
        maghrib: { start: '17:42', iqamah: '17:47' },
        isha: { start: '19:03', iqamah: '19:20' },
      },
      jumuah: [{ label: 'First Jumuah', khutbah: '12:20', start: '12:30' }],
    },
  ],
});

describe('MonthlyTimetable', () => {
  it('renders month, provenance, Salah, Iqamah, Hijri and Jumuah data', () => {
    const html = renderToStaticMarkup(
      <MonthlyTimetable monthLabel="August 2026" timetable={timetable} />,
    );

    expect(html).toContain('Example Masjid');
    expect(html).toContain('August 2026');
    expect(html).toContain('Revision 3');
    expect(html).toContain('24 Safar 1448');
    expect(html).toContain('Iqamah 05:45');
    expect(html).toContain('First Jumuah 12:30');
  });
});
