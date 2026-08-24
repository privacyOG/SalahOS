import { describe, expect, it } from 'vitest';
import {
  defaultAdhanAudioPreferences,
  packagedAdhanRecordings,
  parseAdhanAudioPreferences,
  resolveAdhanAudioSourceForPrayer,
} from './adhanAudioLibrary';

describe('Adhan audio library', () => {
  it('publishes two immutable packaged recordings with integrity and rights metadata', () => {
    expect(packagedAdhanRecordings.map((recording) => recording.id)).toEqual([
      'beautiful-adhan',
      'fajr-malmo',
    ]);
    for (const recording of packagedAdhanRecordings) {
      expect(recording.url).toMatch(/^\/audio\/adhan\/.+\.mp3$/u);
      expect(recording.sha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(recording.bytes).toBeGreaterThan(100_000);
      expect(recording.durationSeconds).toBeGreaterThan(60);
      expect(recording.sampleRateHz).toBe(44100);
      expect(recording.channels).toBe(1);
      expect(recording.bitRate).toBe(96000);
      expect(recording.upstreamCommit).toHaveLength(40);
    }
  });

  it('parses persisted defaults, volume and per-prayer overrides defensively', () => {
    expect(
      parseAdhanAudioPreferences({
        version: 1,
        defaultSourceId: 'fajr-malmo',
        prayerSelections: { fajr: 'beautiful-adhan', dhuhr: 'local-upload' },
        volumePercent: 62,
        notificationOnly: true,
      }),
    ).toEqual({
      version: 1,
      defaultSourceId: 'fajr-malmo',
      prayerSelections: {
        fajr: 'beautiful-adhan',
        dhuhr: 'local-upload',
        asr: 'default',
        maghrib: 'default',
        isha: 'default',
      },
      volumePercent: 62,
      notificationOnly: true,
    });

    expect(parseAdhanAudioPreferences({ version: 99 })).toBe(defaultAdhanAudioPreferences);
    expect(
      parseAdhanAudioPreferences({
        version: 1,
        defaultSourceId: 'remote-url',
        prayerSelections: { fajr: 'remote-url' },
        volumePercent: 101,
      }),
    ).toEqual(defaultAdhanAudioPreferences);
  });

  it('resolves per-prayer overrides and safely falls back when a local upload is absent', () => {
    const preferences = parseAdhanAudioPreferences({
      version: 1,
      defaultSourceId: 'beautiful-adhan',
      prayerSelections: { fajr: 'fajr-malmo', dhuhr: 'local-upload' },
      volumePercent: 85,
      notificationOnly: false,
    });

    expect(resolveAdhanAudioSourceForPrayer(preferences, 'fajr', false)).toBe('fajr-malmo');
    expect(resolveAdhanAudioSourceForPrayer(preferences, 'dhuhr', true)).toBe('local-upload');
    expect(resolveAdhanAudioSourceForPrayer(preferences, 'dhuhr', false)).toBe('beautiful-adhan');
    expect(resolveAdhanAudioSourceForPrayer(preferences, 'isha', false)).toBe('beautiful-adhan');
  });
});
