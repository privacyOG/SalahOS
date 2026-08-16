import { hijriDateParts } from './calendar';
import type { CalculationMethod } from './methods';

const RAMADAN_MONTH = 9;

/**
 * Resolve named calculation-method rules that depend on the civil date.
 *
 * The institutional Umm al-Qura calendar is used without the user's optional
 * Hijri display correction. A display correction must never silently change a
 * named prayer-calculation method.
 */
export function resolveCalculationMethodForCivilDate(
  method: CalculationMethod,
  civilDate: Date,
): CalculationMethod {
  const policy = method.seasonalIshaPolicy;
  if (policy === undefined) return method;
  if (method.ishaRule.kind !== 'interval') {
    throw new Error('Seasonal Isha policy requires an interval-based Isha rule');
  }

  const hijri = hijriDateParts(civilDate, 0, 'islamic-umalqura');
  if (hijri.month !== RAMADAN_MONTH) return method;

  return {
    ...method,
    ishaRule: {
      kind: 'interval',
      minutesAfterMaghrib: policy.ramadanMinutesAfterMaghrib,
    },
  };
}
