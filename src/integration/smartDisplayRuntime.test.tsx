import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoordinates } from '../domain/coordinates';
import { buildPrayerDashboard } from '../domain/dashboard';
import { applyPrayerSourceToDashboard } from '../domain/sourcedDashboard';
import { formatZonedInstantTime } from '../i18n/i18n';
import { createSystemSleepWakeDetector } from '../platform/systemSleepWake';
import { SmartDisplay } from '../ui/SmartDisplay';

const sydney = createCoordinates(-33.8688, 151.2093);
const timeZone = 'Australia/Sydney';

function sourcedAt(instant: Date) {
  const dashboard = buildPrayerDashboard({ instant, coordinates: sydney, timeZone });
  return applyPrayerSourceToDashboard({
    dashboard,
    sourceMode: 'calculated',
    mosqueTimetable: null,
  });
}

function renderAt(instant: Date): string {
  const dashboard = sourcedAt(instant);
  return renderToStaticMarkup(
    <SmartDisplay
      locale="en"
      currentClock={formatZonedInstantTime(instant, timeZone, 'en', 'h23')}
      dashboard={dashboard}
      timeFormat="h23"
      hijriCorrectionDays={0}
      offline={false}
      systemTimeUnavailable={false}
      calculationUnavailable={false}
    />,
  );
}

describe('smart display runtime continuity', () => {
  it('rolls the displayed prayer schedule to the next local civil day', () => {
    const before = new Date('2026-08-16T13:59:30.000Z');
    const after = new Date('2026-08-16T14:00:30.000Z');
    const beforeDashboard = sourcedAt(before);
    const afterDashboard = sourcedAt(after);

    expect(beforeDashboard.base.civilDate.toISOString().slice(0, 10)).toBe('2026-08-16');
    expect(afterDashboard.base.civilDate.toISOString().slice(0, 10)).toBe('2026-08-17');

    const beforeHtml = renderAt(before);
    const afterHtml = renderAt(after);
    expect(beforeHtml).not.toBe(afterHtml);
    expect(afterHtml).toContain('17 August 2026');
  });

  it('updates the smart-display clock and schedule context across the Sydney DST jump', () => {
    const before = new Date('2026-10-03T15:59:30.000Z');
    const after = new Date('2026-10-03T16:00:30.000Z');
    const beforeDashboard = sourcedAt(before);
    const afterDashboard = sourcedAt(after);

    expect(beforeDashboard.base.utcOffsetMinutes).toBe(600);
    expect(afterDashboard.base.utcOffsetMinutes).toBe(660);
    expect(beforeDashboard.base.clock.hour).toBe(1);
    expect(afterDashboard.base.clock.hour).toBe(3);
    expect(beforeDashboard.base.timeZone).toBe(timeZone);
    expect(afterDashboard.base.timeZone).toBe(timeZone);

    const beforeHtml = renderAt(before);
    const afterHtml = renderAt(after);
    expect(beforeHtml).toContain('01:59:30');
    expect(afterHtml).toContain('03:00:30');
    expect(afterHtml).toContain('Australia/Sydney');
  });

  it('re-renders from fresh wall time after a detected sleep/wake gap', () => {
    const before = new Date('2026-08-16T02:00:00.000Z');
    const resumed = new Date('2026-08-16T04:30:00.000Z');
    const detector = createSystemSleepWakeDetector({ wallTimeMs: before.getTime() });

    expect(detector.sample({ wallTimeMs: before.getTime() + 1_000 })).toBe(false);
    expect(detector.sample({ wallTimeMs: resumed.getTime() })).toBe(true);

    const beforeDashboard = sourcedAt(before);
    const resumedDashboard = sourcedAt(resumed);
    expect(resumedDashboard.base.generatedAt.getTime()).toBe(resumed.getTime());
    expect(resumedDashboard.secondsUntilNextPrayer).not.toBe(
      beforeDashboard.secondsUntilNextPrayer,
    );

    const beforeHtml = renderAt(before);
    const resumedHtml = renderAt(resumed);
    expect(beforeHtml).not.toBe(resumedHtml);
    expect(resumedHtml).toContain('14:30:00');
  });
});
