const SUNNAH_BASE = 'https://sunnah.com/';

export function hadithFullTextUrl(sourceId: string, hadithNumber: number): string {
  const slug =
    sourceId === 'hadith-bukhari' ? 'bukhari' : sourceId === 'hadith-muslim' ? 'muslim' : null;
  if (!slug || !Number.isInteger(hadithNumber) || hadithNumber < 1) {
    throw new Error('Unsupported hadith full-text reference');
  }
  return `${SUNNAH_BASE}${slug}:${String(hadithNumber)}`;
}
