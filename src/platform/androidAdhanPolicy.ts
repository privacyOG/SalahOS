export type AndroidAdhanLifecycle = 'foreground' | 'background' | 'terminated';

export type AndroidAdhanPlaybackReason =
  | 'local-audio-not-configured'
  | 'background-playback-not-guaranteed'
  | 'foreground-local-audio-available';

export type AndroidAdhanPlaybackPolicy =
  | {
      readonly delivery: 'notification-alert';
      readonly fullAudioAutoPlay: false;
      readonly reason: 'local-audio-not-configured' | 'background-playback-not-guaranteed';
    }
  | {
      readonly delivery: 'foreground-local-audio';
      readonly fullAudioAutoPlay: true;
      readonly reason: 'foreground-local-audio-available';
    };

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
    delivery: 'foreground-local-audio',
    fullAudioAutoPlay: true,
    reason: 'foreground-local-audio-available',
  };
}
