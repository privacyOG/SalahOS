export const themePalettes = [
  'salah-classic',
  'royal-blue',
  'emerald-mosque',
  'navy',
  'desert-sand',
  'soft-lavender',
  'midnight-gold',
  'olive-heritage',
  'monochrome',
  'high-contrast',
] as const;

export type ThemePalette = (typeof themePalettes)[number];
export const defaultThemePalette: ThemePalette = 'salah-classic';

export const themePaletteLabels: Readonly<Record<ThemePalette, string>> = Object.freeze({
  'salah-classic': 'Standard',
  'royal-blue': 'Light Blue',
  'emerald-mosque': 'Emerald',
  navy: 'Navy',
  'desert-sand': 'Warm Sand',
  'soft-lavender': 'Soft Lavender',
  'midnight-gold': 'Midnight Gold',
  'olive-heritage': 'Olive Heritage',
  monochrome: 'Monochrome',
  'high-contrast': 'High Contrast',
});

export function parseThemePalette(value: unknown): ThemePalette {
  return typeof value === 'string' && (themePalettes as readonly string[]).includes(value)
    ? (value as ThemePalette)
    : defaultThemePalette;
}

export function applyThemePalette(
  palette: ThemePalette,
  documentTarget: Pick<Document, 'documentElement'> = document,
): void {
  documentTarget.documentElement.dataset.palette = palette;
}
