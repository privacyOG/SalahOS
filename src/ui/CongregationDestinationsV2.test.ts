import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');
const mosquesSource = readFileSync(new URL('./MosquesScreen.tsx', import.meta.url), 'utf8');
const communitySource = readFileSync(new URL('./CommunityScreen.tsx', import.meta.url), 'utf8');

function sourceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('Congregation destination ownership', () => {
  it('routes Mosques and Community to dedicated congregation reader screens', () => {
    const congregationRoutes = sourceBetween(
      mainSource,
      'function CongregationRoute',
      'function CongregationApplication',
    );

    expect(mainSource).toContain("import { MosquesScreen } from './ui/MosquesScreen';");
    expect(mainSource).toContain("import { CommunityScreen } from './ui/CommunityScreen';");
    expect(congregationRoutes).toContain("case 'mosques'");
    expect(congregationRoutes).toContain('<MosquesScreen />');
    expect(congregationRoutes).toContain("case 'community'");
    expect(congregationRoutes).toContain('<CommunityScreen />');
    expect(congregationRoutes).not.toContain('<MosqueProfilesPanel />');
    expect(congregationRoutes).not.toContain('<CommunityUpdatesPanel />');
  });

  it('keeps Community reader-only with separate announcement and event tabs', () => {
    expect(communitySource).toContain("type CommunityTab = 'announcements' | 'events';");
    expect(communitySource).toContain('role="tablist"');
    expect(communitySource).toContain('role="tabpanel"');
    expect(communitySource).not.toContain('parseCommunityContentLibrary');
    expect(communitySource).not.toContain('serializeCommunityContentLibrary');
    expect(communitySource).not.toContain('<textarea');
  });

  it('keeps mosque nearby sorting explicit, local and separate from location acquisition', () => {
    expect(mosquesSource).toContain('text.nearbyPrivacy');
    expect(mosquesSource).toContain('settings.location');
    expect(mosquesSource).toContain('distanceKm');
    expect(mosquesSource).not.toContain('requestQiblaLocation');
    expect(mosquesSource).not.toContain('navigator.geolocation');
    expect(mosquesSource).not.toContain(['fe', 'tch('].join(''));
  });

  it('reuses the authoritative prayer dashboard/source pipeline for mosque profiles', () => {
    expect(mosquesSource).toContain('buildPrayerDashboardResult');
    expect(mosquesSource).toContain('applyPrayerSourceToDashboard');
    expect(mosquesSource).toContain('timetableMatchesProfile');
  });
});
