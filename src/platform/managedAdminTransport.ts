import {
  createManagedDisplayConfigUpdate,
  createManagedDisplayHeartbeat,
  createManagedDisplayRegistration,
  createManagedDisplayRemoteConfig,
  createManagedDisplayRemoteStatus,
  type ManagedDisplayConfigUpdate,
  type ManagedDisplayEnrollment,
  type ManagedDisplayHeartbeat,
  type ManagedDisplayRegistration,
  type ManagedDisplayRemoteConfig,
  type ManagedDisplayRemoteStatus,
} from '../domain/managedAdminProtocol';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ManagedAdminConnection {
  readonly baseUrl: string;
  readonly adminToken: string;
}

export interface ManagedDisplayConnection {
  readonly baseUrl: string;
  readonly displayId: string;
  readonly deviceToken: string;
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

export interface ManagedDisplayClient {
  readonly displayId: string;
  getConfig(): Promise<ManagedDisplayRemoteConfig>;
  heartbeat(
    input: Omit<ManagedDisplayHeartbeat, 'displayId'>,
  ): Promise<ManagedDisplayRemoteStatus>;
}

export function normalizeManagedServiceBaseUrl(value: string): string {
  const url = new URL(value.trim());
  const loopback =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new RangeError('Managed administration requires HTTPS except on loopback development hosts');
  }
  if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new RangeError(
      'Managed administration service URL may not contain credentials, query or fragment',
    );
  }
  return url.toString().replace(/\/$/u, '');
}

export function normalizeManagedServiceToken(value: string): string {
  const token = value.trim();
  if (token.length < 32 || token.length > 512 || !/^[A-Za-z0-9._~-]+$/u.test(token)) {
    throw new RangeError('Managed administration token must contain 32 through 512 safe characters');
  }
  return token;
}

export function normalizeManagedDisplayId(value: string): string {
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

function createAuthorizedRequest(
  baseUrl: string,
  token: string,
  fetchImpl: FetchLike,
): (path: string, init?: RequestInit) => Promise<unknown> {
  return async (path, init = {}) => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
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
}

export function createManagedAdminClient(
  connection: ManagedAdminConnection,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): ManagedAdminClient {
  const baseUrl = normalizeManagedServiceBaseUrl(connection.baseUrl);
  const adminToken = normalizeManagedServiceToken(connection.adminToken);
  const request = createAuthorizedRequest(baseUrl, adminToken, fetchImpl);

  return Object.freeze({
    async listDisplays() {
      const body = await request('/v1/admin/displays');
      if (!isRecord(body) || !Array.isArray(body.displays)) {
        throw new TypeError('Managed display list response is malformed');
      }
      return Object.freeze(body.displays.map(parseRemoteStatus));
    },

    async registerDisplay(input: ManagedDisplayRegistration) {
      const registration = createManagedDisplayRegistration(input);
      const body = await request('/v1/admin/displays', {
        method: 'POST',
        body: JSON.stringify(registration),
      });
      return parseEnrollment(body);
    },

    async updateDisplayConfig(displayId: string, update: ManagedDisplayConfigUpdate) {
      const normalizedDisplayId = normalizeManagedDisplayId(displayId);
      const normalizedUpdate = createManagedDisplayConfigUpdate(update);
      const body = await request(
        `/v1/admin/displays/${encodeURIComponent(normalizedDisplayId)}/config`,
        {
          method: 'PUT',
          body: JSON.stringify(normalizedUpdate),
        },
      );
      return parseRemoteStatus(body);
    },

    async revokeDisplay(displayId: string) {
      const normalizedDisplayId = normalizeManagedDisplayId(displayId);
      const body = await request(
        `/v1/admin/displays/${encodeURIComponent(normalizedDisplayId)}/revoke`,
        { method: 'POST' },
      );
      return parseRemoteStatus(body);
    },
  });
}

export function createManagedDisplayClient(
  connection: ManagedDisplayConnection,
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): ManagedDisplayClient {
  const baseUrl = normalizeManagedServiceBaseUrl(connection.baseUrl);
  const displayId = normalizeManagedDisplayId(connection.displayId);
  const deviceToken = normalizeManagedServiceToken(connection.deviceToken);
  const request = createAuthorizedRequest(baseUrl, deviceToken, fetchImpl);

  return Object.freeze({
    displayId,
    async getConfig() {
      const body = await request(`/v1/device/config?displayId=${encodeURIComponent(displayId)}`);
      return parseManagedDeviceRemoteConfig(body);
    },
    async heartbeat(input: Omit<ManagedDisplayHeartbeat, 'displayId'>) {
      const heartbeat = createManagedDisplayHeartbeat({ ...input, displayId });
      const body = await request('/v1/device/heartbeat', {
        method: 'POST',
        body: JSON.stringify(heartbeat),
      });
      return parseRemoteStatus(body);
    },
  });
}

export function parseManagedDeviceRemoteConfig(value: unknown): ManagedDisplayRemoteConfig {
  if (!isRecord(value)) throw new TypeError('Managed display configuration response is malformed');
  return createManagedDisplayRemoteConfig(value as unknown as ManagedDisplayRemoteConfig);
}
