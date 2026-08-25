import { useEffect, useMemo, useRef, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  LOCATION_CONTEXT_CHANGE_EVENT,
  persistBestAvailableLocation,
  resolveBestAvailableLocation,
  type LocationFallback,
} from '../platform/bestAvailableLocation';
import { requestCompassPermission } from '../platform/deviceCompass';
import {
  completeQiblaPermissionOnboarding,
  LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT,
  qiblaPermissionOnboardingRequired,
} from '../platform/qiblaPermissionOnboarding';
import { loadPersistedSettings } from '../platform/settingsStorage';

type PermissionOnboardingCopy = Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  detail: string;
  enable: string;
  enabling: string;
  later: string;
}>;

const copy: Readonly<Record<Locale, PermissionOnboardingCopy>> = {
  en: {
    eyebrow: 'SalahOS · Location',
    title: 'Make SalahOS local to you',
    body: 'Allow location while using SalahOS to automatically calculate local prayer times, find nearby mosques, provide Qiblah guidance and show local weather.',
    detail:
      'Your operating system chooses the best available source, including GPS, Wi-Fi or cellular positioning. Manual and saved locations remain available if you prefer not to enable it.',
    enable: 'Enable location & compass',
    enabling: 'Requesting permissions…',
    later: 'Not now',
  },
  ar: {
    eyebrow: 'SalahOS · الموقع',
    title: 'اجعل SalahOS محلياً لك',
    body: 'اسمح بالموقع أثناء استخدام SalahOS لحساب مواقيت الصلاة المحلية تلقائياً والعثور على المساجد القريبة وتوجيه القبلة وعرض الطقس المحلي.',
    detail:
      'يختار نظام التشغيل أفضل مصدر متاح، بما في ذلك GPS أو Wi-Fi أو الشبكة الخلوية. تبقى المواقع اليدوية والمحفوظة متاحة إذا فضّلت عدم التفعيل.',
    enable: 'تفعيل الموقع والبوصلة',
    enabling: 'جارٍ طلب الأذونات…',
    later: 'ليس الآن',
  },
  tr: {
    eyebrow: 'SalahOS · Konum',
    title: 'SalahOS bulunduğunuz yere uyum sağlasın',
    body: 'Yerel namaz vakitlerini otomatik hesaplamak, yakındaki camileri bulmak, Kıble yönünü göstermek ve yerel hava durumunu sunmak için kullanım sırasında konuma izin verin.',
    detail:
      'İşletim sisteminiz GPS, Wi-Fi veya hücresel konum dahil en iyi mevcut kaynağı seçer. Etkinleştirmemeyi tercih ederseniz elle ve kayıtlı konumlar kullanılabilir.',
    enable: 'Konum ve pusulayı etkinleştir',
    enabling: 'İzinler isteniyor…',
    later: 'Şimdi değil',
  },
  id: {
    eyebrow: 'SalahOS · Lokasi',
    title: 'Sesuaikan SalahOS dengan lokasi Anda',
    body: 'Izinkan lokasi saat menggunakan SalahOS agar waktu salat lokal, masjid terdekat, arah Kiblat, dan cuaca lokal dapat ditentukan secara otomatis.',
    detail:
      'Sistem operasi memilih sumber terbaik yang tersedia, termasuk GPS, Wi-Fi, atau jaringan seluler. Lokasi manual dan tersimpan tetap tersedia jika Anda memilih untuk tidak mengaktifkannya.',
    enable: 'Aktifkan lokasi & kompas',
    enabling: 'Meminta izin…',
    later: 'Nanti',
  },
};

function initialState(): { locale: Locale; visible: boolean } {
  const storage = getApplicationStorage();
  return {
    locale: loadPersistedSettings(storage).locale,
    visible: qiblaPermissionOnboardingRequired(storage),
  };
}

function savedLocationFallback(): LocationFallback | undefined {
  const settings = loadPersistedSettings(getApplicationStorage());
  return settings.location === null
    ? undefined
    : {
        coordinates: settings.location.coordinates,
        source: 'saved',
        ...(settings.location.timeZone === undefined
          ? {}
          : { timeZone: settings.location.timeZone }),
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

  const finish = (autoLocation: boolean) => {
    completeQiblaPermissionOnboarding(getApplicationStorage(), autoLocation);
    dialogRef.current?.close();
    setVisible(false);
    window.dispatchEvent(new Event(LOCATION_PERMISSION_ONBOARDING_COMPLETE_EVENT));
    if (autoLocation) {
      window.dispatchEvent(new Event('salahos:qibla-permission-onboarding-complete'));
    }
  };

  const requestPermissions = async () => {
    if (requesting) return;
    setRequesting(true);
    let locationEnabled = false;
    try {
      // Device-orientation permission must be requested synchronously from a user gesture on
      // platforms such as iOS Safari, so request it before the asynchronous location flow.
      await requestCompassPermission();
      const storage = getApplicationStorage();
      const saved = savedLocationFallback();
      const location = await resolveBestAvailableLocation(storage, {
        ...(saved === undefined ? {} : { saved }),
      });
      if (location !== null && location.freshness === 'live') {
        locationEnabled = true;
        if (persistBestAvailableLocation(storage, location)) {
          window.dispatchEvent(new Event(LOCATION_CONTEXT_CHANGE_EVENT));
        }
      }
    } finally {
      finish(locationEnabled);
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
        <p className="qibla-permission-onboarding__eyebrow">{text.eyebrow}</p>
        <h2 id="qibla-permission-title">{text.title}</h2>
        <p>{text.body}</p>
        <p className="qibla-permission-onboarding__privacy">{text.detail}</p>
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
          <button
            type="button"
            disabled={requesting}
            onClick={() => {
              finish(false);
            }}
          >
            {text.later}
          </button>
        </div>
      </div>
    </dialog>
  );
}
