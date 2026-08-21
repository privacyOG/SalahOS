import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { ScenicSpiritualPrayerBoard } from './ScenicSpiritualPrayerBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Scenic Community Mosque and Education Centre',
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

describe('ScenicSpiritualPrayerBoard', () => {
  it('renders the scenic artwork mode without changing prayer-board data semantics', () => {
    const html = renderToStaticMarkup(
      <ScenicSpiritualPrayerBoard
        data={boardData()}
        locale="en"
        timeFormat="h12"
        displayTheme="midnight"
      />,
    );

    expect(html).toContain('data-prayer-board-template="scenic-spiritual"');
    expect(html).toContain('data-artwork-mode="scenic"');
    expect(html).toContain('data-scenic-variant="midnight"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Scenic Community Mosque and Education Centre');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Second Jumuah');
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).toContain('data-solar-event="sunset"');
  });

  it('remains a complete Arabic prayer board when decorative artwork is disabled', () => {
    const data = boardData();
    const html = renderToStaticMarkup(
      <ScenicSpiritualPrayerBoard
        data={{ ...data, offline: true }}
        locale="ar"
        timeFormat="h23"
        displayTheme="sandstone"
        artworkEnabled={false}
      />,
    );

    expect(html).toContain('data-artwork-mode="plain"');
    expect(html).toContain('data-scenic-variant="sandstone"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('الفجر');
    expect(html).toContain('المغرب');
    expect(html).toContain('الإقامة');
    expect(html).toContain('غير متصل');
  });
});
