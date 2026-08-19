export type SignageScheduleContext = 'all' | 'normal' | 'jumuah' | 'ramadan';
export type PrayerScheduleKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jumuah';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SignagePlaylistEntry {
  readonly sceneId: string;
  readonly dwellSeconds: number;
}

export interface SignagePlaylist {
  readonly playlistId: string;
  readonly mosqueId: string;
  readonly title: string;
  readonly revision: number;
  readonly scenes: readonly SignagePlaylistEntry[];
}

interface ScheduleRuleBase {
  readonly ruleId: string;
  readonly playlistId: string;
  readonly priority: number;
  readonly context: SignageScheduleContext;
}

export interface TimeWindowScheduleRule extends ScheduleRuleBase {
  readonly kind: 'time-window';
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly weekdays: readonly Weekday[];
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface PrayerRelativeScheduleRule extends ScheduleRuleBase {
  readonly kind: 'prayer-relative';
  readonly prayer: PrayerScheduleKey;
  readonly offsetMinutes: number;
  readonly durationMinutes: number;
}

export type SignageScheduleRule = TimeWindowScheduleRule | PrayerRelativeScheduleRule;

export interface SignageScheduleEvaluationContext {
  readonly localDate: string;
  readonly weekday: Weekday;
  readonly localClock: string;
  readonly context: Exclude<SignageScheduleContext, 'all'>;
  readonly prayerTimes: Readonly<Partial<Record<PrayerScheduleKey, string>>>;
}

export interface SignageScheduleResolution {
  readonly winner: SignageScheduleRule | null;
  readonly matchingRuleIds: readonly string[];
  readonly decisionBasis: string;
}

export interface DisplayPlaylistCache {
  readonly activePlaylistId: string | null;
  readonly nextPlaylistId: string | null;
  readonly cachedAt: string;
  readonly revision: number;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CLOCK_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;

function normalizeIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 160 || !ID_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function normalizeText(value: string, label: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1-${String(maxLength)} characters`);
  }
  return normalized;
}

function assertDate(value: string, label: string): string {
  const normalized = value.trim();
  if (!DATE_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must use YYYY-MM-DD`);
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new RangeError(`${label} must be a valid calendar date`);
  }
  return normalized;
}

function assertClock(value: string, label: string): string {
  const normalized = value.trim();
  if (!CLOCK_PATTERN.test(normalized)) {
    throw new RangeError(`${label} must use HH:mm`);
  }
  return normalized;
}

function clockMinutes(value: string): number {
  const parts = value.split(':');
  const hoursText = parts.at(0);
  const minutesText = parts.at(1);
  if (hoursText === undefined || minutesText === undefined) {
    throw new RangeError('Clock value must use HH:mm');
  }
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  return hours * 60 + minutes;
}

function minutesInWindow(now: number, start: number, end: number): boolean {
  if (start === end) return true;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

function addMinutes(value: number, delta: number): number {
  return (((value + delta) % 1440) + 1440) % 1440;
}

function normalizeWeekdays(values: readonly Weekday[]): readonly Weekday[] {
  if (values.length === 0) return Object.freeze([]);
  const unique = [...new Set(values)].sort((left, right) => left - right);
  if (unique.some((value) => value < 0 || value > 6)) {
    throw new RangeError('Weekdays must be integers from 0 through 6');
  }
  return Object.freeze(unique);
}

export function createSignagePlaylist(input: SignagePlaylist): SignagePlaylist {
  const scenes = input.scenes.map((entry) => {
    if (
      !Number.isInteger(entry.dwellSeconds) ||
      entry.dwellSeconds < 5 ||
      entry.dwellSeconds > 3600
    ) {
      throw new RangeError('Scene dwell seconds must be an integer from 5 through 3600');
    }
    return Object.freeze({
      sceneId: normalizeIdentifier(entry.sceneId, 'Scene ID'),
      dwellSeconds: entry.dwellSeconds,
    });
  });
  if (scenes.length === 0 || scenes.length > 100) {
    throw new RangeError('Playlist must contain 1-100 scenes');
  }
  if (new Set(scenes.map((entry) => entry.sceneId)).size !== scenes.length) {
    throw new RangeError('Playlist scene IDs must be unique');
  }
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new RangeError('Playlist revision must be a positive integer');
  }
  return Object.freeze({
    playlistId: normalizeIdentifier(input.playlistId, 'Playlist ID'),
    mosqueId: normalizeIdentifier(input.mosqueId, 'Mosque ID'),
    title: normalizeText(input.title, 'Playlist title', 140),
    revision: input.revision,
    scenes: Object.freeze(scenes),
  });
}

