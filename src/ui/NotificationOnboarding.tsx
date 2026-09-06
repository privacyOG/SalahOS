import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  allPrayerNotificationsSelected,
  applyNotificationOnboardingSelection,
  noPrayerNotificationsSelected,
  notificationSelectionFromPreferences,
  type NotificationPrayerSelection,
} from '../domain/notificationOnboardingPreferences';
import {
  NOTIFICATION_PRAYERS,
  type NotificationPrayerName,
} from '../domain/notificationPreferences';
import { translate } from '../i18n/i18n';
import type { Locale, TranslationKey } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  completeNotificationOnboarding,
  notificationOnboardingRequired,
  NOTIFICATION_ONBOARDING_COMPLETE_EVENT,
  NOTIFICATION_ONBOARDING_OPEN_EVENT,
} from '../platform/notificationOnboarding';
import { requestNativePrayerNotificationPermission } from '../platform/notificationPermission';
import {
  prayerSetupOnboardingRequired,
  PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT,
} from '../platform/prayerSetupOnboarding';
import { qiblaPermissionOnboardingRequired } from '../platform/qiblaPermissionOnboarding';
import { loadPersistedSettings, savePersistedSettings } from '../platform/settingsStorage';

type Copy = Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  limitationsTitle: string;
  limitations: string;
  selectAll: string;
  selectPrayers: string;
  enable: string;
  notNow: string;
  permissionNote: string;
}>;

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    eyebrow: 'SalahOS · Notifications',
    title: 'Choose prayer notifications',
    body: 'Choose which obligatory prayers may create local notification alerts on this device. You can change these preferences later in Settings.',
    limitationsTitle: 'Platform limits',
    limitations:
      'Android and iOS control final notification delivery and timing. Web/PWA cannot be treated as an exact background alarm. Full-length local Adhan playback is only attempted while SalahOS is visible; background or terminated delivery remains notification-only where supported.',
    selectAll: 'All prayers',
    selectPrayers: 'Prayer alerts',
    enable: 'Enable selected notifications',
    notNow: 'Not now',
    permissionNote:
      'If you opt in on Android or iOS, SalahOS will then ask the operating system for notification permission. This step never opens Android exact-alarm settings.',
  },
  ar: {
    eyebrow: 'SalahOS · الإشعارات',
    title: 'اختر إشعارات الصلاة',
    body: 'اختر الصلوات المفروضة التي يمكن أن تُنشئ تنبيهات محلية على هذا الجهاز. يمكنك تغيير هذه التفضيلات لاحقاً من الإعدادات.',
    limitationsTitle: 'قيود المنصة',
    limitations:
      'يتحكم Android وiOS في التسليم النهائي للإشعارات وتوقيتها. لا يمكن اعتبار الويب أو PWA منبهاً خلفياً دقيقاً. لا تُحاول تلاوة الأذان المحلي كاملة إلا عندما يكون SalahOS ظاهراً؛ أما في الخلفية أو بعد إغلاق التطبيق فيبقى التسليم إشعاراً فقط حيث يكون ذلك مدعوماً.',
    selectAll: 'كل الصلوات',
    selectPrayers: 'تنبيهات الصلاة',
    enable: 'تفعيل الإشعارات المحددة',
    notNow: 'ليس الآن',
    permissionNote:
      'إذا اخترت التفعيل على Android أو iOS فسيطلب SalahOS بعدها إذن الإشعارات من نظام التشغيل. لا تفتح هذه الخطوة إعدادات المنبه الدقيق في Android.',
  },
  tr: {
    eyebrow: 'SalahOS · Bildirimler',
    title: 'Namaz bildirimlerini seçin',
    body: 'Bu cihazda yerel bildirim oluşturabilecek farz namazları seçin. Bu tercihleri daha sonra Ayarlar’dan değiştirebilirsiniz.',
    limitationsTitle: 'Platform sınırları',
    limitations:
      'Android ve iOS bildirimlerin son teslimini ve zamanlamasını kontrol eder. Web/PWA kesin bir arka plan alarmı olarak kabul edilemez. Tam uzunlukta yerel ezan yalnızca SalahOS görünürken denenir; arka planda veya uygulama kapalıyken desteklenen yol bildirimle sınırlıdır.',
    selectAll: 'Tüm namazlar',
    selectPrayers: 'Namaz bildirimleri',
    enable: 'Seçili bildirimleri etkinleştir',
    notNow: 'Şimdi değil',
    permissionNote:
      'Android veya iOS’ta etkinleştirirseniz SalahOS daha sonra işletim sisteminden bildirim izni ister. Bu adım Android kesin alarm ayarlarını açmaz.',
  },
  id: {
    eyebrow: 'SalahOS · Notifikasi',
    title: 'Pilih notifikasi salat',
    body: 'Pilih salat wajib yang boleh membuat notifikasi lokal di perangkat ini. Preferensi ini dapat diubah nanti di Pengaturan.',
    limitationsTitle: 'Batas platform',
    limitations:
      'Android dan iOS mengendalikan pengiriman dan ketepatan waktu notifikasi. Web/PWA tidak dapat dianggap sebagai alarm latar belakang yang tepat. Adzan lokal berdurasi penuh hanya dicoba ketika SalahOS terlihat; saat aplikasi berada di latar belakang atau dihentikan, jalur yang didukung tetap berupa notifikasi.',
    selectAll: 'Semua salat',
    selectPrayers: 'Notifikasi salat',
    enable: 'Aktifkan notifikasi terpilih',
    notNow: 'Nanti saja',
    permissionNote:
      'Jika Anda memilih aktif di Android atau iOS, SalahOS baru kemudian meminta izin notifikasi dari sistem operasi. Langkah ini tidak membuka pengaturan alarm tepat Android.',
  },
};

