import type {
  IqamahRule,
  JumuahSession,
  MosqueDayTimetable,
  MosquePrayerTime,
  MosqueTimetable,
} from './mosqueTimetable';
import { validateMosqueTimetable } from './mosqueTimetable';
import type { ObligatoryPrayerName } from './prayerEngine';

const PRAYERS: readonly ObligatoryPrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const CSV_HEADER = [
  'date',
  'fajr',
  'fajr_iqamah',
  'dhuhr',
  'dhuhr_iqamah',
  'asr',
  'asr_iqamah',
  'maghrib',
  'maghrib_iqamah',
  'isha',
  'isha_iqamah',
] as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseClock(value: string, label: string): number {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new RangeError(`${label} must use 24-hour HH:MM`);
  }

  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new RangeError(`${label} must be a valid 24-hour time`);
  }
  return hours * 60 + minutes;
}

function formatClock(localMinutes: number): string {
  const hours = Math.floor(localMinutes / 60);
  const minutes = localMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseIqamah(value: string, label: string): IqamahRule | undefined {
  if (value === '') return undefined;

  if (/^\+\d{1,3}$/.test(value)) {
    return { kind: 'offset', offsetMinutes: Number(value.slice(1)) };
  }

  return { kind: 'fixed', localMinutes: parseClock(value, label) };
}

function parsePrayer(start: string, iqamah: string, label: string): MosquePrayerTime | undefined {
  if (start === '') {
    if (iqamah !== '') {
      throw new RangeError(`${label} iqamah cannot exist without a prayer start`);
    }
    return undefined;
  }

  const parsedIqamah = parseIqamah(iqamah, `${label} iqamah`);
  return parsedIqamah === undefined
    ? { startLocalMinutes: parseClock(start, `${label} start`) }
    : { startLocalMinutes: parseClock(start, `${label} start`), iqamah: parsedIqamah };
}

function requireNumber(record: JsonRecord, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number`);
  }
  return value;
}

function parseJsonIqamah(value: unknown, label: string): IqamahRule {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new RangeError(`${label} must be an iqamah rule object`);
  }

  if (value.kind === 'fixed') {
    return { kind: 'fixed', localMinutes: requireNumber(value, 'localMinutes', `${label} time`) };
  }

  if (value.kind === 'offset') {
    return {
      kind: 'offset',
      offsetMinutes: requireNumber(value, 'offsetMinutes', `${label} offset`),
    };
  }

  throw new RangeError(`${label} kind must be fixed or offset`);
}

function parseJsonPrayer(value: unknown, label: string): MosquePrayerTime {
  if (!isRecord(value)) {
    throw new RangeError(`${label} must be a prayer-time object`);
  }

  const startLocalMinutes = requireNumber(value, 'startLocalMinutes', `${label} start`);
  if (value.iqamah === undefined) {
    return { startLocalMinutes };
  }

  return {
    startLocalMinutes,
    iqamah: parseJsonIqamah(value.iqamah, `${label} iqamah`),
  };
}

function parseJsonJumuah(value: unknown, label: string): JumuahSession {
  if (!isRecord(value) || typeof value.label !== 'string') {
    throw new RangeError(`${label} must be a Jumuah session object`);
  }

  return {
    label: value.label,
    khutbahLocalMinutes: requireNumber(value, 'khutbahLocalMinutes', `${label} khutbah`),
    salahLocalMinutes: requireNumber(value, 'salahLocalMinutes', `${label} salah`),
  };
}

function parseJsonDay(value: unknown, index: number): MosqueDayTimetable {
  const label = `Timetable day ${String(index + 1)}`;
  if (!isRecord(value) || typeof value.date !== 'string' || !isRecord(value.prayers)) {
    throw new RangeError(`${label} must contain a date and prayers object`);
  }

  const unknownPrayerKeys = Object.keys(value.prayers).filter(
    (key) => !PRAYERS.includes(key as ObligatoryPrayerName),
  );
  if (unknownPrayerKeys.length > 0) {
    throw new RangeError(`${label} contains unknown prayer: ${String(unknownPrayerKeys[0])}`);
  }

  const prayers: Partial<Record<ObligatoryPrayerName, MosquePrayerTime>> = {};
  for (const prayer of PRAYERS) {
    const prayerValue = value.prayers[prayer];
    if (prayerValue !== undefined) {
      prayers[prayer] = parseJsonPrayer(prayerValue, `${label} ${prayer}`);
    }
  }

  if (value.jumuahSessions === undefined) {
    return { date: value.date, prayers };
  }
  if (!Array.isArray(value.jumuahSessions)) {
    throw new RangeError(`${label} Jumuah sessions must be an array`);
  }

  return {
    date: value.date,
    prayers,
    jumuahSessions: value.jumuahSessions.map((session, sessionIndex) =>
      parseJsonJumuah(session, `${label} Jumuah ${String(sessionIndex + 1)}`),
    ),
  };
}

function parseJsonTimetable(value: unknown): MosqueTimetable {
  if (!isRecord(value) || typeof value.mosqueName !== 'string' || !Array.isArray(value.days)) {
    throw new RangeError('Timetable JSON must contain mosqueName and a days array');
  }

  return {
    mosqueName: value.mosqueName,
    days: value.days.map((day, index) => parseJsonDay(day, index)),
  };
}

export function parseMosqueTimetableCsv(csv: string, mosqueName: string): MosqueTimetable {
  const lines = csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new RangeError('CSV timetable is empty');
  }

  const header = lines[0]?.split(',').map((value) => value.trim()) ?? [];
  if (
    header.length !== CSV_HEADER.length ||
    header.some((value, index) => value !== CSV_HEADER[index])
  ) {
    throw new RangeError(`CSV header must be exactly: ${CSV_HEADER.join(',')}`);
  }

  const days: MosqueDayTimetable[] = lines.slice(1).map((line, lineIndex) => {
    const values = line.split(',').map((value) => value.trim());
    if (values.length !== CSV_HEADER.length) {
      throw new RangeError(
        `CSV row ${String(lineIndex + 2)} must contain ${String(CSV_HEADER.length)} columns`,
      );
    }

    const prayers: Partial<Record<ObligatoryPrayerName, MosquePrayerTime>> = {};
    PRAYERS.forEach((prayer, prayerIndex) => {
      const start = values[1 + prayerIndex * 2] ?? '';
      const iqamah = values[2 + prayerIndex * 2] ?? '';
      const parsed = parsePrayer(start, iqamah, prayer);
      if (parsed !== undefined) prayers[prayer] = parsed;
    });

    return { date: values[0] ?? '', prayers };
  });

  const timetable: MosqueTimetable = { mosqueName, days };
  validateMosqueTimetable(timetable);
  return timetable;
}

function serializeIqamah(rule: IqamahRule | undefined): string {
  if (rule === undefined) return '';
  return rule.kind === 'fixed' ? formatClock(rule.localMinutes) : `+${String(rule.offsetMinutes)}`;
}

export function exportMosqueTimetableCsv(timetable: MosqueTimetable): string {
  validateMosqueTimetable(timetable);
  const rows = timetable.days.map((day) => {
    const values = [day.date];
    for (const prayer of PRAYERS) {
      const entry = day.prayers[prayer];
      values.push(entry === undefined ? '' : formatClock(entry.startLocalMinutes));
      values.push(entry === undefined ? '' : serializeIqamah(entry.iqamah));
    }
    return values.join(',');
  });

  return [CSV_HEADER.join(','), ...rows].join('\n');
}

export function parseMosqueTimetableJson(json: string): MosqueTimetable {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new RangeError('Timetable JSON is invalid');
  }

  const timetable = parseJsonTimetable(parsed);
  validateMosqueTimetable(timetable);
  return timetable;
}

export function exportMosqueTimetableJson(timetable: MosqueTimetable): string {
  validateMosqueTimetable(timetable);
  return JSON.stringify(timetable, null, 2);
}
