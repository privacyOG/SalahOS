import type { PrayerName } from './prayerEngine';

export type PrayerPresentationRole = 'obligatory' | 'supplementary';

export function prayerPresentationRole(prayer: PrayerName): PrayerPresentationRole {
  return prayer === 'sunrise' ? 'supplementary' : 'obligatory';
}

export function isSupplementaryPrayer(prayer: PrayerName): boolean {
  return prayerPresentationRole(prayer) === 'supplementary';
}
