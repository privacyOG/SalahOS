import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 8787;
const STATE_VERSION = 1;
const MAX_BODY_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 120;
const DISPLAY_STALE_MS = 2 * 60_000;
const DISPLAY_OFFLINE_MS = 10 * 60_000;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const THEME_IDS = new Set(['classic', 'midnight', 'sandstone', 'emerald']);

function normalizeIdentifier(value, label) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 160 || !ID_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function normalizeNullableIdentifier(value, label) {
  return value === null ? null : normalizeIdentifier(value, label);
}

function normalizeOrientation(value) {
  if (value !== 'landscape' && value !== 'portrait') {
    throw new RangeError('Display orientation must be landscape or portrait');
  }
  return value;
}

function normalizeTheme(value) {
  if (typeof value !== 'string' || !THEME_IDS.has(value)) {
    throw new RangeError('Display theme is unsupported');
  }
  return value;
}

function normalizeRevision(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function normalizeVersion(value) {
  if (typeof value !== 'string' || !VERSION_PATTERN.test(value.trim())) {
    throw new RangeError('App version must use semantic version format');
  }
  return value.trim();
}

function normalizeTimestamp(value, label) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const parsed = new Date(value);
  if (!value.endsWith('Z') || !Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function normalizeRegistration(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Display registration must be an object');
  }
  return Object.freeze({
    displayId: normalizeIdentifier(value.displayId, 'Display ID'),
    organizationId: normalizeIdentifier(value.organizationId, 'Organization ID'),
    mosqueId: normalizeIdentifier(value.mosqueId, 'Mosque ID'),
    locationId: normalizeIdentifier(value.locationId, 'Location ID'),
    orientation: normalizeOrientation(value.orientation),
    resolutionProfile: normalizeIdentifier(value.resolutionProfile, 'Resolution profile'),
    playlistId: normalizeNullableIdentifier(value.playlistId, 'Playlist ID'),
  });
}

function normalizeConfigUpdate(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Display configuration update must be an object');
  }
  const expectedRevision = normalizeRevision(value.expectedRevision, 'Expected revision');
  const contentRevision = normalizeRevision(value.contentRevision, 'Content revision');
  if (contentRevision <= expectedRevision) {
    throw new RangeError('Content revision must advance beyond expected revision');
  }
  return Object.freeze({
    expectedRevision,
    contentRevision,
    playlistId: normalizeNullableIdentifier(value.playlistId, 'Playlist ID'),
    displayTheme: normalizeTheme(value.displayTheme),
  });
}

function normalizeHeartbeat(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Display heartbeat must be an object');
  }
  return Object.freeze({
    displayId: normalizeIdentifier(value.displayId, 'Display ID'),
    appVersion: normalizeVersion(value.appVersion),
    contentRevision: normalizeRevision(value.contentRevision, 'Reported content revision'),
    seenAt: normalizeTimestamp(value.seenAt, 'Heartbeat seenAt'),
  });
}

function hashToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function secureTokenEquals(left, right) {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function bearerToken(request) {
  const header = request.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function newDeviceToken() {
  return randomBytes(32).toString('base64url');
}

function emptyState() {
  return { version: STATE_VERSION, displays: {} };
}

function validatePersistedState(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    value.version !== STATE_VERSION ||
    typeof value.displays !== 'object' ||
    value.displays === null ||
    Array.isArray(value.displays)
  ) {
    throw new RangeError('Managed administration state file is invalid');
  }
  const displays = {};
  for (const [key, entry] of Object.entries(value.displays)) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new RangeError('Managed display state entry is invalid');
    }
    const identity = normalizeRegistration(entry.identity);
    if (identity.displayId !== normalizeIdentifier(key, 'Display state key')) {
      throw new RangeError('Managed display state key does not match identity');
    }
    if (typeof entry.deviceTokenHash !== 'string' || !/^[0-9a-f]{64}$/u.test(entry.deviceTokenHash)) {
      throw new RangeError('Managed display token hash is invalid');
    }
    const remoteConfig = entry.remoteConfig;
    if (typeof remoteConfig !== 'object' || remoteConfig === null || Array.isArray(remoteConfig)) {
      throw new RangeError('Managed display remote configuration is invalid');
    }
    const updatedAt = normalizeTimestamp(remoteConfig.updatedAt, 'Configuration updatedAt');
    displays[identity.displayId] = {
      identity,
      deviceTokenHash: entry.deviceTokenHash,
      lastSeenAt:
        entry.lastSeenAt === null
          ? null
          : normalizeTimestamp(entry.lastSeenAt, 'Display lastSeenAt'),
      appVersion: entry.appVersion === null ? null : normalizeVersion(entry.appVersion),
      reportedContentRevision: normalizeRevision(
        entry.reportedContentRevision,
        'Reported content revision',
      ),
      remoteConfig: {
        displayId: identity.displayId,
        contentRevision: normalizeRevision(remoteConfig.contentRevision, 'Remote content revision'),
        playlistId: normalizeNullableIdentifier(remoteConfig.playlistId, 'Playlist ID'),
        displayTheme: normalizeTheme(remoteConfig.displayTheme),
        revoked: Boolean(remoteConfig.revoked),
        updatedAt,
      },
    };
  }
  return { version: STATE_VERSION, displays };
}

