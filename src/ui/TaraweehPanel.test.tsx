import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { defaultPersistedSettings, type PersistedSettings } from '../platform/settingsStorage';
import { buildTaraweehPanelModel } from './TaraweehPanel';

const mosqueTimetable: MosqueTimetable = {
  mosqueName: 'Example Mosque',
  days: [
    {
      date: '2026-08-16',
      prayers: {},
      taraweehSessions: [
        { label: 'Main hall', startLocalMinutes: 20 * 60 + 15 },
        { label: 'Late session', startLocalMinutes: 22 * 60 },
      ],
    },
  ],
};

function settings(overrides: Partial<PersistedSettings> = {}): PersistedSettings {
  return {
    ...defaultPersistedSettings,
    location: {
      coordinates: createCoordinates(-33.8688, 151.2093),
      timeZone: 'Australia/Sydney',
    },
    prayerSourceMode: 'local-mosque',
    mosqueTimetable,
    ...overrides,
  };
}

describe('Taraweeh panel model', () => {
  it('returns the selected mosque sessions for the resolved local civil date', () => {
    expect(buildTaraweehPanelModel(settings(), new Date('2026-08-16T02:00:00.000Z'))).toEqual({
      mosqueName: 'Example Mosque',
      date: '2026-08-16',
      sessions: [
        { label: 'Main hall', startLocalMinutes: 20 * 60 + 15 },
        { label: 'Late session', startLocalMinutes: 22 * 60 },
      ],
    });
  });

  it('does not surface mosque Taraweeh sessions outside local-mosque mode', () => {
    expect(
      buildTaraweehPanelModel(
        settings({ prayerSourceMode: 'calculated' }),
        new Date('2026-08-16T02:00:00.000Z'),
      ),
    ).toBeNull();
  });

  it('returns no panel when the resolved day has no Taraweeh sessions', () => {
    expect(buildTaraweehPanelModel(settings(), new Date('2026-08-17T02:00:00.000Z'))).toBeNull();
  });
});
