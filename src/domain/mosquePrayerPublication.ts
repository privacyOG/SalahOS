import type { ObligatoryPrayerName } from './prayerEngine';
import { createMosqueId, type MosqueId } from './mosqueIdentity';
import type { IqamahRule, JumuahSession } from './mosqueTimetable';

const PRAYERS: readonly ObligatoryPrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

type PrayerMinuteMap = Readonly<Partial<Record<ObligatoryPrayerName, number>>>;
type IqamahMap = Readonly<Partial<Record<ObligatoryPrayerName, IqamahRule>>>;
type NullableIqamahMap = Readonly<Partial<Record<ObligatoryPrayerName, IqamahRule | null>>>;

export type PrayerPublicationSource = 'calculated' | 'adjusted' | 'supplied';

export interface CalculatedPrayerPublication {
  readonly kind: 'calculated';
}

export interface AdjustedPrayerPublication {
  readonly kind: 'adjusted';
  readonly adjustments: PrayerMinuteMap;
}

export interface SuppliedPrayerPublication {
  readonly kind: 'supplied';
  readonly startLocalMinutes: Readonly<Record<ObligatoryPrayerName, number>>;
}

export type PrayerStartPublication =
  CalculatedPrayerPublication | AdjustedPrayerPublication | SuppliedPrayerPublication;

export interface PrayerDateOverride {
  readonly date: string;
  readonly startLocalMinutes?: PrayerMinuteMap;
  readonly iqamah?: NullableIqamahMap;
  readonly jumuahSessions?: readonly JumuahSession[];
}

export interface PrayerSeasonalRule {
  readonly id: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startLocalMinutes?: PrayerMinuteMap;
  readonly iqamah?: NullableIqamahMap;
}

export interface RamadanPresentation {
  readonly ishaLocalMinutes?: number;
  readonly taraweehLocalMinutes?: number;
  readonly suhurEndsLocalMinutes?: number;
  readonly imsakLocalMinutes?: number;
  readonly iftarLocalMinutes?: number;
  readonly taraweehLabel?: string;
}

export interface MosquePrayerPublicationDraft {
  readonly mosqueId: string;
  readonly prayerStarts: PrayerStartPublication;
  readonly iqamah?: IqamahMap;
  readonly defaultJumuahSessions?: readonly JumuahSession[];
  readonly dateOverrides?: readonly PrayerDateOverride[];
  readonly seasonalRules?: readonly PrayerSeasonalRule[];
  readonly ramadan?: RamadanPresentation | null;
}

export interface MosquePrayerPublication {
  readonly mosqueId: MosqueId;
  readonly prayerStarts: PrayerStartPublication;
  readonly iqamah: IqamahMap;
  readonly defaultJumuahSessions: readonly JumuahSession[];
  readonly dateOverrides: readonly PrayerDateOverride[];
  readonly seasonalRules: readonly PrayerSeasonalRule[];
  readonly ramadan: RamadanPresentation | null;
}

export interface PublicationPreview {
  readonly valid: true;
  readonly publication: MosquePrayerPublication;
  readonly warnings: readonly string[];
}

export interface PublicationRevisionInput {
  readonly revisionId: string;
  readonly changedBy: string;
  readonly publishedAt: string;
  readonly changeSummary: string;
}

export interface MosquePrayerPublicationRevision {
  readonly revisionId: string;
  readonly mosqueId: MosqueId;
  readonly sequence: number;
  readonly previousRevisionId: string | null;
  readonly changedBy: string;
  readonly publishedAt: string;
  readonly changeSummary: string;
  readonly publication: MosquePrayerPublication;
}

function assertDateKey(date: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) {
    throw new RangeError(`${label} must use YYYY-MM-DD`);
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError(`${label} must be a valid Gregorian civil date`);
  }
}

function assertLocalMinutes(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= 1_440) {
    throw new RangeError(`${label} must be an integer from 0 through 1439`);
  }
}

function assertBoundedText(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length === 0 || normalized.length > maximum) {
    throw new RangeError(`${label} must be between 1 and ${String(maximum)} characters`);
  }
  return normalized;
}

