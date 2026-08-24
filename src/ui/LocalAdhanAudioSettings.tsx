import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NOTIFICATION_PRAYERS,
  type NotificationPrayerName,
  type NotificationPreferences,
} from '../domain/notificationPreferences';
import {
  defaultAdhanAudioPreferences,
  isAdhanAudioPrayerSelection,
  isAdhanAudioSourceId,
  packagedAdhanRecordings,
  resolveAdhanAudioSourceForPrayer,
  type AdhanAudioPrayerSelection,
  type AdhanAudioPreferences,
  type AdhanAudioSourceId,
} from '../domain/adhanAudioLibrary';
import { translate } from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import {
  loadAdhanAudioPreferences,
  saveAdhanAudioPreferences,
} from '../platform/adhanAudioPreferences';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  foregroundAdhanPlaybackEvent,
  loadLocalAdhanAudio,
  MAX_LOCAL_ADHAN_AUDIO_BYTES,
  removeLocalAdhanAudio,
  saveLocalAdhanAudio,
  type LocalAdhanAudioRecord,
  type LocalAdhanPrayerRow,
} from '../platform/localAdhanAudio';

type LibraryCopy = Readonly<{
  title: string;
  subtitle: string;
  packaged: string;
  offline: string;
  normalized: string;
  license: string;
  preview: string;
  defaultAudio: string;
  defaultHelp: string;
  perPrayer: string;
  inheritDefault: string;
  volume: string;
  notificationOnly: string;
  notificationOnlyHelp: string;
  localTitle: string;
  choose: string;
  localOption: string;
  remove: string;
  none: string;
  localHelp: string;
  deliveryHelp: string;
  invalid: string;
  unavailable: string;
  blocked: string;
  localMissing: string;
}>;

