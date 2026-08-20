# Language support

**Author:** privacyOG

SalahOS supports four selectable application locales:

- English (`en`)
- Arabic (`ar`)
- Turkish (`tr`)
- Indonesian (`id`)

English and Arabic remain the original locales. Turkish and Indonesian are the first Phase 2 additional-language packs and cover the complete shared application translation catalogue rather than a small prayer-name subset.

## Locale behavior

Each locale is persisted in the existing versioned settings payload and survives export/import. Unsupported or malformed locale values continue to fall back to English rather than being stored as arbitrary language tags.

Formatting uses explicit `Intl` locale tags:

- `en` → `en-AU`
- `ar` → `ar`
- `tr` → `tr-TR`
- `id` → `id-ID`

Arabic remains right-to-left. English, Turkish and Indonesian are left-to-right. Changing the locale updates the document `lang` and `dir` attributes as well as prayer/date/time/number formatting.

## Translation completeness

The English catalogue defines the canonical translation-key set. Tests require Turkish and Indonesian to expose the same key set, and the TypeScript translation lookup is compiled across every supported locale. A newly supported locale therefore cannot silently omit a shared key and rely on an undefined runtime value.

Feature surfaces that intentionally display mosque-authored community content keep their existing content-language model: managed mosque announcements/events may provide English and/or Arabic authored content independently of the application UI locale. The UI language does not fabricate translations of mosque-authored text.

## Offline and privacy behavior

All four application language catalogues ship with the application. Selecting Turkish or Indonesian does not download a language pack, call a translation service, or send user text to a remote endpoint. Date, time and number formatting use the device/runtime internationalization implementation.

## Adding another locale

A future locale should not be added only to the selector. It must include:

1. a complete shared translation catalogue with key parity;
2. a stable `Locale` identifier;
3. an explicit `Intl` formatting tag;
4. correct LTR/RTL direction metadata;
5. persistence/import parsing support;
6. selector labels in every supported locale;
7. tests for representative translations, direction and persistence; and
8. review of any feature-local copy tables or intentionally bilingual authored-content boundaries.

This keeps language support deterministic and offline-first instead of depending on runtime translation or incomplete fallback behavior.
