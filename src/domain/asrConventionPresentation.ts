import type { AsrConvention } from './prayerEngine';

export type AsrMadhhabAssociation = 'shafii-maliki-hanbali' | 'hanafi';

export interface AsrConventionPresentation {
  readonly convention: AsrConvention;
  readonly shadowFactor: 1 | 2;
  readonly madhhabAssociation: AsrMadhhabAssociation;
}

export function asrConventionPresentation(convention: AsrConvention): AsrConventionPresentation {
  return convention === 'standard'
    ? {
        convention,
        shadowFactor: 1,
        madhhabAssociation: 'shafii-maliki-hanbali',
      }
    : {
        convention,
        shadowFactor: 2,
        madhhabAssociation: 'hanafi',
      };
}
