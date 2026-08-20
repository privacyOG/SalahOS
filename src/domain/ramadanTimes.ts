const DAY_MINUTES = 1_440;

export const RAMADAN_IMSAK_PRESENTATION_OFFSET_MINUTES = 10;

export interface RamadanFastTimes {
  readonly imsakLocalMinutes: number | null;
  readonly suhurEndsAtLocalMinutes: number | null;
  readonly iftarLocalMinutes: number | null;
  readonly imsakOffsetMinutes: number;
}

function normalizeDayMinutes(minutes: number): number {
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function requireDisplayedMinutes(value: number | null, label: string): void {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value >= DAY_MINUTES)) {
    throw new RangeError(`${label} must be null or a minute within the civil day`);
  }
}

function requireImsakOffset(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 240) {
    throw new RangeError('Imsak offset must be an integer between 0 and 240 minutes');
  }
}

/**
 * Build Ramadan fasting-time presentation from the prayer times already
 * selected for display. Suhur ends at displayed Fajr and Iftar begins at
 * displayed Maghrib. Imsak is an explicitly supplied precautionary offset,
 * not an independent prayer time or hidden calculation convention.
 */
export function buildRamadanFastTimes(input: {
  readonly displayedFajrLocalMinutes: number | null;
  readonly displayedMaghribLocalMinutes: number | null;
  readonly imsakOffsetMinutes: number;
}): RamadanFastTimes {
  requireDisplayedMinutes(input.displayedFajrLocalMinutes, 'Displayed Fajr');
  requireDisplayedMinutes(input.displayedMaghribLocalMinutes, 'Displayed Maghrib');
  requireImsakOffset(input.imsakOffsetMinutes);

  return Object.freeze({
    imsakLocalMinutes:
      input.displayedFajrLocalMinutes === null
        ? null
        : normalizeDayMinutes(input.displayedFajrLocalMinutes - input.imsakOffsetMinutes),
    suhurEndsAtLocalMinutes: input.displayedFajrLocalMinutes,
    iftarLocalMinutes: input.displayedMaghribLocalMinutes,
    imsakOffsetMinutes: input.imsakOffsetMinutes,
  });
}
