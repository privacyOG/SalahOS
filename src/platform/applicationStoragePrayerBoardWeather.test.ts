import { describe, expect, it } from 'vitest';

import { PERSISTED_APPLICATION_KEYS } from './applicationStorage';
import { PRAYER_BOARD_WEATHER_STORAGE_KEY } from './prayerBoardWeather';

describe('prayer-board weather native persistence registration', () => {
  it('includes optional weather configuration and cache in the native hydration allow-list', () => {
    expect(PERSISTED_APPLICATION_KEYS).toContain(PRAYER_BOARD_WEATHER_STORAGE_KEY);
    expect(new Set(PERSISTED_APPLICATION_KEYS).size).toBe(PERSISTED_APPLICATION_KEYS.length);
  });
});
