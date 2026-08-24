import {
  defaultAdhanAudioPreferences,
  parseAdhanAudioPreferences,
  type AdhanAudioPreferences,
} from '../domain/adhanAudioLibrary';
import type { KeyValueStorage } from './settingsStorage';

export const ADHAN_AUDIO_PREFERENCES_STORAGE_KEY = 'salahos.adhanAudioPreferences';

export function loadAdhanAudioPreferences(storage: KeyValueStorage): AdhanAudioPreferences {
  const raw = storage.getItem(ADHAN_AUDIO_PREFERENCES_STORAGE_KEY);
  if (raw === null) return defaultAdhanAudioPreferences;

  try {
    return parseAdhanAudioPreferences(JSON.parse(raw));
  } catch {
    return defaultAdhanAudioPreferences;
  }
}

export function saveAdhanAudioPreferences(
  storage: KeyValueStorage,
  preferences: AdhanAudioPreferences,
): void {
  storage.setItem(
    ADHAN_AUDIO_PREFERENCES_STORAGE_KEY,
    JSON.stringify(parseAdhanAudioPreferences(preferences)),
  );
}
