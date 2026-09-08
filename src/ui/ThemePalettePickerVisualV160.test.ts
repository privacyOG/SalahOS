import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const picker = readFileSync(new URL('./ThemePalettePicker.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../theme-palette-picker.css', import.meta.url), 'utf8');

describe('V1.6.0 palette picker visual contract', () => {
  it('keeps preview options touch-sized, responsive and keyboard visible', () => {
    expect(css).toContain('min-height: 76px');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('@media (max-width: 360px)');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline: 3px solid var(--salah-focus-ring)');
  });

  it('identifies every option and reset action for rendered acceptance', () => {
    expect(picker).toContain('data-theme-palette-picker');
    expect(picker).toContain('data-theme-palette-option={palette}');
    expect(picker).toContain('data-theme-palette-reset');
  });
});
