export type CommunityNotificationCategory = 'service' | 'announcement' | 'event';
export type CommunityNotificationUrgency = 'normal' | 'urgent-service';
export type CommunityNotificationSourceType = 'announcement' | 'event' | 'service';
export type NotificationDeliveryDecision = 'deliver' | 'quiet-hours' | 'disabled' | 'duplicate';

export interface QuietHours {
  readonly enabled: boolean;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface CommunityNotificationPreferences {
  readonly service: boolean;
  readonly announcement: boolean;
  readonly event: boolean;
  readonly quietHours: QuietHours;
}

export interface CommunityNotificationRequest {
  readonly notificationId: string;
  readonly mosqueId: string;
  readonly sourceType: CommunityNotificationSourceType;
  readonly sourceId: string;
  readonly category: CommunityNotificationCategory;
  readonly urgency: CommunityNotificationUrgency;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly idempotencyKey: string;
}

export interface CommunityNotification extends CommunityNotificationRequest {
  readonly notificationId: string;
  readonly mosqueId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly idempotencyKey: string;
}

export interface NotificationDeliveryEvaluation {
  readonly decision: NotificationDeliveryDecision;
  readonly notification: CommunityNotification;
}

function assertIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeText(value: string, label: string, maximum: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || normalized.length > maximum) {
    throw new RangeError(`${label} must contain 1-${String(maximum)} characters`);
  }
  return normalized;
}

function assertClock(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(normalized)) {
    throw new RangeError(`${label} must use 24-hour HH:mm format`);
  }
  return normalized;
}

function clockMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function normalizeCommunityNotificationPreferences(
  preferences: CommunityNotificationPreferences,
): CommunityNotificationPreferences {
  const startsAt = assertClock(preferences.quietHours.startsAt, 'Quiet-hours start');
  const endsAt = assertClock(preferences.quietHours.endsAt, 'Quiet-hours end');

  return Object.freeze({
    service: preferences.service,
    announcement: preferences.announcement,
    event: preferences.event,
    quietHours: Object.freeze({
      enabled: preferences.quietHours.enabled,
      startsAt,
      endsAt,
    }),
  });
}

export function createCommunityNotification(
  request: CommunityNotificationRequest,
): CommunityNotification {
  if (request.urgency === 'urgent-service' && request.category !== 'service') {
    throw new RangeError('Urgent service notifications must use the service category');
  }

  return Object.freeze({
    notificationId: assertIdentifier(request.notificationId, 'Notification ID'),
    mosqueId: assertIdentifier(request.mosqueId, 'Mosque ID'),
    sourceType: request.sourceType,
    sourceId: assertIdentifier(request.sourceId, 'Notification source ID'),
    category: request.category,
    urgency: request.urgency,
    title: normalizeText(request.title, 'Notification title', 160),
    body: normalizeText(request.body, 'Notification body', 1000),
    createdAt: assertIsoTimestamp(request.createdAt, 'Notification createdAt'),
    idempotencyKey: assertIdentifier(request.idempotencyKey, 'Notification idempotency key'),
  });
}

export function isWithinQuietHours(quietHours: QuietHours, localClock: string): boolean {
  const normalized = normalizeCommunityNotificationPreferences({
    service: true,
    announcement: true,
    event: true,
    quietHours,
  }).quietHours;
  if (!normalized.enabled) return false;

  const current = clockMinutes(assertClock(localClock, 'Local clock'));
  const start = clockMinutes(normalized.startsAt);
  const end = clockMinutes(normalized.endsAt);

  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

export function evaluateCommunityNotificationDelivery(
  request: CommunityNotificationRequest,
  preferences: CommunityNotificationPreferences,
  localClock: string,
  deliveredIdempotencyKeys: ReadonlySet<string>,
): NotificationDeliveryEvaluation {
  const notification = createCommunityNotification(request);
  const normalizedPreferences = normalizeCommunityNotificationPreferences(preferences);

  if (deliveredIdempotencyKeys.has(notification.idempotencyKey)) {
    return Object.freeze({ decision: 'duplicate', notification });
  }

  if (!normalizedPreferences[notification.category]) {
    return Object.freeze({ decision: 'disabled', notification });
  }

  if (
    notification.urgency !== 'urgent-service' &&
    isWithinQuietHours(normalizedPreferences.quietHours, localClock)
  ) {
    return Object.freeze({ decision: 'quiet-hours', notification });
  }

  return Object.freeze({ decision: 'deliver', notification });
}
