import type { KeyValueStorage } from './settingsStorage';

export const PRIVACY_DIAGNOSTICS_STORAGE_KEY = 'salahos.privacyDiagnostics';
export const PRIVACY_DIAGNOSTICS_CHANGE_EVENT = 'salahos:privacy-diagnostics-change';

const PRIVACY_DIAGNOSTICS_VERSION = 1 as const;
const MAX_DIAGNOSTIC_EVENTS = 40;
const MAX_TIMING_MS = 10 * 60 * 1000;

export type PrivacyDiagnosticEvent = PrivacyCrashDiagnostic | PrivacyPerformanceDiagnostic;

export interface PrivacyCrashDiagnostic {
  readonly kind: 'crash';
  readonly occurredAtIso: string;
  readonly source: 'window-error' | 'unhandled-rejection';
  readonly errorClass: string;
  readonly fingerprint: string;
}

export interface PrivacyPerformanceDiagnostic {
  readonly kind: 'performance';
  readonly occurredAtIso: string;
  readonly navigationDurationMs: number | null;
  readonly firstContentfulPaintMs: number | null;
}

export interface PrivacyDiagnosticsState {
  readonly version: 1;
  readonly enabled: boolean;
  readonly events: readonly PrivacyDiagnosticEvent[];
}

export interface PrivacyDiagnosticsExport {
  readonly version: 1;
  readonly generatedAtIso: string;
  readonly privacy: Readonly<{
    preciseLocationIncluded: false;
    urlsIncluded: false;
    rawErrorMessagesIncluded: false;
    rawStacksIncluded: false;
    automaticUpload: false;
  }>;
  readonly events: readonly PrivacyDiagnosticEvent[];
}

export interface PrivacyPerformanceSource {
  getEntriesByType(type: string): readonly PerformanceEntry[];
  getEntriesByName(name: string): readonly PerformanceEntry[];
}

const EMPTY_STATE: PrivacyDiagnosticsState = Object.freeze({
  version: PRIVACY_DIAGNOSTICS_VERSION,
  enabled: false,
  events: Object.freeze([]),
});

