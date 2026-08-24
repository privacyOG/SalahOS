export type IslamicKnowledgeModule = 'quran' | 'hadith' | 'qa';

export interface QuranKnowledgeEntry {
  readonly id: string;
  readonly module: 'quran';
  readonly title: string;
  readonly arabic: string;
  readonly translation: string;
  readonly reference: string;
  readonly source: string;
  readonly tags: readonly string[];
}

export interface HadithKnowledgeEntry {
  readonly id: string;
  readonly module: 'hadith';
  readonly title: string;
  readonly text: string;
  readonly collection: string;
  readonly reference: string;
  readonly grade: string;
  readonly grader: string;
  readonly tags: readonly string[];
}

export interface QaKnowledgeEntry {
  readonly id: string;
  readonly module: 'qa';
  readonly question: string;
  readonly answer: string;
  readonly scholar: string;
  readonly sourceTitle: string;
  readonly sourceNote: string;
  readonly tags: readonly string[];
}

export type IslamicKnowledgeEntry = QuranKnowledgeEntry | HadithKnowledgeEntry | QaKnowledgeEntry;

export const islamicKnowledgeEntries = Object.freeze([
  {
    id: 'quran-prayer-remembrance',
    module: 'quran',
    title: 'Prayer and remembrance',
    arabic:
      'إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي',
    translation:
      'Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance.',
    reference: 'Qur’an 20:14',
    source: 'Qur’an — Surah Taha, verse 14',
    tags: ['prayer', 'remembrance', 'worship'],
  },
  {
    id: 'quran-patience-prayer',
    module: 'quran',
    title: 'Seek help through patience and prayer',
    arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    translation: 'Seek help through patience and prayer.',
    reference: 'Qur’an 2:45',
    source: 'Qur’an — Surah al-Baqarah, verse 45',
    tags: ['prayer', 'patience', 'steadfastness'],
  },
  {
    id: 'quran-friday-prayer',
    module: 'quran',
    title: 'The Friday call to prayer',
    arabic:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ',
    translation:
      'O believers! When the call to prayer is made on Friday, proceed diligently to the remembrance of Allah.',
    reference: 'Qur’an 62:9',
    source: 'Qur’an — Surah al-Jumu‘ah, verse 9',
    tags: ['jumuah', 'friday', 'prayer'],
  },
  {
    id: 'hadith-intentions',
    module: 'hadith',
    title: 'Actions are judged by intentions',
    text: 'Actions are only by intentions, and every person will have only what they intended.',
    collection: 'Sahih al-Bukhari',
    reference: 'Hadith 1',
    grade: 'Sahih',
    grader: 'Imam al-Bukhari',
    tags: ['intention', 'worship', 'sincerity'],
  },
  {
    id: 'hadith-prayer-light',
    module: 'hadith',
    title: 'Prayer is light',
    text: 'Purification is half of faith, and prayer is light.',
    collection: 'Sahih Muslim',
    reference: 'Hadith 223',
    grade: 'Sahih',
    grader: 'Imam Muslim',
    tags: ['prayer', 'purification', 'faith'],
  },
  {
    id: 'hadith-congregation',
    module: 'hadith',
    title: 'Merit of congregational prayer',
    text: 'Prayer in congregation is superior to prayer performed alone by twenty-seven degrees.',
    collection: 'Sahih al-Bukhari',
    reference: 'Hadith 645',
    grade: 'Sahih',
    grader: 'Imam al-Bukhari',
    tags: ['congregation', 'mosque', 'prayer'],
  },
  {
    id: 'qa-intention',
    module: 'qa',
    question: 'What does intention mean in worship?',
    answer:
      'Intention is the resolve of the heart to perform an act of worship for Allah. It is not dependent on reciting a fixed verbal formula. The essential matter is knowing what act you are performing and directing it to Allah.',
    scholar: 'Imam al-Nawawi',
    sourceTitle: 'Commentary on the Forty Hadith — Hadith of intentions',
    sourceNote:
      'Classical commentary on the hadith “Actions are only by intentions”; wording here is a concise SalahOS summary rather than a quotation.',
    tags: ['intention', 'sincerity', 'worship'],
  },
  {
    id: 'qa-prayer-doubt',
    module: 'qa',
    question: 'What should I do if I am unsure how many rak‘ahs I prayed?',
    answer:
      'When genuine doubt remains, build on what is certain and complete the prayer, then perform the prescribed prostrations of forgetfulness. Detailed placement of sujud al-sahw differs across schools, so follow the method taught by your madhhab or trusted local scholar.',
    scholar: 'Imam al-Nawawi',
    sourceTitle: 'Sharh Sahih Muslim — chapters on forgetfulness in prayer',
    sourceNote:
      'Based on the hadith of doubt in prayer in Sahih Muslim; the answer notes juristic variation instead of presenting one school as universal.',
    tags: ['prayer', 'sujud sahw', 'doubt'],
  },
  {
    id: 'qa-travel-prayer',
    module: 'qa',
    question: 'May an obligatory prayer be shortened while travelling?',
    answer:
      'Islamic law permits shortening the four-rak‘ah obligatory prayers during qualifying travel. The precise distance, duration and conditions differ between legal schools, so the traveller should apply the rules of the madhhab they follow or consult a qualified scholar for their circumstances.',
    scholar: 'Imam al-Nawawi',
    sourceTitle: 'al-Majmu‘ — Book of Prayer, discussion of traveller prayer',
    sourceNote:
      'The permission is rooted in Qur’an 4:101 and Prophetic practice. SalahOS intentionally avoids converting school-specific thresholds into a universal rule.',
    tags: ['travel', 'qasr', 'prayer'],
  },
] as const satisfies readonly IslamicKnowledgeEntry[]);

function searchableText(entry: IslamicKnowledgeEntry): string {
  if (entry.module === 'quran') {
    return [
      entry.title,
      entry.arabic,
      entry.translation,
      entry.reference,
      entry.source,
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