const copy: Readonly<Record<Locale, LibraryCopy>> = {
  en: {
    title: 'Adhan audio library',
    subtitle:
      'Choose a rights-verified packaged recording or a private local file, then set a default or override individual prayers.',
    packaged: 'Packaged recordings',
    offline: 'Packaged offline',
    normalized: 'Normalized to −16 LUFS / −1.5 dBTP',
    license: 'License',
    preview: 'Preview',
    defaultAudio: 'Default Adhan',
    defaultHelp: 'Used for every enabled Adhan prayer unless a prayer override is selected.',
    perPrayer: 'Per-prayer audio',
    inheritDefault: 'Use default Adhan',
    volume: 'Playback volume',
    notificationOnly: 'Notification only',
    notificationOnlyHelp:
      'Do not auto-play the full Adhan while SalahOS is visible. Scheduled platform notifications continue normally.',
    localTitle: 'Private local recording',
    choose: 'Choose local audio',
    localOption: 'Local uploaded recording',
    remove: 'Remove local recording',
    none: 'No local recording selected.',
    localHelp:
      'A local recording stays on this device and is never uploaded. It can be selected as the default or for individual prayers.',
    deliveryHelp:
      'Full Adhan playback is app-owned and can start automatically only while SalahOS is open and visible. Background or terminated delivery remains an operating-system notification; the packaged full recordings are not presented as unrestricted background notification audio.',
    invalid: 'Choose a non-empty audio file up to 25 MB.',
    unavailable: 'Adhan audio settings or local media storage are unavailable on this device.',
    blocked:
      'Playback was blocked by the device. Use Preview once while the app is open, then keep SalahOS visible for foreground Adhan playback.',
    localMissing:
      'A saved selection points to local audio, but no local recording is currently stored. SalahOS will use Beautiful Adhan as the safe fallback.',
  },
  ar: {
    title: 'مكتبة أصوات الأذان',
    subtitle:
      'اختر تسجيلاً مضمناً موثّق الحقوق أو ملفاً محلياً خاصاً، ثم حدّد الصوت الافتراضي أو صوتاً لكل صلاة.',
    packaged: 'التسجيلات المضمّنة',
    offline: 'متاح دون اتصال',
    normalized: 'توحيد مستوى الصوت إلى ‎−16 LUFS / −1.5 dBTP',
    license: 'الترخيص',
    preview: 'استماع تجريبي',
    defaultAudio: 'الأذان الافتراضي',
    defaultHelp: 'يُستخدم لكل صلاة مفعّل لها الأذان ما لم تختَر تسجيلاً خاصاً للصلاة.',
    perPrayer: 'صوت لكل صلاة',
    inheritDefault: 'استخدام الأذان الافتراضي',
    volume: 'مستوى صوت التشغيل',
    notificationOnly: 'إشعار فقط',
    notificationOnlyHelp:
      'لا تشغّل الأذان الكامل تلقائياً أثناء ظهور صلاح أو إس. تستمر إشعارات النظام المجدولة بصورة طبيعية.',
    localTitle: 'تسجيل محلي خاص',
    choose: 'اختر ملفاً صوتياً محلياً',
    localOption: 'التسجيل المحلي المرفوع',
    remove: 'إزالة التسجيل المحلي',
    none: 'لم يتم اختيار تسجيل محلي.',
    localHelp:
      'يبقى التسجيل المحلي على هذا الجهاز ولا يتم رفعه. ويمكن اختياره افتراضياً أو لصلاة محددة.',
    deliveryHelp:
      'تشغيل الأذان الكامل تديره واجهة التطبيق ولا يبدأ تلقائياً إلا عندما يكون صلاح أو إس مفتوحاً وظاهراً. في الخلفية أو بعد إغلاق التطبيق يبقى التسليم عبر إشعار نظام التشغيل، ولا تُقدَّم التسجيلات الكاملة كصوت إشعار يعمل بلا قيود.',
    invalid: 'اختر ملفاً صوتياً غير فارغ بحجم لا يتجاوز 25 ميغابايت.',
    unavailable: 'إعدادات صوت الأذان أو تخزين الوسائط المحلية غير متاحة على هذا الجهاز.',
    blocked:
      'منع الجهاز التشغيل. استخدم الاستماع التجريبي مرة أثناء فتح التطبيق ثم اترك صلاح أو إس ظاهراً لتشغيل الأذان في الواجهة.',
    localMissing:
      'يشير اختيار محفوظ إلى صوت محلي، لكن لا يوجد تسجيل محلي مخزّن حالياً. سيستخدم صلاح أو إس تسجيل Beautiful Adhan كبديل آمن.',
  },
  tr: {
    title: 'Ezan ses kitaplığı',
    subtitle:
      'Hakları doğrulanmış paketlenmiş bir kayıt veya özel yerel dosya seçin; ardından varsayılanı ya da namaz başına sesi belirleyin.',
    packaged: 'Paketlenmiş kayıtlar',
    offline: 'Çevrimdışı paketli',
    normalized: '−16 LUFS / −1.5 dBTP düzeyine normalize edildi',
    license: 'Lisans',
    preview: 'Önizle',
    defaultAudio: 'Varsayılan ezan',
    defaultHelp: 'Namaza özel bir seçim yapılmadıkça ezanı açık olan tüm namazlarda kullanılır.',
    perPrayer: 'Namaz başına ses',
    inheritDefault: 'Varsayılan ezanı kullan',
    volume: 'Oynatma ses düzeyi',
    notificationOnly: 'Yalnızca bildirim',
    notificationOnlyHelp:
      'SalahOS görünürken tam ezanı otomatik çalma. Planlanmış platform bildirimleri normal şekilde devam eder.',
    localTitle: 'Özel yerel kayıt',
    choose: 'Yerel ses seç',
    localOption: 'Yüklenen yerel kayıt',
    remove: 'Yerel kaydı kaldır',
    none: 'Yerel kayıt seçilmedi.',
    localHelp:
      'Yerel kayıt bu cihazda kalır ve yüklenmez. Varsayılan veya belirli namazlar için seçilebilir.',
    deliveryHelp:
      'Tam ezan oynatımı uygulama tarafından yönetilir ve yalnızca SalahOS açık ve görünürken otomatik başlayabilir. Arka planda veya uygulama kapalıyken teslimat işletim sistemi bildirimi olarak kalır; tam kayıtlar sınırsız arka plan bildirim sesi olarak sunulmaz.',
    invalid: '25 MB’a kadar boş olmayan bir ses dosyası seçin.',
    unavailable: 'Ezan ses ayarları veya yerel medya depolaması bu cihazda kullanılamıyor.',
    blocked:
      'Oynatma cihaz tarafından engellendi. Uygulama açıkken bir kez Önizle’yi kullanın, ardından ön planda ezan için SalahOS’u görünür tutun.',
    localMissing:
      'Kayıtlı seçim yerel sese işaret ediyor ancak yerel kayıt bulunmuyor. SalahOS güvenli geri dönüş olarak Beautiful Adhan kullanacaktır.',
  },
  id: {
    title: 'Pustaka audio Adzan',
    subtitle:
      'Pilih rekaman bawaan dengan hak distribusi terverifikasi atau berkas lokal pribadi, lalu atur default atau audio per salat.',
    packaged: 'Rekaman bawaan',
    offline: 'Bawaan luring',
    normalized: 'Dinormalisasi ke −16 LUFS / −1.5 dBTP',
    license: 'Lisensi',
    preview: 'Pratinjau',
    defaultAudio: 'Adzan default',
    defaultHelp:
      'Dipakai untuk setiap salat dengan Adzan aktif kecuali ada pilihan khusus per salat.',
    perPrayer: 'Audio per salat',
    inheritDefault: 'Gunakan Adzan default',
    volume: 'Volume pemutaran',
    notificationOnly: 'Notifikasi saja',
    notificationOnlyHelp:
      'Jangan putar Adzan penuh otomatis saat SalahOS terlihat. Notifikasi platform terjadwal tetap berjalan normal.',
    localTitle: 'Rekaman lokal pribadi',
    choose: 'Pilih audio lokal',
    localOption: 'Rekaman lokal yang diunggah',
    remove: 'Hapus rekaman lokal',
    none: 'Belum ada rekaman lokal yang dipilih.',
    localHelp:
      'Rekaman lokal tetap di perangkat ini dan tidak diunggah. Rekaman dapat dipilih sebagai default atau untuk salat tertentu.',
    deliveryHelp:
      'Pemutaran Adzan penuh dikelola aplikasi dan hanya dapat mulai otomatis saat SalahOS terbuka dan terlihat. Di latar belakang atau setelah aplikasi ditutup, pengiriman tetap berupa notifikasi sistem operasi; rekaman penuh tidak dijanjikan sebagai audio notifikasi latar belakang tanpa batas.',
    invalid: 'Pilih berkas audio yang tidak kosong hingga 25 MB.',
    unavailable:
      'Pengaturan audio Adzan atau penyimpanan media lokal tidak tersedia di perangkat ini.',
    blocked:
      'Pemutaran diblokir perangkat. Gunakan Pratinjau sekali saat aplikasi terbuka, lalu biarkan SalahOS terlihat untuk Adzan di latar depan.',
    localMissing:
      'Pilihan tersimpan menunjuk ke audio lokal, tetapi rekaman lokal tidak tersedia. SalahOS akan memakai Beautiful Adhan sebagai fallback aman.',
  },
};

