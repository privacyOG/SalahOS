import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todayScreen = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const todayCss = readFileSync(new URL('../today-screen.css', import.meta.url), 'utf8');

describe('v1.5.3 selected mosque location state', () => {
  it('keeps the existing four state model and reuses the shared mosque icon', () => {
    expect(todayScreen).toContain("? 'mosque'");
    expect(todayScreen).toContain("? 'approximate'");
    expect(todayScreen).toContain("? 'saved'");
    expect(todayScreen).toContain(": 'precise'");
    expect(todayScreen).toContain('<SalahIcon name="mosques"');
    expect(todayScreen).toContain('{directoryMosqueActive && (');
  });

  it('styles only mosque and approximate states beyond the neutral base card', () => {
    expect(todayCss).toContain("[data-location-confidence='mosque']");
    expect(todayCss).toContain("[data-location-confidence='approximate']");
    expect(todayCss).not.toContain("[data-location-confidence='saved']");
    expect(todayCss).not.toContain("[data-location-confidence='precise']");

    const start = todayCss.indexOf('.today-location-confidence__mosque-icon');
    const end = todayCss.indexOf('.today-location-confidence__meta {', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const stateCss = todayCss.slice(start, end);
    expect(stateCss).toContain('var(--salah-fg-accent)');
    expect(stateCss).toContain('var(--salah-border-subtle)');
    expect(stateCss).toContain('var(--salah-bg-surface)');
    expect(stateCss).not.toMatch(/#[0-9a-f]{3,8}/iu);
  });
});
