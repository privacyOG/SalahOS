import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todayScreen = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const todayCss = readFileSync(new URL('../today-screen.css', import.meta.url), 'utf8');

describe('v1.5.3 Sunrise row presentation', () => {
  it('never assigns current or next highlight state to Sunrise', () => {
    expect(todayScreen).toContain("!isSunrise && prayer.isCurrent ? ' is-current' : ''");
    expect(todayScreen).toContain("!isSunrise && prayer.isNext ? ' is-next' : ''");
  });

  it('uses token-only logical styling with reduced Sunrise hierarchy', () => {
    const start = todayCss.indexOf('.today-prayer-row--sunrise {');
    const end = todayCss.indexOf('.today-prayer-row.is-supplementary', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const sunriseCss = todayCss.slice(start, end);

    expect(sunriseCss).toContain('border-block-start-color: var(--salah-border-default)');
    expect(sunriseCss).toContain('color: var(--salah-fg-secondary)');
    expect(sunriseCss).toContain('color: var(--salah-fg-tertiary)');
    expect(sunriseCss).toContain('font-size: var(--salah-text-xs)');
    expect(sunriseCss).toContain('font-weight: 600');
    expect(sunriseCss).toContain('box-shadow: none');
    expect(sunriseCss).not.toMatch(/#[0-9a-f]{3,8}/iu);
    expect(sunriseCss).not.toMatch(/(?:margin|padding|border)-(?:left|right)\s*:/u);
  });
});
