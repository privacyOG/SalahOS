export type PublicApiVersion = 'v1';
export type PublicApiResource = 'profile' | 'daily-prayers' | 'monthly-timetable';

export interface PublicApiEndpoint {
  readonly version: PublicApiVersion;
  readonly resource: PublicApiResource;
  readonly pathTemplate: string;
  readonly method: 'GET';
  readonly cacheControl: string;
  readonly rateLimitPerMinute: number;
}

export interface PublicApiPolicy {
  readonly version: PublicApiVersion;
  readonly endpoints: readonly PublicApiEndpoint[];
  readonly allowedFields: readonly string[];
  readonly forbiddenFields: readonly string[];
}

const PUBLIC_FIELDS = Object.freeze([
  'mosqueId',
  'name',
  'address',
  'timezone',
  'publicContact',
  'facilities',
  'prayerSource',
  'publishedAt',
  'revision',
  'prayers',
  'iqamah',
  'jumuah',
  'hijriLabel',
]);

const FORBIDDEN_FIELDS = Object.freeze([
  'members',
  'roles',
  'sessions',
  'invitations',
  'auditLog',
  'deviceTokens',
  'pairingCodes',
  'privateNotes',
  'adminEmail',
]);

export function createPublicApiPolicy(): PublicApiPolicy {
  const endpoints: readonly PublicApiEndpoint[] = Object.freeze([
    Object.freeze({
      version: 'v1',
      resource: 'profile',
      pathTemplate: '/api/v1/mosques/:mosqueId',
      method: 'GET',
      cacheControl: 'public, max-age=60, stale-while-revalidate=300',
      rateLimitPerMinute: 120,
    }),
    Object.freeze({
      version: 'v1',
      resource: 'daily-prayers',
      pathTemplate: '/api/v1/mosques/:mosqueId/prayers/:date',
      method: 'GET',
      cacheControl: 'public, max-age=60, stale-while-revalidate=300',
      rateLimitPerMinute: 120,
    }),
    Object.freeze({
      version: 'v1',
      resource: 'monthly-timetable',
      pathTemplate: '/api/v1/mosques/:mosqueId/timetables/:month',
      method: 'GET',
      cacheControl: 'public, max-age=300, stale-while-revalidate=900',
      rateLimitPerMinute: 60,
    }),
  ]);

  return Object.freeze({
    version: 'v1',
    endpoints,
    allowedFields: PUBLIC_FIELDS,
    forbiddenFields: FORBIDDEN_FIELDS,
  });
}

export function buildPublicApiPath(
  resource: PublicApiResource,
  mosqueId: string,
  value?: string,
): string {
  const normalizedMosqueId = normalizeId(mosqueId);

  if (resource === 'profile') {
    return `/api/v1/mosques/${encodeURIComponent(normalizedMosqueId)}`;
  }

  if (value === undefined || value.trim().length === 0) {
    throw new RangeError(`${resource} requires a date or month value`);
  }

  const normalizedValue = value.trim();
  if (resource === 'daily-prayers') {
    assertDate(normalizedValue);
    return `/api/v1/mosques/${encodeURIComponent(normalizedMosqueId)}/prayers/${normalizedValue}`;
  }

  assertMonth(normalizedValue);
  return `/api/v1/mosques/${encodeURIComponent(normalizedMosqueId)}/timetables/${normalizedValue}`;
}

export function assertPublicApiPayload(payload: Readonly<Record<string, unknown>>): void {
  const policy = createPublicApiPolicy();
  for (const key of Object.keys(payload)) {
    if (policy.forbiddenFields.includes(key)) {
      throw new RangeError(`Public API payload contains forbidden field: ${key}`);
    }
  }
}

function normalizeId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)) {
    throw new RangeError('Mosque ID must use a stable lowercase-safe identifier');
  }
  return normalized;
}

function assertDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new RangeError('Prayer date must use YYYY-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError('Prayer date must be a valid Gregorian date');
  }
}

function assertMonth(value: string): void {
  if (!/^\d{4}-\d{2}$/u.test(value)) {
    throw new RangeError('Timetable month must use YYYY-MM');
  }
  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 7) !== value) {
    throw new RangeError('Timetable month must be a valid Gregorian month');
  }
}
