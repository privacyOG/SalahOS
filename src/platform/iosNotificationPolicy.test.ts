import { describe, expect, it } from 'vitest';
import {
  IOS_NOTIFICATION_LIFECYCLES,
  iosNotificationDeliveryPolicy,
} from './iosNotificationPolicy';

describe('iOS notification delivery policy', () => {
  it.each(IOS_NOTIFICATION_LIFECYCLES)(
    'uses system local notifications without app background execution in %s',
    (lifecycle) => {
      expect(iosNotificationDeliveryPolicy({ sound: 'default' }, lifecycle)).toEqual({
        delivery: 'system-local-notification',
        lifecycle,
        audio: 'default-notification-sound',
        requiresAppBackgroundExecution: false,
        fullAdhanAutoPlayback: false,
      });
    },
  );

  it('keeps silent preferences silent', () => {
    expect(iosNotificationDeliveryPolicy({ sound: 'silent' }, 'background').audio).toBe('silent');
  });

  it('never represents scheduled Adhan alerts as full recording playback', () => {
    for (const lifecycle of IOS_NOTIFICATION_LIFECYCLES) {
      expect(iosNotificationDeliveryPolicy({ sound: 'default' }, lifecycle).fullAdhanAutoPlayback).toBe(
        false,
      );
    }
  });
});
