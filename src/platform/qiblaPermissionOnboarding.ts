import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

export const QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY = 'salahos.qibla-permission-onboarding';
export const LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT =
  'salahos:location-permission-onboarding-complete';

export interface QiblaPermissionOnboardingState {
  readonly version: 2;
  /** True only when the user enabled automatic foreground location. */
  readonly completed: boolean;
  /** True after the first-run choice has been handled, including “Not now”. */
  readonly dismissed: boolean;
  readonly autoLocation: boolean;
}

const defaultState: QiblaPermissionOnboardingState = Object.freeze({
  version: 2,
  completed: false,
  dismissed: false,
  autoLocation: false,
});
const migratedExistingInstallState: QiblaPermissionOnboardingState = Object.freeze({
  version: 2,
  completed: true,
  dismissed: true,
  autoLocation: true,
});

export function loadQiblaPermissionOnboarding(
  storage: KeyValueStorage,
): QiblaPermissionOnboardingState {
  const serialized = storage.getItem(QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY);
  if (serialized === null) {
    return storage.getItem(SETTINGS_STORAGE_KEY) === null
      ? defaultState
      : migratedExistingInstallState;
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    if (parsed.version === 1 && typeof parsed.completed === 'boolean') {
      return Object.freeze({
        version: 2,
        completed: parsed.completed,
        dismissed: parsed.completed,
        autoLocation: parsed.completed,
      });
    }
    if (
      parsed.version !== 2 ||
      typeof parsed.dismissed !== 'boolean' ||
      typeof parsed.autoLocation !== 'boolean'
    ) {
      return defaultState;
    }
    return Object.freeze({
      version: 2,
      completed: parsed.autoLocation,
      dismissed: parsed.dismissed,
      autoLocation: parsed.autoLocation,
    });
  } catch {
    return defaultState;
  }
}

export function qiblaPermissionOnboardingRequired(storage: KeyValueStorage): boolean {
  return !loadQiblaPermissionOnboarding(storage).dismissed;
}

export function completeQiblaPermissionOnboarding(
  storage: KeyValueStorage,
  autoLocation = true,
): void {
  storage.setItem(
    QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
    JSON.stringify({
      version: 2,
      dismissed: true,
      autoLocation,
    }),
  );
}
