import { describe, expect, it } from 'vitest';

import {
  createCommunityNotification,
  evaluateCommunityNotificationDelivery,
  isWithinQuietHours,
  normalizeCommunityNotificationPreferences,
  type CommunityNotificationPreferences,
  type CommunityNotificationRequest,
} from './communityNotification';

function preferences(
  overrides: Partial<CommunityNotificationPreferences> = {},
): CommunityNotificationPreferences {
  return {
    service: true,
    announcement: true,
    event: true,
    quietHours: {
      enabled: true,
      startsAt: '22:00',
      endsAt: '07:00',
    },
    ...overrides,
  };
}

function request(
  overrides: Partial<CommunityNotificationRequest> = {},
): CommunityNotificationRequest {
  return {
    notificationId: 'announcement-2026-08-19',
    mosqueId: 'masjid-al-noor:sydney',
    sourceType: 'announcement',
    sourceId: 'community-update-2026-08-19',
    category: 'announcement',
    urgency: 'normal',
    title: 'Community update',
    body: 'The community hall will open after Maghrib.',
    createdAt: '2026-08-19T06:00:00.000Z',
    idempotencyKey: 'masjid-al-noor:community-update:2026-08-19',
    ...overrides,
  };
}

describe('community notification publishing', () => {
  it('normalizes managed community notification content', () => {
    const notification = createCommunityNotification(
      request({ title: '  Community   update  ', body: ' Hall   open after Maghrib. ' }),
    );

    expect(notification.title).toBe('Community update');
    expect(notification.body).toBe('Hall open after Maghrib.');
    expect(notification.mosqueId).toBe('masjid-al-noor:sydney');
  });

  it('keeps urgent delivery limited to service messages', () => {
    expect(() => createCommunityNotification(request({ urgency: 'urgent-service' }))).toThrow(
      /service category/u,
    );

    expect(
      createCommunityNotification(
        request({
          sourceType: 'service',
          category: 'service',
          urgency: 'urgent-service',
        }),
      ).urgency,
    ).toBe('urgent-service');
  });

  it('supports overnight and daytime quiet-hour windows', () => {
    expect(isWithinQuietHours({ enabled: true, startsAt: '22:00', endsAt: '07:00' }, '23:30')).toBe(
      true,
    );
    expect(isWithinQuietHours({ enabled: true, startsAt: '22:00', endsAt: '07:00' }, '12:00')).toBe(
      false,
    );
    expect(isWithinQuietHours({ enabled: true, startsAt: '13:00', endsAt: '15:00' }, '14:00')).toBe(
      true,
    );
  });

  it('honours category preferences before delivery', () => {
    const result = evaluateCommunityNotificationDelivery(
      request(),
      preferences({ announcement: false }),
      '12:00',
      new Set<string>(),
    );

    expect(result.decision).toBe('disabled');
  });

  it('defers normal community messages during quiet hours', () => {
    const result = evaluateCommunityNotificationDelivery(
      request(),
      preferences(),
      '23:00',
      new Set<string>(),
    );

    expect(result.decision).toBe('quiet-hours');
  });

  it('allows urgent service notifications through quiet hours when service is enabled', () => {
    const result = evaluateCommunityNotificationDelivery(
      request({
        sourceType: 'service',
        sourceId: 'water-shutdown-2026-08-19',
        category: 'service',
        urgency: 'urgent-service',
      }),
      preferences(),
      '23:00',
      new Set<string>(),
    );

    expect(result.decision).toBe('deliver');
  });

  it('prevents duplicate delivery using stable idempotency keys', () => {
    const notification = request();
    const result = evaluateCommunityNotificationDelivery(
      notification,
      preferences(),
      '12:00',
      new Set([notification.idempotencyKey]),
    );

    expect(result.decision).toBe('duplicate');
  });

  it('validates quiet-hour clocks and returns immutable normalized preferences', () => {
    expect(() =>
      normalizeCommunityNotificationPreferences(
        preferences({ quietHours: { enabled: true, startsAt: '25:00', endsAt: '07:00' } }),
      ),
    ).toThrow(/HH:mm/u);

    const normalized = normalizeCommunityNotificationPreferences(preferences());
    expect(Object.isFrozen(normalized)).toBe(true);
    expect(Object.isFrozen(normalized.quietHours)).toBe(true);
  });
});
