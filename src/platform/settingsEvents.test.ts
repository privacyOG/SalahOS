import { describe, expect, it } from 'vitest';

import { SETTINGS_CHANGE_EVENT } from './settingsEvents';

describe('settings change event', () => {
  it('uses a stable application-scoped event name', () => {
    expect(SETTINGS_CHANGE_EVENT).toBe('salahos:settings-change');
  });
});