const prayerTranslationKeys: Readonly<Record<NotificationPrayerName, TranslationKey>> = {
  fajr: 'prayerFajr',
  dhuhr: 'prayerDhuhr',
  asr: 'prayerAsr',
  maghrib: 'prayerMaghrib',
  isha: 'prayerIsha',
};

function initialState() {
  const storage = getApplicationStorage();
  const settings = loadPersistedSettings(storage);
  return {
    settings,
    visible:
      notificationOnboardingRequired(storage) &&
      !qiblaPermissionOnboardingRequired(storage) &&
      !prayerSetupOnboardingRequired(storage),
    selection: notificationSelectionFromPreferences(settings.notifications),
  };
}

export function NotificationOnboarding() {
  const initial = useMemo(initialState, []);
  const [settings, setSettings] = useState(initial.settings);
  const [selection, setSelection] = useState<NotificationPrayerSelection>(initial.selection);
  const [visible, setVisible] = useState(initial.visible);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = copy[settings.locale];
  const allSelected = NOTIFICATION_PRAYERS.every((prayer) => selection[prayer]);
  const anySelected = NOTIFICATION_PRAYERS.some((prayer) => selection[prayer]);

  const showWithLatestSettings = useCallback((requireIncomplete: boolean) => {
    const storage = getApplicationStorage();
    if (requireIncomplete && !notificationOnboardingRequired(storage)) return;
    const latest = loadPersistedSettings(storage);
    setSettings(latest);
    setSelection(notificationSelectionFromPreferences(latest.notifications));
    setVisible(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!visible || dialog === null || dialog.open) return;
    dialog.showModal();
  }, [visible]);

  useEffect(() => {
    const continueAfterPrayerSetup = () => {
      showWithLatestSettings(true);
    };
    const reopen = () => {
      showWithLatestSettings(false);
    };
    window.addEventListener(PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT, continueAfterPrayerSetup);
    window.addEventListener(NOTIFICATION_ONBOARDING_OPEN_EVENT, reopen);
    return () => {
      window.removeEventListener(PRAYER_SETUP_ONBOARDING_COMPLETE_EVENT, continueAfterPrayerSetup);
      window.removeEventListener(NOTIFICATION_ONBOARDING_OPEN_EVENT, reopen);
    };
  }, [showWithLatestSettings]);

  if (!visible) return null;

  const close = () => {
    dialogRef.current?.close();
    setVisible(false);
    setBusy(false);
    window.dispatchEvent(new Event(NOTIFICATION_ONBOARDING_COMPLETE_EVENT));
  };

  const decline = () => {
    const storage = getApplicationStorage();
    if (notificationOnboardingRequired(storage)) {
      completeNotificationOnboarding(storage, 'declined');
    }
    close();
  };

  const enable = async () => {
    if (!anySelected || busy) return;
    setBusy(true);
    const storage = getApplicationStorage();
    const latest = loadPersistedSettings(storage);
    const notifications = applyNotificationOnboardingSelection(latest.notifications, selection);
    savePersistedSettings(storage, { ...latest, notifications });

    try {
      await requestNativePrayerNotificationPermission();
    } catch {
      // Preferences remain saved; platform permission can be reviewed later in system settings.
    }

    completeNotificationOnboarding(storage, 'enabled');
    close();
  };

  const setPrayer = (prayer: NotificationPrayerName, enabled: boolean) => {
    setSelection((current) => ({ ...current, [prayer]: enabled }));
  };

  return (
    <dialog
      ref={dialogRef}
      className="prayer-setup-onboarding notification-onboarding"
      aria-labelledby="notification-onboarding-title"
      data-notification-onboarding
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) decline();
      }}
    >
      <div className="prayer-setup-onboarding__content">
        <p className="prayer-setup-onboarding__eyebrow">{text.eyebrow}</p>
        <h2 id="notification-onboarding-title">{text.title}</h2>
        <p>{text.body}</p>

        <section className="notification-onboarding__notice">
          <h3>{text.limitationsTitle}</h3>
          <p>{text.limitations}</p>
        </section>

        <fieldset className="notification-onboarding__prayers">
          <legend>{text.selectPrayers}</legend>
          <label className="notification-onboarding__all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => {
                setSelection(
                  event.currentTarget.checked
                    ? allPrayerNotificationsSelected
                    : noPrayerNotificationsSelected,
                );
              }}
            />
            <strong>{text.selectAll}</strong>
          </label>
          <div className="notification-onboarding__prayer-grid">
            {NOTIFICATION_PRAYERS.map((prayer) => (
              <label key={prayer}>
                <input
                  type="checkbox"
                  checked={selection[prayer]}
                  onChange={(event) => {
                    setPrayer(prayer, event.currentTarget.checked);
                  }}
                />
                <span>{translate(settings.locale, prayerTranslationKeys[prayer])}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="prayer-setup-onboarding__hint">{text.permissionNote}</p>

        <div className="prayer-setup-onboarding__actions">
          <button
            type="button"
            className="prayer-setup-onboarding__primary"
            disabled={!anySelected || busy}
            autoFocus
            onClick={() => {
              void enable();
            }}
          >
            {text.enable}
          </button>
          <button type="button" disabled={busy} onClick={decline}>
            {text.notNow}
          </button>
        </div>
      </div>
    </dialog>
  );
}
