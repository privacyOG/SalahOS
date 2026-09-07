import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  defaultThemePalette,
  themePaletteLabels,
  themePalettePreviewColors,
  themePalettes,
} from '../platform/themePalette';

const picker = readFileSync(new URL('./ThemePalettePicker.tsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('./SettingsScreen.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../theme-palette-picker.css', import.meta.url), 'utf8');

describe('V1.6.0 theme palette picker', () => {
  it('keeps every requested palette persistent and previewable', () => {
    expect(defaultThemePalette).toBe('salah-classic');
    expect(themePalettes).toEqual(
      expect.arrayContaining([
        'salah-classic',
        'royal-blue',
        'emerald-mosque',
        'navy',
        'desert-sand',
        'soft-lavender',
      ]),
    );
    expect(themePaletteLabels['salah-classic']).toBe('Standard');
    expect(themePaletteLabels['royal-blue']).toBe('Light Blue');
    expect(themePaletteLabels['emerald-mosque']).toBe('Emerald');
    expect(themePaletteLabels.navy).toBe('Navy');
    expect(themePaletteLabels['desert-sand']).toBe('Warm Sand');
    expect(themePaletteLabels['soft-lavender']).toBe('Soft Lavender');
    expect(Object.keys(themePalettePreviewColors)).toHaveLength(themePalettes.length);
  });

  it('exposes an accessible preview grid and explicit Standard reset', () => {
    expect(picker).toContain('role="radiogroup"');
    expect(picker).toContain('role="radio"');
    expect(picker).toContain('aria-checked={active}');
    expect(picker).toContain('data-theme-palette-option={palette}');
    expect(picker).toContain('data-theme-palette-reset');
    expect(picker).toContain('onSelect(defaultThemePalette)');
  });

  it('keeps appearance mode separate and uses semantic focus/surface tokens', () => {
    expect(settings).toContain('<ThemePalettePicker');
    expect(settings).toContain("theme: event.target.value as PersistedSettings['theme']");
    expect(css).toContain('var(--salah-bg-surface-raised)');
    expect(css).toContain('var(--salah-border-strong)');
    expect(css).toContain('var(--salah-focus-ring)');
    expect(css).not.toMatch(/color:\s*#[0-9a-f]{3,8}/iu);
  });
});
