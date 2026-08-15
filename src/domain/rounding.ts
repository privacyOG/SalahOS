export type RoundingPolicy = 'nearest-minute' | 'ceiling-minute' | 'floor-minute';

export function roundMinutes(value: number, policy: RoundingPolicy): number {
  if (!Number.isFinite(value)) {
    throw new RangeError('Prayer time minutes must be finite');
  }

  switch (policy) {
    case 'nearest-minute':
      return Math.round(value);
    case 'ceiling-minute':
      return Math.ceil(value);
    case 'floor-minute':
      return Math.floor(value);
  }
}

export const defaultRoundingPolicy: RoundingPolicy = 'nearest-minute';
