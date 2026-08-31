export type TextDirection = 'ltr' | 'rtl';

export interface TextPresentationMetadata {
  readonly lang: string;
  readonly dir: TextDirection;
}

export const englishTextPresentation = Object.freeze({
  lang: 'en',
  dir: 'ltr',
}) satisfies TextPresentationMetadata;

export const arabicTextPresentation = Object.freeze({
  lang: 'ar',
  dir: 'rtl',
}) satisfies TextPresentationMetadata;

export const latinTransliterationPresentation = Object.freeze({
  lang: 'en-Latn',
  dir: 'ltr',
}) satisfies TextPresentationMetadata;

export function textPresentationMetadata(
  lang: string,
  dir: TextDirection,
): TextPresentationMetadata {
  if (lang.trim().length === 0) throw new TypeError('Text language tag cannot be empty');
  return Object.freeze({ lang, dir });
}