function validateIqamahRule(rule: IqamahRule, label: string): IqamahRule {
  if (rule.kind === 'fixed') {
    assertLocalMinutes(rule.localMinutes, `${label} fixed time`);
    return Object.freeze({ kind: 'fixed', localMinutes: rule.localMinutes });
  }

  const offset = rule.offsetMinutes;
  if (!Number.isInteger(offset) || offset < 0 || offset > 180) {
    throw new RangeError(`${label} offset must be an integer from 0 through 180 minutes`);
  }
  return Object.freeze({ kind: 'offset', offsetMinutes: offset });
}

function normalizeIqamahMap(value: IqamahMap | undefined): IqamahMap {
  const result: Partial<Record<ObligatoryPrayerName, IqamahRule>> = {};
  for (const prayer of PRAYERS) {
    const rule = value?.[prayer];
    if (rule !== undefined) {
      result[prayer] = validateIqamahRule(rule, `${prayer} iqamah`);
    }
  }
  return Object.freeze(result);
}

function normalizeNullableIqamahMap(
  value: NullableIqamahMap | undefined,
): NullableIqamahMap | undefined {
  if (value === undefined) return undefined;

  const result: Partial<Record<ObligatoryPrayerName, IqamahRule | null>> = {};
  for (const prayer of PRAYERS) {
    const rule = value[prayer];
    if (rule === null) {
      result[prayer] = null;
    } else if (rule !== undefined) {
      result[prayer] = validateIqamahRule(rule, `${prayer} iqamah override`);
    }
  }
  return Object.freeze(result);
}

function normalizeMinuteMap(
  value: PrayerMinuteMap | undefined,
  label: string,
): PrayerMinuteMap | undefined {
  if (value === undefined) return undefined;

  const result: Partial<Record<ObligatoryPrayerName, number>> = {};
  for (const prayer of PRAYERS) {
    const minutes = value[prayer];
    if (minutes !== undefined) {
      assertLocalMinutes(minutes, `${label} ${prayer}`);
      result[prayer] = minutes;
    }
  }
  return Object.freeze(result);
}

function normalizePrayerStarts(value: PrayerStartPublication): PrayerStartPublication {
  if (value.kind === 'calculated') {
    return Object.freeze({ kind: 'calculated' });
  }

  if (value.kind === 'adjusted') {
    const adjustments: Partial<Record<ObligatoryPrayerName, number>> = {};
    for (const prayer of PRAYERS) {
      const minutes = value.adjustments[prayer];
      if (minutes === undefined) continue;
      if (!Number.isInteger(minutes) || minutes < -180 || minutes > 180) {
        throw new RangeError(
          `${prayer} adjustment must be an integer from -180 through 180 minutes`,
        );
      }
      adjustments[prayer] = minutes;
    }
    return Object.freeze({ kind: 'adjusted', adjustments: Object.freeze(adjustments) });
  }

  const starts = {} as Record<ObligatoryPrayerName, number>;
  for (const prayer of PRAYERS) {
    const minutes = value.startLocalMinutes[prayer];
    assertLocalMinutes(minutes, `${prayer} supplied start`);
    starts[prayer] = minutes;
  }
  return Object.freeze({ kind: 'supplied', startLocalMinutes: Object.freeze(starts) });
}

function normalizeJumuahSessions(
  value: readonly JumuahSession[] | undefined,
): readonly JumuahSession[] {
  if (value === undefined) return Object.freeze([]);
  if (value.length > 10) {
    throw new RangeError('A publication may contain at most 10 Jumuah sessions');
  }

  const labels = new Set<string>();
  const sessions = value.map((session) => {
    const label = assertBoundedText(session.label, 'Jumuah session label', 120);
    assertLocalMinutes(session.khutbahLocalMinutes, 'Jumuah khutbah');
    assertLocalMinutes(session.salahLocalMinutes, 'Jumuah salah');
    if (session.salahLocalMinutes < session.khutbahLocalMinutes) {
      throw new RangeError('Jumuah salah may not precede its khutbah');
    }

    const key = label.toLocaleLowerCase('en-AU');
    if (labels.has(key)) {
      throw new RangeError(`Duplicate Jumuah session label: ${label}`);
    }
    labels.add(key);
    return Object.freeze({
      label,
      khutbahLocalMinutes: session.khutbahLocalMinutes,
      salahLocalMinutes: session.salahLocalMinutes,
    });
  });
  return Object.freeze(sessions);
}

