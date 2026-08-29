import { hijriDateParts, hijriMonthName } from './calendar';
import { buildPrayerDashboardResult } from './dashboardResult';
import { calculationMethods } from './methods';
import { resolveIanaTimeZone } from './timezone';
import type { PersistedSettings } from '../platform/settingsStorage';
const DAY = 86_400_000;
export type PrayerCalendarView = 'daily' | 'weekly' | 'monthly' | 'yearly';
export function utcCivilDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}
export function addCivilDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}
export function startOfWeek(date: Date) {
  return addCivilDays(date, -date.getUTCDay());
}
export function daysInGregorianMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
export function civilDatesForView(anchor: Date, view: PrayerCalendarView) {
  if (view === 'daily') return [anchor];
  if (view === 'weekly') {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addCivilDays(start, i));
  }
  if (view === 'monthly') {
    const y = anchor.getUTCFullYear(),
      m = anchor.getUTCMonth() + 1;
    return Array.from({ length: daysInGregorianMonth(y, m) }, (_, i) => utcCivilDate(y, m, i + 1));
  }
  const y = anchor.getUTCFullYear(),
    dates: Date[] = [];
  for (let m = 1; m <= 12; m++)
    for (let d = 1; d <= daysInGregorianMonth(y, m); d++) dates.push(utcCivilDate(y, m, d));
  return dates;
}
export function hijriCalendarLabel(date: Date, correctionDays = 0) {
  const h = hijriDateParts(date, correctionDays);
  return {
    ...h,
    monthName: hijriMonthName(h.month),
    label: [String(h.day), hijriMonthName(h.month), String(h.year), 'AH'].join(' '),
  };
}
function instantForCivilDate(date: Date, timeZone: string) {
  const target = date.toISOString().slice(0, 10),
    seed = date.getTime() + 12 * 3_600_000;
  for (let h = -24; h <= 24; h++) {
    const instant = new Date(seed + h * 3_600_000),
      parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(instant),
      year = parts.find((part) => part.type === 'year')?.value,
      month = parts.find((part) => part.type === 'month')?.value,
      day = parts.find((part) => part.type === 'day')?.value;
    if (year === undefined || month === undefined || day === undefined) continue;
    const value = [year, month, day].join('-');
    if (value === target) return instant;
  }
  throw new RangeError(`Unable to resolve civil date ${target} in ${timeZone}`);
}
export function buildPrayerCalendarDay(date: Date, settings: PersistedSettings) {
  if (!settings.location) return null;
  const timeZone =
    settings.location.timeZone ?? resolveIanaTimeZone(settings.location.coordinates).timeZone;
  const instant = instantForCivilDate(date, timeZone);
  const result = buildPrayerDashboardResult({
    instant,
    coordinates: settings.location.coordinates,
    timeZone,
    method: calculationMethods[settings.calculationMethodId],
    asrConvention: settings.asrConvention,
    highLatitudeRule: settings.highLatitudeRule,
    adjustments: settings.prayerAdjustments,
    hijriCorrectionDays: settings.hijriCorrectionDays,
  });
  if (!result.ok) return null;
  return {
    civilDate: date,
    hijri: hijriCalendarLabel(date, settings.hijriCorrectionDays),
    prayers: result.dashboard.prayers,
  };
}