export function createSignageScheduleRule(input: SignageScheduleRule): SignageScheduleRule {
  const base = {
    ruleId: normalizeIdentifier(input.ruleId, 'Rule ID'),
    playlistId: normalizeIdentifier(input.playlistId, 'Playlist ID'),
    priority: input.priority,
    context: input.context,
  } as const;
  if (!Number.isInteger(base.priority) || base.priority < 0 || base.priority > 1000) {
    throw new RangeError('Schedule priority must be an integer from 0 through 1000');
  }

  if (input.kind === 'time-window') {
    const startDate = input.startDate === null ? null : assertDate(input.startDate, 'Start date');
    const endDate = input.endDate === null ? null : assertDate(input.endDate, 'End date');
    if (startDate !== null && endDate !== null && endDate < startDate) {
      throw new RangeError('Schedule end date cannot precede start date');
    }
    return Object.freeze({
      ...base,
      kind: 'time-window',
      startDate,
      endDate,
      weekdays: normalizeWeekdays(input.weekdays),
      startsAt: assertClock(input.startsAt, 'Schedule start clock'),
      endsAt: assertClock(input.endsAt, 'Schedule end clock'),
    });
  }

  if (
    !Number.isInteger(input.offsetMinutes) ||
    input.offsetMinutes < -360 ||
    input.offsetMinutes > 360
  ) {
    throw new RangeError('Prayer-relative offset must be an integer from -360 through 360 minutes');
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > 360
  ) {
    throw new RangeError('Prayer-relative duration must be an integer from 1 through 360 minutes');
  }
  return Object.freeze({
    ...base,
    kind: 'prayer-relative',
    prayer: input.prayer,
    offsetMinutes: input.offsetMinutes,
    durationMinutes: input.durationMinutes,
  });
}

function contextMatches(
  rule: SignageScheduleRule,
  context: SignageScheduleEvaluationContext,
): boolean {
  return rule.context === 'all' || rule.context === context.context;
}

function ruleMatches(
  rule: SignageScheduleRule,
  context: SignageScheduleEvaluationContext,
): boolean {
  if (!contextMatches(rule, context)) return false;
  const localDate = assertDate(context.localDate, 'Local date');
  const localClock = assertClock(context.localClock, 'Local clock');
  const now = clockMinutes(localClock);

  if (rule.kind === 'time-window') {
    if (rule.startDate !== null && localDate < rule.startDate) return false;
    if (rule.endDate !== null && localDate > rule.endDate) return false;
    if (rule.weekdays.length > 0 && !rule.weekdays.includes(context.weekday)) return false;
    return minutesInWindow(now, clockMinutes(rule.startsAt), clockMinutes(rule.endsAt));
  }

  const prayerClock = context.prayerTimes[rule.prayer];
  if (prayerClock === undefined) return false;
  const prayerMinutes = clockMinutes(assertClock(prayerClock, `${rule.prayer} prayer clock`));
  const start = addMinutes(prayerMinutes, rule.offsetMinutes);
  const end = addMinutes(start, rule.durationMinutes);
  return minutesInWindow(now, start, end);
}

function compareRules(
  left: SignageScheduleRule,
  right: SignageScheduleRule,
  context: SignageScheduleEvaluationContext,
): number {
  if (left.priority !== right.priority) return right.priority - left.priority;
  const leftContext = left.context === context.context ? 1 : 0;
  const rightContext = right.context === context.context ? 1 : 0;
  if (leftContext !== rightContext) return rightContext - leftContext;
  const leftKind = left.kind === 'prayer-relative' ? 1 : 0;
  const rightKind = right.kind === 'prayer-relative' ? 1 : 0;
  if (leftKind !== rightKind) return rightKind - leftKind;
  return left.ruleId.localeCompare(right.ruleId);
}

export function resolveSignageSchedule(
  rules: readonly SignageScheduleRule[],
  context: SignageScheduleEvaluationContext,
): SignageScheduleResolution {
  const normalizedRules = rules.map(createSignageScheduleRule);
  const matches = normalizedRules
    .filter((rule) => ruleMatches(rule, context))
    .sort((left, right) => compareRules(left, right, context));
  const winner = matches[0] ?? null;
  return Object.freeze({
    winner,
    matchingRuleIds: Object.freeze(matches.map((rule) => rule.ruleId)),
    decisionBasis:
      winner === null
        ? 'No schedule rule matched the supplied local context.'
        : 'Highest priority wins; ties prefer exact context, prayer-relative rules, then lexical rule ID.',
  });
}

export function createDisplayPlaylistCache(input: DisplayPlaylistCache): DisplayPlaylistCache {
  const parsed = new Date(input.cachedAt);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== input.cachedAt) {
    throw new RangeError('Cache timestamp must be an ISO-8601 UTC timestamp');
  }
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new RangeError('Cache revision must be a positive integer');
  }
  return Object.freeze({
    activePlaylistId:
      input.activePlaylistId === null
        ? null
        : normalizeIdentifier(input.activePlaylistId, 'Active playlist ID'),
    nextPlaylistId:
      input.nextPlaylistId === null
        ? null
        : normalizeIdentifier(input.nextPlaylistId, 'Next playlist ID'),
    cachedAt: input.cachedAt,
    revision: input.revision,
  });
}
