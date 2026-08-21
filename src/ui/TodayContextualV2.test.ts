import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todaySource = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const contextualSource = readFileSync(new URL('./TodayContextualSections.tsx', import.meta.url), 'utf8');

describe('Stage 22.3 Today contextual experience', () => {
  it('keeps the prayer-first Today screen authoritative and composes context beneath it', () => {
    expect(todaySource).toContain('buildPrayerDashboardResult');
    expect(todaySource).toContain('applyPrayerSourceToDashboard');
    expect(todaySource).toContain('<TodayContextualSections');
    expect(todaySource).toContain('dashboard={sourcedDashboard}');
    expect(todaySource).toContain('unavailablePrayers={unavailablePrayers}');
  });

  it('shows Ramadan fasting and Taraweeh context only through existing domain helpers', () => {
    expect(contextualSource).toContain('deriveRamadanMode');
    expect(contextualSource).toContain('buildRamadanFastTimes');
    expect(contextualSource).toContain('RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES');
    expect(contextualSource).toContain('taraweehSessionsForDate');
    expect(contextualSource).toContain('if (ramadan.active && ramadan.ramadanDay !== null)');
  });

  it('keeps Today community content compact, local and selected-mosque scoped', () => {
    expect(contextualSource).toContain('buildCommunityFeed');
    expect(contextualSource).toContain('mosqueId: input.mosqueLibrary.selectedProfileId');
    expect(contextualSource).toContain('const announcement = feed.announcements[0] ?? null');
    expect(contextualSource).toContain('const event = feed.events[0] ?? null');
    expect(contextualSource).not.toContain('fetch(');
    expect(contextualSource).not.toContain('navigator.geolocation');
  });

  it('distinguishes managed-data and astronomical-unavailable states explicitly', () => {
    for (const state of [
      'no-selected-mosque',
      'missing-timetable',
      'stale-timetable',
      'offline-managed',
      'astronomical-unavailable',
    ]) {
      expect(contextualSource).toContain(state);
    }
    expect(todaySource).toContain("translate(locale, 'configureLocation')");
  });
});
