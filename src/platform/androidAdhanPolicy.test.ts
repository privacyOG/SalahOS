import { describe, expect, it } from 'vitest';
import { androidAdhanPlaybackPolicy } from './androidAdhanPolicy';

describe('Android Adhan lifecycle policy', () => {
  it('keeps background delivery notification-only even when local audio is configured', () => {
    expect(androidAdhanPlaybackPolicy('background', { localAudioConfigured: true })).toEqual({
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'background-playback-not-guaranteed',
    });
  });

  it('keeps terminated delivery notification-only', () => {
    expect(androidAdhanPlaybackPolicy('terminated')).toEqual({
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'background-playback-not-guaranteed',
    });
  });

  it('does not imply full playback when no foreground local audio is configured', () => {
    expect(androidAdhanPlaybackPolicy('foreground')).toEqual({
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'local-audio-not-configured',
    });
  });

  it('keeps full foreground audio owned by the separate visible-app player', () => {
    expect(androidAdhanPlaybackPolicy('foreground', { localAudioConfigured: true })).toEqual({
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'foreground-audio-owned-by-visible-app-player',
    });
  });
});
