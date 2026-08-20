import {
  createManagedDisplayConfigUpdate,
  createManagedDisplayRegistration,
  createManagedDisplayRemoteConfig,
  createManagedDisplayRemoteStatus,
  type ManagedDisplayConfigUpdate,
  type ManagedDisplayEnrollment,
  type ManagedDisplayRegistration,
  type ManagedDisplayRemoteConfig,
  type ManagedDisplayRemoteStatus,
} from '../domain/managedAdminProtocol';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ManagedAdminConnection {
  readonly baseUrl: string;
  readonly adminToken: string;
}

export interface ManagedAdminClient {
  listDisplays(): Promise<readonly ManagedDisplayRemoteStatus[]>;
  registerDisplay(input: ManagedDisplayRegistration): Promise<ManagedDisplayEnrollment>;
  updateDisplayConfig(
    displayId: string,
    update: ManagedDisplayConfigUpdate,
  ): Promise<ManagedDisplayRemoteStatus>;
  revokeDisplay(displayId: string): Promise<ManagedDisplayRemoteStatus>;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value.trim());
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new RangeError('Managed administration requires HTTPS except on loopback development hosts');
  }
  if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new RangeError('Managed administration service URL may not contain credentials, query or fragment');
  }
  return url.toString().replace(/\/$/u, '');
}

function normalizeToken(value: string): string {
  const token = value.trim();
  if (token.length < 32 || token.length > 512 || !/^[A-Za-z0-9._~-]+$/u.test(token)) {
    throw new RangeError('Managed administration token must contain 32 through 512 safe characters');
  }
  return token;
}

function normalizeDisplayId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError('Display ID must be a stable lowercase-safe identifier');
  }
  return normalized;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('Managed administration service returned a non-JSON response');
  }
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Managed administration request failed with HTTP ${String(response.status)}`;
    throw new Error(message);
  }
  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRemoteStatus(value: unknown): ManagedDisplayRemoteStatus {
  if (!isRecord(value) || !isRecord(value.identity) || !isRecord(value.remoteConfig)) {
    throw new TypeError('Managed display status response is malformed');
  }
  return createManagedDisplayRemoteStatus(value as unknown as ManagedDisplayRemoteStatus);
}

function parseEnrollment(value: unknown): ManagedDisplayEnrollment {
  if (!isRecord(value) || typeof value.deviceToken !== 'string') {
    throw new TypeError('Managed display enrollment response is malformed');
  }
  if (value.deviceToken.length < 32) {
    throw new RangeError('Managed display device token is unexpectedly short');
  }
  return Object.freeze({
    display: parseRemoteStatus(value.display),
    deviceToken: value.deviceToken,
  });
}

export function createManagedAdminClient(
  connection: ManagedAdminConnection,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): ManagedAdminClient {
  const baseUrl = normalizeBaseUrl(connection.baseUrl);
  const adminToken = normalizeToken(connection.adminToken);

  const request = async (path: string, init: RequestInit = {}): Promise<unknown> => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${adminToken}`,
        ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...init.headers,
      },
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    });
    return parseJsonResponse(response);
  };

  return Object.freeze({
    async listDisplays() {
      const body = await request('/v1/admin/displays');
      if (!isRecord(body) || !Array.isArray(body.displays)) {
        throw new TypeError('Managed display list response is malformed');
      }
      return Object.freeze(body.displays.map(parseRemoteStatus));
    },

    async registerDisplay(input) {
      const registration = createManagedDisplayRegistration(input);
      const body = await request('/v1/admin/displays', {
        method: 'POST',
        body: JSON.stringify(registration),
      });
      return parseEnrollment(body);
    },

    async updateDisplayConfig(displayId, update) {
      const normalizedDisplayId = normalizeDisplayId(displayId);
      const normalizedUpdate = createManagedDisplayConfigUpdate(update);
      const body = await request(`/v1/admin/displays/${encodeURIComponent(normalizedDisplayId)}/config`, {
        method: 'PUT',
        body: JSON.stringify(normalizedUpdate),
      });
      return parseRemoteStatus(body);
    },

    async revokeDisplay(displayId) {
      const normalizedDisplayId = normalizeDisplayId(displayId);
      const body = await request(`/v1/admin/displays/${encodeURIComponent(normalizedDisplayId)}/revoke`, {
        method: 'POST',
      });
      return parseRemoteStatus(body);
    },
  });
}

export function parseManagedDeviceRemoteConfig(value: unknown): ManagedDisplayRemoteConfig {
  if (!isRecord(value)) throw new TypeError('Managed display configuration response is malformed');
  return createManagedDisplayRemoteConfig(value as unknown as ManagedDisplayRemoteConfig);
}
