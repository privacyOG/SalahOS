import { stage7SearchText } from './islamicKnowledgeStage7';
import { englishTextPresentation, type TextPresentationMetadata } from './textPresentation';

export type IslamicKnowledgeModule = 'quran' | 'hadith' | 'qa';
export type IslamicKnowledgeContentType = 'quran' | 'hadith' | 'fiqh' | 'creed' | 'general';
export type Madhhab = 'hanafi' | 'maliki' | 'shafii' | 'hanbali';

export interface QuranKnowledgeEntry {
  readonly id: string;
  readonly module: 'quran';
  readonly contentType: 'quran';
  readonly title: string;
  readonly arabic: string;
  readonly translation: string;
  readonly translationPresentation: TextPresentationMetadata;
  readonly reference: string;
  readonly referencePresentation: TextPresentationMetadata;
  readonly source: string;
  readonly sourceIds: readonly string[];
  readonly arabicSourceId: string;
  readonly translationSourceId: string;
  readonly tafsirSourceId: string;
  readonly tafsirSummary: string;
  readonly tafsirSummaryPresentation: TextPresentationMetadata;
  readonly relatedAyahIds: readonly string[];
  readonly topics: readonly string[];
  readonly tags: readonly string[];
}

export interface HadithKnowledgeEntry {
  readonly id: string;
  readonly module: 'hadith';
  readonly contentType: 'hadith';
  readonly title: string;
  readonly text: string;
  readonly translationPresentation: TextPresentationMetadata;
  readonly collection: string;
  readonly reference: string;
  readonly referencePresentation: TextPresentationMetadata;
  readonly metadataPresentation: TextPresentationMetadata;
  readonly grade: string;
  readonly grader: string;
  readonly sourceIds: readonly string[];
  readonly gradingAuthoritySourceId: string;
  readonly sourceNote: string;
  readonly tags: readonly string[];
}

export interface QaKnowledgeEntry {
  readonly id: string;
  readonly module: 'qa';
  readonly contentType: 'fiqh' | 'creed' | 'general';
  readonly question: string;
  readonly answer: string;
  readonly metadataPresentation: TextPresentationMetadata;
  readonly scholar: string;
  readonly sourceTitle: string;
  readonly sourceNote: string;
  readonly sourceIds: readonly string[];
  readonly madhhabs: readonly Madhhab[];
  readonly recognisedDisagreement: boolean;
  readonly disagreementNote: string | null;
  readonly tags: readonly string[];
}

export type IslamicKnowledgeEntry = QuranKnowledgeEntry | HadithKnowledgeEntry | QaKnowledgeEntry;

const fourMadhhabs = Object.freeze(['hanafi', 'maliki', 'shafii', 'hanbali'] as const);
const fourMadhhabSources = Object.freeze([
  'fiqh-hanafi-hidayah',
  'fiqh-maliki-risalah',
  'fiqh-shafii-majmu',
  'fiqh-hanbali-mughni',
] as const);
const quranReadingSources = Object.freeze([
  'quran-uthmani-text',
  'quran-pickthall-1930',
  'quran-tafsir-jalalayn',
] as const);

