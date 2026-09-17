export type { HadithLibraryBlock, NawawiHadithLibraryEntry } from './hadithLibraryNawawiTypes';
import type { NawawiHadithLibraryEntry } from './hadithLibraryNawawiTypes';

import { nawawiHadithsPart1 } from './hadithLibraryNawawiPart1';
import { nawawiHadithsPart2 } from './hadithLibraryNawawiPart2';
import { nawawiHadithsPart3 } from './hadithLibraryNawawiPart3';
import { nawawiHadithsPart4 } from './hadithLibraryNawawiPart4';

export const NAWAWI_COLLECTION_ID = 'nawawi-forty' as const;

export const nawawiCollection = Object.freeze({
  id: NAWAWI_COLLECTION_ID,
  title: 'The Forty Nawawi Hadiths',
  scholar: 'Imam al-Nawawi',
  scholarArabic: 'الإمام النووي',
  sourceLabel: 'The Forty Nawawi Hadiths.docx',
  sourceNote:
    'Source-faithful transcription of the user-supplied document. The supplied text contains 42 numbered hadiths despite the collection title.',
  entryCount: 42,
});

export const nawawiHadiths = Object.freeze([
  ...nawawiHadithsPart1,
  ...nawawiHadithsPart2,
  ...nawawiHadithsPart3,
  ...nawawiHadithsPart4,
] as const satisfies readonly NawawiHadithLibraryEntry[]);

export function nawawiHadithSearchText(entry: NawawiHadithLibraryEntry): string {
  return [
    entry.sourceHeading,
    entry.reference,
    nawawiCollection.title,
    nawawiCollection.scholar,
    nawawiCollection.scholarArabic,
    ...entry.blocks.map((block) => block.text),
  ]
    .join(' ')
    .toLocaleLowerCase();
}
