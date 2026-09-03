import { asrConventionPresentation } from '../domain/asrConventionPresentation';
import type { CalculationMethodId } from '../domain/methods';
import {
  hasManualPrayerAdjustments,
  type PrayerAdjustments,
} from '../domain/prayerAdjustments';
import type { AsrConvention } from '../domain/prayerEngine';
import type { Locale } from '../i18n/translations';

type BuiltInCalculationMethodId = Exclude<CalculationMethodId, 'custom'>;

const methodShortLabels: Readonly<Record<BuiltInCalculationMethodId, string>> = Object.freeze({
  'muslim-world-league': 'MWL',
  'umm-al-qura': 'Umm al-Qura',
  egyptian: 'Egyptian',
  karachi: 'Karachi',
  isna: 'ISNA',
  diyanet: 'Diyanet',
  muis: 'MUIS',
  dubai: 'Dubai',
  kuwait: 'Kuwait',
  qatar: 'Qatar',
});

const provenanceCopy: Readonly<
  Record<
    Locale,
    Readonly<{
      standardAsr: string;
      hanafiAsr: string;
      adjusted: string;
      settingsPrefix: string;
    }>
  >
> = Object.freeze({
  en: {
    standardAsr: 'Standard Asr',
    hanafiAsr: 'Hanafi Asr',
    adjusted: 'Adjusted',
    settingsPrefix: 'Prayer calculation settings',
  },
  ar: {
    standardAsr: 'العصر القياسي',
    hanafiAsr: 'العصر الحنفي',
    adjusted: 'معدّل',
    settingsPrefix: 'إعدادات حساب مواقيت الصلاة',
  },
  tr: {
    standardAsr: 'Standart ikindi',
    hanafiAsr: 'Hanefi ikindi',
    adjusted: 'Ayarlı',
    settingsPrefix: 'Namaz vakti hesaplama ayarları',
  },
  id: {
    standardAsr: 'Asar standar',
    hanafiAsr: 'Asar Hanafi',
    adjusted: 'Disesuaikan',
    settingsPrefix: 'Pengaturan perhitungan waktu salat',
  },
});

export interface TodayPrayerProvenancePresentation {
  readonly methodLabel: string;
  readonly asrLabel: string;
  readonly adjustedLabel: string | null;
  readonly ariaLabel: string;
  readonly hasManualAdjustments: boolean;
}

export function todayPrayerProvenancePresentation(input: {
  readonly locale: Locale;
  readonly methodId: BuiltInCalculationMethodId;
  readonly asrConvention: AsrConvention;
  readonly prayerAdjustments: PrayerAdjustments;
}): TodayPrayerProvenancePresentation {
  const copy = provenanceCopy[input.locale];
  const asr = asrConventionPresentation(input.asrConvention);
  const asrLabel =
    asr.madhhabAssociation === 'hanafi' ? copy.hanafiAsr : copy.standardAsr;
  const hasManualAdjustments = hasManualPrayerAdjustments(input.prayerAdjustments);
  const adjustedLabel = hasManualAdjustments ? copy.adjusted : null;
  const visibleParts = [methodShortLabels[input.methodId], asrLabel];
  if (adjustedLabel !== null) visibleParts.push(adjustedLabel);

  return {
    methodLabel: methodShortLabels[input.methodId],
    asrLabel,
    adjustedLabel,
    ariaLabel: `${copy.settingsPrefix}: ${visibleParts.join(', ')}`,
    hasManualAdjustments,
  };
}
