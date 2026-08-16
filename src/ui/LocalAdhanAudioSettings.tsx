import { useEffect, useMemo, useRef, useState } from 'react';
import type { NotificationPreferences } from '../domain/notificationPreferences';
import type { Locale } from '../i18n/translations';
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

const copy = {
  en: {
    title: 'Local Adhan audio',
    choose: 'Choose local audio',
    preview: 'Preview',
    remove: 'Remove',
    none: 'No local recording selected.',
    help: 'The selected recording stays on this device. SalahOS does not upload or bundle it. Full local audio can play automatically only while the app is open and visible; background and terminated delivery continues to use the platform notification alert.',
    invalid: 'Choose a non-empty audio file up to 25 MB.',
    unavailable: 'Local audio storage is unavailable on this device.',
    blocked: 'Automatic playback was blocked by the device. Use Preview once while the app is open, then keep the app visible for foreground Adhan playback.',
  },
  ar: {
    title: 'صوت أذان محلي',
    choose: 'اختر ملفاً صوتياً محلياً',
    preview: 'استماع تجريبي',
    remove: 'إزالة',
    none: 'لم يتم اختيار تسجيل محلي.',
    help: 'يبقى التسجيل المختار على هذا الجهاز ولا يرفعه صلاح أو إس ولا يضمّنه في التطبيق. يمكن تشغيل الصوت المحلي الكامل تلقائياً فقط عندما يكون التطبيق مفتوحاً وظاهراً؛ أما في الخلفية أو بعد إغلاق التطبيق فيستمر التنبيه وفق نظام الإشعارات في الجهاز.',
    invalid: 'اختر ملفاً صوتياً غير فارغ بحجم لا يتجاوز 25 ميغابايت.',
    unavailable: 'تخزين الصوت المحلي غير متاح على هذا الجهاز.',
    blocked: 'منع الجهاز التشغيل التلقائي. استخدم الاستماع التجريبي مرة أثناء فتح التطبيق ثم اترك التطبيق ظاهراً لتشغيل الأذان في الواجهة.',
  },
} as const;

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
