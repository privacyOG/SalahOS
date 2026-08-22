import { useMemo, useState } from 'react';

import {
  parsePrayerBoardTemplateConfig,
  prayerBoardTemplateRegistry,
  type PrayerBoardAccentPreset,
  type PrayerBoardTemplateConfig,
  type PrayerBoardTemplateId,
} from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import {
  loadMobilePrayerBoardDisplayConfig,
  MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT,
  saveMobilePrayerBoardDisplayConfig,
} from '../platform/mobilePrayerBoardDisplayConfig';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { MobilePrayerThemePreview } from './MobilePrayerThemePreview';
import { buildPrayerBoardPreviewData } from './prayerBoardPreviewData';
import '../mobile-prayer-theme-settings.css';

interface Copy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly phoneTarget: string;
  readonly tvTarget: string;
  readonly selected: string;
  readonly preview: string;
  readonly close: string;
  readonly apply: string;
  readonly previewFirst: string;
  readonly applied: string;
  readonly accent: string;
  readonly orientation: string;
  readonly orientationValue: string;
}

const copy: Readonly<Record<Locale, Copy>> = {
  en: {
    eyebrow: 'Phone / Home',
    title: 'Prayer-times design',
    description:
      'Choose the design used on the main Today prayer page on this phone or tablet. This does not change a managed TV or kiosk display.',
    phoneTarget: 'Phone / tablet Today',
    tvTarget: 'TV / kiosk remains separate',
    selected: 'Selected',
    preview: 'Preview on phone',
    close: 'Close preview',
    apply: 'Apply to Phone / Home',
    previewFirst: 'Preview this design before applying it.',
    applied: 'Phone / Home design applied.',
    accent: 'Accent',
    orientation: 'Orientation support',
    orientationValue: 'Portrait + compact landscape; tablet adaptations included',
  },
  ar: {
    eyebrow: 'الهاتف / الرئيسية',
    title: 'تصميم مواقيت الصلاة',
    description:
      'اختر التصميم المستخدم في صفحة مواقيت الصلاة الرئيسية على هذا الهاتف أو الجهاز اللوحي. لا يغيّر هذا شاشة التلفاز أو الكشك المُدارة.',
    phoneTarget: 'صفحة اليوم للهاتف / الجهاز اللوحي',
    tvTarget: 'التلفاز / الكشك مستقل',
    selected: 'محدد',
    preview: 'معاينة على الهاتف',
    close: 'إغلاق المعاينة',
    apply: 'تطبيق على الهاتف / الرئيسية',
    previewFirst: 'عاين هذا التصميم قبل تطبيقه.',
    applied: 'تم تطبيق تصميم الهاتف / الرئيسية.',
    accent: 'اللون المميز',
    orientation: 'دعم الاتجاه',
    orientationValue: 'عمودي + أفقي مضغوط؛ مع تخطيطات للأجهزة اللوحية',
  },
  tr: {
    eyebrow: 'Telefon / Ana Sayfa',
    title: 'Namaz vakitleri tasarımı',
    description:
      'Bu telefon veya tabletteki ana Bugün namaz sayfasının tasarımını seçin. Yönetilen TV veya kiosk ekranı değişmez.',
    phoneTarget: 'Telefon / tablet Bugün',
    tvTarget: 'TV / kiosk ayrı kalır',
    selected: 'Seçili',
    preview: 'Telefonda önizle',
    close: 'Önizlemeyi kapat',
    apply: 'Telefon / Ana Sayfaya uygula',
    previewFirst: 'Uygulamadan önce bu tasarımı önizleyin.',
    applied: 'Telefon / Ana Sayfa tasarımı uygulandı.',
    accent: 'Vurgu',
    orientation: 'Yön desteği',
    orientationValue: 'Dikey + kompakt yatay; tablet uyarlamaları dahil',
  },
  id: {
    eyebrow: 'Ponsel / Beranda',
    title: 'Desain waktu salat',
    description:
      'Pilih desain untuk halaman salat utama Hari Ini di ponsel atau tablet ini. Ini tidak mengubah layar TV atau kios terkelola.',
    phoneTarget: 'Hari Ini ponsel / tablet',
    tvTarget: 'TV / kios tetap terpisah',
    selected: 'Dipilih',
    preview: 'Pratinjau di ponsel',
    close: 'Tutup pratinjau',
    apply: 'Terapkan ke Ponsel / Beranda',
    previewFirst: 'Pratinjau desain ini sebelum menerapkannya.',
    applied: 'Desain Ponsel / Beranda diterapkan.',
    accent: 'Aksen',
    orientation: 'Dukungan orientasi',
    orientationValue: 'Potret + lanskap ringkas; adaptasi tablet disertakan',
  },
};

const accentPresets: readonly PrayerBoardAccentPreset[] = [
  'emerald',
  'midnight',
  'sandstone',
  'neutral',
  'jewel',
];

