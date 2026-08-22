import { useEffect, useState, type CSSProperties } from 'react';

import type { DisplayIdentity } from '../domain/displayFleet';
import { resolveManagedPrayerBoardTarget } from '../domain/managedPrayerBoardTarget';
import type { PrayerBoardTemplateConfig } from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import { PrayerBoardRenderer } from './PrayerBoardRenderer';
import { buildPrayerBoardPreviewData } from './prayerBoardPreviewData';

interface ManagedDisplayTargetPreviewProps {
  readonly identity: DisplayIdentity;
  readonly config: PrayerBoardTemplateConfig;
  readonly locale: Locale;
  readonly onClose: () => void;
}

const copy = {
  en: {
    title: 'Exact target preview',
    target: 'Target',
    close: 'Close preview',
    unsupported: 'This target is not validated for prayer-board publication.',
  },
  ar: {
    title: 'معاينة الهدف الفعلية',
    target: 'الهدف',
    close: 'إغلاق المعاينة',
    unsupported: 'هذا الهدف غير معتمد حالياً لنشر لوحة الصلاة.',
  },
  tr: {
    title: 'Tam hedef önizlemesi',
    target: 'Hedef',
    close: 'Önizlemeyi kapat',
    unsupported: 'Bu hedef namaz panosu yayını için doğrulanmamıştır.',
  },
  id: {
    title: 'Pratinjau target persis',
    target: 'Target',
    close: 'Tutup pratinjau',
    unsupported: 'Target ini belum tervalidasi untuk publikasi papan salat.',
  },
} as const;

export function ManagedDisplayTargetPreview({
  identity,
  config,
  locale,
  onClose,
}: ManagedDisplayTargetPreviewProps) {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const target = resolveManagedPrayerBoardTarget(identity);
  const text = copy[locale];
  const previewData = buildPrayerBoardPreviewData('near-athan');

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!target.supported) {
    return (
      <div
        className="managed-target-preview"
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <section className="managed-target-preview__unsupported" role="alert">
          <h3>{text.unsupported}</h3>
          <p>{target.reason}</p>
          <button type="button" onClick={onClose}>
            {text.close}
          </button>
        </section>
      </div>
    );
  }

  const availableWidth = Math.max(320, viewport.width - 48);
  const availableHeight = Math.max(240, viewport.height - 116);
  const scale = Math.min(1, availableWidth / target.width, availableHeight / target.height);
  const shellStyle = {
    width: `${String(target.width * scale)}px`,
    height: `${String(target.height * scale)}px`,
  } as CSSProperties;
  const canvasStyle = {
    width: `${String(target.width)}px`,
    height: `${String(target.height)}px`,
    transform: `scale(${String(scale)})`,
  } as CSSProperties;

  return (
    <div
      className="managed-target-preview"
      role="dialog"
      aria-modal="true"
      aria-label={text.title}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-target-width={String(target.width)}
      data-target-height={String(target.height)}
    >
      <header className="managed-target-preview__toolbar">
        <div>
          <strong>{text.title}</strong>
          <span>
            {text.target}: {target.width}×{target.height} · {identity.orientation} ·{' '}
            {identity.resolutionProfile}
          </span>
        </div>
        <button type="button" onClick={onClose}>
          {text.close}
        </button>
      </header>
      <div className="managed-target-preview__viewport">
        <div className="managed-target-preview__shell" style={shellStyle}>
          <div className="managed-target-preview__canvas" style={canvasStyle}>
            <PrayerBoardRenderer data={previewData} config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
