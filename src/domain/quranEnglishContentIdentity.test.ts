import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { islamicKnowledgeEntries } from './islamicKnowledge';
import { salahos2026EnglishMeaning } from './quranSalahos2026';

interface OfflinePackAyah {
  readonly ayah: number;
  readonly key: string;
  readonly translations: Readonly<{ 'pickthall-1930': string }>;
}

interface OfflinePackSurah {
  readonly surah: number;
  readonly ayahs: readonly OfflinePackAyah[];
}

interface OfflinePack {
  readonly counts: Readonly<{ surahs: number; ayahs: number }>;
  readonly surahs: readonly OfflinePackSurah[];
}

type CuratedQuranEntry = Extract<
  (typeof islamicKnowledgeEntries)[number],
  { readonly module: 'quran' }
>;

const pack = JSON.parse(
  readFileSync(new URL('../../public/data/quran/quran-offline-pack.json', import.meta.url), 'utf8'),
) as OfflinePack;

function quranEntries(): readonly CuratedQuranEntry[] {
  return islamicKnowledgeEntries.filter(
    (entry): entry is CuratedQuranEntry => entry.module === 'quran',
  );
}

function verseKeyFromReference(reference: string): string {
  const match = /Qur[’']an\s+(\d{1,3}:\d{1,3})/u.exec(reference);
  if (match?.[1] === undefined) throw new Error(`Unsupported Qur’an reference: ${reference}`);
  return match[1];
}

function packTranslation(verseKey: string): string {
  const [surahText, ayahText] = verseKey.split(':');
  const surahNumber = Number(surahText);
  const ayahNumber = Number(ayahText);
  const surah = pack.surahs.find((candidate) => candidate.surah === surahNumber);
  const ayah = surah?.ayahs.find((candidate) => candidate.ayah === ayahNumber);
  if (ayah === undefined) throw new Error(`Pinned Qur’an pack is missing ${verseKey}.`);
  return ayah.translations['pickthall-1930'];
}

describe('Qur’an English content identity', () => {
  it('uses the complete pinned corpus as the canonical baseline', () => {
    expect(pack.counts).toEqual({ surahs: 114, ayahs: 6236 });
  });

  it('keeps every curated Qur’an excerpt aligned with the SalahOS 2026 derived meaning', () => {
    for (const entry of quranEntries()) {
      const verseKey = verseKeyFromReference(entry.reference);
      const pickthall = packTranslation(verseKey);
      expect(entry.translationSourceId).toBe('quran-salahos-2026');
      expect(entry.sourceIds).toContain('quran-pickthall-1930');
      expect(entry.translation, `${entry.id} differs from SalahOS 2026 at ${verseKey}`).toBe(
        salahos2026EnglishMeaning(verseKey, pickthall),
      );
      expect(entry.translationPresentation).toEqual({ lang: 'en', dir: 'ltr' });
    }
  });

  it('labels SalahOS tafsir summaries as English commentary separate from translation identity', () => {
    for (const entry of quranEntries()) {
      expect(entry.tafsirSummaryPresentation).toEqual({ lang: 'en', dir: 'ltr' });
      expect(entry.tafsirSourceId).not.toBe(entry.translationSourceId);
      expect(entry.tafsirSummary).toContain('SalahOS summary');
    }
  });
});
