import type {
  IqamahRule,
  JumuahSession,
  MosqueDayTimetable,
  MosquePrayerTime,
  MosqueTimetable,
  TaraweehSession,
} from './mosqueTimetable';
import { validateMosqueTimetable } from './mosqueTimetable';
import type { ObligatoryPrayerName } from './prayerEngine';

const PRAYERS: readonly ObligatoryPrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireNumber(record: JsonRecord, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number`);
  }
  return value;
}

function parseIqamah(value: unknown, label: string): IqamahRule {
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

function parsePrayer(value: unknown, label: string): MosquePrayerTime {
  if (!isRecord(value)) throw new RangeError(`${label} must be a prayer-time object`);
  const startLocalMinutes = requireNumber(value, 'startLocalMinutes', `${label} start`);
  return value.iqamah === undefined
    ? { startLocalMinutes }
    : { startLocalMinutes, iqamah: parseIqamah(value.iqamah, `${label} iqamah`) };
}

function parseJumuah(value: unknown, label: string): JumuahSession {
  if (!isRecord(value) || typeof value.label !== 'string') {
    throw new RangeError(`${label} must be a Jumuah session object`);
  }
  return {
    label: value.label,
    khutbahLocalMinutes: requireNumber(value, 'khutbahLocalMinutes', `${label} khutbah`),
    salahLocalMinutes: requireNumber(value, 'salahLocalMinutes', `${label} salah`),
  };
}

function parseTaraweeh(value: unknown, label: string): TaraweehSession {
  if (!isRecord(value) || typeof value.label !== 'string') {
    throw new RangeError(`${label} must be a Taraweeh session object`);
  }
  return {
    label: value.label,
    startLocalMinutes: requireNumber(value, 'startLocalMinutes', `${label} start`),
  };
}

function parseDay(value: unknown, index: number): MosqueDayTimetable {
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
    if (prayerValue !== undefined) prayers[prayer] = parsePrayer(prayerValue, `${label} ${prayer}`);
  }

  let jumuahSessions: readonly JumuahSession[] | undefined;
  if (value.jumuahSessions !== undefined) {
    if (!Array.isArray(value.jumuahSessions)) {
      throw new RangeError(`${label} Jumuah sessions must be an array`);
    }
    jumuahSessions = value.jumuahSessions.map((session, sessionIndex) =>
      parseJumuah(session, `${label} Jumuah ${String(sessionIndex + 1)}`),
    );
  }

  let taraweehSessions: readonly TaraweehSession[] | undefined;
  if (value.taraweehSessions !== undefined) {
    if (!Array.isArray(value.taraweehSessions)) {
      throw new RangeError(`${label} Taraweeh sessions must be an array`);
    }
    taraweehSessions = value.taraweehSessions.map((session, sessionIndex) =>
      parseTaraweeh(session, `${label} Taraweeh ${String(sessionIndex + 1)}`),
    );
  }

  return {
    date: value.date,
    prayers,
    ...(jumuahSessions === undefined ? {} : { jumuahSessions }),
    ...(taraweehSessions === undefined ? {} : { taraweehSessions }),
  };
}

export function parseMosqueTimetablePayload(value: unknown): MosqueTimetable {
  if (!isRecord(value) || typeof value.mosqueName !== 'string' || !Array.isArray(value.days)) {
    throw new RangeError('Timetable payload must contain mosqueName and a days array');
  }
  const timetable: MosqueTimetable = {
    mosqueName: value.mosqueName,
    days: value.days.map((day, index) => parseDay(day, index)),
  };
  validateMosqueTimetable(timetable);
  return timetable;
}
