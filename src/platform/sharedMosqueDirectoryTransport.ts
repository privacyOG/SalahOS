import type { Coordinates } from '../domain/coordinates';
import {
  validateSharedMosqueRecord,
  type SharedMosqueContribution,
  type SharedMosqueRecord,
  type SharedMosqueSubmissionInput,
} from '../domain/sharedMosqueDirectory';

const DEFAULT_ENDPOINT = '/api/v1/shared-mosques';
const REQUEST_TIMEOUT_MS = 6_000;

export class SharedMosqueDirectoryTransportError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'SharedMosqueDirectoryTransportError';
    this.status = status;
  }
}

function endpoint(): string {
  const configured = import.meta.env.VITE_SHARED_MOSQUE_DIRECTORY_URL?.trim();
  return configured === undefined || configured === ''
    ? DEFAULT_ENDPOINT
    : configured.replace(/\/$/u, '');
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${endpoint()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
    const body = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message =
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'string'
          ? body.error
          : `Shared mosque directory request failed (${String(response.status)})`;
      throw new SharedMosqueDirectoryTransportError(message, response.status);
    }
    return body;
  } catch (error) {
    if (error instanceof SharedMosqueDirectoryTransportError) throw error;
    throw new SharedMosqueDirectoryTransportError(
      error instanceof Error ? error.message : 'Shared mosque directory is unavailable',
    );
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchSharedMosques(input: {
  readonly query?: string;
  readonly coordinates?: Coordinates | null;
  readonly radiusKm?: number;
  readonly limit?: number;
}): Promise<readonly SharedMosqueRecord[]> {
  const parameters = new URLSearchParams();
  if ((input.query ?? '').trim() !== '') parameters.set('q', input.query!.trim());
  if (input.coordinates !== null && input.coordinates !== undefined) {
    parameters.set('lat', String(input.coordinates.latitude));
    parameters.set('lon', String(input.coordinates.longitude));
    parameters.set('radiusKm', String(input.radiusKm ?? 100));
  }
  parameters.set('limit', String(input.limit ?? 50));
  const raw = await requestJson(`?${parameters.toString()}`);
  if (!Array.isArray(raw))
    throw new SharedMosqueDirectoryTransportError('Directory response is invalid');
  return Object.freeze(raw.map((value) => validateSharedMosqueRecord(value as SharedMosqueRecord)));
}

export async function submitSharedMosque(
  submission: SharedMosqueSubmissionInput,
): Promise<SharedMosqueContribution> {
  return (await requestJson('/submissions', {
    method: 'POST',
    body: JSON.stringify(submission),
  })) as SharedMosqueContribution;
}

export async function suggestSharedMosqueEdit(
  mosqueId: string,
  payload: Readonly<Record<string, string>>,
): Promise<SharedMosqueContribution> {
  return (await requestJson(`/${encodeURIComponent(mosqueId)}/suggestions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as SharedMosqueContribution;
}

export async function requestSharedMosqueClaim(
  mosqueId: string,
  contact: string,
): Promise<SharedMosqueContribution> {
  return (await requestJson(`/${encodeURIComponent(mosqueId)}/claims`, {
    method: 'POST',
    body: JSON.stringify({ contact }),
  })) as SharedMosqueContribution;
}
