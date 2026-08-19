export function normalizeBearing(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    throw new RangeError('Bearing must be finite');
  }
  return ((degrees % 360) + 360) % 360;
}

export function signedTurnToQibla(qiblaBearing: number, deviceHeading: number): number {
  const qibla = normalizeBearing(qiblaBearing);
  const heading = normalizeBearing(deviceHeading);
  const clockwise = normalizeBearing(qibla - heading);
  return clockwise > 180 ? clockwise - 360 : clockwise;
}

export function absoluteTurnToQibla(qiblaBearing: number, deviceHeading: number): number {
  return Math.abs(signedTurnToQibla(qiblaBearing, deviceHeading));
}
