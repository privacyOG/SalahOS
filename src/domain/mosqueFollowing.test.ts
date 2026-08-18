import { describe, expect, it } from 'vitest';
import { createMosqueId } from './mosqueIdentity';
import { previewMosquePrayerPublication } from './mosquePrayerPublication';
import {
  cacheMosquePrayerData,
  cachedPrayerDataForMosque,
  createMosqueFollowingState,
  followMosque,
  mosqueCacheFreshness,
  setPreferredMosque,
  unfollowMosque,
} from './mosqueFollowing';

const publication = previewMosquePrayerPublication({
  mosqueId: 'masjid-al-noor:sydney',
  prayerStarts: { kind: 'calculated' },
}).publication;

const cached = {
  mosqueId: publication.mosqueId,
  revisionId: 'rev-001',
  synchronizedAt: '2026-08-19T00:00:00.000Z',
  staleAfter: '2026-08-19T06:00:00.000Z',
  publication,
} as const;

describe('mosque following', () => {
  it('follows multiple mosques and keeps preferred source inside the followed set', () => {
    let state = createMosqueFollowingState();
    state = followMosque(state, 'masjid-al-noor:sydney');
    state = followMosque(state, 'lakemba-mosque');
    state = setPreferredMosque(state, 'lakemba-mosque');

    expect(state.followedMosqueIds).toEqual(['masjid-al-noor:sydney', 'lakemba-mosque']);
    expect(state.preferredMosqueId).toBe('lakemba-mosque');
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('rejects a preferred mosque that is not followed', () => {
    const state = createMosqueFollowingState(['masjid-al-noor:sydney']);
    expect(() => setPreferredMosque(state, 'unfollowed-mosque')).toThrow(/must also be followed/u);
  });

  it('clears the preferred mosque and cached data when it is unfollowed', () => {
    let state = createMosqueFollowingState(
      ['masjid-al-noor:sydney'],
      'masjid-al-noor:sydney',
    );
    state = cacheMosquePrayerData(state, cached);
    state = unfollowMosque(state, 'masjid-al-noor:sydney');

    expect(state.preferredMosqueId).toBeNull();
    expect(state.followedMosqueIds).toEqual([]);
    expect(state.cachedPrayerData).toEqual([]);
  });

  it('caches followed mosque prayer data and reports freshness without device location', () => {
    let state = createMosqueFollowingState(['masjid-al-noor:sydney']);
    state = cacheMosquePrayerData(state, cached);

    expect(cachedPrayerDataForMosque(state, 'masjid-al-noor:sydney')?.revisionId).toBe('rev-001');
    expect(
      mosqueCacheFreshness(state, 'masjid-al-noor:sydney', '2026-08-19T05:59:59.000Z'),
    ).toBe('fresh');
    expect(
      mosqueCacheFreshness(state, 'masjid-al-noor:sydney', '2026-08-19T06:00:00.000Z'),
    ).toBe('stale');
    expect(mosqueCacheFreshness(state, 'lakemba-mosque', '2026-08-19T06:00:00.000Z')).toBe(
      'missing',
    );
    expect('coordinates' in state).toBe(false);
  });

  it('rejects cache entries for unfollowed or mismatched mosques', () => {
    const state = createMosqueFollowingState(['lakemba-mosque']);
    expect(() => cacheMosquePrayerData(state, cached)).toThrow(
      /only be cached for a followed mosque/u,
    );

    expect(() =>
      createMosqueFollowingState(['masjid-al-noor:sydney'], null, [
        {
          ...cached,
          mosqueId: createMosqueId('lakemba-mosque'),
        },
      ]),
    ).toThrow(/must belong to the cached mosque/u);
  });

  it('validates synchronization and staleness timestamps', () => {
    expect(() =>
      createMosqueFollowingState(['masjid-al-noor:sydney'], null, [
        {
          ...cached,
          staleAfter: '2026-08-18T23:00:00.000Z',
        },
      ]),
    ).toThrow(/must be later/u);
  });
});