function initialState(): {
  readonly locale: Locale;
  readonly config: PrayerBoardTemplateConfig;
} {
  const storage = getApplicationStorage();
  const settings = loadPersistedSettings(storage);
  const existing = loadMobilePrayerBoardDisplayConfig(storage);
  return {
    locale: settings.locale,
    config: parsePrayerBoardTemplateConfig({
      ...(existing ?? {}),
      version: 1,
      primaryLocale: settings.locale,
      timeFormat: settings.timeFormat,
    }),
  };
}

function thumbnailClass(templateId: PrayerBoardTemplateId): string {
  return `mobile-theme-choice__thumb mobile-theme-choice__thumb--${templateId}`;
}

export function MobilePrayerThemeSettings() {
  const initial = useMemo(initialState, []);
  const [draft, setDraft] = useState(initial.config);
  const [applied, setApplied] = useState(initial.config);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewedFingerprint, setPreviewedFingerprint] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const locale = initial.locale;
  const text = copy[locale];
  const fingerprint = JSON.stringify(draft);
  const appliedFingerprint = JSON.stringify(applied);
  const previewed = previewedFingerprint === fingerprint;
  const dirty = fingerprint !== appliedFingerprint;
  const previewData = useMemo(() => buildPrayerBoardPreviewData('near-athan'), []);

  const chooseTemplate = (templateId: PrayerBoardTemplateId) => {
    setDraft((current) =>
      parsePrayerBoardTemplateConfig({
        ...current,
        templateId,
      }),
    );
    setPreviewedFingerprint(null);
    setStatus(null);
  };

  const changeAccent = (accentPreset: PrayerBoardAccentPreset) => {
    setDraft((current) =>
      parsePrayerBoardTemplateConfig({
        ...current,
        accentPreset,
      }),
    );
    setPreviewedFingerprint(null);
    setStatus(null);
  };

  const openPreview = () => {
    setPreviewedFingerprint(fingerprint);
    setPreviewOpen(true);
  };

  const apply = () => {
    if (!previewed || !dirty) return;
    const saved = saveMobilePrayerBoardDisplayConfig(getApplicationStorage(), draft);
    setApplied(saved);
    setDraft(saved);
    setStatus(text.applied);
    window.dispatchEvent(new Event(MOBILE_PRAYER_BOARD_DISPLAY_CONFIG_CHANGE_EVENT));
  };

  return (
    <section className="mobile-prayer-theme-settings" aria-labelledby="mobile-theme-settings-title">
      <header className="mobile-prayer-theme-settings__header">
        <div>
          <p>{text.eyebrow}</p>
          <h2 id="mobile-theme-settings-title">{text.title}</h2>
          <span>{text.description}</span>
        </div>
        <div className="mobile-prayer-theme-settings__targets">
          <strong>{text.phoneTarget}</strong>
          <span>{text.tvTarget}</span>
        </div>
      </header>

      <div className="mobile-theme-choice-grid" role="group" aria-label={text.title}>
        {prayerBoardTemplateRegistry.map((template) => {
          const selected = draft.templateId === template.id;
          return (
            <button
              type="button"
              className="mobile-theme-choice"
              data-mobile-theme-choice={template.id}
              aria-pressed={selected}
              key={template.id}
              onClick={() => {
                chooseTemplate(template.id);
              }}
            >
              <span className={thumbnailClass(template.id)} aria-hidden="true">
                <i className="mobile-theme-choice__mini-clock">11:37</i>
                <i className="mobile-theme-choice__mini-focus" />
                <i className="mobile-theme-choice__mini-row" />
                <i className="mobile-theme-choice__mini-row" />
                <i className="mobile-theme-choice__mini-row" />
              </span>
              <span className="mobile-theme-choice__label">
                <strong>{template.label}</strong>
                <small>{selected ? text.selected : text.orientationValue}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mobile-prayer-theme-settings__controls">
        <label>
          <span>{text.accent}</span>
          <select
            value={draft.accentPreset}
            onChange={(event) => {
              changeAccent(event.target.value as PrayerBoardAccentPreset);
            }}
          >
            {accentPresets.map((accent) => (
              <option key={accent} value={accent}>
                {accent}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span>{text.orientation}</span>
          <strong>{text.orientationValue}</strong>
        </div>
      </div>

      <div className="mobile-prayer-theme-settings__actions">
        <button type="button" className="secondary" onClick={openPreview}>
          {text.preview}
        </button>
        <button type="button" className="primary" disabled={!dirty || !previewed} onClick={apply}>
          {text.apply}
        </button>
        {dirty && !previewed && <span role="status">{text.previewFirst}</span>}
        {status !== null && <span role="status">{status}</span>}
      </div>

      {previewOpen && (
        <div className="mobile-theme-preview-dialog" role="dialog" aria-modal="true">
          <div className="mobile-theme-preview-dialog__toolbar">
            <div>
              <strong>{prayerBoardTemplateRegistry.find((item) => item.id === draft.templateId)?.label}</strong>
              <span>{text.phoneTarget}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewOpen(false);
              }}
            >
              {text.close}
            </button>
          </div>
          <div className="mobile-theme-preview-dialog__device">
            <MobilePrayerThemePreview data={previewData} config={draft} />
          </div>
        </div>
      )}
    </section>
  );
}