const prayerTranslationKeys: Readonly<Record<NotificationPrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

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
  const [preferences, setPreferences] = useState<AdhanAudioPreferences>(
    defaultAdhanAudioPreferences,
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPreferences(loadAdhanAudioPreferences(getApplicationStorage()));
    } catch {
      setMessage(labels.unavailable);
    }
  }, [labels.unavailable]);

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

  const localAudioUrl = useMemo(() => {
    if (record === null) return null;
    return URL.createObjectURL(record.blob);
  }, [record]);

  useEffect(
    () => () => {
      if (localAudioUrl !== null) URL.revokeObjectURL(localAudioUrl);
    },
    [localAudioUrl],
  );

  const sourceUrlFor = useCallback(
    (sourceId: AdhanAudioSourceId): string | null => {
      if (sourceId === 'local-upload') return localAudioUrl;
      return packagedAdhanRecordings.find((recording) => recording.id === sourceId)?.url ?? null;
    },
    [localAudioUrl],
  );

  const playSource = useCallback(
    (sourceId: AdhanAudioSourceId) => {
      setMessage(null);
      const url = sourceUrlFor(sourceId);
      if (url === null) {
        setMessage(labels.localMissing);
        return;
      }
      const player = audioRef.current;
      if (player === null) return;
      player.pause();
      player.src = url;
      player.volume = preferences.volumePercent / 100;
      player.currentTime = 0;
      void player.play().catch(() => {
        setMessage(labels.blocked);
      });
    },
    [labels.blocked, labels.localMissing, preferences.volumePercent, sourceUrlFor],
  );

  useEffect(() => {
    const player = audioRef.current;
    if (player !== null) player.volume = preferences.volumePercent / 100;
  }, [preferences.volumePercent]);

  useEffect(() => {
    if (
      preferences.notificationOnly ||
      date === null ||
      localMinutes === null ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    const playback = foregroundAdhanPlaybackEvent({
      date,
      localMinutes,
      prayers,
      notifications,
    });
    if (playback === null || playback.key === lastAutomaticPlaybackKey.current) {
      return;
    }

    lastAutomaticPlaybackKey.current = playback.key;
    playSource(resolveAdhanAudioSourceForPrayer(preferences, playback.prayer, record !== null));
  }, [date, localMinutes, notifications, playSource, prayers, preferences, record]);

  const persistPreferences = (next: AdhanAudioPreferences) => {
    setPreferences(next);
    try {
      saveAdhanAudioPreferences(getApplicationStorage(), next);
      setMessage(null);
    } catch {
      setMessage(labels.unavailable);
    }
  };

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

  const remove = async () => {
    setMessage(null);
    try {
      await removeLocalAdhanAudio();
      audioRef.current?.pause();
      setRecord(null);
    } catch {
      setMessage(labels.unavailable);
    }
  };

  const localConfigured =
    preferences.defaultSourceId === 'local-upload' ||
    Object.values(preferences.prayerSelections).includes('local-upload');

  const sourceOptions = () => [
    ...packagedAdhanRecordings.map((recording) => (
      <option key={recording.id} value={recording.id}>
        {recording.title}
      </option>
    )),
    <option key="local-upload" value="local-upload" disabled={record === null}>
      {record === null ? labels.localOption : `${labels.localOption} — ${record.name}`}
    </option>,
  ];

  return (
    <section className="adhan-audio-library" aria-labelledby="adhan-audio-library-title">
      <header className="adhan-audio-library__header">
        <h3 id="adhan-audio-library-title">{labels.title}</h3>
        <p>{labels.subtitle}</p>
      </header>

      <div>
        <h4>{labels.packaged}</h4>
        <div className="adhan-audio-library__catalog" role="list">
          {packagedAdhanRecordings.map((recording) => (
            <article
              className="adhan-audio-library__recording"
              data-adhan-source={recording.id}
              key={recording.id}
              role="listitem"
            >
              <div>
                <h5>{recording.title}</h5>
                <p>{recording.author}</p>
              </div>
              <div className="adhan-audio-library__recording-meta">
                <span className="adhan-audio-library__badge">{labels.offline}</span>
                <span>
                  {labels.license}: {recording.license}
                </span>
              </div>
              <p className="setting-help">{labels.normalized}</p>
              <button
                type="button"
                aria-label={`${labels.preview}: ${recording.title}`}
                onClick={() => {
                  playSource(recording.id);
                }}
              >
                {labels.preview}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="adhan-audio-library__configuration">
        <label>
          <span>{labels.defaultAudio}</span>
          <select
            data-testid="adhan-default-source"
            value={preferences.defaultSourceId}
            onChange={(event) => {
              if (!isAdhanAudioSourceId(event.target.value)) return;
              persistPreferences({ ...preferences, defaultSourceId: event.target.value });
            }}
          >
            {sourceOptions()}
          </select>
          <small>{labels.defaultHelp}</small>
        </label>

        <label className="adhan-audio-library__volume">
          <span>{labels.volume}</span>
          <span className="adhan-audio-library__volume-control">
            <input
              data-testid="adhan-volume"
              type="range"
              min="0"
              max="100"
              step="1"
              value={preferences.volumePercent}
              onChange={(event) => {
                persistPreferences({
                  ...preferences,
                  volumePercent: Number(event.target.value),
                });
              }}
            />
            <output>{preferences.volumePercent}%</output>
          </span>
        </label>

        <label className="adhan-audio-library__notification-only">
          <input
            data-testid="adhan-notification-only"
            type="checkbox"
            checked={preferences.notificationOnly}
            onChange={(event) => {
              persistPreferences({ ...preferences, notificationOnly: event.target.checked });
            }}
          />
          <span>
            <strong>{labels.notificationOnly}</strong>
            <small>{labels.notificationOnlyHelp}</small>
          </span>
        </label>

        <fieldset className="adhan-audio-library__prayer-fieldset">
          <legend>{labels.perPrayer}</legend>
          <div className="adhan-audio-library__prayer-grid">
            {NOTIFICATION_PRAYERS.map((prayer) => (
              <label key={prayer}>
                <span>{translate(locale, prayerTranslationKeys[prayer])}</span>
                <select
                  data-adhan-prayer={prayer}
                  value={preferences.prayerSelections[prayer]}
                  onChange={(event) => {
                    if (!isAdhanAudioPrayerSelection(event.target.value)) return;
                    const selection: AdhanAudioPrayerSelection = event.target.value;
                    persistPreferences({
                      ...preferences,
                      prayerSelections: {
                        ...preferences.prayerSelections,
                        [prayer]: selection,
                      },
                    });
                  }}
                >
                  <option value="default">{labels.inheritDefault}</option>
                  {sourceOptions()}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="adhan-audio-library__local">
        <h4>{labels.localTitle}</h4>
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
              <button
                type="button"
                onClick={() => {
                  playSource('local-upload');
                }}
              >
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
        <p className="setting-help">{labels.localHelp}</p>
      </div>

      {record === null && localConfigured ? (
        <p className="inline-message" role="status">
          {labels.localMissing}
        </p>
      ) : null}
      {message === null ? null : (
        <p className="inline-message" role="status">
          {message}
        </p>
      )}
      <p className="setting-help adhan-audio-library__delivery">{labels.deliveryHelp}</p>
      <audio ref={audioRef} preload="metadata" />
    </section>
  );
}
