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

export type IshaRule =
  | { readonly kind: 'angle'; readonly angleDegrees: number }
  | { readonly kind: 'interval'; readonly minutesAfterMaghrib: number };

export type MethodVerification =
  'cross-checked-reference' | 'pending-authoritative-source' | 'custom';

export interface MethodAdjustments {
  readonly fajr?: number;
  readonly sunrise?: number;
  readonly dhuhr?: number;
  readonly asr?: number;
  readonly maghrib?: number;
  readonly isha?: number;
}

export interface CalculationMethod {
  readonly id: CalculationMethodId;
  readonly name: string;
  readonly fajrAngleDegrees: number;
  readonly ishaRule: IshaRule;
  readonly maghribRule: { readonly kind: 'sunset' };
  readonly institutionalAdjustments: Readonly<MethodAdjustments>;
  readonly provenance: string;
  readonly verification: MethodVerification;
}

function validateInstitutionalAdjustments(adjustments: Readonly<MethodAdjustments>): void {
  for (const [prayer, minutes] of Object.entries(adjustments)) {
    if (!Number.isInteger(minutes) || minutes < -60 || minutes > 60) {
      throw new RangeError(
        `${prayer} institutional adjustment must be an integer between -60 and 60 minutes`,
      );
    }
  }
}

const method = (
  id: Exclude<CalculationMethodId, 'custom'>,
  name: string,
  fajrAngleDegrees: number,
  ishaRule: IshaRule,
  provenance: string,
  verification: Exclude<MethodVerification, 'custom'>,
  institutionalAdjustments: Readonly<MethodAdjustments> = {},
): CalculationMethod => {
  validateInstitutionalAdjustments(institutionalAdjustments);
  return {
    id,
    name,
    fajrAngleDegrees,
    ishaRule,
    maghribRule: { kind: 'sunset' },
    institutionalAdjustments: Object.freeze({ ...institutionalAdjustments }),
    provenance,
    verification,
  };
};

/**
 * Built-in method registry. Numerical parameters are explicit and centralized so
 * method provenance can be audited independently from the calculation engine.
 * `cross-checked-reference` means the parameters agree with the reference set
 * documented in docs/PRAYER_METHOD_REFERENCES.md; it is not institutional
 * certification and does not replace geographic timetable parity testing.
 *
 * `institutionalAdjustments` records published authority-specific corrections
 * separately from user/manual prayer offsets. The astronomical engine does not
 * silently apply these values until the corresponding method policy has been
 * validated end-to-end against authoritative timetable output.
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
    '18°/17° interoperability approximation. Diyanet officially publishes -7 min Sunrise, +5 min Dhuhr, +4 min Asr and +7 min Maghrib corrections; Imsak/Fajr and Isha receive no temkin adjustment. Twilight-angle parity with official Diyanet output remains pending.',
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
    '18.2° angles follow Batoul Apps research. Dubai IACAD describes its official prayer-time service as using government astronomical/Sharia criteria supervised with the International Astronomical Center, but the official material reviewed does not establish 18.2°/18.2° as the authority formula. Official service parity remains pending.',
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
    institutionalAdjustments: Object.freeze({}),
    provenance: 'User-defined custom calculation parameters.',
    verification: 'custom',
  };
}

function validateAngle(value: number, prayer: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 30) {
    throw new RangeError(`${prayer} angle must be greater than 0 and no more than 30 degrees`);
  }
}
