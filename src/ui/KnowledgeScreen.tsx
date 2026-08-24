import { useMemo, useState } from 'react';

import {
  filterIslamicKnowledge,
  type IslamicKnowledgeEntry,
  type IslamicKnowledgeModule,
} from '../domain/islamicKnowledge';
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
  quran: string;
  hadith: string;
  qa: string;
  offline: string;
  source: string;
  collection: string;
  grade: string;
  gradedBy: string;
  scholar: string;
  noResults: string;
  guidance: string;
}>;

const copy: Readonly<Record<Locale, KnowledgeCopy>> = {
  en: {
    eyebrow: 'Islamic Knowledge',
    title: 'Read with sources in view',
    intro:
      'A compact offline-first library for Qur’an passages, rigorously attributed hadith and source-aware Q&A. It is designed for learning, not as a substitute for a qualified scholar in personal rulings.',
    search: 'Search the library',
    searchPlaceholder: 'Prayer, intention, travel…',
    all: 'All',
    quran: 'Qur’an',
    hadith: 'Hadith',
    qa: 'Q&A',
    offline: 'Available offline',
    source: 'Source',
    collection: 'Collection',
    grade: 'Grade',
    gradedBy: 'Grading authority',
    scholar: 'Scholar attribution',
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
    searchPlaceholder: 'الصلاة، النية، السفر…',
    all: 'الكل',
    quran: 'القرآن',
    hadith: 'الحديث',
    qa: 'سؤال وجواب',
    offline: 'متاح دون اتصال',
    source: 'المصدر',
    collection: 'المجموعة',
    grade: 'الدرجة',
    gradedBy: 'جهة التصحيح',
    scholar: 'نسبة العالم',
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
    searchPlaceholder: 'Namaz, niyet, yolculuk…',
    all: 'Tümü',
    quran: 'Kur’an',
    hadith: 'Hadis',
    qa: 'Soru & Cevap',
    offline: 'Çevrimdışı kullanılabilir',
    source: 'Kaynak',
    collection: 'Koleksiyon',
    grade: 'Derece',
    gradedBy: 'Derecelendiren',
    scholar: 'Âlim atfı',
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
    searchPlaceholder: 'Salat, niat, perjalanan…',
    all: 'Semua',
    quran: 'Qur’an',
    hadith: 'Hadis',
    qa: 'Tanya & Jawab',
    offline: 'Tersedia luring',
    source: 'Sumber',
    collection: 'Koleksi',
    grade: 'Derajat',
    gradedBy: 'Otoritas penilaian',
    scholar: 'Atribusi ulama',
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
}: Readonly<{ entry: IslamicKnowledgeEntry; labels: KnowledgeCopy }>) {
  if (entry.module === 'quran') {
    return (
      <article className="knowledge-card" data-knowledge-module="quran">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.quran}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <p className="knowledge-card__arabic" lang="ar" dir="rtl">
          {entry.arabic}
        </p>
        <p>{entry.translation}</p>
        <dl className="knowledge-source-list">
          <div>
            <dt>{labels.source}</dt>
            <dd>
              {entry.reference} · {entry.source}
            </dd>
          </div>
        </dl>
      </article>
    );
  }

  if (entry.module === 'hadith') {
    return (
      <article className="knowledge-card" data-knowledge-module="hadith">
        <div className="knowledge-card__meta-row">
          <span className="knowledge-badge">{labels.hadith}</span>
          <span className="knowledge-offline">{labels.offline}</span>
        </div>
        <h3>{entry.title}</h3>
        <p>{entry.text}</p>
        <dl className="knowledge-source-list">
          <div>
            <dt>{labels.collection}</dt>
            <dd>
              {entry.collection} · {entry.reference}
            </dd>
          </div>
          <div>
            <dt>{labels.grade}</dt>
            <dd>{entry.grade}</dd>
          </div>
          <div>
            <dt>{labels.gradedBy}</dt>
            <dd>{entry.grader}</dd>
          </div>
        </dl>
      </article>
    );
  }

  return (
    <article className="knowledge-card" data-knowledge-module="qa">
      <div className="knowledge-card__meta-row">
        <span className="knowledge-badge">{labels.qa}</span>
        <span className="knowledge-offline">{labels.offline}</span>
      </div>
      <h3>{entry.question}</h3>
      <p>{entry.answer}</p>
      <dl className="knowledge-source-list">
        <div>
          <dt>{labels.scholar}</dt>
          <dd>{entry.scholar}</dd>
        </div>
        <div>
          <dt>{labels.source}</dt>
          <dd>{entry.sourceTitle}</dd>
        </div>
      </dl>
      <p className="knowledge-card__source-note">{entry.sourceNote}</p>
    </article>
  );
}

export function KnowledgeScreen() {
  const locale = currentLocale();
  const labels = copy[locale];
  const [module, setModule] = useState<IslamicKnowledgeModule | 'all'>('all');
  const [query, setQuery] = useState('');
  const entries = useMemo(() => filterIslamicKnowledge(module, query), [module, query]);

  const filters: readonly Readonly<{
    id: IslamicKnowledgeModule | 'all';
    label: string;
  }>[] = [
    { id: 'all', label: labels.all },
    { id: 'quran', label: labels.quran },
    { id: 'hadith', label: labels.hadith },
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
      </section>

      {entries.length === 0 ? (
        <p className="knowledge-empty" role="status">
          {labels.noResults}
        </p>
      ) : (
        <section className="knowledge-grid" aria-live="polite">
          {entries.map((entry) => (
            <KnowledgeEntryCard key={entry.id} entry={entry} labels={labels} />
          ))}
        </section>
      )}
    </main>
  );
}
