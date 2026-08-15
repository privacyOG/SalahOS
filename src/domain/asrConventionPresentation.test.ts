import { describe, expect, it } from 'vitest';
import { asrConventionPresentation } from './asrConventionPresentation';

describe('Asr convention presentation', () => {
  it('keeps Standard mathematically precise while associating it with Shafii, Maliki and Hanbali practice', () => {
    expect(asrConventionPresentation('standard')).toEqual({
      convention: 'standard',
      shadowFactor: 1,
      madhhabAssociation: 'shafii-maliki-hanbali',
    });
  });

  it('keeps Hanafi mathematically precise with shadow factor two', () => {
    expect(asrConventionPresentation('hanafi')).toEqual({
      convention: 'hanafi',
      shadowFactor: 2,
      madhhabAssociation: 'hanafi',
    });
  });
});