export const islamicKnowledgeEntries = Object.freeze([
  {
    id: 'quran-prayer-remembrance',
    module: 'quran',
    contentType: 'quran',
    title: 'Prayer and remembrance',
    arabic:
      'إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي',
    translation:
      'Lo! I, even I, am Allah. There is no God save Me. So serve Me and establish worship for My remembrance.',
    reference: 'Qur’an 20:14',
    source: 'Arabic Uthmani text · English translation: M. M. Pickthall (1930)',
    sourceIds: quranReadingSources,
    arabicSourceId: 'quran-uthmani-text',
    translationSourceId: 'quran-pickthall-1930',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    tafsirSummaryPresentation: englishTextPresentation,
    tafsirSourceId: 'quran-tafsir-jalalayn',
    tafsirSummary:
      'Tafsir al-Jalalayn connects the command to establish prayer here directly with remembrance of Allah. This is a concise SalahOS summary, not a quotation.',
    relatedAyahIds: ['quran-patience-prayer', 'quran-friday-prayer'],
    topics: ['prayer', 'remembrance', 'worship'],
    tags: ['prayer', 'remembrance', 'worship'],
  },
  {
    id: 'quran-patience-prayer',
    module: 'quran',
    contentType: 'quran',
    title: 'Seek help through patience and prayer',
    arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    translation:
      'Seek help in patience and prayer; and truly it is hard save for the humble-minded.',
    reference: 'Qur’an 2:45',
    source: 'Arabic Uthmani text · English translation: M. M. Pickthall (1930)',
    sourceIds: quranReadingSources,
    arabicSourceId: 'quran-uthmani-text',
    translationSourceId: 'quran-pickthall-1930',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    tafsirSummaryPresentation: englishTextPresentation,
    tafsirSourceId: 'quran-tafsir-jalalayn',
    tafsirSummary:
      'Tafsir al-Jalalayn explains seeking help through patience and prayer in the context of obedience and humility before Allah. This is a concise SalahOS summary, not a quotation.',
    relatedAyahIds: ['quran-prayer-remembrance', 'quran-friday-prayer'],
    topics: ['prayer', 'patience', 'humility'],
    tags: ['prayer', 'patience', 'steadfastness', 'humility'],
  },
  {
    id: 'quran-friday-prayer',
    module: 'quran',
    contentType: 'quran',
    title: 'The Friday call to prayer',
    arabic:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ',
    translation:
      'O ye who believe! When the call is heard for the prayer of the day of congregation, haste unto remembrance of Allah and leave your trading.',
    reference: 'Qur’an 62:9',
    source: 'Arabic Uthmani text · English translation: M. M. Pickthall (1930)',
    sourceIds: quranReadingSources,
    arabicSourceId: 'quran-uthmani-text',
    translationSourceId: 'quran-pickthall-1930',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    tafsirSummaryPresentation: englishTextPresentation,
    tafsirSourceId: 'quran-tafsir-jalalayn',
    tafsirSummary:
      'Tafsir al-Jalalayn explains the Friday call as a command to proceed to Allah’s remembrance and leave trade for the prayer. This is a concise SalahOS summary, not a quotation.',
    relatedAyahIds: ['quran-prayer-remembrance', 'quran-patience-prayer'],
    topics: ['jumuah', 'friday', 'congregation', 'prayer'],
    tags: ['jumuah', 'friday', 'prayer', 'congregation'],
  },
  {
    id: 'hadith-intentions',
    module: 'hadith',
    contentType: 'hadith',
    title: 'Actions are judged by intentions',
    text: 'Actions are only by intentions, and every person will have only what they intended.',
    collection: 'Sahih al-Bukhari',
    reference: 'Hadith 1',
    grade: 'Sahih',
    grader: 'Imam al-Bukhari',
    sourceIds: ['hadith-bukhari'],
    gradingAuthoritySourceId: 'hadith-bukhari',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    metadataPresentation: englishTextPresentation,
    sourceNote:
      'Concise English rendering; the cited collection and hadith number remain authoritative.',
    tags: ['intention', 'worship', 'sincerity'],
  },
  {
    id: 'hadith-prayer-light',
    module: 'hadith',
    contentType: 'hadith',
    title: 'Prayer is light',
    text: 'Purification is half of faith, and prayer is light.',
    collection: 'Sahih Muslim',
    reference: 'Hadith 223',
    grade: 'Sahih',
    grader: 'Imam Muslim',
    sourceIds: ['hadith-muslim'],
    gradingAuthoritySourceId: 'hadith-muslim',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    metadataPresentation: englishTextPresentation,
    sourceNote:
      'Concise English rendering; the cited collection and hadith number remain authoritative.',
    tags: ['prayer', 'purification', 'faith'],
  },
  {
    id: 'hadith-congregation',
    module: 'hadith',
    contentType: 'hadith',
    title: 'Merit of congregational prayer',
    text: 'Prayer in congregation is superior to prayer performed alone by twenty-seven degrees.',
    collection: 'Sahih al-Bukhari',
    reference: 'Hadith 645',
    grade: 'Sahih',
    grader: 'Imam al-Bukhari',
    sourceIds: ['hadith-bukhari'],
    gradingAuthoritySourceId: 'hadith-bukhari',
    translationPresentation: englishTextPresentation,
    referencePresentation: englishTextPresentation,
    metadataPresentation: englishTextPresentation,
    sourceNote:
      'Concise English rendering; the cited collection and hadith number remain authoritative.',
    tags: ['congregation', 'mosque', 'prayer'],
  },
  {
    id: 'qa-intention',
    module: 'qa',
    contentType: 'fiqh',
    question: 'What does intention mean in worship?',
    metadataPresentation: englishTextPresentation,
    answer:
      'Intention is the resolve of the heart to perform an act of worship for Allah. It is not dependent on reciting a fixed verbal formula. The essential matter is knowing what act you are performing and directing it to Allah.',
    scholar: 'Classical Hanafi, Maliki, Shafi‘i and Hanbali sources',
    sourceTitle: 'al-Hidayah · al-Risalah · al-Majmu‘ · al-Mughni',
    sourceNote:
      'SalahOS presents a concise cross-school synthesis rather than attributing a universal legal formulation to one madhhab.',
    sourceIds: fourMadhhabSources,
    madhhabs: fourMadhhabs,
    recognisedDisagreement: true,
    disagreementNote:
      'The four schools agree that intention is fundamentally an act of the heart while differing in some details of timing, formulation and recommended verbal expression.',
    tags: ['intention', 'sincerity', 'worship', 'madhhab'],
  },
  {
    id: 'qa-prayer-doubt',
    module: 'qa',
    contentType: 'fiqh',
    question: 'What should I do if I am unsure how many rak‘ahs I prayed?',
    metadataPresentation: englishTextPresentation,
    answer:
      'When genuine doubt remains, build on what is certain and complete the prayer, then perform the prescribed prostrations of forgetfulness. Detailed placement of sujud al-sahw differs across schools, so follow the method taught by your madhhab or trusted local scholar.',
    scholar: 'Classical Hanafi, Maliki, Shafi‘i and Hanbali sources',
    sourceTitle: 'al-Hidayah · al-Risalah · al-Majmu‘ · al-Mughni',
    sourceNote:
      'Cross-school summary of the rules of doubt and sujud al-sahw; it deliberately does not collapse school-specific details into one universal procedure.',
    sourceIds: fourMadhhabSources,
    madhhabs: fourMadhhabs,
    recognisedDisagreement: true,
    disagreementNote:
      'The schools differ on several sujud al-sahw details, including when it is performed and how repeated doubt is treated.',
    tags: ['prayer', 'sujud sahw', 'doubt', 'madhhab'],
  },
  {
    id: 'qa-travel-prayer',
    module: 'qa',
    contentType: 'fiqh',
    question: 'May an obligatory prayer be shortened while travelling?',
    metadataPresentation: englishTextPresentation,
    answer:
      'Islamic law permits shortening the four-rak‘ah obligatory prayers during qualifying travel. The precise distance, duration and conditions differ between legal schools, so the traveller should apply the rules of the madhhab they follow or consult a qualified scholar for their circumstances.',
    scholar: 'Classical Hanafi, Maliki, Shafi‘i and Hanbali sources',
    sourceTitle: 'al-Hidayah · al-Risalah · al-Majmu‘ · al-Mughni',
    sourceNote:
      'The permission is rooted in Qur’an 4:101 and Prophetic practice; the summary preserves school-specific thresholds instead of inventing a universal one.',
    sourceIds: fourMadhhabSources,
    madhhabs: fourMadhhabs,
    recognisedDisagreement: true,
    disagreementNote:
      'Recognised disagreement includes qualifying travel distance, intended duration of stay and several conditions governing shortening and combining prayers.',
    tags: ['travel', 'qasr', 'prayer', 'madhhab'],
  },
] as const satisfies readonly IslamicKnowledgeEntry[]);

