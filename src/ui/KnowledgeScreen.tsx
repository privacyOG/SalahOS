import { useMemo, useState } from 'react';

import {
  filterIslamicKnowledge,
  getIslamicKnowledgeEntryById,
  type IslamicKnowledgeEntry,
  type IslamicKnowledgeModule,
} from '../domain/islamicKnowledge';
import { FiqhStage7Details, HadithStage7Details } from './KnowledgeStage7Details';
import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { loadPersistedSettings } from '../platform/settingsStorage';

type KnowledgeCopy = Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  search: string;
  searchPlaceholder: string;
  all: string;
  hadith: string;
  fiqh: string;
  qa: string;
  offline: string;
  noResults: string;
  guidance: string;
}>;

type KnowledgeFilter = IslamicKnowledgeModule | 'fiqh' | 'all';

const copy: Readonly<Record<Locale, KnowledgeCopy>> = {
  en: {
    eyebrow: 'Islamic Knowledge',
    title: 'Read with sources in view',
    intro:
      'A compact offline-first library for Qur’an passages, rigorously attributed hadith and source-aware Q&A. It is designed for learning, not as a substitute for a qualified scholar in personal rulings.',
    search: 'Search the library',
    searchPlaceholder: 'Ayah, text, topic, prayer, travel…',
    all: 'All',
    hadith: 'Hadith',
    fiqh: 'Fiqh',
    qa: 'Q&A',
    offline: 'Available offline',
    noResults: 'No knowledge entries match this search.',
    guidance:
      'Q&A summaries preserve source and scholar attribution and call out juristic variation where it matters.',
  },
  ar: {
    eyebrow: 'المعرفة الإسلامية',
    title: 'اقرأ والمصادر أمامك',
    intro:
      'مكتبة موجزة تعمل دون اتصال لآيات من القرآن وأحاديث موثقة وأسئلة وأجوبة مع نسبة المصادر. هي للتعلّم وليست بديلاً عن العالم المؤهل في الأحكام الشخصية.',
    search: 'ابحث في المكتبة',
    searchPlaceholder: 'آية، نص، موضوع، صلاة، سفر…',
    all: 'الكل',
    hadith: 'الحديث',
    fiqh: 'الفقه',
    qa: 'سؤال وجواب',
    offline: 'متاح دون اتصال',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    guidance:
      'تحافظ ملخصات الأسئلة والأجوبة على نسبة المصدر والعالم وتوضح مواضع اختلاف الفقهاء عند الحاجة.',
  },
  tr: {
    eyebrow: 'İslami Bilgi',
    title: 'Kaynakları görünür tutarak okuyun',
    intro:
      'Kur’an pasajları, kaynaklandırılmış hadisler ve kaynak duyarlı soru-cevap için çevrimdışı çalışan kısa bir kütüphane. Kişisel fetvalarda ehil bir âlimin yerini tutmaz.',
    search: 'Kütüphanede ara',
    searchPlaceholder: 'Ayet, metin, konu, namaz, yolculuk…',
    all: 'Tümü',
    hadith: 'Hadis',
    fiqh: 'Fıkıh',
    qa: 'Soru & Cevap',
    offline: 'Çevrimdışı kullanılabilir',
    noResults: 'Bu aramayla eşleşen bilgi kaydı yok.',
    guidance:
      'Soru-cevap özetleri kaynak ve âlim atfını korur, gerektiğinde fıkhî ihtilafı açıkça belirtir.',
  },
  id: {
    eyebrow: 'Pengetahuan Islam',
    title: 'Membaca dengan sumber yang terlihat',
    intro:
      'Pustaka ringkas yang ramah luring untuk ayat Qur’an, hadis dengan atribusi jelas, dan tanya-jawab berbasis sumber. Ini untuk pembelajaran, bukan pengganti ulama yang kompeten dalam fatwa pribadi.',
    search: 'Cari di pustaka',
    searchPlaceholder: 'Ayat, teks, topik, salat, perjalanan…',
    all: 'Semua',
    hadith: 'Hadis',
    fiqh: 'Fikih',
    qa: 'Tanya & Jawab',
    offline: 'Tersedia luring',
    noResults: 'Tidak ada entri yang cocok dengan pencarian ini.',
    guidance:
      'Ringkasan tanya-jawab mempertahankan atribusi sumber dan ulama serta menandai perbedaan fikih bila relevan.',
  },
};

function currentLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    const language = document.documentElement.lang.toLowerCase();
    if (language.startsWith('ar')) return 'ar';
    if (language.startsWith('tr')) return 'tr';
    if (language.startsWith('id')) return 'id';
    return 'en';
  }
}

function KnowledgeEntryCard({
  entry,
  labels,
  locale,
  onSearchHadithTopic,
  onNavigateHadith,
}: Readonly<{
  entry: Exclude<IslamicKnowledgeEntry, { readonly module: 'quran' }>;
  labels: KnowledgeCopy;
  locale: Locale;
  onSearchHadithTopic: (topic: string) => void;
  onNavigateHadith: (entryId: string) => void;
}>) {
  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card knowledge-card--hadith" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <HadithStage7Details
          entry={entry}
          locale={locale}
          onSearchTopic={onSearchHadithTopic}
          onNavigateHadith={onNavigateHadith}
        />
      </article>
    );
  }

  return (
    <article
      className="knowledge-card knowledge-card--fiqh"
      data-knowledge-module="qa"
      data-knowledge-content-type={entry.contentType}
    >
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">
          {entry.contentType === 'fiqh' ? labels.fiqh : labels.qa}
        </span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      {entry.contentType === 'fiqh' ? (
        <FiqhStage7Details entry={entry} locale={locale} />
      ) : (
        <p>{entry.answer}</p>
      )}
    </article>
  );
}

export function KnowledgeScreen({ scope = 'library' }: Readonly<{ scope?: 'library' | 'hadith' }>) {
  const locale = currentLocale();
  const labels = copy[locale];
  const [module, setModule] = useState<KnowledgeFilter>(() =>
    scope === 'hadith' ? 'hadith' : 'all',
  );
  const [query, setQuery] = useState('');
  const entries = useMemo(() => {
    const baseModule: IslamicKnowledgeModule | 'all' = module === 'fiqh' ? 'qa' : module;
    const filtered = filterIslamicKnowledge(baseModule, query);
    const scoped =
      module === 'fiqh'
        ? filtered.filter((entry) => entry.module === 'qa' && entry.contentType === 'fiqh')
        : filtered;
    return scope === 'hadith'
      ? scoped.filter((entry) => entry.module === 'hadith')
      : scoped.filter(
          (entry): entry is Exclude<IslamicKnowledgeEntry, { readonly module: 'quran' }> =>
            entry.module !== 'quran' && entry.module !== 'hadith',
        );
  }, [module, query, scope]);

  const filters: readonly Readonly<{
    id: KnowledgeFilter;
    label: string;
  }>[] =
    scope === 'hadith'
      ? []
      : [
          { id: 'all', label: labels.all },
          { id: 'fiqh', label: labels.fiqh },
          { id: 'qa', label: labels.qa },
        ];

  return (
    <main className="knowledge-screen" data-knowledge-screen>
      <header className="knowledge-hero">
        <p className="knowledge-hero__eyebrow">{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <p>{labels.intro}</p>
        <div className="knowledge-hero__status" role="note">
          <span>{labels.offline}</span>
          <span aria-hidden="true">•</span>
          <span>{labels.guidance}</span>
        </div>
      </header>

      <section className="knowledge-controls" aria-label={labels.search}>
        <label className="knowledge-search">
          <span>{labels.search}</span>
          <input
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        {filters.length > 0 ? (
          <div className="knowledge-filter" role="group" aria-label={labels.eyebrow}>
            {filters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                aria-pressed={module === filter.id}
                data-knowledge-filter={filter.id}
                onClick={() => {
                  setModule(filter.id);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {entries.length === 0 ? (
        <p className="knowledge-empty" role="status">
          {labels.noResults}
        </p>
      ) : (
        <section className="knowledge-grid" aria-live="polite">
          {entries.map((entry) => (
            <KnowledgeEntryCard
              key={entry.id}
              entry={entry}
              labels={labels}
              locale={locale}
              onSearchHadithTopic={(topic) => {
                setModule('hadith');
                setQuery(topic);
              }}
              onNavigateHadith={(entryId) => {
                const related = getIslamicKnowledgeEntryById(entryId);
                if (related?.module !== 'hadith') return;
                setModule('hadith');
                setQuery(related.reference);
              }}
            />
          ))}
        </section>
      )}
    </main>
  );
}
