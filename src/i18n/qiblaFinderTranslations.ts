import type { Locale } from './translations';

export interface QiblaFinderCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly privacy: string;
  readonly compassView: string;
  readonly mapView: string;
  readonly currentPosition: string;
  readonly locating: string;
  readonly retryLocation: string;
  readonly stopLiveLocation: string;
  readonly liveLocation: string;
  readonly savedLocation: string;
  readonly cityLocation: string;
  readonly pinLocation: string;
  readonly noLocation: string;
  readonly locationDenied: string;
  readonly locationUnavailable: string;
  readonly manualFallback: string;
  readonly manualSearch: string;
  readonly searchPlaceholder: string;
  readonly searchHelp: string;
  readonly useCity: string;
  readonly bearing: string;
  readonly trueNorth: string;
  readonly startCompass: string;
  readonly stopCompass: string;
  readonly compassStarting: string;
  readonly compassWaiting: string;
  readonly compassUnavailable: string;
  readonly compassDenied: string;
  readonly staticBearing: string;
  readonly deviceHeading: string;
  readonly turnLeft: string;
  readonly turnRight: string;
  readonly facingQiblah: string;
  readonly calibrationTitle: string;
  readonly calibrationBody: string;
  readonly mapPrivacyTitle: string;
  readonly mapPrivacyBody: string;
  readonly loadMap: string;
  readonly standardMap: string;
  readonly satelliteMap: string;
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly dropPin: string;
  readonly mapUnavailable: string;
  readonly mapAttributionStandard: string;
  readonly mapAttributionSatellite: string;
  readonly alignedMap: string;
}