export function getIslamicKnowledgeEntryById(id: string): IslamicKnowledgeEntry | null {
  return islamicKnowledgeEntries.find((entry) => entry.id === id) ?? null;
}

function searchableText(entry: IslamicKnowledgeEntry): string {
  if (entry.module === 'quran') {
    return [
      entry.title,
      entry.arabic,
      entry.translation,
      entry.reference,
      entry.source,
      entry.tafsirSummary,
      ...entry.topics,
      ...entry.sourceIds,
      ...entry.tags,
    ]
      .join(' ')
      .toLocaleLowerCase();
  }
  if (entry.module === 'hadith') {
    return [
      entry.title,
      entry.text,
      entry.collection,
      entry.reference,
      entry.grade,
      entry.grader,
      entry.sourceNote,
      stage7SearchText(entry.id),
      ...entry.sourceIds,
      ...entry.tags,
    ]
      .join(' ')
      .toLocaleLowerCase();
  }
  return [
    entry.question,
    entry.answer,
    entry.scholar,
    entry.sourceTitle,
    entry.sourceNote,
    entry.disagreementNote ?? '',
    stage7SearchText(entry.id),
    ...entry.sourceIds,
    ...entry.madhhabs,
    ...entry.tags,
  ]
    .join(' ')
    .toLocaleLowerCase();
}

export function filterIslamicKnowledge(
  module: IslamicKnowledgeModule | 'all',
  query: string,
): readonly IslamicKnowledgeEntry[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return islamicKnowledgeEntries.filter((entry) => {
    if (module !== 'all' && entry.module !== module) return false;
    return normalizedQuery.length === 0 || searchableText(entry).includes(normalizedQuery);
  });
}
