import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { MinimalModernPrayerBoard } from './MinimalModernPrayerBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Minimal Modern Community Mosque and Education Centre',
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

describe('MinimalModernPrayerBoard', () => {
  it('renders five restrained prayer columns with explicit Athan/start and Iqamah values', () => {
    const html = renderToStaticMarkup(
      <MinimalModernPrayerBoard
        data={boardData()}
        locale="en"
        timeFormat="h12"
        variant="light"
      />,
    );

    expect(html).toContain('data-prayer-board-template="minimal-modern"');
    expect(html).toContain('data-minimal-variant="light"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('Minimal Modern Community Mosque and Education Centre');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Second Jumuah');
    expect(html).toContain('data-solar-event="sunset"');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).not.toContain('heritage-classic-board__pattern');
  });

  it('supports the dark variant with Arabic presentation', () => {
    const html = renderToStaticMarkup(
      <MinimalModernPrayerBoard
        data={boardData()}
        locale="ar"
        timeFormat="h23"
        variant="dark"
      />,
    );

    expect(html).toContain('data-minimal-variant="dark"');
    expect(html).toContain('الفجر');
    expect(html).toContain('الإقامة');
    expect(html).toContain('الشروق');
  });
});
