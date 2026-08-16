export interface ClockSample {
  readonly wallTimeMs: number;
  readonly monotonicTimeMs: number;
}

export interface SystemClockChangeDetector {
  sample(next: ClockSample): boolean;
  reset(next: ClockSample): void;
}

export function createSystemClockChangeDetector(
  initial: ClockSample,
  thresholdMs = 30_000,
): SystemClockChangeDetector {
  if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
    throw new RangeError('Clock-change threshold must be a positive finite number.');
  }

  let previous = initial;

  const validateSample = (sample: ClockSample): void => {
    if (!Number.isFinite(sample.wallTimeMs) || !Number.isFinite(sample.monotonicTimeMs)) {
      throw new RangeError('Clock samples must contain finite values.');
    }
  };

  validateSample(initial);

  return {
    sample(next) {
      validateSample(next);
      const wallElapsed = next.wallTimeMs - previous.wallTimeMs;
      const monotonicElapsed = next.monotonicTimeMs - previous.monotonicTimeMs;
      previous = next;

      if (monotonicElapsed < 0) return true;
      return Math.abs(wallElapsed - monotonicElapsed) >= thresholdMs;
    },
    reset(next) {
      validateSample(next);
      previous = next;
    },
  };
}
