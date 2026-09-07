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

export const themePalettePreviewColors: Readonly<
  Record<ThemePalette, Readonly<{ accent: string; strong: string }>>
> = Object.freeze({
  'salah-classic': { accent: '#72a66b', strong: '#3f7448' },
  'royal-blue': { accent: '#74b9f2', strong: '#276ea7' },
  'emerald-mosque': { accent: '#47b881', strong: '#14704a' },
  navy: { accent: '#6689c8', strong: '#173c70' },
  'desert-sand': { accent: '#c99b68', strong: '#81552d' },
  'soft-lavender': { accent: '#aa94d6', strong: '#66509a' },
  'midnight-gold': { accent: '#d5b15d', strong: '#8f6b20' },
  'olive-heritage': { accent: '#9aa66b', strong: '#59652e' },
  monochrome: { accent: '#a8adb3', strong: '#555b62' },
  'high-contrast': { accent: '#ffe500', strong: '#005fcc' },
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
