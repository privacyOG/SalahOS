import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { HeritageClassicPrayerBoard } from './HeritageClassicPrayerBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Central Mosque with a deliberately long community name',
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

describe('HeritageClassicPrayerBoard', () => {
  it('renders the shared prayer-board contract as a structured Athan and Iqamah board', () => {
    const html = renderToStaticMarkup(
      <HeritageClassicPrayerBoard
        data={boardData()}
        locale="en"
        timeFormat="h12"
        displayTheme="classic"
      />,
    );

    expect(html).toContain('data-prayer-board-template="heritage-classic"');
    expect(html).toContain('data-heritage-variant="classic"');
    expect(html.match(/heritage-classic-prayer-row/g)).toHaveLength(10);
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('Central Mosque with a deliberately long community name');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Second Jumuah');
    expect(html).toContain('data-solar-event="sunset"');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
  });

  it('supports Arabic RTL-adjacent content and jewel-compatible legacy variants', () => {
    const html = renderToStaticMarkup(
      <HeritageClassicPrayerBoard
        data={boardData()}
        locale="ar"
        timeFormat="h23"
        displayTheme="emerald"
      />,
    );

    expect(html).toContain('data-heritage-variant="emerald"');
    expect(html).toContain('الفجر');
    expect(html).toContain('الإقامة');
    expect(html).toContain('الشروق');
  });
});
