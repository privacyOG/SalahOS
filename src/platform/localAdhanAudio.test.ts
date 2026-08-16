import { describe, expect, it } from 'vitest';
import { defaultNotificationPreferences, updatePrayerNotificationPreference } from '../domain/notificationPreferences';
import {
  foregroundAdhanPlaybackKey,
  MAX_LOCAL_ADHAN_AUDIO_BYTES,
  validateLocalAdhanAudio,
} from './localAdhanAudio';

describe('local Adhan audio', () => {
  it('accepts a bounded local audio file without requiring redistribution metadata', () => {
    expect(() =>
      validateLocalAdhanAudio({ name: 'my-adhan.mp3', type: 'audio/mpeg', size: 1_024 }),
    ).not.toThrow();
  });

  it('rejects non-audio, empty and oversized local files', () => {
    expect(() =>
      validateLocalAdhanAudio({ name: 'notes.txt', type: 'text/plain', size: 100 }),
    ).toThrow(TypeError);
    expect(() =>
      validateLocalAdhanAudio({ name: 'empty.mp3', type: 'audio/mpeg', size: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      validateLocalAdhanAudio({
        name: 'huge.mp3',
        type: 'audio/mpeg',
        size: MAX_LOCAL_ADHAN_AUDIO_BYTES + 1,
      }),
    ).toThrow(RangeError);
  });

  it('returns one stable foreground playback key only at an enabled Adhan prayer minute', () => {
    const notifications = updatePrayerNotificationPreference(
      defaultNotificationPreferences,
      'fajr',
      { enabled: true, adhanEnabled: true },
    );
    const prayers = [
      { name: 'fajr', localMinutes: 330 },
      { name: 'sunrise', localMinutes: 410 },
      { name: 'dhuhr', localMinutes: 720 },
    ];

    expect(
      foregroundAdhanPlaybackKey({
        date: '2026-08-16',
        localMinutes: 330.5,
        prayers,
        notifications,
      }),
    ).toBe('2026-08-16:fajr:local-adhan');
    expect(
      foregroundAdhanPlaybackKey({
        date: '2026-08-16',
        localMinutes: 331,
        prayers,
        notifications,
      }),
    ).toBeNull();
  });

  it('does not trigger for disabled Adhan, disabled prayer, or sunrise', () => {
    const prayers = [
      { name: 'fajr', localMinutes: 330 },
      { name: 'sunrise', localMinutes: 410 },
    ];
    const adhanDisabled = updatePrayerNotificationPreference(
      defaultNotificationPreferences,
      'fajr',
      { enabled: true, adhanEnabled: false },
    );
    const prayerDisabled = updatePrayerNotificationPreference(
      defaultNotificationPreferences,
      'fajr',
      { enabled: false, adhanEnabled: true },
    );

    expect(
      foregroundAdhanPlaybackKey({
        date: '2026-08-16',
        localMinutes: 330,
        prayers,
        notifications: adhanDisabled,
      }),
    ).toBeNull();
    expect(
      foregroundAdhanPlaybackKey({
        date: '2026-08-16',
        localMinutes: 330,
        prayers,
        notifications: prayerDisabled,
      }),
    ).toBeNull();
    expect(
      foregroundAdhanPlaybackKey({
        date: '2026-08-16',
        localMinutes: 410,
        prayers,
        notifications: defaultNotificationPreferences,
      }),
    ).toBeNull();
  });
});
