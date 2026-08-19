import type { HijriDateParts } from './calendar';

export interface RamadanModeState {
  readonly active: boolean;
  readonly hijriYear: number;
  readonly ramadanDay: number | null;
  readonly source: 'corrected-hijri-date';
}

function assertHijriDate(hijri: Pick<HijriDateParts, 'year' | 'month' | 'day'>): void {
  if (!Number.isInteger(hijri.year) || hijri.year < 1) {
    throw new RangeError('Hijri year must be a positive integer');
  }
  if (!Number.isInteger(hijri.month) || hijri.month < 1 || hijri.month > 12) {
    throw new RangeError('Hijri month must be an integer between 1 and 12');
  }
  if (!Number.isInteger(hijri.day) || hijri.day < 1 || hijri.day > 30) {
    throw new RangeError('Hijri day must be an integer between 1 and 30');
  }
}

export function deriveRamadanMode(
  hijri: Pick<HijriDateParts, 'year' | 'month' | 'day'>,
): RamadanModeState {
  assertHijriDate(hijri);
  const active = hijri.month === 9;

  return Object.freeze({
    active,
    hijriYear: hijri.year,
    ramadanDay: active ? hijri.day : null,
    source: 'corrected-hijri-date',
  });
}