async function loadState(path) {
  try {
    return validatePersistedState(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyState();
    throw error;
  }
}

async function persistState(path, state) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, path);
}

function syncStateFor(entry, nowMs) {
  if (entry.remoteConfig.revoked) return 'revoked';
  if (entry.lastSeenAt === null) return 'offline';
  const age = nowMs - new Date(entry.lastSeenAt).getTime();
  if (age >= DISPLAY_OFFLINE_MS) return 'offline';
  if (age >= DISPLAY_STALE_MS) return 'stale';
  if (entry.reportedContentRevision < entry.remoteConfig.contentRevision) return 'syncing';
  return 'current';
}

function publicStatus(entry, nowMs) {
  return {
    identity: entry.identity,
    lastSeenAt: entry.lastSeenAt,
    appVersion: entry.appVersion,
    reportedContentRevision: entry.reportedContentRevision,
    syncState: syncStateFor(entry, nowMs),
    remoteConfig: entry.remoteConfig,
  };
}

function json(response, status, body, corsOrigin = null) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    ...(corsOrigin === null
      ? {}
      : {
          'access-control-allow-origin': corsOrigin,
          vary: 'origin',
        }),
  });
  response.end(payload);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new RangeError('Request body exceeds 64 KiB');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new SyntaxError('Request body must contain valid JSON');
    error.statusCode = 400;
    throw error;
  }
}

function clientAddress(request) {
  return request.socket.remoteAddress ?? 'unknown';
}

