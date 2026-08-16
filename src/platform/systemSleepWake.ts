export interface SleepWakeSample {
  readonly wallTimeMs: number;
}

export interface SystemSleepWakeDetector {
  sample(next: SleepWakeSample): boolean;
  reset(next: SleepWakeSample): void;
}

export function createSystemSleepWakeDetector(
  initial: SleepWakeSample,
  thresholdMs = 5_000,
): SystemSleepWakeDetector {
  if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
    throw new RangeError('Sleep/wake threshold must be a positive finite number.');
  }

  const validateSample = (sample: SleepWakeSample): void => {
    if (!Number.isFinite(sample.wallTimeMs)) {
      throw new RangeError('Sleep/wake samples must contain a finite wall time.');
    }
  };

  validateSample(initial);
  let previous = initial;

  return {
    sample(next) {
      validateSample(next);
      const elapsed = next.wallTimeMs - previous.wallTimeMs;
      previous = next;

      return elapsed >= thresholdMs;
    },
    reset(next) {
      validateSample(next);
      previous = next;
    },
  };
}
