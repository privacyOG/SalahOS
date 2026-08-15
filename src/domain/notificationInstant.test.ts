import { describe, expect, it } from 'vitest';
import type { NotificationIntent } from './notificationSchedule';
import {
  resolveNotificationIntentInstant,
  resolveNotificationScheduleInstants,
} from './notificationInstant';

function intent(
  deliveryDate: string,
  deliveryLocalMinutes: number,
  id = '2026-08-16:fajr:reminder',
): NotificationIntent {
  return {
    id,
    prayer: 'fajr',
    prayerDate: '2026-08-16',
    kind: 'reminder',
    deliveryDate,
    deliveryLocalMinutes,
    sound: 'default',
    vibration: true,
  };
}

describe('notification instant resolution', () => {
  it('converts an ordinary Sydney intent to the correct exact instant', () => {
    const resolution = resolveNotificationIntentInstant(
      intent('2026-08-16', 5 * 60 + 30),
      'Australia/Sydney',
    );

    expect(resolution.status).toBe('scheduled');
    if (resolution.status !== 'scheduled') return;
    expect(resolution.instant.toISOString()).toBe('2026-08-15T19:30:00.000Z');
    expect(resolution.offsetMinutes).toBe(600);
    expect(resolution.ambiguity).toBe('none');
  });

  it('chooses and marks the earlier occurrence of an ambiguous London time', () => {
    const resolution = resolveNotificationIntentInstant(
      intent('2026-10-25', 90),
      'Europe/London',
    );

    expect(resolution.status).toBe('scheduled');
    if (resolution.status !== 'scheduled') return;
    expect(resolution.instant.toISOString()).toBe('2026-10-25T00:30:00.000Z');
    expect(resolution.offsetMinutes).toBe(60);
    expect(resolution.ambiguity).toBe('earlier-occurrence');
  });

  it('skips a nonexistent London wall-clock time instead of shifting it silently', () => {
    const source = intent('2026-03-29', 90);
    const resolution = resolveNotificationIntentInstant(source, 'Europe/London');

    expect(resolution).toEqual({
      status: 'skipped-nonexistent-local-time',
      intent: source,
      timeZone: 'Europe/London',
    });
  });

  it('resolves a batch without changing intent order or identity', () => {
    const first = intent('2026-08-16', 300, 'first');
    const second = intent('2026-08-16', 720, 'second');
    const resolved = resolveNotificationScheduleInstants(
      [first, second],
      'Australia/Sydney',
    );

    expect(resolved.map((item) => item.intent.id)).toEqual(['first', 'second']);
    expect(resolved.every((item) => item.status === 'scheduled')).toBe(true);
  });
});
