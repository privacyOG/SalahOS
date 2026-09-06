import { SETTINGS_STORAGE_KEY, type KeyValueStorage } from './settingsStorage';

export const NOTIFICATION_ONBOARDING_STORAGE_KEY = 'salahos.notification-onboarding';
export const NOTIFICATION_ONBOARDING_COMPLETE_EVENT = 'salahos:notification-onboarding-complete';
export const NOTIFICATION_ONBOARDING_OPEN_EVENT = 'salahos:notification-onboarding-open';

export type NotificationOnboardingDecision = 'enabled' | 'declined';

export interface NotificationOnboardingState {
  readonly version: 1;
  readonly completed: boolean;
  readonly decision: NotificationOnboardingDecision | null;
}

const firstRunState: NotificationOnboardingState = Object.freeze({
  version: 1,
  completed: false,
  decision: null,
});
const migratedExistingInstallState: NotificationOnboardingState = Object.freeze({
  version: 1,
  completed: true,
  decision: null,
});

function parseDecision(value: unknown): NotificationOnboardingDecision | null {
  return value === 'enabled' || value === 'declined' ? value : null;
}

export function loadNotificationOnboarding(storage: KeyValueStorage): NotificationOnboardingState {
  const serialized = storage.getItem(NOTIFICATION_ONBOARDING_STORAGE_KEY);
  if (serialized === null) {
    return storage.getItem(SETTINGS_STORAGE_KEY) === null
      ? firstRunState
      : migratedExistingInstallState;
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    if (parsed.version !== 1 || typeof parsed.completed !== 'boolean') return firstRunState;
    return Object.freeze({
      version: 1,
      completed: parsed.completed,
      decision: parseDecision(parsed.decision),
    });
  } catch {
    return firstRunState;
  }
}

/** Initialize before location onboarding can persist settings, preserving first-run sequencing. */
export function initializeNotificationOnboarding(
  storage: KeyValueStorage,
): NotificationOnboardingState {
  const state = loadNotificationOnboarding(storage);
  if (storage.getItem(NOTIFICATION_ONBOARDING_STORAGE_KEY) === null) {
    storage.setItem(NOTIFICATION_ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function notificationOnboardingRequired(storage: KeyValueStorage): boolean {
  return !loadNotificationOnboarding(storage).completed;
}

export function completeNotificationOnboarding(
  storage: KeyValueStorage,
  decision: NotificationOnboardingDecision,
): void {
  storage.setItem(
    NOTIFICATION_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ version: 1, completed: true, decision }),
  );
}
