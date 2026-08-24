import { useEffect, useMemo, useRef, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { requestCompassPermission } from '../platform/deviceCompass';
import {
  completeQiblaPermissionOnboarding,
  loadQiblaPermissionOnboarding,
} from '../platform/qiblaPermissionOnboarding';
import { requestQiblaLocation } from '../platform/qiblaLocation';
import { loadPersistedSettings } from '../platform/settingsStorage';

type PermissionOnboardingCopy = Readonly<{
  title: string;
  body: string;
  privacy: string;
  enable: string;
  enabling: string;
  later: string;
}>;

const copy: Readonly<Record<Locale, PermissionOnboardingCopy>> = {
  en: {
    title: 'Enable accurate Qiblah',
    body:
      'Allow foreground location and device heading so Qiblah can start live automatically. Your operating system chooses the best available positioning sources, such as GPS, Wi-Fi and cellular positioning.',
    privacy:
      'SalahOS does not request background location for Qiblah. Manual and saved locations remain available if you decline.',
    enable: 'Enable location & compass',
    enabling: 'Requesting permissions…',
    later: 'Not now',
  },
  ar: {
    title: 'تفعيل القبلة الدقيقة',
    body:
      'اسمح بالموقع أثناء الاستخدام واتجاه الجهاز لكي تبدأ القبلة مباشرة. يختار نظام التشغيل أفضل مصادر تحديد الموقع المتاحة مثل GPS وWi-Fi والشبكة الخلوية.',
    privacy:
      'لا يطلب SalahOS موقع الخلفية للقبلة. تبقى المواقع المحفوظة واليدوية متاحة إذا رفضت الإذن.',
    enable: 'تفعيل الموقع والبوصلة',
    enabling: 'جارٍ طلب الأذونات…',
    later: 'ليس الآن',
  },
  tr: {
    title: 'Hassas Kıbleyi etkinleştir',
    body:
      'Kıblenin otomatik olarak canlı başlaması için ön planda konum ve cihaz yönü izni verin. İşletim sistemi GPS, Wi-Fi ve hücresel konum gibi mevcut en iyi kaynakları seçer.',
    privacy:
      'SalahOS Kıble için arka plan konumu istemez. İzin vermezseniz kayıtlı ve elle seçilen konumlar kullanılabilir.',
    enable: 'Konum ve pusulayı etkinleştir',
    enabling: 'İzinler isteniyor…',
    later: 'Şimdi değil',
  },
  id: {
    title: 'Aktifkan Kiblat akurat',
    body:
      'Izinkan lokasi saat aplikasi digunakan dan arah perangkat agar Kiblat dapat langsung berjalan secara live. Sistem operasi memilih sumber posisi terbaik yang tersedia, seperti GPS, Wi-Fi, dan jaringan seluler.',
    privacy:
      'SalahOS tidak meminta lokasi latar belakang untuk Kiblat. Lokasi tersimpan dan manual tetap tersedia jika izin ditolak.',
    enable: 'Aktifkan lokasi & kompas',
    enabling: 'Meminta izin…',
    later: 'Nanti',
  },
};

function initialState(): { locale: Locale; visible: boolean } {
  const storage = getApplicationStorage();
  return {
    locale: loadPersistedSettings(storage).locale,
    visible: !loadQiblaPermissionOnboarding(storage).completed,
  };
}

export function QiblaPermissionOnboarding() {
  const initial = useMemo(initialState, []);
  const [visible, setVisible] = useState(initial.visible);
  const [requesting, setRequesting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const text = copy[initial.locale];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!visible || dialog === null || dialog.open) return;
    dialog.showModal();
  }, [visible]);

  if (!visible) return null;

  const finish = () => {
    completeQiblaPermissionOnboarding(getApplicationStorage());
    dialogRef.current?.close();
    setVisible(false);
  };

  const requestPermissions = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      // Device-orientation permission must be requested synchronously from a user gesture on
      // platforms such as iOS Safari, so request it before the asynchronous location flow.
      await requestCompassPermission();
      await requestQiblaLocation();
    } finally {
      finish();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="qibla-permission-onboarding"
      aria-labelledby="qibla-permission-title"
      data-qibla-permission-onboarding
    >
      <div className="qibla-permission-onboarding__content">
        <p className="qibla-permission-onboarding__eyebrow">SalahOS · Qiblah</p>
        <h2 id="qibla-permission-title">{text.title}</h2>
        <p>{text.body}</p>
        <p className="qibla-permission-onboarding__privacy">{text.privacy}</p>
        <div className="qibla-permission-onboarding__actions">
          <button
            type="button"
            className="qibla-permission-onboarding__primary"
            autoFocus
            disabled={requesting}
            onClick={() => {
              void requestPermissions();
            }}
          >
            {requesting ? text.enabling : text.enable}
          </button>
          <button type="button" disabled={requesting} onClick={finish}>
            {text.later}
          </button>
        </div>
      </div>
    </dialog>
  );
}