const STANDARD_ERROR_CLASSES = new Set([
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'AggregateError',
  'DOMException',
  'PromiseRejection',
  'UnknownError',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function boundedTiming(value: unknown): number | null {
  if (value === null) return null;
  const timing = Number(value);
  if (!Number.isFinite(timing) || timing < 0 || timing > MAX_TIMING_MS) return null;
  return Math.round(timing);
}

function parseEvent(value: unknown): PrivacyDiagnosticEvent | null {
  if (!isRecord(value) || !validIso(value.occurredAtIso)) return null;

  if (value.kind === 'crash') {
    const source = value.source;
    if (source !== 'window-error' && source !== 'unhandled-rejection') return null;
    if (typeof value.errorClass !== 'string' || !STANDARD_ERROR_CLASSES.has(value.errorClass)) {
      return null;
    }
    if (typeof value.fingerprint !== 'string' || !/^[a-f0-9]{8}$/u.test(value.fingerprint)) {
      return null;
    }
    return Object.freeze({
      kind: 'crash',
      occurredAtIso: value.occurredAtIso,
      source,
      errorClass: value.errorClass,
      fingerprint: value.fingerprint,
    });
  }

  if (value.kind === 'performance') {
    const navigationDurationMs = boundedTiming(value.navigationDurationMs);
    const firstContentfulPaintMs = boundedTiming(value.firstContentfulPaintMs);
    if (navigationDurationMs === null && firstContentfulPaintMs === null) return null;
    return Object.freeze({
      kind: 'performance',
      occurredAtIso: value.occurredAtIso,
      navigationDurationMs,
      firstContentfulPaintMs,
    });
  }

  return null;
}

export function loadPrivacyDiagnosticsState(storage: KeyValueStorage): PrivacyDiagnosticsState {
  const raw = storage.getItem(PRIVACY_DIAGNOSTICS_STORAGE_KEY);
  if (raw === null) return EMPTY_STATE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== PRIVACY_DIAGNOSTICS_VERSION) return EMPTY_STATE;
    const events = Array.isArray(parsed.events)
      ? parsed.events
          .map((event) => parseEvent(event))
          .filter((event): event is PrivacyDiagnosticEvent => event !== null)
          .slice(-MAX_DIAGNOSTIC_EVENTS)
      : [];
    return Object.freeze({
      version: PRIVACY_DIAGNOSTICS_VERSION,
      enabled: parsed.enabled === true,
      events: Object.freeze(events),
    });
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(storage: KeyValueStorage, state: PrivacyDiagnosticsState): PrivacyDiagnosticsState {
  const normalized = Object.freeze({
    version: PRIVACY_DIAGNOSTICS_VERSION,
    enabled: state.enabled,
    events: Object.freeze([...state.events].slice(-MAX_DIAGNOSTIC_EVENTS)),
  });
  storage.setItem(PRIVACY_DIAGNOSTICS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function setPrivacyDiagnosticsEnabled(
  storage: KeyValueStorage,
  enabled: boolean,
): PrivacyDiagnosticsState {
  const current = loadPrivacyDiagnosticsState(storage);
  return saveState(storage, { ...current, enabled });
}

export function clearPrivacyDiagnostics(storage: KeyValueStorage): PrivacyDiagnosticsState {
  const current = loadPrivacyDiagnosticsState(storage);
  return saveState(storage, { ...current, events: [] });
}

function appendEvent(
  storage: KeyValueStorage,
  event: PrivacyDiagnosticEvent,
): PrivacyDiagnosticsState {
  const current = loadPrivacyDiagnosticsState(storage);
  if (!current.enabled) return current;
  return saveState(storage, { ...current, events: [...current.events, event] });
}

function stableFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function errorClassFor(value: unknown): string {
  if (typeof DOMException !== 'undefined' && value instanceof DOMException) return 'DOMException';
  if (value instanceof Error && STANDARD_ERROR_CLASSES.has(value.name)) return value.name;
  return value instanceof Error ? 'Error' : 'PromiseRejection';
}

function fingerprintBasis(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}|${value.stack ?? ''}`;
  }
  return Object.prototype.toString.call(value);
}

export function recordCrashDiagnostic(
  storage: KeyValueStorage,
  source: PrivacyCrashDiagnostic['source'],
  value: unknown,
  now: Date = new Date(),
): PrivacyDiagnosticsState {
  return appendEvent(
    storage,
    Object.freeze({
      kind: 'crash',
      occurredAtIso: now.toISOString(),
      source,
      errorClass: errorClassFor(value),
      fingerprint: stableFingerprint(fingerprintBasis(value)),
    }),
  );
}

export function collectCurrentPerformanceDiagnostics(
  storage: KeyValueStorage,
  performanceSource: PrivacyPerformanceSource,
  now: Date = new Date(),
): PrivacyDiagnosticsState {
  const current = loadPrivacyDiagnosticsState(storage);
  if (!current.enabled) return current;

  const navigation = performanceSource.getEntriesByType('navigation')[0];
  const firstContentfulPaint = performanceSource.getEntriesByName('first-contentful-paint')[0];
  const navigationDurationMs = boundedTiming(navigation?.duration ?? null);
  const firstContentfulPaintMs = boundedTiming(firstContentfulPaint?.startTime ?? null);
  if (navigationDurationMs === null && firstContentfulPaintMs === null) return current;

  return appendEvent(
    storage,
    Object.freeze({
      kind: 'performance',
      occurredAtIso: now.toISOString(),
      navigationDurationMs,
      firstContentfulPaintMs,
    }),
  );
}

export function exportPrivacyDiagnostics(
  storage: KeyValueStorage,
  now: Date = new Date(),
): string {
  const state = loadPrivacyDiagnosticsState(storage);
  const payload: PrivacyDiagnosticsExport = Object.freeze({
    version: PRIVACY_DIAGNOSTICS_VERSION,
    generatedAtIso: now.toISOString(),
    privacy: Object.freeze({
      preciseLocationIncluded: false,
      urlsIncluded: false,
      rawErrorMessagesIncluded: false,
      rawStacksIncluded: false,
      automaticUpload: false,
    }),
    events: state.events,
  });
  return JSON.stringify(payload, null, 2);
}

export function installPrivacyDiagnostics(storage: KeyValueStorage): () => void {
  let performanceRecorded = false;

  const recordPerformanceIfEnabled = () => {
    if (performanceRecorded || !loadPrivacyDiagnosticsState(storage).enabled) return;
    collectCurrentPerformanceDiagnostics(storage, performance);
    performanceRecorded = true;
  };

  const handleError = (event: ErrorEvent) => {
    recordCrashDiagnostic(storage, 'window-error', event.error ?? event.message);
  };
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    recordCrashDiagnostic(storage, 'unhandled-rejection', event.reason);
  };
  const handlePreferenceChange = () => {
    recordPerformanceIfEnabled();
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener(PRIVACY_DIAGNOSTICS_CHANGE_EVENT, handlePreferenceChange);

  if (document.readyState === 'complete') {
    recordPerformanceIfEnabled();
  } else {
    window.addEventListener('load', recordPerformanceIfEnabled, { once: true });
  }

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener(PRIVACY_DIAGNOSTICS_CHANGE_EVENT, handlePreferenceChange);
    window.removeEventListener('load', recordPerformanceIfEnabled);
  };
}
