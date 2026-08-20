import { describe, expect, it } from 'vitest';

import { createCoordinates } from '../domain/coordinates';
import type { MosqueTimetable } from '../domain/mosqueTimetable';
import { defaultPersistedSettings, type PersistedSettings } from '../platform/settingsStorage';
import { buildRamadanPanelModel } from './RamadanModePanel';

const mosqueTimetable: MosqueTimetable = {
  mosqueName: 'Example Mosque',
  days: [
    {
      date: '2026-08-16',
      prayers: {
        fajr: { startLocalMinutes: 330 },
        maghrib: { startLocalMinutes: 1_050 },
      },
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
    ...overrides,
  };
}

describe('Ramadan mode panel model', () => {
  it('uses the selected local-mosque Fajr and Maghrib for fasting presentation', () => {
    const model = buildRamadanPanelModel(
      settings({ prayerSourceMode: 'local-mosque', mosqueTimetable }),
      new Date('2026-08-16T02:00:00.000Z'),
    );

    expect(model).not.toBeNull();
    expect(model).toMatchObject({
      imsakLocalMinutes: 320,
      suhurEndsAtLocalMinutes: 330,
      iftarLocalMinutes: 1_050,
    });
  });

  it('returns no model until a location is configured', () => {
    expect(
      buildRamadanPanelModel(
        { ...defaultPersistedSettings, location: null },
        new Date('2026-08-16T02:00:00.000Z'),
      ),
    ).toBeNull();
  });
});