export const qiblaFinderCopy = {
  en: {
    eyebrow: 'Qiblah',
    title: 'Qiblah Finder',
    subtitle: 'Face the Kaaba using a true-north compass or a map bearing.',
    privacy: 'Location and Qiblah calculations stay on this device unless you choose to load map tiles.',
    compassView: 'Compass',
    mapView: 'Map',
    currentPosition: 'Use current position',
    locating: 'Finding your position…',
    retryLocation: 'Retry location',
    stopLiveLocation: 'Stop live location',
    liveLocation: 'Live device position',
    savedLocation: 'Saved prayer location',
    cityLocation: 'Selected city',
    pinLocation: 'Dropped map pin',
    noLocation: 'Set a location to calculate the Qiblah direction.',
    locationDenied: 'Location permission was denied. Retry after enabling permission or use a manual location.',
    locationUnavailable: 'Your position is unavailable. Try again or use a city or map pin.',
    manualFallback: 'Manual location',
    manualSearch: 'Search city',
    searchPlaceholder: 'City, country or timezone',
    searchHelp: 'City search uses SalahOS’s bundled offline location catalogue.',
    useCity: 'Use this city',
    bearing: 'Qiblah bearing',
    trueNorth: 'from true north',
    startCompass: 'Start live compass',
    stopCompass: 'Stop compass',
    compassStarting: 'Starting compass…',
    compassWaiting: 'Move the device gently while waiting for a heading.',
    compassUnavailable: 'This device has no usable compass sensor. Use the true-north bearing or map instead.',
    compassDenied: 'Compass access was denied. Use the true-north bearing or map instead.',
    staticBearing: 'Static true-north bearing',
    deviceHeading: 'Device true heading',
    turnLeft: 'Turn Left',
    turnRight: 'Turn Right',
    facingQiblah: 'Facing Qiblah',
    calibrationTitle: 'Compass needs calibration',
    calibrationBody: 'Move the device in a figure-8. Keep it away from metal, magnetic tablet covers and keyboard cases.',
    mapPrivacyTitle: 'Map tiles use external providers',
    mapPrivacyBody: 'Loading the map sends requested map tiles and normal network metadata to the selected provider. If centred on your location, the viewed area can reveal your approximate location. SalahOS does not attach your saved prayer settings or mosque data.',
    loadMap: 'Load map tiles',
    standardMap: 'Standard',
    satelliteMap: 'Satellite',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    dropPin: 'Tap the map to drop a Qiblah-location pin.',
    mapUnavailable: 'Some map tiles could not be loaded. The Qiblah bearing remains available.',
    mapAttributionStandard: '© OpenStreetMap contributors',
    mapAttributionSatellite: 'Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    alignedMap: 'Aligned with Qiblah',
  },
  ar: {
    eyebrow: 'القبلة',
    title: 'محدد القبلة',
    subtitle: 'اتجه نحو الكعبة باستخدام بوصلة مرتبطة بالشمال الحقيقي أو اتجاه على الخريطة.',
    privacy: 'يبقى تحديد الموقع وحساب القبلة على هذا الجهاز ما لم تختر تحميل مربعات الخريطة.',
    compassView: 'البوصلة',
    mapView: 'الخريطة',
    currentPosition: 'استخدام الموقع الحالي',
    locating: 'جارٍ تحديد موقعك…',
    retryLocation: 'إعادة محاولة تحديد الموقع',
    stopLiveLocation: 'إيقاف الموقع المباشر',
    liveLocation: 'موقع الجهاز المباشر',
    savedLocation: 'موقع الصلاة المحفوظ',
    cityLocation: 'المدينة المحددة',
    pinLocation: 'دبوس الخريطة',
    noLocation: 'حدّد موقعاً لحساب اتجاه القبلة.',
    locationDenied: 'تم رفض إذن الموقع. فعّل الإذن ثم أعد المحاولة أو استخدم موقعاً يدوياً.',
    locationUnavailable: 'تعذر تحديد موقعك. حاول مجدداً أو اختر مدينة أو دبوساً على الخريطة.',
    manualFallback: 'موقع يدوي',
    manualSearch: 'البحث عن مدينة',
    searchPlaceholder: 'مدينة أو دولة أو منطقة زمنية',
    searchHelp: 'يستخدم بحث المدن دليل المواقع المحلي المضمّن في صلاح أو إس.',
    useCity: 'استخدام هذه المدينة',
    bearing: 'اتجاه القبلة',
    trueNorth: 'من الشمال الحقيقي',
    startCompass: 'تشغيل البوصلة المباشرة',
    stopCompass: 'إيقاف البوصلة',
    compassStarting: 'جارٍ تشغيل البوصلة…',
    compassWaiting: 'حرّك الجهاز برفق أثناء انتظار قراءة الاتجاه.',
    compassUnavailable: 'لا توجد بوصلة قابلة للاستخدام في هذا الجهاز. استخدم اتجاه الشمال الحقيقي أو الخريطة.',
    compassDenied: 'تم رفض الوصول إلى البوصلة. استخدم اتجاه الشمال الحقيقي أو الخريطة.',
    staticBearing: 'اتجاه ثابت من الشمال الحقيقي',
    deviceHeading: 'اتجاه الجهاز من الشمال الحقيقي',
    turnLeft: 'استدر يساراً',
    turnRight: 'استدر يميناً',
    facingQiblah: 'أنت باتجاه القبلة',
    calibrationTitle: 'تحتاج البوصلة إلى معايرة',
    calibrationBody: 'حرّك الجهاز على شكل رقم 8 وأبعده عن المعادن والأغطية المغناطيسية ولوحات المفاتيح المغناطيسية.',
    mapPrivacyTitle: 'تستخدم الخريطة مزودي مربعات خارجيين',
    mapPrivacyBody: 'عند تحميل الخريطة يتلقى مزود المربعات المختار مربعات الخريطة المطلوبة وبيانات الشبكة المعتادة. إذا كانت الخريطة متمركزة على موقعك فقد تكشف منطقة العرض موقعك التقريبي. لا يرفق صلاح أو إس إعدادات الصلاة المحفوظة أو بيانات المسجد.',
    loadMap: 'تحميل مربعات الخريطة',
    standardMap: 'قياسية',
    satelliteMap: 'أقمار صناعية',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    dropPin: 'اضغط على الخريطة لوضع دبوس موقع القبلة.',
    mapUnavailable: 'تعذر تحميل بعض مربعات الخريطة. يبقى اتجاه القبلة متاحاً.',
    mapAttributionStandard: '© مساهمو OpenStreetMap',
    mapAttributionSatellite: 'المصادر: Esri وMaxar وEarthstar Geographics ومجتمع GIS',
    alignedMap: 'محاذٍ للقبلة',
  },
  tr: {
    eyebrow: 'Kıble',
    title: 'Kıble Bulucu',
    subtitle: 'Gerçek kuzey pusulası veya harita doğrultusuyla Kâbe’ye yönelin.',
    privacy: 'Harita döşemelerini yüklemeyi seçmediğiniz sürece konum ve kıble hesapları bu cihazda kalır.',
    compassView: 'Pusula',
    mapView: 'Harita',
    currentPosition: 'Mevcut konumu kullan',
    locating: 'Konumunuz belirleniyor…',
    retryLocation: 'Konumu yeniden dene',
    stopLiveLocation: 'Canlı konumu durdur',
    liveLocation: 'Canlı cihaz konumu',
    savedLocation: 'Kayıtlı namaz konumu',
    cityLocation: 'Seçilen şehir',
    pinLocation: 'Harita iğnesi',
    noLocation: 'Kıble yönünü hesaplamak için bir konum belirleyin.',
    locationDenied: 'Konum izni reddedildi. İzni açtıktan sonra yeniden deneyin veya manuel konum kullanın.',
    locationUnavailable: 'Konumunuz alınamıyor. Yeniden deneyin veya şehir ya da harita iğnesi kullanın.',
    manualFallback: 'Manuel konum',
    manualSearch: 'Şehir ara',
    searchPlaceholder: 'Şehir, ülke veya saat dilimi',
    searchHelp: 'Şehir araması SalahOS’un paketlenmiş çevrimdışı konum kataloğunu kullanır.',
    useCity: 'Bu şehri kullan',
    bearing: 'Kıble doğrultusu',
    trueNorth: 'gerçek kuzeyden',
    startCompass: 'Canlı pusulayı başlat',
    stopCompass: 'Pusulayı durdur',
    compassStarting: 'Pusula başlatılıyor…',
    compassWaiting: 'Yön bilgisi beklenirken cihazı hafifçe hareket ettirin.',
    compassUnavailable: 'Bu cihazda kullanılabilir pusula sensörü yok. Gerçek kuzey doğrultusunu veya haritayı kullanın.',
    compassDenied: 'Pusula erişimi reddedildi. Gerçek kuzey doğrultusunu veya haritayı kullanın.',
    staticBearing: 'Sabit gerçek-kuzey doğrultusu',
    deviceHeading: 'Cihazın gerçek-kuzey yönü',
    turnLeft: 'Sola Dön',
    turnRight: 'Sağa Dön',
    facingQiblah: 'Kıbleye Dönük',
    calibrationTitle: 'Pusulanın kalibre edilmesi gerekiyor',
    calibrationBody: 'Cihazı 8 şekli çizerek hareket ettirin. Metalden, manyetik tablet kapaklarından ve klavye kılıflarından uzak tutun.',
    mapPrivacyTitle: 'Harita döşemeleri harici sağlayıcıları kullanır',
    mapPrivacyBody: 'Harita yüklendiğinde seçilen sağlayıcı istenen harita döşemelerini ve olağan ağ meta verilerini alır. Harita konumunuza ortalanmışsa görüntülenen alan yaklaşık konumunuzu açığa çıkarabilir. SalahOS kayıtlı namaz ayarlarınızı veya cami verilerinizi eklemez.',
    loadMap: 'Harita döşemelerini yükle',
    standardMap: 'Standart',
    satelliteMap: 'Uydu',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    dropPin: 'Kıble konumu iğnesi bırakmak için haritaya dokunun.',
    mapUnavailable: 'Bazı harita döşemeleri yüklenemedi. Kıble doğrultusu kullanılabilir durumda.',
    mapAttributionStandard: '© OpenStreetMap katkıda bulunanları',
    mapAttributionSatellite: 'Kaynaklar: Esri, Maxar, Earthstar Geographics ve GIS User Community',
    alignedMap: 'Kıbleyle hizalı',
  },
  id: {
    eyebrow: 'Kiblat',
    title: 'Pencari Kiblat',
    subtitle: 'Arahkan diri ke Ka’bah dengan kompas utara sejati atau arah pada peta.',
    privacy: 'Lokasi dan perhitungan kiblat tetap di perangkat ini kecuali Anda memilih memuat ubin peta.',
    compassView: 'Kompas',
    mapView: 'Peta',
    currentPosition: 'Gunakan posisi saat ini',
    locating: 'Mencari posisi Anda…',
    retryLocation: 'Coba lokasi lagi',
    stopLiveLocation: 'Hentikan lokasi langsung',
    liveLocation: 'Posisi perangkat langsung',
    savedLocation: 'Lokasi salat tersimpan',
    cityLocation: 'Kota terpilih',
    pinLocation: 'Pin peta',
    noLocation: 'Tetapkan lokasi untuk menghitung arah kiblat.',
    locationDenied: 'Izin lokasi ditolak. Aktifkan izin lalu coba lagi atau gunakan lokasi manual.',
    locationUnavailable: 'Posisi Anda tidak tersedia. Coba lagi atau gunakan kota maupun pin peta.',
    manualFallback: 'Lokasi manual',
    manualSearch: 'Cari kota',
    searchPlaceholder: 'Kota, negara, atau zona waktu',
    searchHelp: 'Pencarian kota menggunakan katalog lokasi offline bawaan SalahOS.',
    useCity: 'Gunakan kota ini',
    bearing: 'Arah kiblat',
    trueNorth: 'dari utara sejati',
    startCompass: 'Mulai kompas langsung',
    stopCompass: 'Hentikan kompas',
    compassStarting: 'Memulai kompas…',
    compassWaiting: 'Gerakkan perangkat perlahan sambil menunggu arah.',
    compassUnavailable: 'Perangkat ini tidak memiliki sensor kompas yang dapat digunakan. Gunakan arah utara sejati atau peta.',
    compassDenied: 'Akses kompas ditolak. Gunakan arah utara sejati atau peta.',
    staticBearing: 'Arah statis dari utara sejati',
    deviceHeading: 'Arah utara sejati perangkat',
    turnLeft: 'Putar Kiri',
    turnRight: 'Putar Kanan',
    facingQiblah: 'Menghadap Kiblat',
    calibrationTitle: 'Kompas perlu dikalibrasi',
    calibrationBody: 'Gerakkan perangkat membentuk angka 8. Jauhkan dari logam, penutup tablet magnetik, dan casing papan ketik.',
    mapPrivacyTitle: 'Ubin peta memakai penyedia eksternal',
    mapPrivacyBody: 'Saat peta dimuat, penyedia yang dipilih menerima ubin peta yang diminta dan metadata jaringan normal. Jika peta dipusatkan pada lokasi Anda, area yang dilihat dapat mengungkap perkiraan lokasi Anda. SalahOS tidak menyertakan pengaturan salat tersimpan atau data masjid Anda.',
    loadMap: 'Muat ubin peta',
    standardMap: 'Standar',
    satelliteMap: 'Satelit',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    dropPin: 'Ketuk peta untuk menaruh pin lokasi kiblat.',
    mapUnavailable: 'Sebagian ubin peta tidak dapat dimuat. Arah kiblat tetap tersedia.',
    mapAttributionStandard: '© Kontributor OpenStreetMap',
    mapAttributionSatellite: 'Sumber: Esri, Maxar, Earthstar Geographics, dan GIS User Community',
    alignedMap: 'Sejajar dengan kiblat',
  },
} as const satisfies Readonly<Record<Locale, QiblaFinderCopy>>;
