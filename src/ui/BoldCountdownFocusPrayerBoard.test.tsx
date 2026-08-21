import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { buildPrayerBoardData } from '../domain/prayerBoardTemplate';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  BoldCountdownFocusPrayerBoard,
  deriveBoldCountdownFocus,
} from './BoldCountdownFocusPrayerBoard';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Bold Countdown Community Mosque and Education Centre',
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

function boardData(instant: string) {
  const base = buildPrayerDashboard({
    instant: new Date(instant),
    coordinates: sydney,
  });
  const dashboard = applyPrayerSourceToDashboard({
    dashboard: base,
    sourceMode: 'local-mosque',
    mosqueTimetable: fridayTimetable,
  });
  return buildPrayerBoardData({ dashboard });
}

describe('BoldCountdownFocusPrayerBoard', () => {
  it('renders a dominant next-prayer focus while keeping the five-prayer timetable visible', () => {
    const data = boardData('2026-08-14T06:00:00.000Z');
    const html = renderToStaticMarkup(
      <BoldCountdownFocusPrayerBoard
        data={data}
        locale="en"
        timeFormat="h12"
        displayTheme="midnight"
      />,
    );

    expect(deriveBoldCountdownFocus(data).state).toBe('next-prayer');
    expect(html).toContain('data-prayer-board-template="bold-countdown-focus"');
    expect(html).toContain('data-focus-state="next-prayer"');
    expect(html).toContain('data-bold-variant="midnight"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Start');
    expect(html).toContain('Iqamah');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('data-solar-event="sunset"');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
  });

  it('switches the dominant region to a pre-Iqamah countdown after prayer start', () => {
    const data = boardData('2026-08-14T02:45:00.000Z');
    const focus = deriveBoldCountdownFocus(data);
    const html = renderToStaticMarkup(
      <BoldCountdownFocusPrayerBoard
        data={data}
        locale="en"
        timeFormat="h23"
        displayTheme="emerald"
      />,
    );

    expect(focus.state).toBe('pre-iqamah');
    expect(focus.prayerName).toBe('dhuhr');
    expect(focus.secondsUntil).toBe(900);
    expect(html).toContain('data-focus-state="pre-iqamah"');
    expect(html).toContain('Dhuhr');
  });

  it('exposes an explicit Iqamah-now state for the configured Iqamah minute', () => {
    const data = boardData('2026-08-14T03:00:20.000Z');
    const focus = deriveBoldCountdownFocus(data);
    const html = renderToStaticMarkup(
      <BoldCountdownFocusPrayerBoard
        data={data}
        locale="ar"
        timeFormat="h23"
        displayTheme="sandstone"
      />,
    );

    expect(focus.state).toBe('iqamah-now');
    expect(focus.prayerName).toBe('dhuhr');
    expect(focus.secondsUntil).toBe(0);
    expect(html).toContain('data-focus-state="iqamah-now"');
    expect(html).toContain('الإقامة');
    expect(html).toContain('الظهر');
  });
});
