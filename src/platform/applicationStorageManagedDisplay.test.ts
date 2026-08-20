import { describe, expect, it } from 'vitest';

import { PERSISTED_APPLICATION_KEYS } from './applicationStorage';
import { MANAGED_DISPLAY_CONNECTION_STORAGE_KEY } from './managedDisplayConnectionStorage';

describe('managed display native persistence registration', () => {
  it('includes the managed display connection in the explicit native hydration allow-list', () => {
    expect(PERSISTED_APPLICATION_KEYS).toContain(MANAGED_DISPLAY_CONNECTION_STORAGE_KEY);
    expect(new Set(PERSISTED_APPLICATION_KEYS).size).toBe(PERSISTED_APPLICATION_KEYS.length);
  });
});
