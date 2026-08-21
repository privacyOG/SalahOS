import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import {
  SmartDisplay,
  smartDisplayModeRequested,
  smartDisplayScenicArtworkRequested,
  smartDisplayTemplateRequested,
} from './SmartDisplay';

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

  it('resolves only implemented smart-display templates from the route', () => {
    expect(smartDisplayTemplateRequested('')).toBe('heritage-classic');
    expect(smartDisplayTemplateRequested('?mode=smart-display')).toBe('heritage-classic');
    expect(smartDisplayTemplateRequested('?mode=smart-display&template=minimal-modern')).toBe(
      'minimal-modern',
    );
    expect(smartDisplayTemplateRequested('?mode=smart-display&template=bold-countdown-focus')).toBe(
      'bold-countdown-focus',
    );
    expect(
      smartDisplayTemplateRequested('?mode=smart-display&template=structured-split-board'),
    ).toBe('structured-split-board');
    expect(smartDisplayTemplateRequested('?mode=smart-display&template=scenic-spiritual')).toBe(
      'scenic-spiritual',
    );
    expect(smartDisplayTemplateRequested('?template=family-classroom')).toBe('heritage-classic');
  });

  it('treats Scenic Spiritual artwork as enabled unless explicitly disabled', () => {
    expect(smartDisplayScenicArtworkRequested('')).toBe(true);
    expect(smartDisplayScenicArtworkRequested('?artwork=on')).toBe(true);
    expect(smartDisplayScenicArtworkRequested('?artwork=off')).toBe(false);
    expect(smartDisplayScenicArtworkRequested('?mode=smart-display&artwork=off')).toBe(false);
  });

  it('renders Heritage Classic from the shared prayer-board contract with Iqamah and state', () => {
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
    expect(html).toContain('data-display-template="heritage-classic"');
    expect(html).toContain('data-prayer-board-template="heritage-classic"');
    expect(html.match(/<div class="heritage-classic-prayer-row(?: |")/g)).toHaveLength(5);
    expect(html).toContain('Fajr');
    expect(html).toContain('Dhuhr');
    expect(html).toContain('Asr');
    expect(html).toContain('Maghrib');
    expect(html).toContain('Isha');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).toContain('Central Mosque');
  });

  it('renders Minimal Modern from the same prayer-board contract without changing prayer data', () => {
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
        templateId="minimal-modern"
      />,
    );

    expect(html).toContain('data-display-template="minimal-modern"');
    expect(html).toContain('data-prayer-board-template="minimal-modern"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Central Mosque');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).not.toContain('data-prayer-board-template="heritage-classic"');
  });

  it('renders Bold Countdown Focus from the same prayer-board contract', () => {
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
        templateId="bold-countdown-focus"
      />,
    );

    expect(html).toContain('data-display-template="bold-countdown-focus"');
    expect(html).toContain('data-prayer-board-template="bold-countdown-focus"');
    expect(html).toContain('data-focus-state="next-prayer"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Central Mosque');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).not.toContain('data-prayer-board-template="heritage-classic"');
    expect(html).not.toContain('data-prayer-board-template="minimal-modern"');
  });

  it('renders Structured Split Board from the same prayer-board contract', () => {
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
        templateId="structured-split-board"
      />,
    );

    expect(html).toContain('data-display-template="structured-split-board"');
    expect(html).toContain('data-prayer-board-template="structured-split-board"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('structured-prayer-row__start');
    expect(html).toContain('structured-prayer-row__iqamah');
    expect(html).toContain('Central Mosque');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).not.toContain('data-prayer-board-template="heritage-classic"');
    expect(html).not.toContain('data-prayer-board-template="minimal-modern"');
    expect(html).not.toContain('data-prayer-board-template="bold-countdown-focus"');
  });

  it('renders Scenic Spiritual with a usable artwork-disabled mode from the same contract', () => {
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
        templateId="scenic-spiritual"
        scenicArtworkEnabled={false}
      />,
    );

    expect(html).toContain('data-display-template="scenic-spiritual"');
    expect(html).toContain('data-prayer-board-template="scenic-spiritual"');
    expect(html).toContain('data-artwork-mode="plain"');
    expect(html.match(/data-prayer="(?:fajr|dhuhr|asr|maghrib|isha)"/g)).toHaveLength(5);
    expect(html).toContain('Central Mosque');
    expect(html).toContain('First Jumuah');
    expect(html).toContain('Iqamah');
    expect(html).toContain('is-current');
    expect(html).toContain('is-next');
    expect(html).not.toContain('data-prayer-board-template="heritage-classic"');
    expect(html).not.toContain('data-prayer-board-template="minimal-modern"');
    expect(html).not.toContain('data-prayer-board-template="bold-countdown-focus"');
    expect(html).not.toContain('data-prayer-board-template="structured-split-board"');
  });

  it('renders configured Friday Jumuah sessions from the shared prayer-board contract', () => {
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
    expect(html).toContain('data-solar-event="sunset"');
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
    expect(html).not.toContain('data-prayer-board-template="heritage-classic"');
    expect(html).not.toContain('data-prayer-board-template="minimal-modern"');
    expect(html).not.toContain('data-prayer-board-template="bold-countdown-focus"');
    expect(html).not.toContain('data-prayer-board-template="structured-split-board"');
    expect(html).not.toContain('data-prayer-board-template="scenic-spiritual"');
  });

  it('preserves Arabic presentation and offline status', () => {
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
