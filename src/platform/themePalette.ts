export const themePalettes = [
  'salah-classic',
  'midnight-gold',
  'emerald-mosque',
  'royal-blue',
  'desert-sand',
  'olive-heritage',
  'monochrome',
  'high-contrast',
] as const;

export type ThemePalette = (typeof themePalettes)[number];
export const defaultThemePalette: ThemePalette = 'salah-classic';

export const themePaletteLabels: Readonly<Record<ThemePalette, string>> = Object.freeze({
  'salah-classic': 'Salah Classic',
  'midnight-gold': 'Midnight Gold',
  'emerald-mosque': 'Emerald Mosque',
  'royal-blue': 'Royal Blue',
  'desert-sand': 'Desert Sand',
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
