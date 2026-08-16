export type StructuredErrorCode =
  | 'invalid-system-time'
  | 'prayer-calculation-unavailable'
  | 'notification-scheduling-unavailable';

export interface StructuredErrorEvent {
  readonly component: 'runtime-clock' | 'prayer-calculation' | 'notification-scheduling';
  readonly code: StructuredErrorCode;
  readonly severity: 'error';
}

export interface StructuredErrorSink {
  write(event: StructuredErrorEvent): void;
}

const consoleSink: StructuredErrorSink = {
  write(event) {
    console.error('SalahOS error', event);
  },
};

export interface StructuredErrorLogger {
  log(code: StructuredErrorCode): void;
}

function componentForCode(code: StructuredErrorCode): StructuredErrorEvent['component'] {
  if (code === 'invalid-system-time') return 'runtime-clock';
  if (code === 'notification-scheduling-unavailable') return 'notification-scheduling';
  return 'prayer-calculation';
}

export function createStructuredErrorLogger(
  sink: StructuredErrorSink = consoleSink,
): StructuredErrorLogger {
  return {
    log(code) {
      sink.write({
        component: componentForCode(code),
        code,
        severity: 'error',
      });
    },
  };
}
