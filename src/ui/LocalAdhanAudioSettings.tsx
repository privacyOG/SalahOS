import { useEffect, useMemo, useRef, useState } from 'react';
import type { NotificationPreferences } from '../domain/notificationPreferences';
import { translate } from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import {
  foregroundAdhanPlaybackKey,
  loadLocalAdhanAudio,
  MAX_LOCAL_ADHAN_AUDIO_BYTES,
  removeLocalAdhanAudio,
  saveLocalAdhanAudio,
  type LocalAdhanAudioRecord,
  type LocalAdhanPrayerRow,
} from '../platform/localAdhanAudio';
import './LocalAdhanAudioSettings.css';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAutomaticPlaybackKey = useRef<string | null>(null);
  const [record, setRecord] = useState<LocalAdhanAudioRecord | null>(null);
  const [messageKey, setMessageKey] = useState<TranslationKey | null>(null);

  useEffect(() => {
    let active = true;
    void loadLocalAdhanAudio()
      .then((loaded) => {
        if (active) setRecord(loaded);
      })
      .catch(() => {
        if (active) setMessageKey('localAdhanUnavailable');
      });
    return () => {
      active = false;
    };
  }, []);

  const audioUrl = useMemo(() => {
    if (record === null) return null;
    return URL.createObjectURL(record.blob);
  }, [record]);
  const formattedRecordSize = useMemo(() => {
    if (record === null) return null;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en-AU', {
      style: 'unit',
      unit: 'megabyte',
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(record.size / (1024 * 1024));
  }, [locale, record]);

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
      setMessageKey('localAdhanBlocked');
    });
  }, [audioUrl, date, localMinutes, notifications, prayers]);

  const selectAudio = async (file: File | undefined) => {
    if (file === undefined) return;
    setMessageKey(null);
    try {
      if (file.size > MAX_LOCAL_ADHAN_AUDIO_BYTES) throw new RangeError('oversized');
      const saved = await saveLocalAdhanAudio(file);
      setRecord(saved);
    } catch {
      setMessageKey('localAdhanInvalid');
    }
  };

  const preview = () => {
    setMessageKey(null);
    const player = audioRef.current;
    if (player === null) return;
    player.currentTime = 0;
    void player.play().catch(() => {
      setMessageKey('localAdhanBlocked');
    });
  };

  const remove = async () => {
    setMessageKey(null);
    try {
      await removeLocalAdhanAudio();
      audioRef.current?.pause();
      setRecord(null);
      lastAutomaticPlaybackKey.current = null;
    } catch {
      setMessageKey('localAdhanUnavailable');
    }
  };

  return (
    <section className="local-adhan-audio" aria-labelledby="local-adhan-audio-title">
      <h3 id="local-adhan-audio-title">{translate(locale, 'localAdhanTitle')}</h3>
      <label>
        <span>{translate(locale, 'localAdhanChoose')}</span>
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
        <p className="setting-help">{translate(locale, 'localAdhanNone')}</p>
      ) : (
        <div className="local-adhan-audio-selection">
          <p>
            <strong>{record.name}</strong> · {formattedRecordSize}
          </p>
          <div className="button-row">
            <button type="button" onClick={preview}>
              {translate(locale, 'localAdhanPreview')}
            </button>
            <button
              type="button"
              onClick={() => {
                void remove();
              }}
            >
              {translate(locale, 'localAdhanRemove')}
            </button>
          </div>
        </div>
      )}
      <p className="setting-help">{translate(locale, 'localAdhanHelp')}</p>
      {messageKey === null ? null : (
        <p className="setting-help" role="status">
          {translate(locale, messageKey)}
        </p>
      )}
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" />
    </section>
  );
}
