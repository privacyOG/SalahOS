export type AndroidAdhanLifecycle = 'foreground' | 'background' | 'terminated';

export type AndroidAdhanPlaybackReason =
  | 'local-audio-not-configured'
  | 'background-playback-not-guaranteed'
  | 'foreground-auto-play-disabled';

export interface AndroidAdhanPlaybackPolicy {
  readonly delivery: 'notification-alert';
  readonly fullAudioAutoPlay: false;
  readonly reason: AndroidAdhanPlaybackReason;
}

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
    reason: 'foreground-auto-play-disabled',
  };
}
