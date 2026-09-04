import type { JumuahSession } from './mosqueTimetable';

function validCivilDate(civilDateIso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(civilDateIso)) return null;

  const date = new Date(`${civilDateIso}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === civilDateIso
    ? date
    : null;
}

export function shouldPromoteFridayJumuah(
  input: Readonly<{
    civilDateIso: string;
    jumuahSessions: readonly JumuahSession[];
  }>,
): boolean {
  if (input.jumuahSessions.length === 0) return false;

  const civilDate = validCivilDate(input.civilDateIso);
  return civilDate !== null && civilDate.getUTCDay() === 5;
}
