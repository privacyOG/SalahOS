import { useEffect, useRef, useState } from 'react';

import {
  qiblaCompassAccuracyKnown,
  qiblaCompassCalibrationNeeded,
  qiblaCompassCalibrationPassed,
} from '../domain/qiblaCalibration';
import type { Locale } from '../i18n/translations';

import '../qibla-calibration.css';

type CompassState = 'idle' | 'starting' | 'active' | 'denied' | 'unsupported' | 'error';
type CalibrationState = 'idle' | 'prompt' | 'active' | 'success' | 'unavailable';

interface QiblaCalibrationControlProps {
  readonly locale: Locale;
  readonly compassState: CompassState;
  readonly accuracyDegrees: number | null;
  readonly onRecalibrate: () => void;
}

interface CalibrationCopy {
  readonly action: string;
  readonly lowAccuracyTitle: string;
  readonly lowAccuracyBody: string;
  readonly start: string;
  readonly later: string;
  readonly guideTitle: string;
  readonly guideBody: string;
  readonly currentAccuracy: string;
  readonly checking: string;
  readonly cancel: string;
  readonly successTitle: string;
  readonly successBody: string;
  readonly done: string;
  readonly unavailableTitle: string;
  readonly unavailableBody: string;
}

const copy: Readonly<Record<Locale, CalibrationCopy>> = {
  en: {
    action: 'Recalibrate compass',
    lowAccuracyTitle: 'Compass accuracy is low',
    lowAccuracyBody:
      'For a more reliable Qiblah direction, recalibrate the device compass before relying on the live needle.',
    start: 'Start recalibration',
    later: 'Not now',
    guideTitle: 'Recalibrate your compass',
    guideBody:
      'Move the device slowly in a figure-8 several times. Keep it away from metal, magnets, speakers, magnetic cases and large electrical equipment. SalahOS will reassess accuracy automatically.',
    currentAccuracy: 'Current accuracy',
    checking: 'Waiting for a fresh accuracy reading…',
    cancel: 'Cancel',
    successTitle: 'Compass accuracy improved',
    successBody: 'A fresh compass reading is now within the recommended accuracy range for Qiblah guidance.',
    done: 'Done',
    unavailableTitle: 'Compass recalibration is unavailable',
    unavailableBody:
      'This device did not provide usable compass access. Use the true-north bearing or map fallback instead.',
  },
  ar: {
    action: 'إعادة معايرة البوصلة',
    lowAccuracyTitle: 'دقة البوصلة منخفضة',
    lowAccuracyBody:
      'للحصول على اتجاه قبلة أكثر موثوقية، أعد معايرة بوصلة الجهاز قبل الاعتماد على المؤشر المباشر.',
    start: 'بدء إعادة المعايرة',
    later: 'ليس الآن',
    guideTitle: 'أعد معايرة البوصلة',
    guideBody:
      'حرّك الجهاز ببطء على شكل رقم 8 عدة مرات. أبعده عن المعادن والمغناطيس ومكبرات الصوت والأغطية المغناطيسية والمعدات الكهربائية الكبيرة. سيعيد SalahOS تقييم الدقة تلقائياً.',
    currentAccuracy: 'الدقة الحالية',
    checking: 'بانتظار قراءة دقة جديدة…',
    cancel: 'إلغاء',
    successTitle: 'تحسنت دقة البوصلة',
    successBody: 'أصبحت قراءة البوصلة الجديدة ضمن نطاق الدقة الموصى به لإرشاد القبلة.',
    done: 'تم',
    unavailableTitle: 'إعادة معايرة البوصلة غير متاحة',
    unavailableBody:
      'لم يوفر هذا الجهاز وصولاً صالحاً إلى البوصلة. استخدم اتجاه الشمال الحقيقي أو الخريطة كبديل.',
  },
  tr: {
    action: 'Pusulayı yeniden kalibre et',
    lowAccuracyTitle: 'Pusula doğruluğu düşük',
    lowAccuracyBody:
      'Daha güvenilir Kıble yönü için canlı ibreye güvenmeden önce cihaz pusulasını yeniden kalibre edin.',
    start: 'Kalibrasyonu başlat',
    later: 'Şimdi değil',
    guideTitle: 'Pusulayı yeniden kalibre edin',
    guideBody:
      'Cihazı birkaç kez yavaşça 8 şekli çizerek hareket ettirin. Metalden, mıknatıslardan, hoparlörlerden, manyetik kılıflardan ve büyük elektrikli ekipmandan uzak tutun. SalahOS doğruluğu otomatik olarak yeniden değerlendirecektir.',
    currentAccuracy: 'Mevcut doğruluk',
    checking: 'Yeni doğruluk ölçümü bekleniyor…',
    cancel: 'İptal',
    successTitle: 'Pusula doğruluğu iyileşti',
    successBody: 'Yeni pusula ölçümü artık Kıble yönlendirmesi için önerilen doğruluk aralığında.',
    done: 'Bitti',
    unavailableTitle: 'Pusula kalibrasyonu kullanılamıyor',
    unavailableBody:
      'Bu cihaz kullanılabilir pusula erişimi sağlamadı. Bunun yerine gerçek-kuzey doğrultusunu veya haritayı kullanın.',
  },
  id: {
    action: 'Kalibrasi ulang kompas',
    lowAccuracyTitle: 'Akurasi kompas rendah',
    lowAccuracyBody:
      'Untuk arah Kiblat yang lebih andal, kalibrasi ulang kompas perangkat sebelum mengandalkan jarum langsung.',
    start: 'Mulai kalibrasi ulang',
    later: 'Nanti',
    guideTitle: 'Kalibrasi ulang kompas',
    guideBody:
      'Gerakkan perangkat perlahan membentuk angka 8 beberapa kali. Jauhkan dari logam, magnet, speaker, casing magnetik, dan peralatan listrik besar. SalahOS akan menilai ulang akurasi secara otomatis.',
    currentAccuracy: 'Akurasi saat ini',
    checking: 'Menunggu pembacaan akurasi baru…',
    cancel: 'Batal',
    successTitle: 'Akurasi kompas membaik',
    successBody: 'Pembacaan kompas baru kini berada dalam rentang akurasi yang disarankan untuk panduan Kiblat.',
    done: 'Selesai',
    unavailableTitle: 'Kalibrasi kompas tidak tersedia',
    unavailableBody:
      'Perangkat ini tidak menyediakan akses kompas yang dapat digunakan. Gunakan arah utara sejati atau peta sebagai gantinya.',
  },
};

