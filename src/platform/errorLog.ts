export type StructuredErrorCode =
  'invalid-system-time' | 'prayer-calculation-unavailable' | 'notification-scheduling-unavailable';

export interface StructuredErrorEvent {
  readonly component: 'runtime-clock' | 'prayer-calculation';
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

export function createStructuredErrorLogger(
  sink: StructuredErrorSink = consoleSink,
): StructuredErrorLogger {
  return {
    log(code) {
      sink.write({
        component: code === 'invalid-system-time' ? 'runtime-clock' : 'prayer-calculation',
        code,
        severity: 'error',
      });
    },
  };
}
