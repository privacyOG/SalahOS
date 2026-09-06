import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsSource = readFileSync(new URL('./SettingsScreen.tsx', import.meta.url), 'utf8');
const todaySource = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');
const todayCss = readFileSync(new URL('../today-screen.css', import.meta.url), 'utf8');

describe('v1.5.3 Item 22 corrections', () => {
  it('exposes the full -3 through +3 Hijri correction range in Settings', () => {
    expect(settingsSource).toContain('[-3, -2, -1, 0, 1, 2, 3].map((day) => (');
    expect(settingsSource).toContain('day > 0 ? `+${number.format(day)}` : number.format(day)');
  });

  it('uses explicit current-prayer gap labels instead of the ambiguous between-times copy', () => {
    expect(todaySource).not.toContain('Between prayer times');
    expect(todaySource).toContain("beforeFirstPrayer: 'Before today’s first obligatory prayer'");
    expect(todaySource).toContain("noCurrentPrayer: 'No current obligatory prayer'");
    expect(todaySource).toContain(
      "sourcedDashboard?.currentPrayerState === 'before-first-obligatory-prayer'",
    );
  });

  it('refreshes the Today snapshot when settings or mosque-profile state changes', () => {
    expect(mainSource).toContain('function ReactiveTodayScreen()');
    expect(mainSource).toContain(
      'window.addEventListener(SETTINGS_CHANGE_EVENT, refreshSnapshot);',
    );
    expect(mainSource).toContain(
      'window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refreshSnapshot);',
    );
    expect(mainSource).toContain('<ReactiveTodayScreen />');
  });

  it('reserves uppercase tracking for hero prayer/countdown labels', () => {
    expect(todayCss).toContain('.today-next__identity p,\n.today-next__countdown span {');
    expect(todayCss).toContain('font-weight: 780;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;');
    expect(todayCss).toContain(
      '.today-section-heading p,\n.today-dates span,\n.today-next__times dt {',
    );
    expect(todayCss).toContain('font-weight: 600;\n  letter-spacing: 0;\n  text-transform: none;');
    expect(todayCss).toContain('.today-location-confidence > div:first-child span {');
  });
});
