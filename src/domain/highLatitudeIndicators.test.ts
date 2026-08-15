import { describe, expect, it } from 'vitest';
import { displayedHighLatitudeRuleApplied } from './highLatitudeIndicators';

describe('high-latitude display indicators', () => {
  it('shows the indicator when the displayed calculated prayer used a fallback', () => {
    expect(displayedHighLatitudeRuleApplied('fajr', true, 'calculated')).toBe(true);
    expect(displayedHighLatitudeRuleApplied('isha', true, 'calculated-adjustments')).toBe(true);
  });

  it('hides the indicator when no high-latitude fallback was applied', () => {
    expect(displayedHighLatitudeRuleApplied('fajr', false, 'calculated')).toBe(false);
  });

  it('suppresses the indicator when a mosque timetable replaces an obligatory prayer time', () => {
    expect(displayedHighLatitudeRuleApplied('fajr', true, 'local-mosque')).toBe(false);
    expect(displayedHighLatitudeRuleApplied('isha', true, 'local-mosque')).toBe(false);
  });

  it('keeps Sunrise eligible in local-mosque mode because Sunrise remains calculated', () => {
    expect(displayedHighLatitudeRuleApplied('sunrise', true, 'local-mosque')).toBe(true);
  });
});
