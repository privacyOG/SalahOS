import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { StructuredSplitBoard } from './StructuredSplitBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Structured Community Mosque and Education Centre',
  days: [
    {
      date: '2026-08-14',
      prayers: {
        fajr: { startLocalMinutes: 330, iqamah: { kind: 'offset', offsetMinutes: 20 } },
        dhuhr: { startLocalMinutes: 750, iqamah: { kind: 'fixed', localMinutes: 780 } },
        asr: { startLocalMinutes: 930, iqamah: { kind: 'offset', offsetMinutes: 15 } },
        maghrib: { startLocalMinutes: 1_050, iqamah: { kind: 'offset', offsetMinutes: 10 } },
        isha: { startLocalMinutes: 1_140, iqamah: { kind: 'fixed', localMinutes: 1_170 } },
      },
      jumuahSessions: [
        { label: 'First Jumuah', khutbahLocalMinutes: 750, salahLocalMinutes: 765 },
        { label: 'Second Jumuah', khutbahLocalMinutes: 810, salahLocalMinutes: 825 },
      ],
    },
  ],
};

function boardData() {
  const base = buildPrayerDashboard({
    instant: new Date('2026-08-14T06:00:00.000Z'),
    coordinates: sydney,
  });
  const dashboard = applyPrayerSourceToDashboard({
    dashboard: base,
    sourceMode: 'local-mosque',
    mosqueTimetable: fridayTimetable,
  });
  return buildPrayerBoardData({ dashboard });
}

describe('StructuredSplitBoard', () => {
  it('renders a precise Start/Iqamah timetable beside the clock and next-prayer rail', () => {
    const html = renderToStaticMarkup(
      <StructuredSplitBoard
        data={boardData()}
        locale="en"
        timeFormat="h12"
        displayTheme="midnight"
      />,
    );

    expect(html).toContain('data-prayer-board-template="structured-split-board"');
    expect(html).toContain('data-structured-variant="midnight"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('structured-prayer-table__head');
    expect(html).toContain('structured-prayer-row__start');
    expect(html).toContain('structured-prayer-row__iqamah');
    expect(html).toContain('structured-split-board__clock');
    expect(html).toContain('structured-split-board__next');
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Second Jumuah');
    expect(html).toContain('data-solar-event="sunset"');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
  });

  it('preserves the split information hierarchy in Arabic RTL presentation', () => {
    const html = renderToStaticMarkup(
      <StructuredSplitBoard
        data={boardData()}
        locale="ar"
        timeFormat="h23"
        displayTheme="emerald"
      />,
    );

    expect(html).toContain('data-prayer-board-template="structured-split-board"');
    expect(html).toContain('الفجر');
    expect(html).toContain('الظهر');
    expect(html).toContain('العصر');
    expect(html).toContain('المغرب');
    expect(html).toContain('العشاء');
    expect(html).toContain('الإقامة');
    expect(html).toContain('Structured Community Mosque and Education Centre');
  });
});