function normalizeDateOverrides(
  value: readonly PrayerDateOverride[] | undefined,
): readonly PrayerDateOverride[] {
  if (value === undefined) return Object.freeze([]);

  const seen = new Set<string>();
  const overrides: PrayerDateOverride[] = value.map((override) => {
    assertDateKey(override.date, 'Prayer override date');
    if (seen.has(override.date)) {
      throw new RangeError(`Duplicate prayer override date: ${override.date}`);
    }
    seen.add(override.date);

    const startLocalMinutes =
      override.startLocalMinutes === undefined
        ? undefined
        : normalizeMinuteMap(override.startLocalMinutes, 'Prayer override');
    const iqamah =
      override.iqamah === undefined ? undefined : normalizeNullableIqamahMap(override.iqamah);

    return Object.freeze({
      date: override.date,
      ...(startLocalMinutes === undefined ? {} : { startLocalMinutes }),
      ...(iqamah === undefined ? {} : { iqamah }),
      ...(override.jumuahSessions === undefined
        ? {}
        : { jumuahSessions: normalizeJumuahSessions(override.jumuahSessions) }),
    });
  });
  return Object.freeze(overrides);
}

function normalizeSeasonalRules(
  value: readonly PrayerSeasonalRule[] | undefined,
): readonly PrayerSeasonalRule[] {
  if (value === undefined) return Object.freeze([]);

  const seenIds = new Set<string>();
  const normalized: PrayerSeasonalRule[] = value.map((rule) => {
    const id = assertBoundedText(rule.id, 'Seasonal rule ID', 120).toLowerCase();
    if (seenIds.has(id)) {
      throw new RangeError(`Duplicate seasonal rule ID: ${id}`);
    }
    seenIds.add(id);
    assertDateKey(rule.startDate, 'Seasonal rule start date');
    assertDateKey(rule.endDate, 'Seasonal rule end date');
    if (rule.endDate < rule.startDate) {
      throw new RangeError(`Seasonal rule ${id} ends before it starts`);
    }

    const startLocalMinutes =
      rule.startLocalMinutes === undefined
        ? undefined
        : normalizeMinuteMap(rule.startLocalMinutes, 'Seasonal prayer');
    const iqamah = rule.iqamah === undefined ? undefined : normalizeNullableIqamahMap(rule.iqamah);

    return Object.freeze({
      id,
      startDate: rule.startDate,
      endDate: rule.endDate,
      ...(startLocalMinutes === undefined ? {} : { startLocalMinutes }),
      ...(iqamah === undefined ? {} : { iqamah }),
    });
  });

  const sorted = [...normalized].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  );
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous === undefined || current === undefined) {
      throw new Error('Seasonal rule ordering invariant failed');
    }
    if (current.startDate <= previous.endDate) {
      throw new RangeError(`Seasonal rules may not overlap: ${previous.id} and ${current.id}`);
    }
  }
  return Object.freeze(normalized);
}

function normalizeRamadan(
  value: RamadanPresentation | null | undefined,
): RamadanPresentation | null {
  if (value === null || value === undefined) return null;

  const fields: (readonly [string, number | undefined])[] = [
    ['Isha', value.ishaLocalMinutes],
    ['Taraweeh', value.taraweehLocalMinutes],
    ['Suhur end', value.suhurEndsLocalMinutes],
    ['Imsak', value.imsakLocalMinutes],
    ['Iftar', value.iftarLocalMinutes],
  ];
  for (const [name, minutes] of fields) {
    if (minutes !== undefined) {
      assertLocalMinutes(minutes, `Ramadan ${name}`);
    }
  }

  if (
    value.ishaLocalMinutes !== undefined &&
    value.taraweehLocalMinutes !== undefined &&
    value.taraweehLocalMinutes < value.ishaLocalMinutes
  ) {
    throw new RangeError('Taraweeh may not be presented before Isha');
  }
  if (
    value.imsakLocalMinutes !== undefined &&
    value.suhurEndsLocalMinutes !== undefined &&
    value.imsakLocalMinutes > value.suhurEndsLocalMinutes
  ) {
    throw new RangeError('Imsak may not be after the configured Suhur end');
  }

  return Object.freeze({
    ...(value.ishaLocalMinutes === undefined ? {} : { ishaLocalMinutes: value.ishaLocalMinutes }),
    ...(value.taraweehLocalMinutes === undefined
      ? {}
      : { taraweehLocalMinutes: value.taraweehLocalMinutes }),
    ...(value.suhurEndsLocalMinutes === undefined
      ? {}
      : { suhurEndsLocalMinutes: value.suhurEndsLocalMinutes }),
    ...(value.imsakLocalMinutes === undefined
      ? {}
      : { imsakLocalMinutes: value.imsakLocalMinutes }),
    ...(value.iftarLocalMinutes === undefined
      ? {}
      : { iftarLocalMinutes: value.iftarLocalMinutes }),
    ...(value.taraweehLabel === undefined
      ? {}
      : { taraweehLabel: assertBoundedText(value.taraweehLabel, 'Taraweeh label', 120) }),
  });
}

