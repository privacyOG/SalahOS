export type WearablePrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type WearablePrayerSourceKind = 'calculated' | 'mosque';

export interface WearablePrayerMoment {
  readonly id: WearablePrayerId;
  readonly startsAt: string;
  readonly iqamahAt: string | null;
}

export interface WearablePrayerSource {
  readonly kind: WearablePrayerSourceKind;
  readonly label: string;
}

export interface WearableCompanionSnapshotDraft {
  readonly generatedAt: string;
  readonly staleAfter: string;
  readonly civilDate: string;
  readonly timezone: string;
  readonly locale: string;
  readonly source: WearablePrayerSource;
  readonly prayers: readonly WearablePrayerMoment[];
  readonly nextPrayer: WearablePrayerMoment | null;
}

export interface WearableCompanionSnapshot extends WearableCompanionSnapshotDraft {
  readonly version: 1;
  readonly source: WearablePrayerSource;
  readonly prayers: readonly WearablePrayerMoment[];
  readonly nextPrayer: WearablePrayerMoment | null;
}

const PRAYER_ORDER: readonly WearablePrayerId[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

function assertUtcTimestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new RangeError(`${label} must be an exact ISO-8601 UTC timestamp`);
  }
  return value;
}

function assertCivilDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new RangeError('Wearable civil date must use YYYY-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError('Wearable civil date must be a valid Gregorian date');
  }
  return value;
}

function assertTimezone(value: string): string {
  const timezone = value.trim();
  if (timezone.length === 0 || timezone.length > 100) {
    throw new RangeError('Wearable timezone must contain 1 through 100 characters');
  }
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone: timezone }).format(new Date(0));
  } catch (error) {
    throw new RangeError('Wearable timezone must be a supported IANA timezone', {
      cause: error,
    });
  }
  return timezone;
}

function assertLocale(value: string): string {
  const locale = value.trim();
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(locale)) {
    throw new RangeError('Wearable locale must be a bounded BCP-47 style language tag');
  }
  return locale;
}

function normalizeLabel(value: string): string {
  const label = value.replace(/\s+/gu, ' ').trim();
  if (label.length === 0 || label.length > 160) {
    throw new RangeError('Wearable source label must contain 1 through 160 characters');
  }
  return label;
}

function normalizeMoment(
  value: WearablePrayerMoment,
  expectedId: WearablePrayerId | null,
  label: string,
): WearablePrayerMoment {
  if (expectedId !== null && value.id !== expectedId) {
    throw new RangeError(`${label} must preserve canonical prayer order`);
  }
  if (!PRAYER_ORDER.includes(value.id)) {
    throw new RangeError(`${label} contains an unsupported prayer identifier`);
  }
  const startsAt = assertUtcTimestamp(value.startsAt, `${label} startsAt`);
  const iqamahAt =
    value.iqamahAt === null
      ? null
      : assertUtcTimestamp(value.iqamahAt, `${label} iqamahAt`);
  if (iqamahAt !== null && new Date(iqamahAt).getTime() < new Date(startsAt).getTime()) {
    throw new RangeError(`${label} iqamahAt must not precede prayer start`);
  }
  return Object.freeze({ id: value.id, startsAt, iqamahAt });
}

export function createWearableCompanionSnapshot(
  draft: WearableCompanionSnapshotDraft,
): WearableCompanionSnapshot {
  const generatedAt = assertUtcTimestamp(draft.generatedAt, 'Wearable generatedAt');
  const staleAfter = assertUtcTimestamp(draft.staleAfter, 'Wearable staleAfter');
  if (new Date(staleAfter).getTime() <= new Date(generatedAt).getTime()) {
    throw new RangeError('Wearable staleAfter must be later than generatedAt');
  }
  if (draft.prayers.length !== PRAYER_ORDER.length) {
    throw new RangeError('Wearable snapshot must contain exactly five obligatory prayers');
  }

  const prayers = Object.freeze(
    PRAYER_ORDER.map((prayerId, index) => {
      const entry = draft.prayers[index];
      if (entry === undefined) {
        throw new RangeError('Wearable snapshot is missing an obligatory prayer');
      }
      return normalizeMoment(entry, prayerId, `Wearable prayer ${prayerId}`);
    }),
  );

  return Object.freeze({
    version: 1,
    generatedAt,
    staleAfter,
    civilDate: assertCivilDate(draft.civilDate),
    timezone: assertTimezone(draft.timezone),
    locale: assertLocale(draft.locale),
    source: Object.freeze({
      kind: draft.source.kind,
      label: normalizeLabel(draft.source.label),
    }),
    prayers,
    nextPrayer:
      draft.nextPrayer === null
        ? null
        : normalizeMoment(draft.nextPrayer, null, 'Wearable next prayer'),
  });
}

export function serializeWearableCompanionSnapshot(
  snapshot: WearableCompanionSnapshot,
): string {
  return JSON.stringify(snapshot);
}
