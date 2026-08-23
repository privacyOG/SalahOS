import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import {
  changeManagedThemeArtwork,
  changeManagedThemeMosqueName,
  changeManagedThemeTemplate,
  nextManagedThemeRevision,
  planManagedDisplayBulkAssignment,
  smartDisplayThemeForAccent,
} from '../domain/adminDisplayThemeManagement';
import {
  createManagedPrayerBoardAssignmentConfig,
  type ManagedDisplayRemoteStatus,
  type ManagedMosquePrayerBoardDefault,
} from '../domain/managedAdminProtocol';
import { resolveManagedPrayerBoardTarget } from '../domain/managedPrayerBoardTarget';
import {
  PRAYER_BOARD_CORE_MODULES,
  getPrayerBoardTemplate,
  parsePrayerBoardTemplateConfig,
  prayerBoardTemplateRegistry,
  type PrayerBoardAccentPreset,
  type PrayerBoardArtworkId,
  type PrayerBoardModuleId,
  type PrayerBoardTemplateConfig,
  type PrayerBoardTemplateId,
} from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  createManagedAdminClient,
  type ManagedAdminClient,
  type ManagedAdminConnection,
} from '../platform/managedAdminTransport';
import { getManagedAdminSession, setManagedAdminSession } from '../platform/managedAdminSession';
import {
  listManagedThemeRevisions,
  recordManagedThemeRevision,
  type ManagedThemeRevisionScope,
} from '../platform/managedThemeRevisionStore';
import { loadPrayerBoardDisplayConfig } from '../platform/prayerBoardDisplayConfig';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { ManagedDisplayTargetPreview } from './ManagedDisplayTargetPreview';
import { PrayerBoardRenderer } from './PrayerBoardRenderer';
import { buildPrayerBoardPreviewData } from './prayerBoardPreviewData';

const OPTIONAL_MODULES: readonly PrayerBoardModuleId[] = [
  'dates',
  'jumuah',
  'sunrise-sunset',
  'mosque-branding',
  'announcements',
  'weather',
];
const ACCENTS: readonly PrayerBoardAccentPreset[] = [
  'emerald',
  'midnight',
  'sandstone',
  'neutral',
  'jewel',
];
const ARTWORK_OPTIONS = prayerBoardTemplateRegistry.map((template) => ({
  id: template.fallbackArtworkId,
  label: template.label,
}));
const FIXTURE_ENDPOINT = 'https://stage24-themes.fixture.invalid';
const FIXTURE_TOKEN = 'stage24-theme-fixture-token'.padEnd(48, 'x');

interface PreviewState {
  readonly identity: ManagedDisplayRemoteStatus['identity'];
  readonly config: PrayerBoardTemplateConfig;
}

interface HistoryTarget {
  readonly scope: ManagedThemeRevisionScope;
  readonly targetId: string;
}

interface ThemeStudioCopy {
  readonly title: string;
  readonly subtitle: string;
  readonly connection: string;
  readonly endpoint: string;
  readonly token: string;
  readonly connect: string;
  readonly disconnect: string;
  readonly connected: string;
  readonly disconnected: string;
  readonly security: string;
  readonly gallery: string;
  readonly selected: string;
  readonly configuration: string;
  readonly primaryLanguage: string;
  readonly clock: string;
  readonly accent: string;
  readonly background: string;
  readonly backgroundHelp: string;
  readonly branding: string;
  readonly modules: string;
  readonly livePreview: string;
  readonly exactPreview: string;
  readonly previewRequired: string;
  readonly fleet: string;
  readonly selectCompatible: string;
  readonly clearSelection: string;
  readonly selectedDisplays: string;
  readonly compatible: string;
  readonly blocked: string;
  readonly currentDesign: string;
  readonly source: string;
  readonly revision: string;
  readonly mosque: string;
  readonly publishMosque: string;
  readonly publishBulk: string;
  readonly inheritBulk: string;
  readonly noCompatible: string;
  readonly partialWarning: string;
  readonly published: string;
  readonly inherited: string;
  readonly history: string;
  readonly historyHelp: string;
  readonly noHistory: string;
  readonly loadRevision: string;
  readonly rollbackReady: string;
  readonly current: string;
  readonly target: string;
  readonly enroll: string;
  readonly enrollAction: string;
  readonly displayId: string;
  readonly organizationId: string;
  readonly mosqueId: string;
  readonly locationId: string;
  readonly orientation: string;
  readonly profile: string;
  readonly playlist: string;
  readonly credential: string;
  readonly credentialWarning: string;
  readonly revoke: string;
  readonly revokeConfirm: string;
  readonly error: string;
}

