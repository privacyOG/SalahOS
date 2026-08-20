import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPublicEventCalendar } from './calendar.mjs';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8788;
const DEFAULT_DATA_PATH = 'local-api/public-data.json';
const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const SNAPSHOT_VERSION = 1;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const MONTH_PATTERN = /^\d{4}-\d{2}$/u;
const CLOCK_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;
const REQUIRED_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const RATE_LIMITS = Object.freeze({ profile: 120, daily: 120, monthly: 60, calendar: 60 });
const CACHE_POLICIES = Object.freeze({
  profile: 'public, max-age=60, stale-while-revalidate=300',
  daily: 'public, max-age=60, stale-while-revalidate=300',
  monthly: 'public, max-age=300, stale-while-revalidate=900',
  calendar: 'public, max-age=300, stale-while-revalidate=900',
});
const FORBIDDEN_PUBLIC_KEYS = new Set(
  [
    'memberships',
    'roles',
    'sessions',
    'invitations',
    'auditRecords',
    'notificationDeviceTokens',
    'displayPairingCodes',
    'privateNotes',
    'privateAdminContact',
    'adminToken',
    'deviceToken',
    'deviceTokenHash',
    'password',
    'secret',
    'credentials',
  ].map((value) => value.toLowerCase()),
);

function normalizeIdentifier(value, label) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 160 || !ID_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function assertObject(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function assertBoundedString(value, label, maximum) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maximum) {
    throw new RangeError(`${label} must contain 1 through ${String(maximum)} characters`);
  }
  return normalized;
}

