import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');
const mosquesSource = readFileSync(new URL('./MosquesScreen.tsx', import.meta.url), 'utf8');
const communitySource = readFileSync(new URL('./CommunityScreen.tsx', import.meta.url), 'utf8');

describe('Stage 22.5 congregation destinations', () => {
  it('routes Mosques and Community to dedicated congregation reader screens', () => {
    expect(mainSource).toContain("import { MosquesScreen } from './ui/MosquesScreen';");
    expect(mainSource).toContain("import { CommunityScreen } from './ui/CommunityScreen';");
    expect(mainSource).toContain('<MosquesScreen />');
    expect(mainSource).toContain('<CommunityScreen />');
    expect(mainSource).not.toContain('<MosqueProfilesPanel />');
    expect(mainSource).not.toContain('<CommunityUpdatesPanel />');
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
