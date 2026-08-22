import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 8787;
const STATE_VERSION = 2;
const MAX_BODY_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 120;
const DISPLAY_STALE_MS = 2 * 60_000;
const DISPLAY_OFFLINE_MS = 10 * 60_000;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;
const EXACT_PROFILE_PATTERN = /^(\d{3,4})x(\d{3,4})$/u;
const THEME_IDS = new Set(['classic', 'midnight', 'sandstone', 'emerald']);
const TEMPLATE_IDS = new Set([
  'heritage-classic',
  'minimal-modern',
  'bold-countdown-focus',
  'structured-split-board',
  'scenic-spiritual',
  'family-classroom',
]);
const LOCALES = new Set(['en', 'ar', 'tr', 'id']);
const ACCENT_PRESETS = new Set(['emerald', 'midnight', 'sandstone', 'neutral', 'jewel']);
const MODULE_IDS = [
  'current-time',
  'dates',
  'next-prayer',
  'countdown',
  'prayer-timetable',
  'jumuah',
  'sunrise-sunset',
  'mosque-branding',
  'announcements',
  'weather',
];
const CORE_MODULES = new Set(['current-time', 'next-prayer', 'countdown', 'prayer-timetable']);
const FALLBACK_ARTWORK = {
  'heritage-classic': 'geometric-heritage',
  'minimal-modern': 'quiet-grid',
  'bold-countdown-focus': 'countdown-field',
  'structured-split-board': 'structured-lines',
  'scenic-spiritual': 'scenic-gradient',
  'family-classroom': 'classroom-pattern',
};

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
  if (
    !value.endsWith('Z') ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString() !== value
  ) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

function normalizeTemplateId(value) {
  if (typeof value !== 'string' || !TEMPLATE_IDS.has(value)) {
    throw new RangeError('Prayer-board template is unsupported');
  }
  return value;
}

function accentForTheme(theme) {
  switch (theme) {
    case 'midnight':
      return 'midnight';
    case 'sandstone':
      return 'sandstone';
    case 'emerald':
      return 'emerald';
    case 'classic':
    default:
      return 'neutral';
  }
}

function themeForPrayerBoardConfig(config) {
  switch (config.accentPreset) {
    case 'midnight':
      return 'midnight';
    case 'sandstone':
      return 'sandstone';
    case 'emerald':
    case 'jewel':
      return 'emerald';
    case 'neutral':
    default:
      return 'classic';
  }
}

function normalizeMosqueNames(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const names = {};
  for (const locale of LOCALES) {
    const raw = value[locale];
    if (typeof raw !== 'string') continue;
    const text = raw.trim().replace(/\s+/gu, ' ');
    if (text.length > 0 && text.length <= 160) names[locale] = text;
  }
  return Object.keys(names).length === 0 ? null : names;
}

function normalizePrayerBoardConfig(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || value.version !== 1) {
    throw new RangeError('Prayer-board configuration must use version 1');
  }
  const templateId = normalizeTemplateId(value.templateId);
  if (typeof value.primaryLocale !== 'string' || !LOCALES.has(value.primaryLocale)) {
    throw new RangeError('Prayer-board locale is unsupported');
  }
  if (value.languageMode !== 'single' && value.languageMode !== 'en-ar') {
    throw new RangeError('Prayer-board language mode is unsupported');
  }
  if (value.timeFormat !== 'h12' && value.timeFormat !== 'h23') {
    throw new RangeError('Prayer-board time format is unsupported');
  }
  if (typeof value.accentPreset !== 'string' || !ACCENT_PRESETS.has(value.accentPreset)) {
    throw new RangeError('Prayer-board accent preset is unsupported');
  }
  const requestedModules =
    typeof value.moduleVisibility === 'object' &&
    value.moduleVisibility !== null &&
    !Array.isArray(value.moduleVisibility)
      ? value.moduleVisibility
      : {};
  const moduleVisibility = {};
  for (const moduleId of MODULE_IDS) {
    moduleVisibility[moduleId] =
      CORE_MODULES.has(moduleId) ||
      (typeof requestedModules[moduleId] === 'boolean'
        ? requestedModules[moduleId]
        : moduleId !== 'weather');
  }
  const branding =
    typeof value.branding === 'object' && value.branding !== null && !Array.isArray(value.branding)
      ? value.branding
      : {};

  return Object.freeze({
    version: 1,
    templateId,
    primaryLocale: value.primaryLocale,
    languageMode: value.languageMode,
    timeFormat: value.timeFormat,
    accentPreset: value.accentPreset,
    moduleVisibility: Object.freeze(moduleVisibility),
    branding: Object.freeze({
      mosqueName: normalizeMosqueNames(branding.mosqueName),
      logo: null,
    }),
    background: Object.freeze({
      kind: 'builtin',
      artworkId: FALLBACK_ARTWORK[templateId],
    }),
  });
}