function createRateLimiter() {
  const buckets = new Map();
  return (request, nowMs) => {
    const key = clientAddress(request);
    const current = buckets.get(key);
    if (current === undefined || nowMs - current.startedAt >= RATE_WINDOW_MS) {
      buckets.set(key, { startedAt: nowMs, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= RATE_LIMIT;
  };
}

function allowedCorsOrigin(request, configuredOrigin) {
  if (configuredOrigin === null) return null;
  const origin = request.headers.origin;
  return origin === configuredOrigin ? origin : null;
}

function requireAdmin(request, adminToken) {
  const provided = bearerToken(request);
  if (provided === null || !secureTokenEquals(provided, adminToken)) {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
}

function requireDevice(request, entry) {
  const provided = bearerToken(request);
  if (provided === null || !secureTokenEquals(hashToken(provided), entry.deviceTokenHash)) {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
}

export async function createManagedAdminService(options) {
  const adminToken = String(options.adminToken ?? '').trim();
  if (adminToken.length < 32 || adminToken.length > 512) {
    throw new RangeError('Admin token must contain 32 through 512 characters');
  }
  const statePath = resolve(options.statePath);
  const allowedOrigin = options.allowedOrigin === undefined ? null : options.allowedOrigin;
  if (allowedOrigin !== null) {
    const parsed = new URL(allowedOrigin);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.origin !== allowedOrigin) {
      throw new RangeError('Allowed admin origin must be an absolute HTTP(S) origin');
    }
  }

  let state = await loadState(statePath);
  let mutation = Promise.resolve();
  const limitRequest = createRateLimiter();

  const mutate = async (fn) => {
    let result;
    mutation = mutation.then(async () => {
      result = await fn(state);
      await persistState(statePath, state);
    });
    await mutation;
    return result;
  };

  const handler = async (request, response) => {
    const now = new Date();
    const nowMs = now.getTime();
    const corsOrigin = allowedCorsOrigin(request, allowedOrigin);

    if (!limitRequest(request, nowMs)) {
      json(response, 429, { error: 'Rate limit exceeded' }, corsOrigin);
      return;
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        ...(corsOrigin === null ? {} : { 'access-control-allow-origin': corsOrigin }),
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
        'access-control-max-age': '600',
        vary: 'origin',
      });
      response.end();
      return;
    }

    try {
      const url = new URL(request.url ?? '/', 'http://localhost');

      if (request.method === 'GET' && url.pathname === '/health') {
        json(response, 200, { status: 'ok' }, corsOrigin);
        return;
      }

      if (url.pathname.startsWith('/v1/admin/')) {
        requireAdmin(request, adminToken);
      }

      if (request.method === 'GET' && url.pathname === '/v1/admin/displays') {
        const displays = Object.values(state.displays)
          .map((entry) => publicStatus(entry, nowMs))
          .sort((left, right) => left.identity.displayId.localeCompare(right.identity.displayId));
        json(response, 200, { displays }, corsOrigin);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/admin/displays') {
        const identity = normalizeRegistration(await readJsonBody(request));
        if (state.displays[identity.displayId] !== undefined) {
          const error = new Error('Display already exists');
          error.statusCode = 409;
          throw error;
        }
        const deviceToken = newDeviceToken();
        const entry = {
          identity,
          deviceTokenHash: hashToken(deviceToken),
          lastSeenAt: null,
          appVersion: null,
          reportedContentRevision: 0,
          remoteConfig: {
            displayId: identity.displayId,
            contentRevision: 0,
            playlistId: identity.playlistId,
            displayTheme: 'classic',
            revoked: false,
            updatedAt: now.toISOString(),
          },
        };
        await mutate(async (current) => {
          current.displays[identity.displayId] = entry;
        });
        json(response, 201, { display: publicStatus(entry, nowMs), deviceToken }, corsOrigin);
        return;
      }

      const configMatch = /^\/v1\/admin\/displays\/([^/]+)\/config$/u.exec(url.pathname);
      if (request.method === 'PUT' && configMatch !== null) {
        const displayId = normalizeIdentifier(decodeURIComponent(configMatch[1]), 'Display ID');
        const update = normalizeConfigUpdate(await readJsonBody(request));
        const entry = state.displays[displayId];
        if (entry === undefined) {
          const error = new Error('Display not found');
          error.statusCode = 404;
          throw error;
        }
        if (entry.remoteConfig.contentRevision !== update.expectedRevision) {
          const error = new Error('Display configuration revision conflict');
          error.statusCode = 409;
          throw error;
        }
        await mutate(async () => {
          entry.remoteConfig = {
            ...entry.remoteConfig,
            contentRevision: update.contentRevision,
            playlistId: update.playlistId,
            displayTheme: update.displayTheme,
            updatedAt: now.toISOString(),
          };
        });
        json(response, 200, publicStatus(entry, nowMs), corsOrigin);
        return;
      }

      const revokeMatch = /^\/v1\/admin\/displays\/([^/]+)\/revoke$/u.exec(url.pathname);
      if (request.method === 'POST' && revokeMatch !== null) {
        const displayId = normalizeIdentifier(decodeURIComponent(revokeMatch[1]), 'Display ID');
        const entry = state.displays[displayId];
        if (entry === undefined) {
          const error = new Error('Display not found');
          error.statusCode = 404;
          throw error;
        }
        await mutate(async () => {
          entry.remoteConfig = {
            ...entry.remoteConfig,
            revoked: true,
            updatedAt: now.toISOString(),
          };
        });
        json(response, 200, publicStatus(entry, nowMs), corsOrigin);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/v1/device/config') {
        const displayId = normalizeIdentifier(url.searchParams.get('displayId') ?? '', 'Display ID');
        const entry = state.displays[displayId];
        if (entry === undefined) {
          const error = new Error('Display not found');
          error.statusCode = 404;
          throw error;
        }
        requireDevice(request, entry);
        json(response, 200, entry.remoteConfig, corsOrigin);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/device/heartbeat') {
        const heartbeat = normalizeHeartbeat(await readJsonBody(request));
        const entry = state.displays[heartbeat.displayId];
        if (entry === undefined) {
          const error = new Error('Display not found');
          error.statusCode = 404;
          throw error;
        }
        requireDevice(request, entry);
        if (entry.remoteConfig.revoked) {
          const error = new Error('Display has been revoked');
          error.statusCode = 403;
          throw error;
        }
        await mutate(async () => {
          entry.lastSeenAt = heartbeat.seenAt;
          entry.appVersion = heartbeat.appVersion;
          entry.reportedContentRevision = heartbeat.contentRevision;
        });
        json(response, 200, publicStatus(entry, nowMs), corsOrigin);
        return;
      }

      json(response, 404, { error: 'Not found' }, corsOrigin);
    } catch (error) {
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : error instanceof RangeError || error instanceof TypeError || error instanceof SyntaxError ? 400 : 500;
      json(response, status, { error: status === 500 ? 'Internal service error' : error.message }, corsOrigin);
    }
  };

  return Object.freeze({
    statePath,
    handler,
    createHttpServer() {
      return createServer((request, response) => {
        void handler(request, response);
      });
    },
  });
}

export async function startManagedAdminServiceFromEnvironment(env = process.env) {
  const root = dirname(fileURLToPath(import.meta.url));
  const statePath = env.SALAHOS_MANAGED_STATE_PATH ?? resolve(root, '.state', 'managed-admin.json');
  const service = await createManagedAdminService({
    adminToken: env.SALAHOS_ADMIN_TOKEN,
    statePath,
    allowedOrigin: env.SALAHOS_ADMIN_ORIGIN,
  });
  const port = Number(env.SALAHOS_MANAGED_PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError('SALAHOS_MANAGED_PORT must be an integer TCP port');
  }
  const host = env.SALAHOS_MANAGED_HOST ?? '127.0.0.1';
  const server = service.createHttpServer();
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolvePromise);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await startManagedAdminServiceFromEnvironment();
    console.log('SalahOS managed administration service started.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
