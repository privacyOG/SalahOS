import { useEffect, useMemo, useRef, useState } from 'react';
import type { NotificationPreferences } from '../domain/notificationPreferences';
import type { Locale } from '../i18n/translations';
import { localAdhanAudioCopy } from '../i18n/featureTranslations';
import {
  foregroundAdhanPlaybackKey,
  loadLocalAdhanAudio,
  MAX_LOCAL_ADHAN_AUDIO_BYTES,
  removeLocalAdhanAudio,
  saveLocalAdhanAudio,
  type LocalAdhanAudioRecord,
  type LocalAdhanPrayerRow,
} from '../platform/localAdhanAudio';

const copy = localAdhanAudioCopy;

export interface LocalAdhanAudioSettingsProps {
  readonly locale: Locale;
  readonly date: string | null;
  readonly localMinutes: number | null;
  readonly prayers: readonly LocalAdhanPrayerRow[];
  readonly notifications: NotificationPreferences;
}

export function LocalAdhanAudioSettings({
  locale,
  date,
  localMinutes,
  prayers,
  notifications,
}: LocalAdhanAudioSettingsProps) {
  const labels = copy[locale];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAutomaticPlaybackKey = useRef<string | null>(null);
  const [record, setRecord] = useState<LocalAdhanAudioRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadLocalAdhanAudio()
      .then((loaded) => {
        if (active) setRecord(loaded);
      })
      .catch(() => {
        if (active) setMessage(labels.unavailable);
      });
    return () => {
      active = false;
    };
  }, [labels.unavailable]);

  const audioUrl = useMemo(() => {
    if (record === null) return null;
    return URL.createObjectURL(record.blob);
  }, [record]);

  useEffect(
    () => () => {
      if (audioUrl !== null) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  useEffect(() => {
    if (
      audioUrl === null ||
      date === null ||
      localMinutes === null ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    const playbackKey = foregroundAdhanPlaybackKey({
      date,
      localMinutes,
      prayers,
      notifications,
    });
    if (playbackKey === null || playbackKey === lastAutomaticPlaybackKey.current) {
      return;
    }

    lastAutomaticPlaybackKey.current = playbackKey;
    const player = audioRef.current;
    if (player === null) return;
    player.currentTime = 0;
    void player.play().catch(() => {
      setMessage(labels.blocked);
    });
  }, [audioUrl, date, labels.blocked, localMinutes, notifications, prayers]);

  const selectAudio = async (file: File | undefined) => {
    if (file === undefined) return;
    setMessage(null);
    try {
      if (file.size > MAX_LOCAL_ADHAN_AUDIO_BYTES) throw new RangeError('oversized');
      const saved = await saveLocalAdhanAudio(file);
      setRecord(saved);
    } catch {
      setMessage(labels.invalid);
    }
  };

  const preview = () => {
    setMessage(null);
    const player = audioRef.current;
    if (player === null) return;
    player.currentTime = 0;
    void player.play().catch(() => {
      setMessage(labels.blocked);
    });
  };

  const remove = async () => {
    setMessage(null);
    try {
      await removeLocalAdhanAudio();
      audioRef.current?.pause();
      setRecord(null);
      lastAutomaticPlaybackKey.current = null;
    } catch {
      setMessage(labels.unavailable);
    }
  };

  return (
    <section className="local-adhan-audio" aria-labelledby="local-adhan-audio-title">
      <h3 id="local-adhan-audio-title">{labels.title}</h3>
      <label>
        <span>{labels.choose}</span>
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => {
            void selectAudio(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {record === null ? (
        <p className="setting-help">{labels.none}</p>
      ) : (
        <div className="local-adhan-audio-selection">
          <p>
            <strong>{record.name}</strong> · {(record.size / (1024 * 1024)).toFixed(1)} MB
          </p>
          <div className="button-row">
            <button type="button" onClick={preview}>
              {labels.preview}
            </button>
            <button
              type="button"
              onClick={() => {
                void remove();
              }}
            >
              {labels.remove}
            </button>
          </div>
        </div>
      )}
      <p className="setting-help">{labels.help}</p>
      {message === null ? null : (
        <p className="setting-help" role="status">
          {message}
        </p>
      )}
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" />
    </section>
  );
}
