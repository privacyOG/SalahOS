import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todaySource = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const congregationSource = readFileSync(
  new URL('../domain/australianMosquePrayerContext.ts', import.meta.url),
  'utf8',
);

describe('V1.6.0 Today Iqamah removal', () => {
  it('removes Iqamah labels, values, placeholders and empty columns from Today source', () => {
    expect(todaySource).not.toContain("translate(locale, 'iqamah')");
    expect(todaySource).not.toContain('nextPrayerIqamah');
    expect(todaySource).not.toContain('today-prayer-row__iqamah');
    expect(todaySource).not.toContain('data-directory-published-iqamah');
    expect(todaySource).not.toContain('data-mosque-iqamah-source="directory-published"');
    expect(todaySource).not.toContain('publishedAustralianMosqueCongregationMinutes');
  });

  it('preserves published congregation-time support outside the Today presentation', () => {
    expect(congregationSource).toContain('publishedAustralianMosqueCongregationMinutes');
    expect(congregationSource).toContain('applyAustralianMosqueCongregationTimes');
  });
});