const copy: Readonly<Record<Locale, ThemeStudioCopy>> = {
  en: {
    title: 'Display theme studio',
    subtitle:
      'Design, preview, assign and publish mosque display themes from one managed administration workspace.',
    connection: 'Managed service',
    endpoint: 'Service URL',
    token: 'Administrator token',
    connect: 'Connect & load fleet',
    disconnect: 'Disconnect',
    connected: 'Managed fleet loaded.',
    disconnected: 'Connect the managed service to publish theme revisions.',
    security: 'Administrator credentials remain in memory only and are never saved by this studio.',
    gallery: 'Prayer-board gallery',
    selected: 'Selected',
    configuration: 'Branding & presentation',
    primaryLanguage: 'Primary language',
    clock: 'Clock format',
    accent: 'Accent preset',
    background: 'Built-in background',
    backgroundHelp:
      'Managed publication accepts only first-party built-in artwork; device-local images remain local and are not silently uploaded.',
    branding: 'Mosque display name',
    modules: 'Optional modules',
    livePreview: 'Live preview',
    exactPreview: 'Preview exact target',
    previewRequired: 'Preview every selected target size before publication.',
    fleet: 'Assignment & fleet',
    selectCompatible: 'Select compatible displays',
    clearSelection: 'Clear selection',
    selectedDisplays: 'Selected displays',
    compatible: 'Validated',
    blocked: 'Blocked',
    currentDesign: 'Current design',
    source: 'Assignment source',
    revision: 'Revision',
    mosque: 'Mosque default',
    publishMosque: 'Publish mosque default',
    publishBulk: 'Publish override to selected',
    inheritBulk: 'Return selected to mosque default',
    noCompatible: 'No compatible 1080p/4K landscape display is available for this mosque.',
    partialWarning:
      'Bulk updates are independent per display; any failed revision remains visible after refresh.',
    published: 'Theme revision published.',
    inherited: 'Selected displays returned to their inherited default.',
    history: 'Revision history & rollback',
    historyHelp:
      'This admin device keeps the last observed revisions. Loading an older revision creates a rollback draft; publishing it always advances to a new revision.',
    noHistory: 'No earlier observed revision is available for this target.',
    loadRevision: 'Load as rollback draft',
    rollbackReady: 'Rollback draft loaded. Preview it, then publish it as the next revision.',
    current: 'Current',
    target: 'Target',
    enroll: 'Enroll a display',
    enrollAction: 'Create enrollment',
    displayId: 'Display ID',
    organizationId: 'Organization ID',
    mosqueId: 'Mosque ID',
    locationId: 'Location ID',
    orientation: 'Orientation',
    profile: 'Resolution profile',
    playlist: 'Playlist ID (optional)',
    credential: 'One-time device credential',
    credentialWarning: 'Copy this credential now. It is not persisted by the administration UI.',
    revoke: 'Revoke display',
    revokeConfirm:
      'Revoke this display? It will stop receiving managed updates until enrolled again.',
    error: 'Managed theme operation failed',
  },
  ar: {
    title: 'استوديو سمات الشاشات',
    subtitle: 'صمّم وعاين وعيّن وانشر سمات شاشات المسجد من مساحة إدارة واحدة.',
    connection: 'خدمة الإدارة',
    endpoint: 'رابط الخدمة',
    token: 'رمز المسؤول',
    connect: 'الاتصال وتحميل الشاشات',
    disconnect: 'قطع الاتصال',
    connected: 'تم تحميل الشاشات المُدارة.',
    disconnected: 'اتصل بخدمة الإدارة لنشر إصدارات السمات.',
    security: 'تبقى بيانات اعتماد المسؤول في الذاكرة فقط ولا يحفظها هذا الاستوديو.',
    gallery: 'معرض لوحات الصلاة',
    selected: 'محدد',
    configuration: 'الهوية والعرض',
    primaryLanguage: 'اللغة الأساسية',
    clock: 'تنسيق الساعة',
    accent: 'نمط الألوان',
    background: 'الخلفية المدمجة',
    backgroundHelp: 'النشر المُدار يقبل الرسومات المدمجة فقط؛ الصور المحلية لا تُرفع تلقائياً.',
    branding: 'اسم المسجد على الشاشة',
    modules: 'الوحدات الاختيارية',
    livePreview: 'معاينة مباشرة',
    exactPreview: 'معاينة الهدف الفعلي',
    previewRequired: 'عاين كل حجم هدف محدد قبل النشر.',
    fleet: 'التعيين والشاشات',
    selectCompatible: 'تحديد الشاشات المتوافقة',
    clearSelection: 'مسح التحديد',
    selectedDisplays: 'الشاشات المحددة',
    compatible: 'معتمد',
    blocked: 'محظور',
    currentDesign: 'التصميم الحالي',
    source: 'مصدر التعيين',
    revision: 'الإصدار',
    mosque: 'افتراضي المسجد',
    publishMosque: 'نشر افتراضي المسجد',
    publishBulk: 'نشر تخصيص للشاشات المحددة',
    inheritBulk: 'إرجاع المحدد إلى افتراضي المسجد',
    noCompatible: 'لا توجد شاشة أفقية 1080p أو 4K معتمدة لهذا المسجد.',
    partialWarning: 'تُحدّث كل شاشة بشكل مستقل؛ يظهر أي فشل بعد التحديث.',
    published: 'تم نشر إصدار السمة.',
    inherited: 'عادت الشاشات المحددة إلى الإعداد الموروث.',
    history: 'سجل الإصدارات والاسترجاع',
    historyHelp:
      'يحفظ جهاز الإدارة آخر الإصدارات المرصودة. تحميل إصدار أقدم ينشئ مسودة استرجاع، والنشر يرفع رقم الإصدار دائماً.',
    noHistory: 'لا يوجد إصدار أقدم مرصود لهذا الهدف.',
    loadRevision: 'تحميل كمسودة استرجاع',
    rollbackReady: 'تم تحميل مسودة الاسترجاع. عاينها ثم انشرها كإصدار جديد.',
    current: 'الحالي',
    target: 'الهدف',
    enroll: 'تسجيل شاشة',
    enrollAction: 'إنشاء تسجيل',
    displayId: 'معرف الشاشة',
    organizationId: 'معرف المؤسسة',
    mosqueId: 'معرف المسجد',
    locationId: 'معرف الموقع',
    orientation: 'الاتجاه',
    profile: 'دقة الشاشة',
    playlist: 'معرف قائمة التشغيل (اختياري)',
    credential: 'بيانات اعتماد الجهاز لمرة واحدة',
    credentialWarning: 'انسخ بيانات الاعتماد الآن؛ واجهة الإدارة لا تحفظها.',
    revoke: 'إلغاء الشاشة',
    revokeConfirm: 'إلغاء هذه الشاشة؟ ستتوقف عن تلقي التحديثات حتى تسجيلها من جديد.',
    error: 'فشلت عملية سمة الشاشة المُدارة',
  },
  tr: {
    title: 'Ekran tema stüdyosu',
    subtitle:
      'Cami ekran temalarını tek bir yönetim alanından tasarlayın, önizleyin, atayın ve yayınlayın.',
    connection: 'Yönetilen hizmet',
    endpoint: 'Hizmet URL’si',
    token: 'Yönetici belirteci',
    connect: 'Bağlan ve filoyu yükle',
    disconnect: 'Bağlantıyı kes',
    connected: 'Yönetilen filo yüklendi.',
    disconnected: 'Tema revizyonlarını yayınlamak için yönetilen hizmete bağlanın.',
    security: 'Yönetici kimlik bilgileri yalnızca bellekte tutulur ve kaydedilmez.',
    gallery: 'Namaz panosu galerisi',
    selected: 'Seçili',
    configuration: 'Markalama ve sunum',
    primaryLanguage: 'Birincil dil',
    clock: 'Saat biçimi',
    accent: 'Vurgu ön ayarı',
    background: 'Yerleşik arka plan',
    backgroundHelp:
      'Yönetilen yayın yalnızca birinci taraf yerleşik görselleri kabul eder; yerel resimler sessizce yüklenmez.',
    branding: 'Ekrandaki cami adı',
    modules: 'İsteğe bağlı modüller',
    livePreview: 'Canlı önizleme',
    exactPreview: 'Tam hedefi önizle',
    previewRequired: 'Yayınlamadan önce seçilen her hedef boyutunu önizleyin.',
    fleet: 'Atama ve filo',
    selectCompatible: 'Uyumlu ekranları seç',
    clearSelection: 'Seçimi temizle',
    selectedDisplays: 'Seçili ekranlar',
    compatible: 'Doğrulandı',
    blocked: 'Engellendi',
    currentDesign: 'Mevcut tasarım',
    source: 'Atama kaynağı',
    revision: 'Revizyon',
    mosque: 'Cami varsayılanı',
    publishMosque: 'Cami varsayılanını yayınla',
    publishBulk: 'Seçilenlere geçersiz kılma yayınla',
    inheritBulk: 'Seçilenleri cami varsayılanına döndür',
    noCompatible: 'Bu cami için uyumlu 1080p/4K yatay ekran yok.',
    partialWarning:
      'Toplu güncellemeler ekran başına bağımsızdır; başarısız revizyonlar yenilemeden sonra görünür.',
    published: 'Tema revizyonu yayınlandı.',
    inherited: 'Seçilen ekranlar devralınan varsayılana döndürüldü.',
    history: 'Revizyon geçmişi ve geri alma',
    historyHelp:
      'Bu yönetim cihazı son görülen revizyonları tutar. Eski bir revizyon geri alma taslağı olur; yayın her zaman yeni bir revizyona ilerler.',
    noHistory: 'Bu hedef için daha eski bir revizyon yok.',
    loadRevision: 'Geri alma taslağı olarak yükle',
    rollbackReady: 'Geri alma taslağı yüklendi. Önizleyin ve sonraki revizyon olarak yayınlayın.',
    current: 'Mevcut',
    target: 'Hedef',
    enroll: 'Ekran kaydet',
    enrollAction: 'Kayıt oluştur',
    displayId: 'Ekran kimliği',
    organizationId: 'Kuruluş kimliği',
    mosqueId: 'Cami kimliği',
    locationId: 'Konum kimliği',
    orientation: 'Yön',
    profile: 'Çözünürlük profili',
    playlist: 'Oynatma listesi (isteğe bağlı)',
    credential: 'Tek kullanımlık cihaz kimliği',
    credentialWarning: 'Bu kimliği şimdi kopyalayın; yönetim arayüzü saklamaz.',
    revoke: 'Ekranı iptal et',
    revokeConfirm: 'Bu ekran iptal edilsin mi? Yeniden kaydedilene kadar güncelleme almaz.',
    error: 'Yönetilen tema işlemi başarısız',
  },
  id: {
    title: 'Studio tema layar',
    subtitle:
      'Rancang, pratinjau, tetapkan, dan publikasikan tema layar masjid dari satu ruang administrasi.',
    connection: 'Layanan terkelola',
    endpoint: 'URL layanan',
    token: 'Token administrator',
    connect: 'Hubungkan & muat armada',
    disconnect: 'Putuskan',
    connected: 'Armada terkelola dimuat.',
    disconnected: 'Hubungkan layanan terkelola untuk memublikasikan revisi tema.',
    security: 'Kredensial administrator hanya berada di memori dan tidak disimpan.',
    gallery: 'Galeri papan salat',
    selected: 'Dipilih',
    configuration: 'Identitas & presentasi',
    primaryLanguage: 'Bahasa utama',
    clock: 'Format jam',
    accent: 'Preset aksen',
    background: 'Latar bawaan',
    backgroundHelp:
      'Publikasi terkelola hanya menerima karya bawaan pihak pertama; gambar lokal tidak diunggah diam-diam.',
    branding: 'Nama masjid pada layar',
    modules: 'Modul opsional',
    livePreview: 'Pratinjau langsung',
    exactPreview: 'Pratinjau target persis',
    previewRequired: 'Pratinjau setiap ukuran target terpilih sebelum publikasi.',
    fleet: 'Penetapan & armada',
    selectCompatible: 'Pilih layar kompatibel',
    clearSelection: 'Hapus pilihan',
    selectedDisplays: 'Layar terpilih',
    compatible: 'Tervalidasi',
    blocked: 'Diblokir',
    currentDesign: 'Desain saat ini',
    source: 'Sumber penetapan',
    revision: 'Revisi',
    mosque: 'Default masjid',
    publishMosque: 'Publikasikan default masjid',
    publishBulk: 'Publikasikan override ke pilihan',
    inheritBulk: 'Kembalikan pilihan ke default masjid',
    noCompatible: 'Tidak ada layar lanskap 1080p/4K yang kompatibel untuk masjid ini.',
    partialWarning:
      'Pembaruan massal berjalan per layar; revisi yang gagal tetap terlihat setelah penyegaran.',
    published: 'Revisi tema dipublikasikan.',
    inherited: 'Layar terpilih dikembalikan ke default turunan.',
    history: 'Riwayat revisi & rollback',
    historyHelp:
      'Perangkat admin ini menyimpan revisi terakhir yang diamati. Memuat revisi lama membuat draf rollback; publikasi selalu maju ke revisi baru.',
    noHistory: 'Tidak ada revisi lama yang diamati untuk target ini.',
    loadRevision: 'Muat sebagai draf rollback',
    rollbackReady: 'Draf rollback dimuat. Pratinjau lalu publikasikan sebagai revisi berikutnya.',
    current: 'Saat ini',
    target: 'Target',
    enroll: 'Daftarkan layar',
    enrollAction: 'Buat pendaftaran',
    displayId: 'ID layar',
    organizationId: 'ID organisasi',
    mosqueId: 'ID masjid',
    locationId: 'ID lokasi',
    orientation: 'Orientasi',
    profile: 'Profil resolusi',
    playlist: 'ID playlist (opsional)',
    credential: 'Kredensial perangkat sekali pakai',
    credentialWarning: 'Salin kredensial ini sekarang; UI administrasi tidak menyimpannya.',
    revoke: 'Cabut layar',
    revokeConfirm: 'Cabut layar ini? Layar berhenti menerima pembaruan hingga didaftarkan lagi.',
    error: 'Operasi tema terkelola gagal',
  },
};

