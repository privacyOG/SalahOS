import type { Madhhab } from './islamicKnowledge';
import { englishTextPresentation, type TextPresentationMetadata } from './textPresentation';

export interface HadithStage7Metadata {
  readonly entryId: string;
  readonly sourceId: string;
  readonly displayPresentation: TextPresentationMetadata;
  readonly bookNumber: number;
  readonly bookTitle: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly hadithNumber: number;
  readonly inBookReference: string;
  readonly arabicExcerpt: string;
  readonly narrator: string;
  readonly topics: readonly string[];
  readonly relatedHadithIds: readonly string[];
}

export interface FiqhMadhhabPosition {
  readonly madhhab: Madhhab;
  readonly summary: string;
  readonly sourceId: string;
}

export interface FiqhStage7Metadata {
  readonly entryId: string;
  readonly topic: string;
  readonly reviewedAt: string;
  readonly supportingReferences: readonly string[];
  readonly madhhabPositions: readonly FiqhMadhhabPosition[];
}

export const hadithStage7Metadata = Object.freeze([
  {
    entryId: 'hadith-intentions',
    sourceId: 'hadith-bukhari',
    displayPresentation: englishTextPresentation,
    bookNumber: 1,
    bookTitle: 'Revelation',
    chapterNumber: 1,
    chapterTitle: "How the Divine Revelation started being revealed to Allah's Messenger",
    hadithNumber: 1,
    inBookReference: 'Book 1, Hadith 1',
    arabicExcerpt: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    narrator: '‘Umar ibn al-Khattab',
    topics: ['intention', 'sincerity', 'worship', 'migration'],
    relatedHadithIds: ['hadith-prayer-light'],
  },
  {
    entryId: 'hadith-prayer-light',
    sourceId: 'hadith-muslim',
    displayPresentation: englishTextPresentation,
    bookNumber: 2,
    bookTitle: 'The Book of Purification',
    chapterNumber: 1,
    chapterTitle: "The virtue of wudu'",
    hadithNumber: 223,
    inBookReference: 'Book 2, Hadith 1',
    arabicExcerpt: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالصَّلَاةُ نُورٌ',
    narrator: 'Abu Malik al-Ash‘ari',
    topics: ['purification', 'prayer', 'faith', 'remembrance'],
    relatedHadithIds: ['hadith-congregation', 'hadith-intentions'],
  },
  {
    entryId: 'hadith-congregation',
    sourceId: 'hadith-bukhari',
    displayPresentation: englishTextPresentation,
    bookNumber: 10,
    bookTitle: 'Call to Prayers (Adhaan)',
    chapterNumber: 30,
    chapterTitle: 'Superiority of the congregational Salat (prayer)',
    hadithNumber: 645,
    inBookReference: 'Book 10, Hadith 42',
    arabicExcerpt: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',
    narrator: '‘Abdullah ibn ‘Umar',
    topics: ['congregation', 'mosque', 'prayer', 'community'],
    relatedHadithIds: ['hadith-prayer-light'],
  },
] as const satisfies readonly HadithStage7Metadata[]);

export const fiqhStage7Metadata = Object.freeze([
  {
    entryId: 'qa-intention',
    topic: 'Intention in worship',
    reviewedAt: '2026-08-26',
    supportingReferences: ['Sahih al-Bukhari, Hadith 1'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'The intention is fundamentally the resolve of the heart. Hanafi prayer rules discuss its timing with the opening of worship; spoken wording may assist concentration but does not replace the heart.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'The decisive intention is in the heart and identifies the act of worship being performed. A fixed verbal formula is not required for the intention itself.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The intention is an act of the heart and, in the school’s formal prayer rules, accompanies entry into the prayer with the opening takbir.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'The intention is located in the heart and is tied to entering the act of worship. Merely pronouncing words is not itself the legal intention.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
  {
    entryId: 'qa-prayer-doubt',
    topic: 'Doubt and prostration of forgetfulness',
    reviewedAt: '2026-08-26',
    supportingReferences: ['al-Hidayah', 'al-Risalah', 'al-Majmu‘', 'al-Mughni'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'Hanafi law has a detailed sujud al-sahw procedure and ordinarily places the prescribed prostrations after the final sitting and salam according to the school’s standard method.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'Maliki law distinguishes causes involving deficiency and addition; that distinction materially affects whether the prostrations are performed before or after salam.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The standard Shafi‘i treatment places sujud al-sahw before salam while preserving detailed rules for the kinds of doubt or omission that call for it.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'Hanbali law preserves both before-salam and after-salam cases according to the cause and the transmitted Prophetic precedents rather than imposing one placement on every case.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
  {
    entryId: 'qa-travel-prayer',
    topic: 'Traveller prayer and qasr',
    reviewedAt: '2026-08-26',
    supportingReferences: ['Qur’an 4:101', 'al-Hidayah', 'al-Risalah', 'al-Majmu‘', 'al-Mughni'],
    madhhabPositions: [
      {
        madhhab: 'hanafi',
        summary:
          'For a qualifying traveller, the Hanafi school treats shortening the four-rak‘ah obligatory prayers as the operative traveller prayer, subject to its own travel and residence thresholds.',
        sourceId: 'fiqh-hanafi-hidayah',
      },
      {
        madhhab: 'maliki',
        summary:
          'The Maliki school treats qasr as an emphasized Prophetic practice for qualifying travel, with school-specific conditions governing distance and intended stay.',
        sourceId: 'fiqh-maliki-risalah',
      },
      {
        madhhab: 'shafii',
        summary:
          'The Shafi‘i school treats qasr as a permitted concession for qualifying travel; completing the prayer remains valid, subject to the school’s travel and stay conditions.',
        sourceId: 'fiqh-shafii-majmu',
      },
      {
        madhhab: 'hanbali',
        summary:
          'The Hanbali school treats qasr as a strongly established concession and Prophetic practice for qualifying travel, with its own distance and intended-stay rules.',
        sourceId: 'fiqh-hanbali-mughni',
      },
    ],
  },
] as const satisfies readonly FiqhStage7Metadata[]);

export function getHadithStage7Metadata(entryId: string): HadithStage7Metadata | null {
  return hadithStage7Metadata.find((metadata) => metadata.entryId === entryId) ?? null;
}

export function getFiqhStage7Metadata(entryId: string): FiqhStage7Metadata | null {
  return fiqhStage7Metadata.find((metadata) => metadata.entryId === entryId) ?? null;
}

export function stage7SearchText(entryId: string): string {
  const hadith = getHadithStage7Metadata(entryId);
  if (hadith) {
    return [
      hadith.bookTitle,
      hadith.chapterTitle,
      hadith.inBookReference,
      hadith.arabicExcerpt,
      ...hadith.topics,
    ].join(' ');
  }
  const fiqh = getFiqhStage7Metadata(entryId);
  if (!fiqh) return '';
  return [
    fiqh.topic,
    fiqh.reviewedAt,
    ...fiqh.supportingReferences,
    ...fiqh.madhhabPositions.flatMap((position) => [
      position.madhhab,
      position.summary,
      position.sourceId,
    ]),
  ].join(' ');
}
