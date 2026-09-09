import type { CSSProperties } from 'react';

import type { Locale } from '../i18n/translations';
import {
  defaultThemePalette,
  themePaletteLabels,
  themePalettePreviewColors,
  themePalettes,
  type ThemePalette,
} from '../platform/themePalette';
import '../theme-palette-picker.css';

type PickerCopy = Readonly<{
  reset: string;
  selected: string;
}>;

const pickerCopy: Readonly<Record<Locale, PickerCopy>> = {
  en: { reset: 'Reset to Standard', selected: 'Selected' },
  ar: { reset: 'إعادة الضبط إلى القياسي', selected: 'محدد' },
  tr: { reset: 'Standart palete dön', selected: 'Seçili' },
  id: { reset: 'Atur ulang ke Standar', selected: 'Dipilih' },
};

type PreviewStyle = CSSProperties &
  Readonly<{
    '--theme-palette-preview-accent': string;
    '--theme-palette-preview-strong': string;
  }>;

export function ThemePalettePicker({
  locale,
  label,
  selected,
  onSelect,
}: Readonly<{
  locale: Locale;
  label: string;
  selected: ThemePalette;
  onSelect: (palette: ThemePalette) => void;
}>) {
  const copy = pickerCopy[locale];

  return (
    <section className="theme-palette-picker" data-theme-palette-picker>
      <header className="theme-palette-picker__header">
        <strong>{label}</strong>
        <button
          type="button"
          data-theme-palette-reset
          disabled={selected === defaultThemePalette}
          onClick={() => {
            onSelect(defaultThemePalette);
          }}
        >
          {copy.reset}
        </button>
      </header>
      <div className="theme-palette-picker__grid" role="radiogroup" aria-label={label}>
        {themePalettes.map((palette) => {
          const preview = themePalettePreviewColors[palette];
          const previewStyle: PreviewStyle = {
            '--theme-palette-preview-accent': preview.accent,
            '--theme-palette-preview-strong': preview.strong,
          };
          const active = selected === palette;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              className="theme-palette-picker__option"
              data-theme-palette-option={palette}
              data-selected={active ? 'true' : undefined}
              key={palette}
              style={previewStyle}
              onClick={() => {
                onSelect(palette);
              }}
            >
              <span className="theme-palette-picker__swatches" aria-hidden="true">
                <span />
                <span />
              </span>
              <span className="theme-palette-picker__name">{themePaletteLabels[palette]}</span>
              {active ? <small>{copy.selected}</small> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
