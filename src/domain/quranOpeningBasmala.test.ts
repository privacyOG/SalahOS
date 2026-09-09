import { describe, expect, it } from 'vitest';

import { quranReaderArabicForAyah } from './quranOfflineLibrary';

const basmala = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

describe('Qur’an opening Bismillah presentation', () => {
  it('keeps Al-Fatihah Bismillah as ayah 1', () => {
    expect(quranReaderArabicForAyah('1:1', basmala, basmala)).toBe(basmala);
  });

  it('removes an unnumbered opening Bismillah prefix from ordinary surah ayah 1', () => {
    expect(quranReaderArabicForAyah('3:1', `${basmala} الٓمٓ`, basmala)).toBe('الٓمٓ');
  });

  it('also prevents an accidental Bismillah prefix from appearing in At-Tawbah', () => {
    expect(quranReaderArabicForAyah('9:1', `${basmala} بَرَآءَةٌ`, basmala)).toBe('بَرَآءَةٌ');
  });

  it('does not alter later ayat or an opening ayah without that source prefix', () => {
    expect(quranReaderArabicForAyah('3:2', 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ', basmala)).toBe(
      'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ',
    );
    expect(quranReaderArabicForAyah('3:1', 'الٓمٓ', basmala)).toBe('الٓمٓ');
  });
});
