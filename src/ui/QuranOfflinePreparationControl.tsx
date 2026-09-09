import { useEffect, useState } from 'react';

import type { Locale } from '../i18n/translations';
import {
  inspectQuranOfflinePreparation,
  prepareQuranOffline,
  type QuranOfflinePreparationState,
} from '../platform/quranOfflinePreparation';

type Copy = Readonly<{
  prepare: string;
  preparing: string;
  ready: string;
  unavailable: string;
  nativeBundled: string;
  status: string;
}>;

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    prepare: 'Prepare Qur’an for offline use',
    preparing: 'Preparing Qur’an, reader assets and font…',
    ready: 'Qur’an offline: ready',
    unavailable: 'Qur’an offline: not prepared',
    nativeBundled: 'Qur’an offline: bundled with this app',
    status: 'Qur’an offline status',
  },
  ar: {
    prepare: 'تجهيز القرآن للاستخدام دون اتصال',
    preparing: 'جارٍ تجهيز القرآن وملفات القارئ والخط…',
    ready: 'القرآن دون اتصال: جاهز',
    unavailable: 'القرآن دون اتصال: غير مجهز',
    nativeBundled: 'القرآن دون اتصال: مضمّن في التطبيق',
    status: 'حالة القرآن دون اتصال',
  },
  tr: {
    prepare: 'Kur’anı çevrimdışı kullanım için hazırla',
    preparing: 'Kur’an, okuyucu dosyaları ve yazı tipi hazırlanıyor…',
    ready: 'Çevrimdışı Kur’an: hazır',
    unavailable: 'Çevrimdışı Kur’an: hazırlanmadı',
    nativeBundled: 'Çevrimdışı Kur’an: uygulamayla birlikte paketlendi',
    status: 'Çevrimdışı Kur’an durumu',
  },
  id: {
    prepare: 'Siapkan Qur’an untuk penggunaan luring',
    preparing: 'Menyiapkan Qur’an, aset pembaca, dan font…',
    ready: 'Qur’an luring: siap',
    unavailable: 'Qur’an luring: belum disiapkan',
    nativeBundled: 'Qur’an luring: disertakan dalam aplikasi',
    status: 'Status Qur’an luring',
  },
};

function stateLabel(labels: Copy, state: QuranOfflinePreparationState): string {
  switch (state) {
    case 'preparing':
      return labels.preparing;
    case 'ready':
      return labels.ready;
    case 'native-bundled':
      return labels.nativeBundled;
    default:
      return labels.unavailable;
  }
}

export function QuranOfflinePreparationControl({ locale }: Readonly<{ locale: Locale }>) {
  const labels = copy[locale];
  const [state, setState] = useState<QuranOfflinePreparationState>('unavailable');

  useEffect(() => {
    let cancelled = false;
    void inspectQuranOfflinePreparation().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canPrepare = state !== 'preparing' && state !== 'native-bundled';

  return (
    <div className="quran-offline-preparation" data-quran-offline-preparation data-state={state}>
      <span role="status" aria-live="polite" aria-label={labels.status}>
        {stateLabel(labels, state)}
      </span>
      {canPrepare ? (
        <button
          type="button"
          data-quran-offline-prepare
          onClick={() => {
            setState('preparing');
            void prepareQuranOffline().then(setState);
          }}
        >
          {labels.prepare}
        </button>
      ) : null}
    </div>
  );
}
