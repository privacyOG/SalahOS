import { useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  clearPrivacyDiagnostics,
  exportPrivacyDiagnostics,
  loadPrivacyDiagnosticsState,
  PRIVACY_DIAGNOSTICS_CHANGE_EVENT,
  setPrivacyDiagnosticsEnabled,
} from '../platform/privacyDiagnostics';
import { loadPersistedSettings } from '../platform/settingsStorage';

type Copy = Readonly<{
  title: string;
  description: string;
  enabled: string;
  privacy: string;
  retained: string;
  prepare: string;
  clear: string;
  prepared: string;
  cleared: string;
  payload: string;
}>;

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    title: 'Diagnostics',
    description:
      'Optional diagnostics can help troubleshoot crashes and slow starts. They are off by default and stored only on this device until you choose to export them.',
    enabled: 'Collect local crash & performance diagnostics',
    privacy:
      'Diagnostics contain only coarse error classes, anonymous fingerprints and rounded performance timings. They never store precise location, URLs, raw error messages or stacks, prayer settings, mosque data, search text or account identifiers, and SalahOS never uploads them automatically.',
    retained: 'Locally retained events',
    prepare: 'Prepare diagnostics export',
    clear: 'Clear diagnostics',
    prepared: 'Diagnostics export prepared below.',
    cleared: 'Stored diagnostics cleared.',
    payload: 'Diagnostics export',
  },
  ar: {
    title: 'التشخيصات',
    description:
      'يمكن للتشخيصات الاختيارية المساعدة في تتبع الأعطال وبطء بدء التشغيل. تكون متوقفة افتراضياً وتبقى على هذا الجهاز حتى تختار تصديرها.',
    enabled: 'جمع تشخيصات الأعطال والأداء محلياً',
    privacy:
      'تحتوي التشخيصات فقط على فئات أخطاء عامة وبصمات مجهولة وأزمنة أداء مقربة. لا تخزن الموقع الدقيق أو عناوين URL أو رسائل الأخطاء أو آثار المكدس الخام أو إعدادات الصلاة أو بيانات المساجد أو نص البحث أو معرفات الحساب، ولا يرفعها SalahOS تلقائياً.',
    retained: 'الأحداث المحفوظة محلياً',
    prepare: 'إعداد تصدير التشخيصات',
    clear: 'مسح التشخيصات',
    prepared: 'تم إعداد تصدير التشخيصات أدناه.',
    cleared: 'تم مسح التشخيصات المخزنة.',
    payload: 'تصدير التشخيصات',
  },
  tr: {
    title: 'Tanılama',
    description:
      'İsteğe bağlı tanılama, çökmeleri ve yavaş başlangıçları incelemeye yardımcı olabilir. Varsayılan olarak kapalıdır ve siz dışa aktarmayı seçene kadar yalnızca bu cihazda tutulur.',
    enabled: 'Yerel çökme ve performans tanılamasını topla',
    privacy:
      'Tanılama yalnızca genel hata sınıfları, anonim parmak izleri ve yuvarlatılmış performans süreleri içerir. Kesin konum, URL, ham hata iletisi veya yığını, namaz ayarları, cami verisi, arama metni ya da hesap tanımlayıcısı saklanmaz ve SalahOS bunları otomatik olarak yüklemez.',
    retained: 'Yerelde tutulan olaylar',
    prepare: 'Tanılama dışa aktarımını hazırla',
    clear: 'Tanılamayı temizle',
    prepared: 'Tanılama dışa aktarımı aşağıda hazırlandı.',
    cleared: 'Saklanan tanılama temizlendi.',
    payload: 'Tanılama dışa aktarımı',
  },
  id: {
    title: 'Diagnostik',
    description:
      'Diagnostik opsional dapat membantu menelusuri crash dan proses mulai yang lambat. Fitur ini mati secara default dan hanya disimpan di perangkat ini sampai Anda memilih untuk mengekspornya.',
    enabled: 'Kumpulkan diagnostik crash & performa lokal',
    privacy:
      'Diagnostik hanya berisi kelas kesalahan umum, sidik anonim, dan waktu performa yang dibulatkan. Lokasi presisi, URL, pesan atau stack kesalahan mentah, pengaturan salat, data masjid, teks pencarian, dan pengenal akun tidak pernah disimpan, dan SalahOS tidak pernah mengunggahnya secara otomatis.',
    retained: 'Peristiwa yang disimpan lokal',
    prepare: 'Siapkan ekspor diagnostik',
    clear: 'Hapus diagnostik',
    prepared: 'Ekspor diagnostik disiapkan di bawah.',
    cleared: 'Diagnostik tersimpan telah dihapus.',
    payload: 'Ekspor diagnostik',
  },
};

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

export function PrivacyDiagnosticsSettings() {
  const storage = getApplicationStorage();
  const locale = readLocale();
  const text = copy[locale];
  const initial = loadPrivacyDiagnosticsState(storage);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [eventCount, setEventCount] = useState(initial.events.length);
  const [payload, setPayload] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const refreshCount = () => {
    setEventCount(loadPrivacyDiagnosticsState(storage).events.length);
  };

  const toggleEnabled = (nextEnabled: boolean) => {
    setPrivacyDiagnosticsEnabled(storage, nextEnabled);
    setEnabled(nextEnabled);
    setPayload('');
    setStatus(null);
    window.dispatchEvent(new Event(PRIVACY_DIAGNOSTICS_CHANGE_EVENT));
    refreshCount();
  };

  const prepareExport = () => {
    setPayload(exportPrivacyDiagnostics(storage));
    setStatus(text.prepared);
    refreshCount();
  };

  const clear = () => {
    clearPrivacyDiagnostics(storage);
    setPayload('');
    setStatus(text.cleared);
    refreshCount();
  };

  return (
    <section className="privacy-diagnostics-settings" aria-labelledby="privacy-diagnostics-title">
      <header>
        <div>
          <h2 id="privacy-diagnostics-title">{text.title}</h2>
          <p>{text.description}</p>
        </div>
        <span className="privacy-diagnostics-settings__state">{enabled ? 'On' : 'Off'}</span>
      </header>

      <label className="privacy-diagnostics-settings__toggle">
        <span>{text.enabled}</span>
        <input
          type="checkbox"
          data-privacy-diagnostics-toggle
          checked={enabled}
          onChange={(event) => {
            toggleEnabled(event.target.checked);
          }}
        />
      </label>

      <p className="privacy-diagnostics-settings__privacy">{text.privacy}</p>
      <p className="privacy-diagnostics-settings__count">
        <strong>{text.retained}:</strong> {eventCount}
      </p>

      <div className="settings-data-actions">
        <button type="button" onClick={prepareExport}>
          {text.prepare}
        </button>
        <button type="button" onClick={clear} disabled={eventCount === 0}>
          {text.clear}
        </button>
      </div>

      {payload !== '' && (
        <label>
          <span>{text.payload}</span>
          <textarea rows={10} readOnly value={payload} data-privacy-diagnostics-export />
        </label>
      )}
      {status !== null && (
        <p className="inline-message" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
