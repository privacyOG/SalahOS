import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

export const PRAYER_SETUP_ONBOARDING_STORAGE_KEY = 'salahos.prayer-setup-onboarding';
export const PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT = 'salahos:prayer-setup-onboarding-complete';

export interface PrayerSetupOnboardingState {
  readonly version: 1;
  readonly completed: boolean;
}

const firstRunState: PrayerSetupOnboardingState = Object.freeze({ version: 1, completed: false });
const migratedExistingInstallState: PrayerSetupOnboardingState = Object.freeze({
  version: 1,
  completed: true,
});

export function loadPrayerSetupOnboarding(storage: KeyValueStorage): PrayerSetupOnboardingState {
  const serialized = storage.getItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY);
  if (serialized === null) {
    return storage.getItem(SETTINGS_STORAGE_KEY) === null
      ? firstRunState
      : migratedExistingInstallState;
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    if (parsed.version !== 1 || typeof parsed.completed !== 'boolean') return firstRunState;
    return Object.freeze({ version: 1, completed: parsed.completed });
  } catch {
    return firstRunState;
  }
}

/**
 * Persist the initial state before location onboarding can create settings. This
 * preserves the second-step flow across a reload while still treating installs
 * that already had settings before v1.5.3 as migrated/completed.
 */
export function initializePrayerSetupOnboarding(
  storage: KeyValueStorage,
): PrayerSetupOnboardingState {
  const state = loadPrayerSetupOnboarding(storage);
  if (storage.getItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY) === null) {
    storage.setItem(PRAYER_SETUP_ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function prayerSetupOnboardingRequired(storage: KeyValueStorage): boolean {
  return !loadPrayerSetupOnboarding(storage).completed;
}

export function completePrayerSetupOnboarding(storage: KeyValueStorage): void {
  storage.setItem(
    PRAYER_SETUP_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ version: 1, completed: true }),
  );
}
