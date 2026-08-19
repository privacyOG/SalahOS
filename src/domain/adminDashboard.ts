export type AdminDashboardHealth = 'healthy' | 'attention' | 'error';
export type AdminPublicationState = 'missing' | 'published' | 'draft-pending';
export type ManagedDisplayState = 'online' | 'stale' | 'offline';
export type ScheduledAdminItemKind = 'announcement' | 'event';
export type AdminOperationalErrorSource = 'sync' | 'media';

export interface AdminPrayerPublicationStatusInput {
  readonly publishedRevisionId: string | null;
  readonly draftRevisionId: string | null;
  readonly publishedAt: string | null;
}

export interface ScheduledAdminItem {
  readonly id: string;
  readonly kind: ScheduledAdminItemKind;
  readonly title: string;
  readonly startsAt: string;
}

export interface ManagedDisplayStatus {
  readonly displayId: string;
  readonly state: ManagedDisplayState;
  readonly lastSeenAt: string | null;
}

export interface AdminOperationalError {
  readonly source: AdminOperationalErrorSource;
  readonly code: string;
  readonly message: string;
  readonly occurredAt: string;
}

export interface AdminDashboardInput {
  readonly now: string;
  readonly prayerPublication: AdminPrayerPublicationStatusInput;
  readonly scheduledItems: readonly ScheduledAdminItem[];
  readonly displays: readonly ManagedDisplayStatus[];
  readonly errors: readonly AdminOperationalError[];
}

export interface AdminDashboardStatus {
  readonly health: AdminDashboardHealth;
  readonly prayerPublication: {
    readonly state: AdminPublicationState;
    readonly publishedRevisionId: string | null;
    readonly draftRevisionId: string | null;
    readonly publishedAt: string | null;
  };
  readonly upcomingItems: readonly ScheduledAdminItem[];
  readonly displayCounts: Readonly<Record<ManagedDisplayState, number>>;
  readonly errors: readonly AdminOperationalError[];
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeOptionalTimestamp(value: string | null, label: string): string | null {
  return value === null ? null : assertIsoTimestamp(value, label);
}

function publicationState(input: AdminPrayerPublicationStatusInput): AdminPublicationState {
  if (input.publishedRevisionId === null) return 'missing';
  return input.draftRevisionId !== null && input.draftRevisionId !== input.publishedRevisionId
    ? 'draft-pending'
    : 'published';
}

function normalizeScheduledItem(item: ScheduledAdminItem): ScheduledAdminItem {
  return Object.freeze({
    id: item.id.trim(),
    kind: item.kind,
    title: item.title.trim(),
    startsAt: assertIsoTimestamp(item.startsAt, 'Scheduled item startsAt'),
  });
}

function normalizeDisplay(display: ManagedDisplayStatus): ManagedDisplayStatus {
  return Object.freeze({
    displayId: display.displayId.trim(),
    state: display.state,
    lastSeenAt: normalizeOptionalTimestamp(display.lastSeenAt, 'Display lastSeenAt'),
  });
}

function normalizeError(error: AdminOperationalError): AdminOperationalError {
  return Object.freeze({
    source: error.source,
    code: error.code.trim(),
    message: error.message.trim(),
    occurredAt: assertIsoTimestamp(error.occurredAt, 'Operational error occurredAt'),
  });
}

export function createAdminDashboardStatus(input: AdminDashboardInput): AdminDashboardStatus {
  const now = assertIsoTimestamp(input.now, 'Dashboard now');
  const publishedAt = normalizeOptionalTimestamp(
    input.prayerPublication.publishedAt,
    'Prayer publication publishedAt',
  );
  if (input.prayerPublication.publishedRevisionId === null && publishedAt !== null) {
    throw new RangeError('Published-at timestamp requires a published prayer revision');
  }

  const prayerState = publicationState(input.prayerPublication);
  const upcomingItems = input.scheduledItems
    .map(normalizeScheduledItem)
    .filter((item) => item.startsAt >= now)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const displays = input.displays.map(normalizeDisplay);
  const displayCounts: Record<ManagedDisplayState, number> = {
    online: 0,
    stale: 0,
    offline: 0,
  };
  for (const display of displays) displayCounts[display.state] += 1;

  const errors = input.errors
    .map(normalizeError)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const health: AdminDashboardHealth =
    errors.length > 0
      ? 'error'
      : prayerState !== 'published' || displayCounts.offline > 0 || displayCounts.stale > 0
        ? 'attention'
        : 'healthy';

  return Object.freeze({
    health,
    prayerPublication: Object.freeze({
      state: prayerState,
      publishedRevisionId: input.prayerPublication.publishedRevisionId,
      draftRevisionId: input.prayerPublication.draftRevisionId,
      publishedAt,
    }),
    upcomingItems: Object.freeze(upcomingItems),
    displayCounts: Object.freeze(displayCounts),
    errors: Object.freeze(errors),
  });
}
