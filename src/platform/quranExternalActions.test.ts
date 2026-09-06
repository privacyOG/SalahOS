import { describe, expect, it } from 'vitest';

import { quranTanzilSourceUrl } from './quranExternalActions';

describe('Qur’an external actions', () => {
  it('returns the reviewed Tanzil provenance destination', () => {
    expect(quranTanzilSourceUrl()).toBe('https://tanzil.net/');
  });
});
