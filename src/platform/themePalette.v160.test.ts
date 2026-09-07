import { describe, expect, it } from 'vitest';

import {
  applyThemePalette,
  defaultThemePalette,
  parseThemePalette,
  themePaletteLabels,
  themePalettes,
} from './themePalette';

const requiredV160Labels = [
  'Standard',
  'Light Blue',
  'Emerald',
  'Navy',
  'Warm Sand',
  'Soft Lavender',
] as const;

describe('V1.6.0 theme palettes', () => {
  it('keeps all requested palettes as persistent choices', () => {
    const labels = themePalettes.map((palette) => themePaletteLabels[palette]);
    for (const label of requiredV160Labels) expect(labels).toContain(label);
  });

  it('keeps palette parsing independent from appearance mode', () => {
    expect(parseThemePalette('navy')).toBe('navy');
    expect(parseThemePalette('soft-lavender')).toBe('soft-lavender');
    expect(parseThemePalette('not-a-palette')).toBe(defaultThemePalette);
  });

  it('applies only the palette data attribute', () => {
    const dataset: DOMStringMap = {};
    applyThemePalette('royal-blue', { documentElement: { dataset } } as Document);
    expect(dataset.palette).toBe('royal-blue');
    expect(dataset.theme).toBeUndefined();
  });
});
