import type { KeyValueStorage } from './settingsStorage';

export const SMART_DISPLAY_THEME_STORAGE_KEY = 'salahos.smartDisplayTheme';
export const SMART_DISPLAY_THEME_CHANGE_EVENT = 'salahos:smart-display-theme-change';

export type SmartDisplayThemeId = 'classic' | 'midnight' | 'sandstone' | 'emerald';

export interface SmartDisplayThemeDefinition {
  readonly id: SmartDisplayThemeId;
  readonly label: string;
}

export const smartDisplayThemes: readonly SmartDisplayThemeDefinition[] = Object.freeze([
  Object.freeze({ id: 'classic', label: 'Classic' }),
  Object.freeze({ id: 'midnight', label: 'Midnight' }),
  Object.freeze({ id: 'sandstone', label: 'Sandstone' }),
  Object.freeze({ id: 'emerald', label: 'Emerald' }),
]);

export const DEFAULT_SMART_DISPLAY_THEME: SmartDisplayThemeId = 'classic';

const THEME_IDS = new Set<SmartDisplayThemeId>(smartDisplayThemes.map((theme) => theme.id));

export function parseSmartDisplayTheme(value: unknown): SmartDisplayThemeId {
  return typeof value === 'string' && THEME_IDS.has(value as SmartDisplayThemeId)
    ? (value as SmartDisplayThemeId)
    : DEFAULT_SMART_DISPLAY_THEME;
}

export function loadSmartDisplayTheme(storage: KeyValueStorage): SmartDisplayThemeId {
  return parseSmartDisplayTheme(storage.getItem(SMART_DISPLAY_THEME_STORAGE_KEY));
}

export function saveSmartDisplayTheme(
  storage: KeyValueStorage,
  theme: SmartDisplayThemeId,
): void {
  storage.setItem(SMART_DISPLAY_THEME_STORAGE_KEY, parseSmartDisplayTheme(theme));
}
