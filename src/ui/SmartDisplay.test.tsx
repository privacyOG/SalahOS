import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { SmartDisplay, smartDisplayModeRequested } from './SmartDisplay';

const sydney = createCoordinates(-33.8688, 151.2093);

const fridayTimetable: MosqueTimetable = {
  mosqueName: 'Central Mosque',
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
    {
      date: '2026-08-15',
      prayers: {
        fajr: { startLocalMinutes: 329, iqamah: { kind: 'offset', offsetMinutes: 20 } },
      },
    },
  ],
};

function fridayDashboard() {
  const base = buildPrayerDashboard({
    instant: new Date('2026-08-14T06:00:00.000Z'),
    coordinates: sydney,
  });
  return applyPrayerSourceToDashboard({
    dashboard: base,
    sourceMode: 'local-mosque',
    mosqueTimetable: fridayTimetable,
  });
}

describe('SmartDisplay', () => {
  it('activates only for the explicit smart-display mode query', () => {
    expect(smartDisplayModeRequested('')).toBe(false);
    expect(smartDisplayModeRequested('?mode=standard')).toBe(false);
    expect(smartDisplayModeRequested('?mode=smart-display')).toBe(true);
    expect(smartDisplayModeRequested('?foo=1&mode=smart-display')).toBe(true);
  });

  it('renders five obligatory prayers at a glance with Iqamah and current/next state', () => {
    const html = renderToStaticMarkup(
      <SmartDisplay
        locale="en"
        currentClock="4:00:00 pm"
        dashboard={fridayDashboard()}
        timeFormat="h12"
        hijriCorrectionDays={0}
        offline={false}
        systemTimeUnavailable={false}
        calculationUnavailable={false}
      />,
    );

    expect(html).toContain('data-mode="smart-display"');
    expect(html.match(/<article class="prayer-card/g)).toHaveLength(5);
    expect(html).toContain('Fajr');
    expect(html).toContain('Dhuhr');
    expect(html).toContain('Asr');
    expect(html).toContain('Maghrib');
    expect(html).toContain('Isha');
    expect(html).not.toContain('Sunrise');
    expect(html).toContain('Iqamah');
    expect(html).toContain('prayer-card-current');
    expect(html).toContain('prayer-card-next');
    expect(html).toContain('Central Mosque');
  });

  it('renders configured Friday Jumuah sessions from the shared sourced dashboard', () => {
    const html = renderToStaticMarkup(
      <SmartDisplay
        locale="en"
        currentClock="4:00:00 pm"
        dashboard={fridayDashboard()}
        timeFormat="h12"
        hijriCorrectionDays={0}
        offline={false}
        systemTimeUnavailable={false}
        calculationUnavailable={false}
      />,
    );

    expect(html).toContain('First Jumuah');
    expect(html).toContain('Second Jumuah');
    expect(html).toContain('Khutbah');
    expect(html).toContain('Salah');
  });

  it('renders a location-not-configured state without fabricating prayer times', () => {
    const html = renderToStaticMarkup(
      <SmartDisplay
        locale="en"
        currentClock="10:00:00 am"
        dashboard={null}
        timeFormat="h23"
        hijriCorrectionDays={0}
        offline={false}
        systemTimeUnavailable={false}
        calculationUnavailable={false}
      />,
    );

    expect(html).toContain('Not configured');
    expect(html).not.toContain('class="smart-display-prayers"');
  });

  it('preserves Arabic presentation and the offline status', () => {
    const html = renderToStaticMarkup(
      <SmartDisplay
        locale="ar"
        currentClock="٤:٠٠:٠٠ م"
        dashboard={fridayDashboard()}
        timeFormat="h12"
        hijriCorrectionDays={0}
        offline
        systemTimeUnavailable={false}
        calculationUnavailable={false}
      />,
    );

    expect(html).toContain('الفجر');
    expect(html).toContain('المغرب');
    expect(html).toContain('غير متصل');
  });
});