function defaultPrayerBoardConfig(theme = 'classic') {
  const displayTheme = normalizeTheme(theme);
  return normalizePrayerBoardConfig({
    version: 1,
    templateId: 'heritage-classic',
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: accentForTheme(displayTheme),
    moduleVisibility: {},
    branding: { mosqueName: null, logo: null },
    background: { kind: 'builtin', artworkId: 'geometric-heritage' },
  });
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
  const prayerBoardConfigSpecified = Object.prototype.hasOwnProperty.call(
    value,
    'prayerBoardConfig',
  );
  return Object.freeze({
    expectedRevision,
    contentRevision,
    playlistId: normalizeNullableIdentifier(value.playlistId, 'Playlist ID'),
    displayTheme: normalizeTheme(value.displayTheme),
    prayerBoardConfigSpecified,
    prayerBoardConfig:
      !prayerBoardConfigSpecified || value.prayerBoardConfig === null
        ? null
        : normalizePrayerBoardConfig(value.prayerBoardConfig),
  });
}

function normalizeMosqueDefaultUpdate(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Mosque prayer-board update must be an object');
  }
  const expectedRevision = normalizeRevision(value.expectedRevision, 'Expected mosque revision');
  const revision = normalizeRevision(value.revision, 'Mosque prayer-board revision');
  if (revision <= expectedRevision) {
    throw new RangeError('Mosque prayer-board revision must advance beyond expected revision');
  }
  return Object.freeze({
    expectedRevision,
    revision,
    prayerBoardConfig: normalizePrayerBoardConfig(value.prayerBoardConfig),
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
    prayerBoardTemplateId:
      value.prayerBoardTemplateId === undefined
        ? null
        : normalizeTemplateId(value.prayerBoardTemplateId),
    seenAt: normalizeTimestamp(value.seenAt, 'Heartbeat seenAt'),
  });
}

function targetDimensions(identity) {
  const exact = EXACT_PROFILE_PATTERN.exec(identity.resolutionProfile);
  if (exact !== null) {
    return [Number(exact[1]), Number(exact[2])];
  }
  switch (identity.resolutionProfile) {
    case 'tv-16x9':
    case 'tv-1080p':
      return [1920, 1080];
    case 'tv-4k':
      return [3840, 2160];
    case 'portrait-foyer':
      return [1080, 1920];
    case 'touch-display-2':
      return identity.orientation === 'landscape' ? [1280, 720] : [720, 1280];
    default:
      return null;
  }
}

function prayerBoardTargetSupported(identity) {
  if (identity.orientation !== 'landscape') return false;
  const dimensions = targetDimensions(identity);
  if (dimensions === null) return false;
  return (
    (dimensions[0] === 1920 && dimensions[1] === 1080) ||
    (dimensions[0] === 3840 && dimensions[1] === 2160)
  );
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
  return { version: STATE_VERSION, displays: {}, mosqueDefaults: {} };
}

function normalizeAssignmentSource(value) {
  return value === 'mosque-default' || value === 'display-override' ? value : 'service-default';
}