export function QiblaCalibrationControl({
  locale,
  compassState,
  accuracyDegrees,
  onRecalibrate,
}: QiblaCalibrationControlProps) {
  const text = copy[locale];
  const [state, setState] = useState<CalibrationState>('idle');
  const [poorAccuracyDismissed, setPoorAccuracyDismissed] = useState(false);
  const freshReadingGapSeenRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const poorAccuracy = qiblaCompassCalibrationNeeded(accuracyDegrees);
  const compassUnavailable =
    compassState === 'denied' || compassState === 'unsupported' || compassState === 'error';

  useEffect(() => {
    if (!poorAccuracy) {
      setPoorAccuracyDismissed(false);
      if (state === 'prompt') setState('idle');
      return;
    }
    if (state === 'idle' && !poorAccuracyDismissed) {
      setState('prompt');
    }
  }, [poorAccuracy, poorAccuracyDismissed, state]);

  useEffect(() => {
    if (state !== 'active') return;
    if (compassUnavailable) {
      setState('unavailable');
      return;
    }
    if (accuracyDegrees === null) {
      freshReadingGapSeenRef.current = true;
      return;
    }
    if (
      freshReadingGapSeenRef.current &&
      qiblaCompassCalibrationPassed(accuracyDegrees)
    ) {
      setState('success');
    }
  }, [accuracyDegrees, compassUnavailable, state]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (state === 'idle') {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [state]);

  const beginCalibration = () => {
    freshReadingGapSeenRef.current = false;
    setPoorAccuracyDismissed(false);
    setState('active');
    onRecalibrate();
  };

  const dismissPrompt = () => {
    setPoorAccuracyDismissed(true);
    setState('idle');
  };

  const closeCalibration = () => {
    setState('idle');
  };

  return (
    <div
      className="qibla-recalibration-control"
      data-qibla-calibration-state={state}
      data-qibla-calibration-needed={poorAccuracy ? 'true' : 'false'}
    >
      <button
        type="button"
        onClick={beginCalibration}
        disabled={compassState === 'starting' || compassUnavailable}
      >
        {text.action}
      </button>
      {qiblaCompassAccuracyKnown(accuracyDegrees) && (
        <span className="qibla-recalibration-control__accuracy" dir="ltr">
          ±{accuracyDegrees.toFixed(0)}°
        </span>
      )}

      <dialog
        ref={dialogRef}
        className="qibla-calibration-dialog"
        aria-labelledby="qibla-calibration-dialog-title"
        data-qibla-calibration-dialog
      >
        <div className="qibla-calibration-dialog__content">
          {state === 'prompt' && (
            <>
              <p className="qibla-calibration-dialog__eyebrow">Qiblah · Compass</p>
              <h3 id="qibla-calibration-dialog-title">{text.lowAccuracyTitle}</h3>
              <p>{text.lowAccuracyBody}</p>
              <div className="qibla-calibration-dialog__actions">
                <button type="button" className="is-primary" onClick={beginCalibration}>
                  {text.start}
                </button>
                <button type="button" onClick={dismissPrompt}>
                  {text.later}
                </button>
              </div>
            </>
          )}

          {state === 'active' && (
            <>
              <p className="qibla-calibration-dialog__eyebrow">Qiblah · Compass</p>
              <h3 id="qibla-calibration-dialog-title">{text.guideTitle}</h3>
              <div className="qibla-calibration-figure-eight" aria-hidden="true">
                ∞
              </div>
              <p>{text.guideBody}</p>
              <p className="qibla-calibration-dialog__accuracy" role="status" aria-live="polite">
                {qiblaCompassAccuracyKnown(accuracyDegrees)
                  ? `${text.currentAccuracy}: ±${accuracyDegrees.toFixed(0)}°`
                  : text.checking}
              </p>
              <div className="qibla-calibration-dialog__actions">
                <button type="button" onClick={closeCalibration}>
                  {text.cancel}
                </button>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <p className="qibla-calibration-dialog__eyebrow">Qiblah · Compass</p>
              <h3 id="qibla-calibration-dialog-title">{text.successTitle}</h3>
              <p>{text.successBody}</p>
              {qiblaCompassAccuracyKnown(accuracyDegrees) && (
                <p className="qibla-calibration-dialog__accuracy" dir="ltr">
                  ±{accuracyDegrees.toFixed(0)}°
                </p>
              )}
              <div className="qibla-calibration-dialog__actions">
                <button type="button" className="is-primary" onClick={closeCalibration}>
                  {text.done}
                </button>
              </div>
            </>
          )}

          {state === 'unavailable' && (
            <>
              <p className="qibla-calibration-dialog__eyebrow">Qiblah · Compass</p>
              <h3 id="qibla-calibration-dialog-title">{text.unavailableTitle}</h3>
              <p>{text.unavailableBody}</p>
              <div className="qibla-calibration-dialog__actions">
                <button type="button" className="is-primary" onClick={closeCalibration}>
                  {text.done}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
