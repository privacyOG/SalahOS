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

export interface CalculationMethod {
  readonly id: CalculationMethodId;
  readonly name: string;
  readonly fajrAngleDegrees: number;
  readonly ishaRule: IshaRule;
  readonly maghribRule: { readonly kind: 'sunset' };
  readonly provenance: string;
  readonly verification: 'pending-authoritative-source' | 'custom';
}

const method = (
  id: Exclude<CalculationMethodId, 'custom'>,
  name: string,
  fajrAngleDegrees: number,
  ishaRule: IshaRule,
  provenance: string,
): CalculationMethod => ({
  id,
  name,
  fajrAngleDegrees,
  ishaRule,
  maghribRule: { kind: 'sunset' },
  provenance,
  verification: 'pending-authoritative-source',
});

/**
 * Built-in method registry. Numerical parameters are explicit and centralized so
 * method provenance can be audited independently from the calculation engine.
 * Entries remain marked pending until their primary/authoritative references are
 * archived in project research documentation.
 */
export const calculationMethods: Readonly<
  Record<Exclude<CalculationMethodId, 'custom'>, CalculationMethod>
> = Object.freeze({
  'muslim-world-league': method(
    'muslim-world-league',
    'Muslim World League',
    18,
    { kind: 'angle', angleDegrees: 17 },
    'Commonly published MWL parameters; authoritative source verification pending.',
  ),
  'umm-al-qura': method(
    'umm-al-qura',
    'Umm al-Qura / Makkah',
    18.5,
    { kind: 'interval', minutesAfterMaghrib: 90 },
    'Commonly published Umm al-Qura parameters; Ramadan-specific interval requires Hijri integration and authoritative source verification.',
  ),
  egyptian: method(
    'egyptian',
    'Egyptian General Authority of Survey',
    19.5,
    { kind: 'angle', angleDegrees: 17.5 },
    'Commonly published Egyptian parameters; authoritative source verification pending.',
  ),
  karachi: method(
    'karachi',
    'University of Islamic Sciences, Karachi',
    18,
    { kind: 'angle', angleDegrees: 18 },
    'Commonly published Karachi parameters; authoritative source verification pending.',
  ),
  isna: method(
    'isna',
    'Islamic Society of North America',
    15,
    { kind: 'angle', angleDegrees: 15 },
    'Commonly published ISNA parameters; authoritative source verification pending.',
  ),
  diyanet: method(
    'diyanet',
    'Diyanet / Turkey',
    18,
    { kind: 'angle', angleDegrees: 17 },
    'Initial interoperable parameters; authoritative Diyanet rule verification pending.',
  ),
  muis: method(
    'muis',
    'MUIS / Singapore',
    20,
    { kind: 'angle', angleDegrees: 18 },
    'Commonly published MUIS parameters; authoritative source verification pending.',
  ),
  dubai: method(
    'dubai',
    'Dubai',
    18.2,
    { kind: 'angle', angleDegrees: 18.2 },
    'Commonly published Dubai parameters; authoritative source verification pending.',
  ),
  kuwait: method(
    'kuwait',
    'Kuwait',
    18,
    { kind: 'angle', angleDegrees: 17.5 },
    'Commonly published Kuwait parameters; authoritative source verification pending.',
  ),
  qatar: method(
    'qatar',
    'Qatar',
    18,
    { kind: 'interval', minutesAfterMaghrib: 90 },
    'Commonly published Qatar parameters; authoritative source verification pending.',
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
    provenance: 'User-defined custom calculation parameters.',
    verification: 'custom',
  };
}

function validateAngle(value: number, prayer: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 30) {
    throw new RangeError(`${prayer} angle must be greater than 0 and no more than 30 degrees`);
  }
}