export function previewMosquePrayerPublication(
  draft: MosquePrayerPublicationDraft,
): PublicationPreview {
  const publication: MosquePrayerPublication = Object.freeze({
    mosqueId: createMosqueId(draft.mosqueId),
    prayerStarts: normalizePrayerStarts(draft.prayerStarts),
    iqamah: normalizeIqamahMap(draft.iqamah),
    defaultJumuahSessions: normalizeJumuahSessions(draft.defaultJumuahSessions),
    dateOverrides: normalizeDateOverrides(draft.dateOverrides),
    seasonalRules: normalizeSeasonalRules(draft.seasonalRules),
    ramadan: normalizeRamadan(draft.ramadan),
  });

  const warnings: string[] = [];
  if (publication.prayerStarts.kind === 'calculated' && publication.dateOverrides.length === 0) {
    warnings.push(
      'Prayer starts remain entirely calculated; only mosque Iqamah/Jumuah metadata is managed.',
    );
  }
  if (publication.defaultJumuahSessions.length === 0) {
    warnings.push('No default Jumuah sessions are configured.');
  }
  return Object.freeze({ valid: true, publication, warnings: Object.freeze(warnings) });
}

function normalizeRevisionMetadata(input: PublicationRevisionInput): PublicationRevisionInput {
  const revisionId = assertBoundedText(input.revisionId, 'Revision ID', 160).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(revisionId)) {
    throw new RangeError('Revision ID must use lowercase-safe identifier characters');
  }

  const changedBy = assertBoundedText(input.changedBy, 'Changed by', 200);
  const changeSummary = assertBoundedText(input.changeSummary, 'Change summary', 500);
  const publishedAt = input.publishedAt.trim();
  const instant = new Date(publishedAt);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== publishedAt) {
    throw new RangeError('Published timestamp must be a canonical UTC ISO instant');
  }

  return Object.freeze({ revisionId, changedBy, changeSummary, publishedAt });
}

export function createMosquePrayerPublicationRevision(
  draft: MosquePrayerPublicationDraft,
  metadata: PublicationRevisionInput,
  previous: MosquePrayerPublicationRevision | null = null,
): MosquePrayerPublicationRevision {
  const publication = previewMosquePrayerPublication(draft).publication;
  const normalized = normalizeRevisionMetadata(metadata);
  if (previous !== null && previous.mosqueId !== publication.mosqueId) {
    throw new RangeError('A publication revision may only follow a revision for the same mosque');
  }

  return Object.freeze({
    revisionId: normalized.revisionId,
    mosqueId: publication.mosqueId,
    sequence: (previous?.sequence ?? 0) + 1,
    previousRevisionId: previous?.revisionId ?? null,
    changedBy: normalized.changedBy,
    publishedAt: normalized.publishedAt,
    changeSummary: normalized.changeSummary,
    publication,
  });
}

export function rollbackMosquePrayerPublication(
  current: MosquePrayerPublicationRevision,
  target: MosquePrayerPublicationRevision,
  metadata: PublicationRevisionInput,
): MosquePrayerPublicationRevision {
  if (current.mosqueId !== target.mosqueId) {
    throw new RangeError('Cannot roll back a timetable using a revision from another mosque');
  }

  const normalized = normalizeRevisionMetadata(metadata);
  return Object.freeze({
    revisionId: normalized.revisionId,
    mosqueId: current.mosqueId,
    sequence: current.sequence + 1,
    previousRevisionId: current.revisionId,
    changedBy: normalized.changedBy,
    publishedAt: normalized.publishedAt,
    changeSummary: `${normalized.changeSummary} (rollback to ${target.revisionId})`,
    publication: target.publication,
  });
}
