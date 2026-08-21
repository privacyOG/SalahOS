import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { FamilyClassroomPrayerBoard } from './FamilyClassroomPrayerBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'SalahOS Family Learning Centre',
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

describe('FamilyClassroomPrayerBoard', () => {
  it('renders five prayers with visually distinct Start and Iqamah learning columns', () => {
    const html = renderToStaticMarkup(
      <FamilyClassroomPrayerBoard
        data={boardData()}
        locale="en"
        timeFormat="h12"
        displayTheme="emerald"
      />,
    );

    expect(html).toContain('data-prayer-board-template="family-classroom"');
    expect(html).toContain('data-family-variant="emerald"');
    expect(html).toContain('data-educational-hints="off"');
    expect(html).toContain('data-daylight-cues="on"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html.match(/family-classroom-prayer-row__start/g)).toHaveLength(5);
    expect(html.match(/family-classroom-prayer-row__iqamah/g)).toHaveLength(5);
    expect(html).toContain('SalahOS Family Learning Centre');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).toContain('data-solar-event="sunset"');
    expect(html).not.toContain('Learn the prayer schedule');
  });

  it('shows optional educational hints only when explicitly enabled', () => {
    const html = renderToStaticMarkup(
      <FamilyClassroomPrayerBoard
        data={boardData()}
        locale="en"
        timeFormat="h23"
        displayTheme="classic"
        educationalHintsEnabled
      />,
    );

    expect(html).toContain('data-educational-hints="on"');
    expect(html).toContain('Learn the prayer schedule');
    expect(html).toContain('Athan / Start: the prayer time has begun.');
    expect(html).toContain('Iqamah: the congregation stands to begin the prayer.');
    expect(html).toContain('Sunrise begins the daylight period after Fajr.');
    expect(html).toContain('Sunset marks the beginning of Maghrib.');
  });

  it('supports Arabic/RTL-friendly content and an explicitly disabled daylight module', () => {
    const data = boardData();
    const html = renderToStaticMarkup(
      <FamilyClassroomPrayerBoard
        data={{ ...data, offline: true }}
        locale="ar"
        timeFormat="h23"
        displayTheme="sandstone"
        educationalHintsEnabled
        daylightCuesEnabled={false}
      />,
    );

    expect(html).toContain('data-daylight-cues="off"');
    expect(html).toContain('تعلّم جدول الصلاة');
    expect(html).toContain('دخل وقت الصلاة');
    expect(html).toContain('الفجر');
    expect(html).toContain('المغرب');
    expect(html).toContain('الإقامة');
    expect(html).toContain('غير متصل');
    expect(html).not.toContain('family-classroom-board__daylight');
  });
});
