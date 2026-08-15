import { describe, expect, it } from 'vitest';
import { isSupplementaryPrayer, prayerPresentationRole } from './prayerPresentation';

describe('prayer presentation roles', () => {
  it('treats Sunrise as supplementary information', () => {
    expect(prayerPresentationRole('sunrise')).toBe('supplementary');
    expect(isSupplementaryPrayer('sunrise')).toBe(true);
  });

  it.each(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const)(
    'keeps %s in the obligatory prayer set',
    (prayer) => {
      expect(prayerPresentationRole(prayer)).toBe('obligatory');
      expect(isSupplementaryPrayer(prayer)).toBe(false);
    },
  );
});
