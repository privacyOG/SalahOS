import { describe, expect, it } from 'vitest';

import {
  defaultPersistedSettings,
  exportPersistedSettings,
  importPersistedSettings,
} from './settingsStorage';

describe('additional locale settings persistence', () => {
  it.each(['tr', 'id'] as const)(
    'round-trips the %s locale through settings export/import',
    (locale) => {
      const settings = { ...defaultPersistedSettings, locale };
      expect(importPersistedSettings(exportPersistedSettings(settings)).locale).toBe(locale);
    },
  );

  it('falls back to English for an unsupported imported locale identifier', () => {
    const payload = JSON.parse(exportPersistedSettings(defaultPersistedSettings)) as Record<
      string,
      unknown
    >;
    payload.locale = 'xx';

    expect(importPersistedSettings(JSON.stringify(payload)).locale).toBe('en');
  });
});
