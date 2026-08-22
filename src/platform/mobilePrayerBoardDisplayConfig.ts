import {
  parsePrayerBoardTemplateConfig,
  type PrayerBoardTemplateConfig,
} from '../domain/prayerBoardTemplate';
import type { KeyValueStorage } from './settingsStorage';

export const MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY =
  'salahos.mobilePrayerBoardDisplayConfig';
export const MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT =
  'salahos:mobile-prayer-board-display-config-change';

export function loadMobilePrayerBoardDisplayConfig(
  storage: KeyValueStorage,
): PrayerBoardTemplateConfig | null {
  const serialized = storage.getItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
  if (serialized === null) return null;

  try {
    return parsePrayerBoardTemplateConfig(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export function saveMobilePrayerBoardDisplayConfig(
  storage: KeyValueStorage,
  config: PrayerBoardTemplateConfig,
): PrayerBoardTemplateConfig {
  const normalized = parsePrayerBoardTemplateConfig(config);
  storage.setItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearMobilePrayerBoardDisplayConfig(storage: KeyValueStorage): void {
  storage.removeItem(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_STORAGE_KEY);
}
