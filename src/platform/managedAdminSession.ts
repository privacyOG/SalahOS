import {
  normalizeManagedServiceBaseUrl,
  normalizeManagedServiceToken,
  type ManagedAdminConnection,
} from './managedAdminTransport';

export const MANAGED_ADMIN_SESSION_CHANGE_EVENT = 'salahos:managed-admin-session-change';

let currentSession: ManagedAdminConnection | null = null;

function normalizedSession(connection: ManagedAdminConnection): ManagedAdminConnection {
  return Object.freeze({
    baseUrl: normalizeManagedServiceBaseUrl(connection.baseUrl),
    adminToken: normalizeManagedServiceToken(connection.adminToken),
  });
}

export function getManagedAdminSession(): ManagedAdminConnection | null {
  return currentSession;
}

export function setManagedAdminSession(connection: ManagedAdminConnection | null): void {
  currentSession = connection === null ? null : normalizedSession(connection);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MANAGED_ADMIN_SESSION_CHANGE_EVENT));
  }
}