function validatePersistedState(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (value.version !== 1 && value.version !== STATE_VERSION) ||
    typeof value.displays !== 'object' ||
    value.displays === null ||
    Array.isArray(value.displays)
  ) {
    throw new RangeError('Managed administration state file is invalid');
  }

  const mosqueDefaults = {};
  const rawMosqueDefaults =
    value.version === STATE_VERSION &&
    typeof value.mosqueDefaults === 'object' &&
    value.mosqueDefaults !== null &&
    !Array.isArray(value.mosqueDefaults)
      ? value.mosqueDefaults
      : {};
  for (const [key, entry] of Object.entries(rawMosqueDefaults)) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new RangeError('Managed mosque prayer-board state entry is invalid');
    }
    const mosqueId = normalizeIdentifier(entry.mosqueId, 'Mosque ID');
    if (mosqueId !== normalizeIdentifier(key, 'Mosque default state key')) {
      throw new RangeError('Mosque default state key does not match mosque ID');
    }
    mosqueDefaults[mosqueId] = {
      mosqueId,
      revision: normalizeRevision(entry.revision, 'Mosque prayer-board revision'),
      prayerBoardConfig: normalizePrayerBoardConfig(entry.prayerBoardConfig),
      updatedAt: normalizeTimestamp(entry.updatedAt, 'Mosque prayer-board updatedAt'),
    };
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
    if (
      typeof entry.deviceTokenHash !== 'string' ||
      !/^[0-9a-f]{64}$/u.test(entry.deviceTokenHash)
    ) {
      throw new RangeError('Managed display token hash is invalid');
    }
    const remoteConfig = entry.remoteConfig;
    if (typeof remoteConfig !== 'object' || remoteConfig === null || Array.isArray(remoteConfig)) {
      throw new RangeError('Managed display remote configuration is invalid');
    }
    const displayTheme = normalizeTheme(remoteConfig.displayTheme);
    const migratedPrayerBoardConfig =
      remoteConfig.prayerBoardConfig === undefined
        ? defaultPrayerBoardConfig(displayTheme)
        : normalizePrayerBoardConfig(remoteConfig.prayerBoardConfig);
    const serviceDefaultPrayerBoardConfig =
      entry.serviceDefaultPrayerBoardConfig === undefined
        ? migratedPrayerBoardConfig
        : normalizePrayerBoardConfig(entry.serviceDefaultPrayerBoardConfig);
    const prayerBoardOverride =
      entry.prayerBoardOverride === undefined || entry.prayerBoardOverride === null
        ? null
        : normalizePrayerBoardConfig(entry.prayerBoardOverride);

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
      reportedPrayerBoardTemplateId:
        entry.reportedPrayerBoardTemplateId === undefined ||
        entry.reportedPrayerBoardTemplateId === null
          ? null
          : normalizeTemplateId(entry.reportedPrayerBoardTemplateId),
      prayerBoardOverride,
      serviceDefaultPrayerBoardConfig,
      remoteConfig: {
        displayId: identity.displayId,
        contentRevision: normalizeRevision(remoteConfig.contentRevision, 'Remote content revision'),
        playlistId: normalizeNullableIdentifier(remoteConfig.playlistId, 'Playlist ID'),
        displayTheme,
        prayerBoardConfig: migratedPrayerBoardConfig,
        prayerBoardAssignment: normalizeAssignmentSource(remoteConfig.prayerBoardAssignment),
        revoked: Boolean(remoteConfig.revoked),
        updatedAt: normalizeTimestamp(remoteConfig.updatedAt, 'Configuration updatedAt'),
      },
    };
  }
  return { version: STATE_VERSION, displays, mosqueDefaults };
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

function effectivePrayerBoardAssignment(state, entry) {
  if (entry.prayerBoardOverride !== null) {
    return { source: 'display-override', config: entry.prayerBoardOverride };
  }
  const mosqueDefault = state.mosqueDefaults[entry.identity.mosqueId];
  if (mosqueDefault !== undefined && prayerBoardTargetSupported(entry.identity)) {
    return { source: 'mosque-default', config: mosqueDefault.prayerBoardConfig };
  }
  return { source: 'service-default', config: entry.serviceDefaultPrayerBoardConfig };
}

