import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

export const QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY = 'salahos.qibla-permission-onboarding';

export interface QiblaPermissionOnboardingState {
  readonly version: 1;
  readonly completed: boolean;
}

const defaultState: QiblaPermissionOnboardingState = Object.freeze({
  version: 1,
  completed: false,
});
const migratedExistingInstallState: QiblaPermissionOnboardingState = Object.freeze({
  version: 1,
  completed: true,
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
    const parsed = JSON.parse(serialized) as Partial<QiblaPermissionOnboardingState>;
    if (parsed.version !== 1 || typeof parsed.completed !== 'boolean') return defaultState;
    return Object.freeze({ version: 1, completed: parsed.completed });
  } catch {
    return defaultState;
  }
}

export function qiblaPermissionOnboardingRequired(storage: KeyValueStorage): boolean {
  return !loadQiblaPermissionOnboarding(storage).completed;
}

export function completeQiblaPermissionOnboarding(storage: KeyValueStorage): void {
  storage.setItem(
    QIBLA_PERMISSION_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ version: 1, completed: true } satisfies QiblaPermissionOnboardingState),
  );
}
