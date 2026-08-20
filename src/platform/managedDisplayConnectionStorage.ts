import type { KeyValueStorage } from './settingsStorage';
import {
  normalizeManagedDisplayId,
  normalizeManagedServiceBaseUrl,
  normalizeManagedServiceToken,
  type ManagedDisplayConnection,
} from './managedAdminTransport';

export const MANAGED_DISPLAY_CONNECTION_STORAGE_KEY = 'salahos.managedDisplayConnection';
export const MANAGED_DISPLAY_CONNECTION_SCHEMA_VERSION = 1;
export const MANAGED_DISPLAY_CONNECTION_CHANGE_EVENT = 'salahos:managed-display-connection-change';

interface ManagedDisplayConnectionEnvelope {
  readonly version: 1;
  readonly connection: ManagedDisplayConnection;
}

function normalizeConnection(connection: ManagedDisplayConnection): ManagedDisplayConnection {
  return Object.freeze({
    baseUrl: normalizeManagedServiceBaseUrl(connection.baseUrl),
    displayId: normalizeManagedDisplayId(connection.displayId),
    deviceToken: normalizeManagedServiceToken(connection.deviceToken),
  });
}

export function parseManagedDisplayConnection(raw: string): ManagedDisplayConnection {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Managed display connection must be an object');
  }
  if (!('version' in value) || value.version !== MANAGED_DISPLAY_CONNECTION_SCHEMA_VERSION) {
    throw new RangeError('Unsupported managed display connection schema version');
  }
  if (
    !('connection' in value) ||
    typeof value.connection !== 'object' ||
    value.connection === null
  ) {
    throw new TypeError('Managed display connection payload is missing');
  }
  const connection = value.connection as Record<string, unknown>;
  if (
    typeof connection.baseUrl !== 'string' ||
    typeof connection.displayId !== 'string' ||
    typeof connection.deviceToken !== 'string'
  ) {
    throw new TypeError('Managed display connection fields are invalid');
  }
  return normalizeConnection({
    baseUrl: connection.baseUrl,
    displayId: connection.displayId,
    deviceToken: connection.deviceToken,
  });
}

export function serializeManagedDisplayConnection(connection: ManagedDisplayConnection): string {
  const envelope: ManagedDisplayConnectionEnvelope = {
    version: MANAGED_DISPLAY_CONNECTION_SCHEMA_VERSION,
    connection: normalizeConnection(connection),
  };
  return JSON.stringify(envelope);
}

export function loadManagedDisplayConnection(
  storage: KeyValueStorage,
): ManagedDisplayConnection | null {
  const raw = storage.getItem(MANAGED_DISPLAY_CONNECTION_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return parseManagedDisplayConnection(raw);
  } catch {
    return null;
  }
}

export function saveManagedDisplayConnection(
  storage: KeyValueStorage,
  connection: ManagedDisplayConnection,
): void {
  storage.setItem(
    MANAGED_DISPLAY_CONNECTION_STORAGE_KEY,
    serializeManagedDisplayConnection(connection),
  );
}

export function clearManagedDisplayConnection(storage: KeyValueStorage): void {
  storage.removeItem(MANAGED_DISPLAY_CONNECTION_STORAGE_KEY);
}