const moduleLabels: Readonly<Record<Locale, Readonly<Record<PrayerBoardModuleId, string>>>> = {
  en: {
    'current-time': 'Current time',
    dates: 'Dates',
    'next-prayer': 'Next prayer',
    countdown: 'Countdown',
    'prayer-timetable': 'Five-prayer timetable',
    jumuah: "Jumu'ah",
    'sunrise-sunset': 'Sunrise / sunset',
    'mosque-branding': 'Mosque branding',
    announcements: 'Announcements',
    weather: 'Weather',
  },
  ar: {
    'current-time': 'الوقت الحالي',
    dates: 'التواريخ',
    'next-prayer': 'الصلاة التالية',
    countdown: 'العد التنازلي',
    'prayer-timetable': 'جدول الصلوات الخمس',
    jumuah: 'الجمعة',
    'sunrise-sunset': 'الشروق / الغروب',
    'mosque-branding': 'هوية المسجد',
    announcements: 'الإعلانات',
    weather: 'الطقس',
  },
  tr: {
    'current-time': 'Mevcut saat',
    dates: 'Tarihler',
    'next-prayer': 'Sonraki namaz',
    countdown: 'Geri sayım',
    'prayer-timetable': 'Beş vakit tablosu',
    jumuah: 'Cuma',
    'sunrise-sunset': 'Gün doğumu / batımı',
    'mosque-branding': 'Cami markalaması',
    announcements: 'Duyurular',
    weather: 'Hava durumu',
  },
  id: {
    'current-time': 'Waktu saat ini',
    dates: 'Tanggal',
    'next-prayer': 'Salat berikutnya',
    countdown: 'Hitung mundur',
    'prayer-timetable': 'Jadwal lima salat',
    jumuah: 'Jumat',
    'sunrise-sunset': 'Terbit / terbenam',
    'mosque-branding': 'Identitas masjid',
    announcements: 'Pengumuman',
    weather: 'Cuaca',
  },
};

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function initialDraft(): PrayerBoardTemplateConfig {
  try {
    const stored = loadPrayerBoardDisplayConfig(getApplicationStorage());
    if (stored !== null) return createManagedPrayerBoardAssignmentConfig(stored);
    const settings = loadPersistedSettings(getApplicationStorage());
    return parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'heritage-classic',
      primaryLocale: settings.locale,
      timeFormat: settings.timeFormat,
      accentPreset: 'emerald',
    });
  } catch {
    return parsePrayerBoardTemplateConfig({ version: 1, templateId: 'heritage-classic' });
  }
}