function synchronizeEffectivePrayerBoard(state, entry, updatedAt, bumpRevision) {
  const assignment = effectivePrayerBoardAssignment(state, entry);
  entry.remoteConfig = {
    ...entry.remoteConfig,
    contentRevision: bumpRevision
      ? entry.remoteConfig.contentRevision + 1
      : entry.remoteConfig.contentRevision,
    displayTheme: themeForPrayerBoardConfig(assignment.config),
    prayerBoardConfig: assignment.config,
    prayerBoardAssignment: assignment.source,
    updatedAt,
  };
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

function publicStatus(state, entry, nowMs) {
  const assignment = effectivePrayerBoardAssignment(state, entry);
  const remoteConfig = {
    ...entry.remoteConfig,
    displayTheme: themeForPrayerBoardConfig(assignment.config),
    prayerBoardConfig: assignment.config,
    prayerBoardAssignment: assignment.source,
  };
  return {
    identity: entry.identity,
    lastSeenAt: entry.lastSeenAt,
    appVersion: entry.appVersion,
    reportedContentRevision: entry.reportedContentRevision,
    reportedPrayerBoardTemplateId: entry.reportedPrayerBoardTemplateId,
    syncState: syncStateFor(entry, nowMs),
    remoteConfig,
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
          .map((entry) => publicStatus(state, entry, nowMs))
          .sort((left, right) => left.identity.displayId.localeCompare(right.identity.displayId));
        json(response, 200, { displays }, corsOrigin);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/v1/admin/mosque-defaults') {
        const defaults = Object.values(state.mosqueDefaults).sort((left, right) =>
          left.mosqueId.localeCompare(right.mosqueId),
        );
        json(response, 200, { defaults }, corsOrigin);
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
        const serviceDefaultPrayerBoardConfig = defaultPrayerBoardConfig('classic');
        const entry = {
          identity,
          deviceTokenHash: hashToken(deviceToken),
          lastSeenAt: null,
          appVersion: null,
          reportedContentRevision: 0,
          reportedPrayerBoardTemplateId: null,
          prayerBoardOverride: null,
          serviceDefaultPrayerBoardConfig,
          remoteConfig: {
            displayId: identity.displayId,
            contentRevision: 0,
            playlistId: identity.playlistId,
            displayTheme: 'classic',
            prayerBoardConfig: serviceDefaultPrayerBoardConfig,
            prayerBoardAssignment: 'service-default',
            revoked: false,
            updatedAt: now.toISOString(),
          },
        };
        await mutate(async (current) => {
          current.displays[identity.displayId] = entry;
          synchronizeEffectivePrayerBoard(current, entry, now.toISOString(), false);
        });
        json(
          response,
          201,
          { display: publicStatus(state, entry, nowMs), deviceToken },
          corsOrigin,
        );
        return;
      }

      const mosqueDefaultMatch = /^\/v1\/admin\/mosques\/([^/]+)\/prayer-board-default$/u.exec(
        url.pathname,
      );
      if (request.method === 'PUT' && mosqueDefaultMatch !== null) {
        const mosqueId = normalizeIdentifier(
          decodeURIComponent(mosqueDefaultMatch[1]),
          'Mosque ID',
        );
        const update = normalizeMosqueDefaultUpdate(await readJsonBody(request));
        const currentDefault = state.mosqueDefaults[mosqueId];
        const currentRevision = currentDefault?.revision ?? 0;
        if (currentRevision !== update.expectedRevision) {
          const error = new Error('Mosque prayer-board revision conflict');
          error.statusCode = 409;
          throw error;
        }
        const nextDefault = {
          mosqueId,
          revision: update.revision,
          prayerBoardConfig: update.prayerBoardConfig,
          updatedAt: now.toISOString(),
        };
        await mutate(async (current) => {
          current.mosqueDefaults[mosqueId] = nextDefault;
          for (const entry of Object.values(current.displays)) {
            if (
              entry.identity.mosqueId === mosqueId &&
              entry.prayerBoardOverride === null &&
              prayerBoardTargetSupported(entry.identity)
            ) {
              synchronizeEffectivePrayerBoard(current, entry, now.toISOString(), true);
            }
          }
        });
        json(response, 200, nextDefault, corsOrigin);
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
        if (
          update.prayerBoardConfigSpecified &&
          update.prayerBoardConfig !== null &&
          !prayerBoardTargetSupported(entry.identity)
        ) {
          const error = new Error(
            'Prayer-board assignment requires a validated 1920x1080 or 3840x2160 landscape target',
          );
          error.statusCode = 409;
          throw error;
        }
        await mutate(async (current) => {
          if (update.prayerBoardConfigSpecified) {
            entry.prayerBoardOverride = update.prayerBoardConfig;
          } else {
            const currentEffective = effectivePrayerBoardAssignment(current, entry).config;
            entry.prayerBoardOverride = normalizePrayerBoardConfig({
              ...currentEffective,
              accentPreset: accentForTheme(update.displayTheme),
            });
          }
          entry.remoteConfig = {
            ...entry.remoteConfig,
            contentRevision: update.contentRevision,
            playlistId: update.playlistId,
            updatedAt: now.toISOString(),
          };
          synchronizeEffectivePrayerBoard(current, entry, now.toISOString(), false);
        });
        json(response, 200, publicStatus(state, entry, nowMs), corsOrigin);
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
        json(response, 200, publicStatus(state, entry, nowMs), corsOrigin);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/v1/device/config') {
        const displayId = normalizeIdentifier(
          url.searchParams.get('displayId') ?? '',
          'Display ID',
        );
        const entry = state.displays[displayId];
        if (entry === undefined) {
          const error = new Error('Display not found');
          error.statusCode = 404;
          throw error;
        }
        requireDevice(request, entry);
        json(response, 200, publicStatus(state, entry, nowMs).remoteConfig, corsOrigin);
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
          if (heartbeat.prayerBoardTemplateId !== null) {
            entry.reportedPrayerBoardTemplateId = heartbeat.prayerBoardTemplateId;
          }
        });
        json(response, 200, publicStatus(state, entry, nowMs), corsOrigin);
        return;
      }

      json(response, 404, { error: 'Not found' }, corsOrigin);
    } catch (error) {
      const status = Number.isInteger(error?.statusCode)
        ? error.statusCode
        : error instanceof RangeError || error instanceof TypeError || error instanceof SyntaxError
          ? 400
          : 500;
      json(
        response,
        status,
        { error: status === 500 ? 'Internal service error' : error.message },
        corsOrigin,
      );
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