function assertDate(value, label) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new RangeError(`${label} must use YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`${label} must be a valid Gregorian date`);
  }
  return value;
}

function assertMonth(value, label) {
  if (typeof value !== 'string' || !MONTH_PATTERN.test(value)) {
    throw new RangeError(`${label} must use YYYY-MM`);
  }
  const month = Number.parseInt(value.slice(5, 7), 10);
  if (month < 1 || month > 12) {
    throw new RangeError(`${label} must contain a valid month`);
  }
  return value;
}

function assertTimestamp(value, label) {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || !/(?:Z|[+-]\d{2}:\d{2})$/u.test(value)) {
    throw new RangeError(`${label} must be an ISO-8601 timestamp with a UTC offset`);
  }
  return value;
}

function assertTimezone(value, label) {
  const timezone = assertBoundedString(value, label, 100);
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone: timezone }).format(new Date(0));
  } catch (error) {
    throw new RangeError(`${label} must be a supported IANA timezone`, { cause: error });
  }
  return timezone;
}

function assertNoForbiddenPublicFields(value, path = 'payload') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertNoForbiddenPublicFields(entry, `${path}[${String(index)}]`),
    );
    return;
  }
  if (typeof value !== 'object' || value === null) return;

  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.has(key.toLowerCase())) {
      throw new RangeError(`${path}.${key} is not permitted in public API data`);
    }
    assertNoForbiddenPublicFields(entry, `${path}.${key}`);
  }
}

function assertPrayerTimeValue(value, label) {
  if (Number.isInteger(value)) {
    if (value < 0 || value >= 1_440) {
      throw new RangeError(`${label} local minutes must be from 0 through 1439`);
    }
    return;
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (CLOCK_PATTERN.test(normalized)) return;
    assertTimestamp(normalized, label);
    return;
  }
  const object = assertObject(value, label);
  const candidateKeys = ['start', 'startTime', 'startLocalMinutes', 'localMinutes', 'time'];
  const key = candidateKeys.find((candidate) => Object.hasOwn(object, candidate));
  if (key === undefined) {
    throw new RangeError(`${label} object does not contain a supported prayer-time field`);
  }
  assertPrayerTimeValue(object[key], `${label}.${key}`);
}

function assertIqamahValue(value, label) {
  if (value === null) return;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.kind === 'offset') {
      if (
        !Number.isInteger(value.offsetMinutes) ||
        value.offsetMinutes < 0 ||
        value.offsetMinutes > 180
      ) {
        throw new RangeError(`${label} offset must be from 0 through 180 minutes`);
      }
      return;
    }
    if (value.kind === 'fixed') {
      assertPrayerTimeValue(value.localMinutes, `${label} fixed time`);
      return;
    }
  }
  assertPrayerTimeValue(value, label);
}

function assertPrayerMap(value, label) {
  const prayers = assertObject(value, label);
  for (const prayer of REQUIRED_PRAYERS) {
    if (!Object.hasOwn(prayers, prayer)) {
      throw new RangeError(`${label} is missing ${prayer}`);
    }
    assertPrayerTimeValue(prayers[prayer], `${label}.${prayer}`);
  }
  return prayers;
}

function assertIqamahMap(value, label) {
  if (value === undefined) return;
  const iqamah = assertObject(value, label);
  for (const [prayer, entry] of Object.entries(iqamah)) {
    if (!REQUIRED_PRAYERS.includes(prayer)) {
      throw new RangeError(`${label}.${prayer} is not an obligatory prayer`);
    }
    assertIqamahValue(entry, `${label}.${prayer}`);
  }
}

function assertPublicationMetadata(value, label) {
  if (value.publishedAt !== undefined) assertTimestamp(value.publishedAt, `${label}.publishedAt`);
  if (value.revision !== undefined) {
    const revision = value.revision;
    const validString =
      typeof revision === 'string' && revision.trim().length > 0 && revision.length <= 120;
    const validInteger = Number.isInteger(revision) && revision >= 0;
    if (!validString && !validInteger) {
      throw new RangeError(`${label}.revision must be a non-negative integer or bounded string`);
    }
  }
}

function normalizeProfile(value, expectedMosqueId) {
  const profile = assertObject(value, `Profile ${expectedMosqueId}`);
  assertNoForbiddenPublicFields(profile, `profile.${expectedMosqueId}`);
  const mosqueId = normalizeIdentifier(profile.mosqueId, 'Profile mosqueId');
  if (mosqueId !== expectedMosqueId) {
    throw new RangeError(`Profile mosqueId does not match snapshot key ${expectedMosqueId}`);
  }
  const name = assertBoundedString(profile.name, 'Profile name', 200);
  const timezone = assertTimezone(profile.timezone, 'Profile timezone');
  assertPublicationMetadata(profile, `profile.${expectedMosqueId}`);
  return Object.freeze({ ...profile, mosqueId, name, timezone });
}

function normalizeDaily(value, expectedMosqueId, dateKey) {
  const daily = assertObject(value, `Daily prayers ${expectedMosqueId}/${dateKey}`);
  assertNoForbiddenPublicFields(daily, `daily.${expectedMosqueId}.${dateKey}`);
  const mosqueId = normalizeIdentifier(daily.mosqueId, 'Daily mosqueId');
  if (mosqueId !== expectedMosqueId) {
    throw new RangeError(`Daily mosqueId does not match snapshot key ${expectedMosqueId}`);
  }
  const date = assertDate(daily.date, 'Daily date');
  if (date !== dateKey) throw new RangeError(`Daily date does not match snapshot key ${dateKey}`);
  const timezone = assertTimezone(daily.timezone, 'Daily timezone');
  assertPrayerMap(daily.prayers, 'Daily prayers');
  assertIqamahMap(daily.iqamah, 'Daily iqamah');
  assertPublicationMetadata(daily, `daily.${expectedMosqueId}.${dateKey}`);
  return Object.freeze({ ...daily, mosqueId, date, timezone });
}

function normalizeMonthly(value, expectedMosqueId, monthKey) {
  const monthly = assertObject(value, `Monthly timetable ${expectedMosqueId}/${monthKey}`);
  assertNoForbiddenPublicFields(monthly, `monthly.${expectedMosqueId}.${monthKey}`);
  const mosqueId = normalizeIdentifier(monthly.mosqueId, 'Monthly mosqueId');
  if (mosqueId !== expectedMosqueId) {
    throw new RangeError(`Monthly mosqueId does not match snapshot key ${expectedMosqueId}`);
  }
  const month = assertMonth(monthly.month, 'Monthly month');
  if (month !== monthKey)
    throw new RangeError(`Monthly month does not match snapshot key ${monthKey}`);
  const timezone = assertTimezone(monthly.timezone, 'Monthly timezone');
  if (!Array.isArray(monthly.days) || monthly.days.length === 0 || monthly.days.length > 31) {
    throw new RangeError('Monthly days must contain 1 through 31 daily entries');
  }
  const seenDates = new Set();
  monthly.days.forEach((entry, index) => {
    const day = assertObject(entry, `Monthly day ${String(index)}`);
    const date = assertDate(day.date, `Monthly day ${String(index)} date`);
    if (!date.startsWith(`${monthKey}-`)) {
      throw new RangeError(`Monthly day ${date} is outside ${monthKey}`);
    }
    if (seenDates.has(date))
      throw new RangeError(`Monthly timetable contains duplicate day ${date}`);
    seenDates.add(date);
    assertPrayerMap(day.prayers, `Monthly day ${date} prayers`);
    assertIqamahMap(day.iqamah, `Monthly day ${date} iqamah`);
  });
  assertPublicationMetadata(monthly, `monthly.${expectedMosqueId}.${monthKey}`);
  return Object.freeze({ ...monthly, mosqueId, month, timezone });
}

function assertExactUtcTimestamp(value, label) {
  const normalized = assertTimestamp(value, label);
  const parsed = new Date(normalized);
  if (parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an exact ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeLocalizedEventContent(value, label) {
  if (value === null || value === undefined) return null;
  const content = assertObject(value, label);
  return Object.freeze({
    title: assertBoundedString(content.title, `${label} title`, 140),
    description: assertBoundedString(content.description, `${label} description`, 6000),
  });
}

function normalizePublicEventUrl(value, label) {
  if (value === null || value === undefined) return null;
  const normalized = assertBoundedString(value, label, 2048);
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (error) {
    throw new RangeError(`${label} must be a valid HTTP(S) URL`, { cause: error });
  }
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new RangeError(`${label} must be a credential-free HTTP(S) URL`);
  }
  return parsed.toString();
}

function normalizePublicEvent(value, expectedMosqueId, index) {
  const event = assertObject(value, `Calendar event ${String(index)}`);
  assertNoForbiddenPublicFields(event, `events.${expectedMosqueId}[${String(index)}]`);
  const eventId = normalizeIdentifier(event.eventId, 'Calendar event ID');
  const mosqueId = normalizeIdentifier(event.mosqueId, 'Calendar event mosqueId');
  if (mosqueId !== expectedMosqueId) {
    throw new RangeError('Calendar event mosqueId does not match snapshot mosque');
  }
  const english = normalizeLocalizedEventContent(event.english, 'Calendar event English');
  const arabic = normalizeLocalizedEventContent(event.arabic, 'Calendar event Arabic');
  if (english === null && arabic === null) {
    throw new RangeError('Calendar event requires English or Arabic content');
  }
  const venue = assertBoundedString(event.venue, 'Calendar event venue', 300);
  if (typeof event.allDay !== 'boolean') {
    throw new TypeError('Calendar event allDay must be boolean');
  }
  const startsAt = assertExactUtcTimestamp(event.startsAt, 'Calendar event startsAt');
  const endsAt = assertExactUtcTimestamp(event.endsAt, 'Calendar event endsAt');
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new RangeError('Calendar event end must be later than start');
  }
  if (
    event.allDay &&
    (!startsAt.endsWith('T00:00:00.000Z') || !endsAt.endsWith('T00:00:00.000Z'))
  ) {
    throw new RangeError('All-day calendar events require UTC-midnight boundaries');
  }
  if (!['none', 'daily', 'weekly'].includes(event.recurrence)) {
    throw new RangeError('Calendar event recurrence must be none, daily or weekly');
  }
  return Object.freeze({
    eventId,
    mosqueId,
    english,
    arabic,
    venue,
    allDay: event.allDay,
    startsAt,
    endsAt,
    recurrence: event.recurrence,
    registrationUrl: normalizePublicEventUrl(
      event.registrationUrl,
      'Calendar event registration URL',
    ),
  });
}

function normalizePublicEvents(value, expectedMosqueId) {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value) || value.length > 500) {
    throw new RangeError('Calendar events must be an array containing at most 500 entries');
  }
  const events = value.map((entry, index) => normalizePublicEvent(entry, expectedMosqueId, index));
  const eventIds = new Set(events.map((event) => event.eventId));
  if (eventIds.size !== events.length) {
    throw new RangeError('Calendar event IDs must be unique within a mosque snapshot');
  }
  return Object.freeze(events);
}

export function validatePublicSnapshot(value) {
  const root = assertObject(value, 'Local API snapshot');
  if (root.version !== SNAPSHOT_VERSION) {
    throw new RangeError(`Local API snapshot version must be ${String(SNAPSHOT_VERSION)}`);
  }
  if (root.generatedAt !== undefined) assertTimestamp(root.generatedAt, 'Snapshot generatedAt');
  const sourceMosques = assertObject(root.mosques, 'Local API mosques');
  const mosqueEntries = Object.entries(sourceMosques);
  if (mosqueEntries.length === 0 || mosqueEntries.length > 100) {
    throw new RangeError('Local API snapshot must contain 1 through 100 mosques');
  }

  const mosques = {};
  for (const [key, rawMosque] of mosqueEntries) {
    const mosqueId = normalizeIdentifier(key, 'Snapshot mosque key');
    if (mosqueId !== key)
      throw new RangeError(`Snapshot mosque key must already be normalized: ${key}`);
    const mosque = assertObject(rawMosque, `Snapshot mosque ${mosqueId}`);
    const profile = normalizeProfile(mosque.profile, mosqueId);

    const dailySource = assertObject(mosque.dailyPrayers ?? {}, `Daily prayer map ${mosqueId}`);
    if (Object.keys(dailySource).length > 800) {
      throw new RangeError(`Daily prayer map ${mosqueId} exceeds 800 dates`);
    }
    const dailyPrayers = {};
    for (const [dateKey, daily] of Object.entries(dailySource)) {
      assertDate(dateKey, 'Daily prayer map key');
      dailyPrayers[dateKey] = normalizeDaily(daily, mosqueId, dateKey);
    }

    const monthlySource = assertObject(
      mosque.monthlyTimetables ?? {},
      `Monthly timetable map ${mosqueId}`,
    );
    if (Object.keys(monthlySource).length > 60) {
      throw new RangeError(`Monthly timetable map ${mosqueId} exceeds 60 months`);
    }
    const monthlyTimetables = {};
    for (const [monthKey, monthly] of Object.entries(monthlySource)) {
      assertMonth(monthKey, 'Monthly timetable map key');
      monthlyTimetables[monthKey] = normalizeMonthly(monthly, mosqueId, monthKey);
    }

    const events = normalizePublicEvents(mosque.events, mosqueId);
    if (events.length > 0) {
      if (root.generatedAt === undefined) {
        throw new RangeError('Snapshot generatedAt is required when calendar events are published');
      }
      assertExactUtcTimestamp(root.generatedAt, 'Snapshot generatedAt');
    }

    mosques[mosqueId] = Object.freeze({
      profile,
      dailyPrayers: Object.freeze(dailyPrayers),
      monthlyTimetables: Object.freeze(monthlyTimetables),
      events,
    });
  }

  return Object.freeze({
    version: SNAPSHOT_VERSION,
    ...(root.generatedAt === undefined ? {} : { generatedAt: root.generatedAt }),
    mosques: Object.freeze(mosques),
  });
}

async function loadPublicSnapshot(path) {
  const metadata = await stat(path);
  if (!metadata.isFile()) throw new RangeError('Local API data path must be a regular file');
  if (metadata.size <= 0 || metadata.size > MAX_SNAPSHOT_BYTES) {
    throw new RangeError(
      `Local API snapshot must be between 1 byte and ${String(MAX_SNAPSHOT_BYTES)} bytes`,
    );
  }
  const raw = await readFile(path, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new SyntaxError('Local API snapshot is not valid JSON', { cause: error });
  }
  return {
    snapshot: validatePublicSnapshot(parsed),
    fingerprint: `${metadata.mtimeMs}:${metadata.size}`,
  };
}

export class PublicSnapshotStore {
  constructor(path) {
    this.path = resolve(path);
    this.snapshot = null;
    this.fingerprint = null;
    this.failedFingerprint = null;
    this.stale = false;
  }

  async initialize() {
    const loaded = await loadPublicSnapshot(this.path);
    this.snapshot = loaded.snapshot;
    this.fingerprint = loaded.fingerprint;
    this.failedFingerprint = null;
    this.stale = false;
    return this.snapshot;
  }

  async current() {
    if (this.snapshot === null) return { snapshot: await this.initialize(), stale: false };

    let fingerprint;
    try {
      const metadata = await stat(this.path);
      fingerprint = `${metadata.mtimeMs}:${metadata.size}`;
    } catch {
      this.stale = true;
      return { snapshot: this.snapshot, stale: true };
    }

    if (fingerprint === this.fingerprint) return { snapshot: this.snapshot, stale: false };
    if (fingerprint === this.failedFingerprint) return { snapshot: this.snapshot, stale: true };

    try {
      const loaded = await loadPublicSnapshot(this.path);
      this.snapshot = loaded.snapshot;
      this.fingerprint = loaded.fingerprint;
      this.failedFingerprint = null;
      this.stale = false;
      return { snapshot: this.snapshot, stale: false };
    } catch {
      this.failedFingerprint = fingerprint;
      this.stale = true;
      return { snapshot: this.snapshot, stale: true };
    }
  }
}

export function assertBindPolicy(host, allowLan) {
  const normalized = assertBoundedString(host, 'Local API host', 255).toLowerCase();
  const loopback = normalized === '127.0.0.1' || normalized === '::1' || normalized === 'localhost';
  if (!loopback && allowLan !== true) {
    throw new RangeError(
      'Non-loopback Local API binding requires explicit SALAHOS_LOCAL_API_ALLOW_LAN=true opt-in',
    );
  }
  return normalized;
}

function normalizePort(value) {
  const port = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError('Local API port must be an integer from 1 through 65535');
  }
  return port;
}

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs ?? RATE_WINDOW_MS;
  const limits = Object.freeze({ ...RATE_LIMITS, ...(options.limits ?? {}) });
  const buckets = new Map();

  return Object.freeze({
    allow(address, resourceKind, now = Date.now()) {
      const limit = limits[resourceKind];
      if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Rate limit is invalid');
      const key = `${address}|${resourceKind}`;
      const existing = buckets.get(key);
      if (existing === undefined || now - existing.startedAt >= windowMs) {
        buckets.set(key, { startedAt: now, count: 1 });
        return true;
      }
      if (existing.count >= limit) return false;
      existing.count += 1;
      return true;
    },
  });
}

function decodeIdentifier(value) {
  try {
    return normalizeIdentifier(decodeURIComponent(value), 'Route mosqueId');
  } catch (error) {
    if (error instanceof URIError)
      throw new RangeError('Route mosqueId is malformed', { cause: error });
    throw error;
  }
}

function matchPublicRoute(pathname) {
  const profile = /^\/api\/v1\/mosques\/([^/]+)$/u.exec(pathname);
  if (profile !== null) {
    return { kind: 'profile', mosqueId: decodeIdentifier(profile[1]) };
  }
  const daily = /^\/api\/v1\/mosques\/([^/]+)\/prayers\/(\d{4}-\d{2}-\d{2})$/u.exec(pathname);
  if (daily !== null) {
    return {
      kind: 'daily',
      mosqueId: decodeIdentifier(daily[1]),
      date: assertDate(daily[2], 'Route date'),
    };
  }
  const calendar = /^\/api\/v1\/mosques\/([^/]+)\/calendar\.ics$/u.exec(pathname);
  if (calendar !== null) {
    return { kind: 'calendar', mosqueId: decodeIdentifier(calendar[1]) };
  }
  const monthly = /^\/api\/v1\/mosques\/([^/]+)\/timetables\/(\d{4}-\d{2})$/u.exec(pathname);
  if (monthly !== null) {
    return {
      kind: 'monthly',
      mosqueId: decodeIdentifier(monthly[1]),
      month: assertMonth(monthly[2], 'Route month'),
    };
  }
  return null;
}

function findPublicPayload(snapshot, route) {
  const mosque = snapshot.mosques[route.mosqueId];
  if (mosque === undefined) return null;
  if (route.kind === 'profile') return mosque.profile;
  if (route.kind === 'daily') return mosque.dailyPrayers[route.date] ?? null;
  return mosque.monthlyTimetables[route.month] ?? null;
}

function responseHeaders(cacheControl, stale) {
  return {
    'Cache-Control': cacheControl,
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-SalahOS-Snapshot-State': stale ? 'stale' : 'fresh',
  };
}

function sendCalendar(response, status, body, mosqueId, options = {}) {
  response.writeHead(status, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Content-Disposition': `inline; filename="${mosqueId}-events.ics"`,
    ...responseHeaders(options.cacheControl ?? 'no-store', options.stale ?? false),
  });
  response.end(body);
}

function sendJson(response, status, payload, options = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...responseHeaders(options.cacheControl ?? 'no-store', options.stale ?? false),
    ...(options.extraHeaders ?? {}),
  });
  response.end(body);
}

export async function createLocalPublicApiService(options = {}) {
  const host = assertBindPolicy(options.host ?? DEFAULT_HOST, options.allowLan ?? false);
  const port = normalizePort(options.port ?? DEFAULT_PORT);
  const dataPath = resolve(options.dataPath ?? DEFAULT_DATA_PATH);
  const store = new PublicSnapshotStore(dataPath);
  await store.initialize();
  const rateLimiter = createRateLimiter({ limits: options.rateLimits });

  const requestHandler = async (request, response) => {
    try {
      if (request.method !== 'GET') {
        sendJson(
          response,
          405,
          { error: 'Method not allowed' },
          { extraHeaders: { Allow: 'GET' } },
        );
        return;
      }

      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.search !== '') {
        sendJson(response, 400, { error: 'Query parameters are not supported' });
        return;
      }
      const route = matchPublicRoute(url.pathname);
      if (route === null) {
        sendJson(response, 404, { error: 'Not found' });
        return;
      }

      const address = request.socket.remoteAddress ?? 'unknown';
      if (!rateLimiter.allow(address, route.kind)) {
        sendJson(
          response,
          429,
          { error: 'Rate limit exceeded' },
          { extraHeaders: { 'Retry-After': '60' } },
        );
        return;
      }

      const current = await store.current();
      if (route.kind === 'calendar') {
        const mosque = current.snapshot.mosques[route.mosqueId];
        const calendar =
          mosque === undefined
            ? null
            : createPublicEventCalendar(mosque, current.snapshot.generatedAt);
        if (calendar === null) {
          sendJson(
            response,
            404,
            { error: 'Published calendar not found' },
            { stale: current.stale },
          );
          return;
        }
        sendCalendar(response, 200, calendar, route.mosqueId, {
          cacheControl: CACHE_POLICIES.calendar,
          stale: current.stale,
        });
        return;
      }
      const payload = findPublicPayload(current.snapshot, route);
      if (payload === null) {
        sendJson(
          response,
          404,
          { error: 'Published resource not found' },
          { stale: current.stale },
        );
        return;
      }
      sendJson(response, 200, payload, {
        cacheControl: CACHE_POLICIES[route.kind],
        stale: current.stale,
      });
    } catch (error) {
      const status =
        error instanceof RangeError || error instanceof TypeError || error instanceof SyntaxError
          ? 400
          : 500;
      sendJson(response, status, {
        error: status === 500 ? 'Internal service error' : error.message,
      });
    }
  };

  return Object.freeze({
    host,
    port,
    dataPath,
    store,
    createHttpServer() {
      return createServer((request, response) => {
        void requestHandler(request, response);
      });
    },
  });
}

function parseAllowLan(value) {
  return value === 'true';
}

function isMainModule() {
  const argvPath = process.argv[1];
  return argvPath !== undefined && resolve(argvPath) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  createLocalPublicApiService({
    host: process.env.SALAHOS_LOCAL_API_HOST ?? DEFAULT_HOST,
    port: process.env.SALAHOS_LOCAL_API_PORT ?? DEFAULT_PORT,
    dataPath: process.env.SALAHOS_LOCAL_API_DATA_PATH ?? DEFAULT_DATA_PATH,
    allowLan: parseAllowLan(process.env.SALAHOS_LOCAL_API_ALLOW_LAN),
  })
    .then((service) => {
      const server = service.createHttpServer();
      server.once('error', (error) => {
        console.error(`SalahOS local API failed: ${error.message}`);
        process.exitCode = 1;
      });
      server.listen(service.port, service.host, () => {
        console.log(
          `SalahOS local API listening on http://${service.host}:${String(service.port)}`,
        );
      });
    })
    .catch((error) => {
      console.error(`SalahOS local API startup failed: ${error.message}`);
      process.exitCode = 1;
    });
}