function fixtureRequested(): boolean {
  return new URLSearchParams(window.location.search).get('adminFixture') === 'stage24themes';
}

function initialConnection(): ManagedAdminConnection | null {
  const session = getManagedAdminSession();
  if (session !== null) return session;
  if (fixtureRequested()) return { baseUrl: FIXTURE_ENDPOINT, adminToken: FIXTURE_TOKEN };
  return null;
}

function targetFingerprint(
  display: ManagedDisplayRemoteStatus,
  config: PrayerBoardTemplateConfig,
): string {
  const target = resolveManagedPrayerBoardTarget(display.identity);
  return `${target.width}x${target.height}:${JSON.stringify(config)}`;
}

function TemplateThumbnail({ templateId }: Readonly<{ templateId: PrayerBoardTemplateId }>) {
  return (
    <span
      className={`prayer-board-template-thumbnail prayer-board-template-thumbnail--${templateId}`}
      aria-hidden="true"
    >
      <span className="prayer-board-template-thumbnail__brand" />
      <span className="prayer-board-template-thumbnail__clock">12:34</span>
      <span className="prayer-board-template-thumbnail__focus" />
      <span className="prayer-board-template-thumbnail__rows">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

function LivePreview({
  config,
  label,
}: Readonly<{ config: PrayerBoardTemplateConfig; label: string }>) {
  const host = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.2);
  const data = useMemo(() => buildPrayerBoardPreviewData('near-athan'), []);

  useEffect(() => {
    const node = host.current;
    if (node === null) return;
    const resize = () => setScale(Math.max(0.08, node.clientWidth / 1920));
    resize();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(node);
    window.addEventListener('resize', resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const canvasStyle = {
    width: '1920px',
    height: '1080px',
    transform: `scale(${String(scale)})`,
    transformOrigin: 'top left',
  } as CSSProperties;
  const shellStyle = { height: `${String(1080 * scale)}px` } as CSSProperties;

  return (
    <section className="admin-theme-live-preview" aria-label={label}>
      <div ref={host} className="admin-theme-live-preview__host" style={shellStyle}>
        <div className="admin-theme-live-preview__canvas" style={canvasStyle}>
          <PrayerBoardRenderer data={data} config={config} />
        </div>
      </div>
    </section>
  );
}

export function AdminDisplayThemeManagement() {
  const locale = readLocale();
  const text = copy[locale];
  const startingConnection = initialConnection();
  const [baseUrl, setBaseUrl] = useState(startingConnection?.baseUrl ?? '');
  const [adminToken, setAdminToken] = useState(startingConnection?.adminToken ?? '');
  const [client, setClient] = useState<ManagedAdminClient | null>(null);
  const [displays, setDisplays] = useState<readonly ManagedDisplayRemoteStatus[]>([]);
  const [mosqueDefaults, setMosqueDefaults] = useState<readonly ManagedMosquePrayerBoardDefault[]>(
    [],
  );
  const [draft, setDraft] = useState<PrayerBoardTemplateConfig>(initialDraft);
  const [selectedMosqueId, setSelectedMosqueId] = useState('');
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<ReadonlySet<string>>(new Set());
  const [previewedTargets, setPreviewedTargets] = useState<ReadonlySet<string>>(new Set());
  const [targetPreview, setTargetPreview] = useState<PreviewState | null>(null);
  const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const [rollbackSource, setRollbackSource] = useState<number | null>(null);
  const [status, setStatus] = useState(startingConnection === null ? text.disconnected : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [credential, setCredential] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState({
    displayId: '',
    organizationId: '',
    mosqueId: '',
    locationId: '',
    orientation: 'landscape' as const,
    resolutionProfile: '1920x1080',
    playlistId: '',
  });
  const fingerprint = JSON.stringify(draft);
  const storage = getApplicationStorage();

  const mosqueIds = useMemo(
    () => [...new Set(displays.map((display) => display.identity.mosqueId))].sort(),
    [displays],
  );
  const displaysForMosque = useMemo(
    () => displays.filter((display) => display.identity.mosqueId === selectedMosqueId),
    [displays, selectedMosqueId],
  );
  const mosqueDefault = useMemo(
    () => mosqueDefaults.find((entry) => entry.mosqueId === selectedMosqueId) ?? null,
    [mosqueDefaults, selectedMosqueId],
  );
  const selectedPlan = useMemo(
    () => planManagedDisplayBulkAssignment(displaysForMosque, selectedDisplayIds),
    [displaysForMosque, selectedDisplayIds],
  );
  const compatibleDisplays = useMemo(
    () =>
      displaysForMosque.filter(
        (display) =>
          resolveManagedPrayerBoardTarget(display.identity).supported &&
          !display.remoteConfig.revoked,
      ),
    [displaysForMosque],
  );
  const requiredMosquePreviewKeys = useMemo(
    () => [...new Set(compatibleDisplays.map((display) => targetFingerprint(display, draft)))],
    [compatibleDisplays, draft],
  );
  const mosquePreviewReady =
    requiredMosquePreviewKeys.length > 0 &&
    requiredMosquePreviewKeys.every((key) => previewedTargets.has(key));
  const selectedPreviewReady =
    selectedPlan.supported.length > 0 &&
    selectedPlan.unsupported.length === 0 &&
    [...new Set(selectedPlan.supported.map((display) => targetFingerprint(display, draft)))].every(
      (key) => previewedTargets.has(key),
    );

  const history = useMemo(() => {
    if (historyTarget === null) return [];
    return listManagedThemeRevisions(storage, historyTarget.scope, historyTarget.targetId);
  }, [historyEpoch, historyTarget, storage]);

  const rememberFleet = useCallback(
    (
      nextDisplays: readonly ManagedDisplayRemoteStatus[],
      nextDefaults: readonly ManagedMosquePrayerBoardDefault[],
    ) => {
      for (const entry of nextDefaults) {
        recordManagedThemeRevision(storage, {
          scope: 'mosque-default',
          targetId: entry.mosqueId,
          revision: entry.revision,
          prayerBoardConfig: entry.prayerBoardConfig,
          observedAt: entry.updatedAt,
        });
      }
      for (const display of nextDisplays) {
        if (display.remoteConfig.prayerBoardAssignment !== 'display-override') continue;
        recordManagedThemeRevision(storage, {
          scope: 'display-override',
          targetId: display.identity.displayId,
          revision: display.remoteConfig.contentRevision,
          prayerBoardConfig: display.remoteConfig.prayerBoardConfig,
          observedAt: display.remoteConfig.updatedAt,
        });
      }
      setHistoryEpoch((value) => value + 1);
    },
    [storage],
  );

  const refresh = useCallback(
    async (activeClient: ManagedAdminClient) => {
      const [nextDisplays, nextDefaults] = await Promise.all([
        activeClient.listDisplays(),
        activeClient.listMosquePrayerBoardDefaults(),
      ]);
      setDisplays(nextDisplays);
      setMosqueDefaults(nextDefaults);
      rememberFleet(nextDisplays, nextDefaults);
      const nextMosque =
        selectedMosqueId !== '' &&
        nextDisplays.some((display) => display.identity.mosqueId === selectedMosqueId)
          ? selectedMosqueId
          : ([...new Set(nextDisplays.map((display) => display.identity.mosqueId))].sort()[0] ??
            '');
      setSelectedMosqueId(nextMosque);
      if (nextMosque !== '') {
        const currentDefault = nextDefaults.find((entry) => entry.mosqueId === nextMosque);
        if (currentDefault !== undefined) setDraft(currentDefault.prayerBoardConfig);
      }
      setStatus(text.connected);
      setError('');
    },
    [rememberFleet, selectedMosqueId, text.connected],
  );

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const connection = { baseUrl, adminToken };
      const nextClient = createManagedAdminClient(connection);
      await refresh(nextClient);
      setClient(nextClient);
      setManagedAdminSession(connection);
    } catch (caught) {
      setClient(null);
      setManagedAdminSession(null);
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  }, [adminToken, baseUrl, refresh, text.error]);

  useEffect(() => {
    if (startingConnection === null) return;
    void connect();
    // The initial connection is intentionally consumed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replaceDraft = (value: unknown) => {
    setDraft(parsePrayerBoardTemplateConfig(value));
    setPreviewedTargets(new Set());
    setRollbackSource(null);
    setStatus('');
  };

  const previewTarget = (display: ManagedDisplayRemoteStatus) => {
    const target = resolveManagedPrayerBoardTarget(display.identity);
    if (!target.supported) return;
    setPreviewedTargets((current) => new Set([...current, targetFingerprint(display, draft)]));
    setTargetPreview({
      identity: display.identity,
      config: createManagedPrayerBoardAssignmentConfig(draft),
    });
  };

  const publishMosqueDefault = async () => {
    if (client === null || selectedMosqueId === '' || !mosquePreviewReady) return;
    setBusy(true);
    try {
      if (mosqueDefault !== null) {
        recordManagedThemeRevision(storage, {
          scope: 'mosque-default',
          targetId: mosqueDefault.mosqueId,
          revision: mosqueDefault.revision,
          prayerBoardConfig: mosqueDefault.prayerBoardConfig,
          observedAt: mosqueDefault.updatedAt,
        });
      }
      const published = await client.updateMosquePrayerBoardDefault(selectedMosqueId, {
        expectedRevision: mosqueDefault?.revision ?? 0,
        revision: nextManagedThemeRevision(mosqueDefault?.revision ?? 0),
        prayerBoardConfig: draft,
      });
      recordManagedThemeRevision(storage, {
        scope: 'mosque-default',
        targetId: published.mosqueId,
        revision: published.revision,
        prayerBoardConfig: published.prayerBoardConfig,
        observedAt: published.updatedAt,
      });
      setHistoryEpoch((value) => value + 1);
      await refresh(client);
      setStatus(text.published);
      setRollbackSource(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const publishBulkOverride = async () => {
    if (client === null || !selectedPreviewReady || selectedPlan.supported.length === 0) return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(
        selectedPlan.supported.map(async (display) => {
          if (display.remoteConfig.prayerBoardAssignment === 'display-override') {
            recordManagedThemeRevision(storage, {
              scope: 'display-override',
              targetId: display.identity.displayId,
              revision: display.remoteConfig.contentRevision,
              prayerBoardConfig: display.remoteConfig.prayerBoardConfig,
              observedAt: display.remoteConfig.updatedAt,
            });
          }
          return client.updateDisplayConfig(display.identity.displayId, {
            expectedRevision: display.remoteConfig.contentRevision,
            contentRevision: nextManagedThemeRevision(display.remoteConfig.contentRevision),
            playlistId: display.remoteConfig.playlistId,
            displayTheme: smartDisplayThemeForAccent(draft.accentPreset),
            prayerBoardConfig: draft,
          });
        }),
      );
      await refresh(client);
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0)
        setError(
          `${String(failed)} / ${String(results.length)} updates failed. ${text.partialWarning}`,
        );
      else {
        setStatus(text.published);
        setRollbackSource(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const inheritBulk = async () => {
    if (
      client === null ||
      selectedPlan.supported.length === 0 ||
      selectedPlan.unsupported.length > 0
    )
      return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(
        selectedPlan.supported.map((display) =>
          client.updateDisplayConfig(display.identity.displayId, {
            expectedRevision: display.remoteConfig.contentRevision,
            contentRevision: nextManagedThemeRevision(display.remoteConfig.contentRevision),
            playlistId: display.remoteConfig.playlistId,
            displayTheme: display.remoteConfig.displayTheme,
            prayerBoardConfig: null,
          }),
        ),
      );
      await refresh(client);
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0)
        setError(
          `${String(failed)} / ${String(results.length)} updates failed. ${text.partialWarning}`,
        );
      else setStatus(text.inherited);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const loadRollback = (scope: ManagedThemeRevisionScope, targetId: string, revision: number) => {
    const snapshot = listManagedThemeRevisions(storage, scope, targetId).find(
      (entry) => entry.revision === revision,
    );
    if (snapshot === undefined) return;
    setDraft(snapshot.prayerBoardConfig);
    setPreviewedTargets(new Set());
    setRollbackSource(revision);
    if (scope === 'mosque-default') {
      setSelectedMosqueId(targetId);
      setSelectedDisplayIds(new Set());
    } else {
      const targetDisplay = displays.find((display) => display.identity.displayId === targetId);
      if (targetDisplay !== undefined) {
        setSelectedMosqueId(targetDisplay.identity.mosqueId);
        setSelectedDisplayIds(new Set([targetId]));
      }
    }
    setStatus(text.rollbackReady);
  };

  const enrollDisplay = async () => {
    if (client === null) return;
    setBusy(true);
    try {
      const result = await client.registerDisplay({
        ...enrollment,
        playlistId: enrollment.playlistId.trim() === '' ? null : enrollment.playlistId,
      });
      setCredential(result.deviceToken);
      await refresh(client);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const revokeDisplay = async (display: ManagedDisplayRemoteStatus) => {
    if (client === null || display.remoteConfig.revoked || !window.confirm(text.revokeConfirm))
      return;
    setBusy(true);
    try {
      await client.revokeDisplay(display.identity.displayId);
      await refresh(client);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.error);
    } finally {
      setBusy(false);
    }
  };

  const setModule = (moduleId: PrayerBoardModuleId, visible: boolean) => {
    if (PRAYER_BOARD_CORE_MODULES.includes(moduleId)) return;
    replaceDraft({
      ...draft,
      moduleVisibility: { ...draft.moduleVisibility, [moduleId]: visible },
    });
  };

  return (
    <section
      className="admin-display-theme-studio"
      aria-labelledby="admin-display-theme-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="admin-display-theme-studio__header">
        <div>
          <p className="admin-overview__eyebrow">SalahOS</p>
          <h2 id="admin-display-theme-title">{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <span>{text.previewRequired}</span>
      </header>

      <section className="admin-theme-connection" aria-labelledby="admin-theme-connection-title">
        <div>
          <h3 id="admin-theme-connection-title">{text.connection}</h3>
          <p>{text.security}</p>
        </div>
        <div className="admin-theme-connection__fields">
          <label>
            <span>{text.endpoint}</span>
            <input
              type="url"
              value={baseUrl}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </label>
          <label>
            <span>{text.token}</span>
            <input
              type="password"
              value={adminToken}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setAdminToken(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-theme-actions">
          <button type="button" disabled={busy} onClick={() => void connect()}>
            {text.connect}
          </button>
          <button
            type="button"
            disabled={client === null || busy}
            onClick={() => {
              setManagedAdminSession(null);
              setClient(null);
              setDisplays([]);
              setMosqueDefaults([]);
              setSelectedDisplayIds(new Set());
              setStatus(text.disconnected);
            }}
          >
            {text.disconnect}
          </button>
        </div>
      </section>

      {(status !== '' || error !== '') && (
        <div
          className="admin-theme-feedback"
          role="status"
          data-error={error !== '' ? 'true' : 'false'}
        >
          {error !== '' ? `${text.error}: ${error}` : status}
        </div>
      )}

      <section className="admin-theme-gallery-section" aria-labelledby="admin-theme-gallery-title">
        <div className="admin-theme-section-heading">
          <h3 id="admin-theme-gallery-title">{text.gallery}</h3>
          {rollbackSource !== null && (
            <span>
              ↶ {text.revision} {rollbackSource}
            </span>
          )}
        </div>
        <div className="prayer-board-template-gallery">
          {prayerBoardTemplateRegistry.map((template) => (
            <button
              key={template.id}
              type="button"
              className="prayer-board-template-card"
              data-template-card={template.id}
              aria-pressed={draft.templateId === template.id}
              onClick={() => replaceDraft(changeManagedThemeTemplate(draft, template.id))}
            >
              <TemplateThumbnail templateId={template.id} />
              <span className="prayer-board-template-card__copy">
                <strong>{template.label}</strong>
                <small>{draft.templateId === template.id ? text.selected : ''}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="admin-theme-workbench">
        <section className="admin-theme-config" aria-labelledby="admin-theme-config-title">
          <h3 id="admin-theme-config-title">{text.configuration}</h3>
          <div className="admin-theme-config__grid">
            <label>
              <span>{text.primaryLanguage}</span>
              <select
                value={draft.primaryLocale}
                onChange={(event) => replaceDraft({ ...draft, primaryLocale: event.target.value })}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
                <option value="id">Indonesia</option>
              </select>
            </label>
            <label>
              <span>{text.clock}</span>
              <select
                value={draft.timeFormat}
                onChange={(event) => replaceDraft({ ...draft, timeFormat: event.target.value })}
              >
                <option value="h23">24-hour</option>
                <option value="h12">12-hour</option>
              </select>
            </label>
            <label>
              <span>{text.accent}</span>
              <select
                value={draft.accentPreset}
                onChange={(event) => replaceDraft({ ...draft, accentPreset: event.target.value })}
              >
                {ACCENTS.map((accent) => (
                  <option value={accent} key={accent}>
                    {accent}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{text.background}</span>
              <select
                value={
                  draft.background.kind === 'builtin'
                    ? draft.background.artworkId
                    : getPrayerBoardTemplate(draft.templateId).fallbackArtworkId
                }
                onChange={(event) =>
                  replaceDraft(
                    changeManagedThemeArtwork(draft, event.target.value as PrayerBoardArtworkId),
                  )
                }
              >
                {ARTWORK_OPTIONS.map((artwork) => (
                  <option value={artwork.id} key={artwork.id}>
                    {artwork.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="admin-theme-config__help">{text.backgroundHelp}</p>
          <fieldset className="admin-theme-branding">
            <legend>{text.branding}</legend>
            <div className="admin-theme-branding__grid">
              {(['en', 'ar', 'tr', 'id'] as const).map((language) => (
                <label key={language}>
                  <span>{language.toUpperCase()}</span>
                  <input
                    dir={language === 'ar' ? 'rtl' : 'auto'}
                    value={draft.branding.mosqueName?.[language] ?? ''}
                    onChange={(event) =>
                      replaceDraft(
                        changeManagedThemeMosqueName(draft, language, event.target.value),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="admin-theme-modules">
            <legend>{text.modules}</legend>
            <div>
              {OPTIONAL_MODULES.map((moduleId) => (
                <label key={moduleId}>
                  <input
                    type="checkbox"
                    checked={draft.moduleVisibility[moduleId]}
                    onChange={(event) => setModule(moduleId, event.target.checked)}
                  />
                  <span>{moduleLabels[locale][moduleId]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <section className="admin-theme-preview-panel" aria-labelledby="admin-theme-live-title">
          <h3 id="admin-theme-live-title">{text.livePreview}</h3>
          <LivePreview config={draft} label={text.livePreview} />
        </section>
      </div>

      <section className="admin-theme-fleet" aria-labelledby="admin-theme-fleet-title">
        <div className="admin-theme-section-heading">
          <div>
            <h3 id="admin-theme-fleet-title">{text.fleet}</h3>
            <p>{text.partialWarning}</p>
          </div>
          <div className="admin-theme-actions">
            <button
              type="button"
              disabled={compatibleDisplays.length === 0}
              onClick={() =>
                setSelectedDisplayIds(
                  new Set(compatibleDisplays.map((display) => display.identity.displayId)),
                )
              }
            >
              {text.selectCompatible}
            </button>
            <button
              type="button"
              disabled={selectedDisplayIds.size === 0}
              onClick={() => setSelectedDisplayIds(new Set())}
            >
              {text.clearSelection}
            </button>
          </div>
        </div>
        {mosqueIds.length > 0 && (
          <label className="admin-theme-mosque-picker">
            <span>{text.mosque}</span>
            <select
              value={selectedMosqueId}
              onChange={(event) => {
                const next = event.target.value;
                setSelectedMosqueId(next);
                setSelectedDisplayIds(new Set());
                setPreviewedTargets(new Set());
                const found = mosqueDefaults.find((entry) => entry.mosqueId === next);
                if (found !== undefined) setDraft(found.prayerBoardConfig);
              }}
            >
              <option value="">—</option>
              {mosqueIds.map((id) => (
                <option value={id} key={id}>
                  {id}
                </option>
              ))}
            </select>
            <small>
              {mosqueDefault === null
                ? `${text.revision}: —`
                : `${text.revision}: ${String(mosqueDefault.revision)}`}
            </small>
          </label>
        )}

        {displaysForMosque.length === 0 ? (
          <p>{client === null ? text.disconnected : text.noCompatible}</p>
        ) : (
          <div className="admin-theme-display-grid">
            {displaysForMosque.map((display) => {
              const target = resolveManagedPrayerBoardTarget(display.identity);
              const selectable = target.supported && !display.remoteConfig.revoked;
              const checked = selectedDisplayIds.has(display.identity.displayId);
              return (
                <article
                  className="admin-theme-display-card"
                  key={display.identity.displayId}
                  data-compatible={target.supported ? 'true' : 'false'}
                >
                  <header>
                    <label>
                      <input
                        type="checkbox"
                        disabled={!selectable}
                        checked={checked}
                        onChange={(event) =>
                          setSelectedDisplayIds((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(display.identity.displayId);
                            else next.delete(display.identity.displayId);
                            return next;
                          })
                        }
                      />
                      <strong dir="ltr">{display.identity.displayId}</strong>
                    </label>
                    <span>{target.supported ? text.compatible : text.blocked}</span>
                  </header>
                  <dl>
                    <div>
                      <dt>{text.target}</dt>
                      <dd dir="ltr">
                        {target.width > 0
                          ? `${target.width}×${target.height}`
                          : display.identity.resolutionProfile}{' '}
                        · {display.identity.orientation}
                      </dd>
                    </div>
                    <div>
                      <dt>{text.currentDesign}</dt>
                      <dd>
                        {
                          getPrayerBoardTemplate(display.remoteConfig.prayerBoardConfig.templateId)
                            .label
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>{text.source}</dt>
                      <dd>{display.remoteConfig.prayerBoardAssignment}</dd>
                    </div>
                    <div>
                      <dt>{text.revision}</dt>
                      <dd>{display.remoteConfig.contentRevision}</dd>
                    </div>
                  </dl>
                  {!target.supported && <p>{target.reason}</p>}
                  <div className="admin-theme-display-card__actions">
                    <button
                      type="button"
                      disabled={!selectable}
                      onClick={() => previewTarget(display)}
                    >
                      {text.exactPreview}
                    </button>
                    <button
                      className="ds-button ds-button--destructive"
                      type="button"
                      disabled={display.remoteConfig.revoked || busy}
                      onClick={() => void revokeDisplay(display)}
                    >
                      {text.revoke}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="admin-theme-publication-bar">
          <span>
            {text.selectedDisplays}: <strong>{selectedDisplayIds.size}</strong>
          </span>
          <button
            type="button"
            disabled={client === null || busy || !mosquePreviewReady}
            onClick={() => void publishMosqueDefault()}
          >
            {text.publishMosque}
          </button>
          <button
            type="button"
            disabled={client === null || busy || !selectedPreviewReady}
            onClick={() => void publishBulkOverride()}
          >
            {text.publishBulk}
          </button>
          <button
            type="button"
            disabled={
              client === null ||
              busy ||
              selectedPlan.supported.length === 0 ||
              selectedPlan.unsupported.length > 0
            }
            onClick={() => void inheritBulk()}
          >
            {text.inheritBulk}
          </button>
        </div>
        {compatibleDisplays.length > 0 && !mosquePreviewReady && (
          <p className="admin-theme-preview-requirement">{text.previewRequired}</p>
        )}
      </section>

      <section className="admin-theme-history" aria-labelledby="admin-theme-history-title">
        <div className="admin-theme-section-heading">
          <div>
            <h3 id="admin-theme-history-title">{text.history}</h3>
            <p>{text.historyHelp}</p>
          </div>
          <label>
            <span>{text.target}</span>
            <select
              value={
                historyTarget === null ? '' : `${historyTarget.scope}|${historyTarget.targetId}`
              }
              onChange={(event) => {
                const [scope, ...rest] = event.target.value.split('|');
                const targetId = rest.join('|');
                setHistoryTarget(
                  scope === 'mosque-default' || scope === 'display-override'
                    ? { scope, targetId }
                    : null,
                );
              }}
            >
              <option value="">—</option>
              {mosqueDefaults.map((entry) => (
                <option key={`mosque-${entry.mosqueId}`} value={`mosque-default|${entry.mosqueId}`}>
                  {text.mosque}: {entry.mosqueId}
                </option>
              ))}
              {displays
                .filter(
                  (display) => display.remoteConfig.prayerBoardAssignment === 'display-override',
                )
                .map((display) => (
                  <option
                    key={`display-${display.identity.displayId}`}
                    value={`display-override|${display.identity.displayId}`}
                  >
                    {display.identity.displayId}
                  </option>
                ))}
            </select>
          </label>
        </div>
        {historyTarget === null || history.length === 0 ? (
          <p>{text.noHistory}</p>
        ) : (
          <div className="admin-theme-history__list">
            {history.map((entry, index) => (
              <article key={`${entry.scope}-${entry.targetId}-${entry.revision}`}>
                <div>
                  <strong>
                    {text.revision} {entry.revision}
                  </strong>
                  <span>
                    {getPrayerBoardTemplate(entry.prayerBoardConfig.templateId).label} ·{' '}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(entry.observedAt))}
                  </span>
                </div>
                {index === 0 ? (
                  <span>{text.current}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => loadRollback(entry.scope, entry.targetId, entry.revision)}
                  >
                    {text.loadRevision}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <details className="admin-theme-enrollment">
        <summary>{text.enroll}</summary>
        <div className="admin-theme-enrollment__grid">
          <label>
            <span>{text.displayId}</span>
            <input
              value={enrollment.displayId}
              onChange={(event) => setEnrollment({ ...enrollment, displayId: event.target.value })}
            />
          </label>
          <label>
            <span>{text.organizationId}</span>
            <input
              value={enrollment.organizationId}
              onChange={(event) =>
                setEnrollment({ ...enrollment, organizationId: event.target.value })
              }
            />
          </label>
          <label>
            <span>{text.mosqueId}</span>
            <input
              value={enrollment.mosqueId}
              onChange={(event) => setEnrollment({ ...enrollment, mosqueId: event.target.value })}
            />
          </label>
          <label>
            <span>{text.locationId}</span>
            <input
              value={enrollment.locationId}
              onChange={(event) => setEnrollment({ ...enrollment, locationId: event.target.value })}
            />
          </label>
          <label>
            <span>{text.orientation}</span>
            <select
              value={enrollment.orientation}
              onChange={(event) =>
                setEnrollment({ ...enrollment, orientation: event.target.value as 'landscape' })
              }
            >
              <option value="landscape">landscape</option>
              <option value="portrait">portrait</option>
            </select>
          </label>
          <label>
            <span>{text.profile}</span>
            <input
              value={enrollment.resolutionProfile}
              onChange={(event) =>
                setEnrollment({ ...enrollment, resolutionProfile: event.target.value })
              }
            />
          </label>
          <label>
            <span>{text.playlist}</span>
            <input
              value={enrollment.playlistId}
              onChange={(event) => setEnrollment({ ...enrollment, playlistId: event.target.value })}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={client === null || busy}
          onClick={() => void enrollDisplay()}
        >
          {text.enrollAction}
        </button>
        {credential !== null && (
          <aside className="admin-theme-credential" role="status">
            <strong>{text.credential}</strong>
            <code dir="ltr">{credential}</code>
            <span>{text.credentialWarning}</span>
          </aside>
        )}
      </details>

      {targetPreview !== null && (
        <ManagedDisplayTargetPreview
          identity={targetPreview.identity}
          config={targetPreview.config}
          locale={locale}
          onClose={() => setTargetPreview(null)}
        />
      )}
    </section>
  );
}
