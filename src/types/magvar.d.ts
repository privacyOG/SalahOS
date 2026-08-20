declare module 'magvar' {
  export function magvar(latitude: number, longitude: number, altitudeKilometres?: number): number;
  export function calculateMagVar(
    julianDays: number,
    latitude: number,
    longitude: number,
    altitudeKilometres?: number,
  ): number;
}
