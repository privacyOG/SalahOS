import { describe, expect, it } from 'vitest';

import { PERSISTED_APPLICATION_KEYS } from './applicationStorage';
import { MANAGED_DISPLAY_CONNECTION_STORAGE_KEY } from './managedDisplayConnectionStorage';
import { MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY } from './managedPrayerBoardCache';

describe('managed display native persistence registration', () => {
  it(
    'includes managed display connection and last-known-good prayer-board cache in the native hydration allow-list',
    () => {
      expect(PERSISTED_APPLICATION_KEYS).toContain(MANAGED_DISPLAY_CONNECTION_STORAGE_KEY);
      expect(PERSISTED_APPLICATION_KEYS).toContain(MANAGED_PRAYER_BOARD_CACHE_STORAGE_KEY);
      expect(new Set(PERSISTED_APPLICATION_KEYS).size).toBe(PERSISTED_APPLICATION_KEYS.length);
    },
  );
});
