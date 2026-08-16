export type AndroidAdhanLifecycle = 'foreground' | 'background' | 'terminated';

export type AndroidAdhanPlaybackReason =
  | 'local-audio-not-configured'
  | 'background-playback-not-guaranteed'
  | 'foreground-audio-owned-by-visible-app-player';

export interface AndroidAdhanPlaybackPolicy {
  readonly delivery: 'notification-alert';
  readonly fullAudioAutoPlay: false;
  readonly reason: AndroidAdhanPlaybackReason;
}

/**
 * Describe what the Android native notification adapter itself provides.
 * Foreground full-recording playback is intentionally owned by the separate
 * visible-app local-audio player, so this native notification policy never
 * claims that the scheduler starts unrestricted full audio.
 */
export function androidAdhanPlaybackPolicy(
  lifecycle: AndroidAdhanLifecycle,
  options: { readonly localAudioConfigured?: boolean } = {},
): AndroidAdhanPlaybackPolicy {
  if (lifecycle !== 'foreground') {
    return {
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'background-playback-not-guaranteed',
    };
  }

  if (options.localAudioConfigured !== true) {
    return {
      delivery: 'notification-alert',
      fullAudioAutoPlay: false,
      reason: 'local-audio-not-configured',
    };
  }

  return {
    delivery: 'notification-alert',
    fullAudioAutoPlay: false,
    reason: 'foreground-audio-owned-by-visible-app-player',
  };
}
