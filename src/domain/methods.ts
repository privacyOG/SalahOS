export type CalculationMethodId =
  | 'muslim-world-league'
  | 'umm-al-qura'
  | 'egyptian'
  | 'karachi'
  | 'isna'
  | 'diyanet'
  | 'muis'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'custom';

export type MethodPrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type IshaRule =
  | { readonly kind: 'angle'; readonly angleDegrees: number }
  | { readonly kind: 'interval'; readonly minutesAfterMaghrib: number };

export type MethodVerification =
  | 'cross-checked-reference'
  | 'pending-authoritative-source'
  | 'custom';

export interface CalculationMethod {
  readonly id: CalculationMethodId;
  readonly name: string;
  readonly fajrAngleDegrees: number;
  readonly ishaRule: IshaRule;
  readonly maghribRule: { readonly kind: 'sunset' };
  readonly adjustments: Readonly<Partial<Record<MethodPrayerName, number>>>;
  readonly provenance: string;
  readonly verification: MethodVerification;
}

const method = (
  id: Exclude<CalculationMethodId, 'custom'>,
  name: string,
  fajrAngleDegrees: number,
  ishaRule: IshaRule,
  provenance: string,
  verification: Exclude<MethodVerification, 'custom'>,
  adjustments: Readonly<Partial<Record<MethodPrayerName, number>>> = {},
): CalculationMethod => ({
  id,
  name,
  fajrAngleDegrees,
  ishaRule,
  maghribRule: { kind: 'sunset' },
  adjustments: Object.freeze({ ...adjustments }),
  provenance,
  verification,
});

/**
 * Built-in method registry. Numerical parameters are explicit and centralized so
 * method provenance can be audited independently from the calculation engine.
 * `cross-checked-reference` means the parameters agree with the reference set
 * documented in docs/PRAYER_METHOD_REFERENCES.md; it is not institutional
 * certification and does not replace geographic timetable parity testing.
 */
export const calculationMethods: Readonly<
  Record<Exclude<CalculationMethodId, 'custom'>, CalculationMethod>
> = Object.freeze({
  'muslim-world-league': method(
    'muslim-world-league',
    'Muslim World League',
    18,
    { kind: 'angle', angleDegrees: 17 },
    '18° Fajr / 17° Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  'umm-al-qura': method(
    'umm-al-qura',
    'Umm al-Qura / Makkah',
    18.5,
    { kind: 'interval', minutesAfterMaghrib: 90 },
    '18.5° Fajr / 90-minute Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan; Ramadan interval remains separate Hijri-aware work.',
    'cross-checked-reference',
  ),
  egyptian: method(
    'egyptian',
    'Egyptian General Authority of Survey',
    19.5,
    { kind: 'angle', angleDegrees: 17.5 },
    '19.5° Fajr / 17.5° Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  karachi: method(
    'karachi',
    'University of Islamic Sciences, Karachi',
    18,
    { kind: 'angle', angleDegrees: 18 },
    '18° Fajr / 18° Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  isna: method(
    'isna',
    'Islamic Society of North America',
    15,
    { kind: 'angle', angleDegrees: 15 },
    '15° Fajr / 15° Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  diyanet: method(
    'diyanet',
    'Diyanet / Turkey',
    18,
    { kind: 'angle', angleDegrees: 17 },
    '18°/17° interoperability approximation with Adhan JS 4.4.4 Turkey per-event adjustments; official Diyanet timetable parity remains pending.',
    'pending-authoritative-source',
    { sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7 },
  ),
  muis: method(
    'muis',
    'MUIS / Singapore',
    20,
    { kind: 'angle', angleDegrees: 18 },
    '20° Fajr / 18° Isha cross-checked against PrayTimes, Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  dubai: method(
    'dubai',
    'Dubai',
    18.2,
    { kind: 'angle', angleDegrees: 18.2 },
    '18.2° angles follow Batoul Apps research; AlAdhan explicitly labels Dubai experimental and additional per-prayer offsets remain unmodelled.',
    'pending-authoritative-source',
  ),
  kuwait: method(
    'kuwait',
    'Kuwait',
    18,
    { kind: 'angle', angleDegrees: 17.5 },
    '18° Fajr / 17.5° Isha cross-checked against Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
  qatar: method(
    'qatar',
    'Qatar',
    18,
    { kind: 'interval', minutesAfterMaghrib: 90 },
    '18° Fajr / 90-minute Isha cross-checked against Adhan JS 4.4.4 and AlAdhan.',
    'cross-checked-reference',
  ),
});

export function getCalculationMethod(
  id: Exclude<CalculationMethodId, 'custom'>,
): CalculationMethod {
  return calculationMethods[id];
}

export function createCustomCalculationMethod(input: {
  readonly name: string;
  readonly fajrAngleDegrees: number;
  readonly ishaRule: IshaRule;
}): CalculationMethod {
  if (!input.name.trim()) {
    throw new RangeError('Custom calculation method name is required');
  }
  validateAngle(input.fajrAngleDegrees, 'Fajr');
  if (input.ishaRule.kind === 'angle') {
    validateAngle(input.ishaRule.angleDegrees, 'Isha');
  } else if (
    !Number.isFinite(input.ishaRule.minutesAfterMaghrib) ||
    input.ishaRule.minutesAfterMaghrib < 0 ||
    input.ishaRule.minutesAfterMaghrib > 240
  ) {
    throw new RangeError('Custom Isha interval must be between 0 and 240 minutes');
  }

  return {
    id: 'custom',
    name: input.name.trim(),
    fajrAngleDegrees: input.fajrAngleDegrees,
    ishaRule: input.ishaRule,
    maghribRule: { kind: 'sunset' },
    adjustments: Object.freeze({}),
    provenance: 'User-defined custom calculation parameters.',
    verification: 'custom',
  };
}

function validateAngle(value: number, prayer: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 30) {
    throw new RangeError(`${prayer} angle must be greater than 0 and no more than 30 degrees`);
  }
}
