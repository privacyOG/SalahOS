import {
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import type { KeyValueStorage } from './settingsStorage';

export const PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY = 'salahos.prayerBoardDisplayConfig';
export const PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT = 'salahos:prayer-board-display-config-change';

export function loadPrayerBoardDisplayConfig(
  storage: KeyValueStorage,
): PrayerBoardTemplateConfig | null {
  const serialized = storage.getItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
  if (serialized === null) return null;

  try {
    return parsePrayerBoardTemplateConfig(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export function savePrayerBoardDisplayConfig(
  storage: KeyValueStorage,
  config: PrayerBoardTemplateConfig,
): PrayerBoardTemplateConfig {
  const normalized = parsePrayerBoardTemplateConfig(config);
  storage.setItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearPrayerBoardDisplayConfig(storage: KeyValueStorage): void {
  storage.removeItem(PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
}
