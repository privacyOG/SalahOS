export function systemTimeFromMilliseconds(milliseconds: number): Date | null {
  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  const instant = new Date(milliseconds);
  return Number.isFinite(instant.getTime()) ? instant : null;
}

export function readSystemTime(readNow: () => number = Date.now): Date | null {
  return systemTimeFromMilliseconds(readNow());
}
