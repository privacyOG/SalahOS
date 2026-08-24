# Islamic Knowledge

Stage 50 adds a first-class congregation **Knowledge** destination with Qur’an, Hadith and Q&A modules.

## Offline-first scope

The initial library is bundled in `src/domain/islamicKnowledge.ts`; normal reading, filtering and search do not require a network request. This keeps the feature useful on Raspberry Pi, kiosk, mobile and PWA installations when connectivity is unavailable.

The starter catalogue is intentionally compact. It establishes the data contract, attribution rules and UX for later expansion without presenting an incomplete remote service as authoritative.

## Source contracts

Every Qur’an entry includes:

- surah/ayah reference;
- Arabic text;
- a concise English rendering;
- an explicit source label.

Every Hadith entry includes:

- collection;
- hadith reference;
- grade;
- grading/collection authority.

Every Q&A entry includes:

- the named scholar/classical authority used for attribution;
- the source work or commentary;
- a source note explaining the basis of the summary;
- explicit acknowledgement of juristic variation where a school-specific ruling should not be presented as universal.

Q&A text is a SalahOS summary, not a quotation and not a replacement for a qualified scholar handling personal circumstances.

## User experience

The Knowledge screen provides:

- Qur’an, Hadith, Q&A and combined filters;
- local full-text search across content and source metadata;
- source/grade/scholar metadata kept visible with each entry;
- Arabic RTL verse rendering;
- responsive mobile and desktop cards;
- multilingual navigation and shell copy for English, Arabic, Turkish and Indonesian.

## Verification

Domain tests enforce the presence of all three modules and required source metadata. Stage 50 browser acceptance verifies module filtering, source/grade/scholar visibility, search, a six-item primary navigation layout, Arabic RTL rendering and mobile overflow behaviour as part of `npm run visual:check`.
