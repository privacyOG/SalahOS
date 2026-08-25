# Islamic Knowledge source governance

SalahOS v1.5 treats religious content as governed source data rather than free-form application copy. The purpose of this layer is to keep provenance, scholarly scope and recognised disagreement attached to the content as the library grows.

## Approved source registry

`src/data/islamic-knowledge-source-registry.json` is the machine-readable allow-list. Every record includes a stable source ID, source kind, title/authorship, edition metadata, translator where relevant, citation requirements, provenance, review state, trust tier, review date and the modules for which that source is approved.

Approval means the source may be used within the declared scope after editorial review. It is not a fatwa, an endorsement of every edition or translation carrying the same title, or permission to strip away citation context.

## Qur'an

Every Qur'an entry must retain an explicit `surah:ayah` reference and identify both its Arabic-text source and named translation source. A translation source is invalid unless the registry identifies its translator. The current English excerpts use Mohammed Marmaduke Pickthall's 1930 translation so translated wording is not presented without a named translator.

The Arabic Qur'an and its translation remain distinct data fields and distinct source records.

## Hadith

Every hadith entry must retain:

- collection;
- hadith number/reference;
- displayed grade;
- grading authority; and
- an approved hadith source that supports the grading attribution.

The current short English renderings are display summaries tied to the cited canonical collection; they are not allowed to replace the collection/reference metadata.

## Fiqh and recognised disagreement

Fiqh Q&A is governed through four source lanes:

- Hanafi — `al-Hidayah` by al-Marghinani;
- Maliki — `al-Risalah` by Ibn Abi Zayd al-Qayrawani;
- Shafi'i — `al-Majmu'` by al-Nawawi; and
- Hanbali — `al-Mughni` by Ibn Qudamah.

Current cross-school fiqh guidance must carry approved sourcing for all four madhhabs. Where the schools materially differ, the entry must mark recognised disagreement and explain the nature of the difference instead of flattening the issue into a single universal rule.

Stage 7 adds school-specific views while preserving this Stage 5 minimum governance contract. Every displayed Hanafi, Maliki, Shafi‘i and Hanbali position points back to the corresponding approved source lane already attached to the governed Q&A entry.

## Theology and creed

Creed/theology content may use only approved Sunni creed sources whose registry lane is explicitly Ash'ari and/or Maturidi. The initial approved lanes include al-Juwayni's `al-Irshad` and Abu Mansur al-Maturidi's `Kitab al-Tawhid`.

Those internal governance labels do not need to be shown as branding in normal user-facing copy. They exist so future content cannot silently drift into an unreviewed theological source lane.

## CI enforcement

`src/domain/islamicKnowledgeGovernance.ts` validates the shipped catalogue and registry. The permanent `npm run knowledge:content:check` Quality-gate step fails when it detects, among other things:

- duplicate or unapproved source IDs;
- missing source provenance, edition/citation metadata or review dates;
- an unnamed Qur'an translator;
- malformed Qur'an or hadith references;
- missing hadith grade/grading attribution;
- a Q&A ruling without source attribution;
- incomplete Hanafi/Maliki/Shafi'i/Hanbali coverage for fiqh entries;
- recognised disagreement without an explanatory note; or
- creed content sourced outside the approved Ash'ari/Maturidi lanes.

The ordinary Vitest suite repeats the same shipped-catalogue validation, while the Knowledge browser acceptance verifies the named Qur'an translation and four-madhhab source presentation remain visible and usable on mobile/RTL layouts.

## Adding content

A contributor adding religious content should first add or reuse an approved source record, then attach its stable source ID to the entry. New page-level quotations must pin the actual edition and page used. Do not invent an edition, translator, grading authority, madhhab consensus or scholarly attribution merely to satisfy the schema; leave the content out until its provenance can be established.

## Stage 7 Hadith and Fiqh enrichment

Stage 7 keeps the governed catalogue as the source of truth and adds auditable companion metadata in `src/domain/islamicKnowledgeStage7.ts`.

Each shipped Hadith now carries its canonical collection and hadith number together with book/chapter navigation, a concise Arabic excerpt, the existing English rendering, grade/grading authority, searchable topics and related-Hadith links. Companion metadata is accepted only when its source ID is already an approved Hadith source on the governed base entry.

Current Fiqh Q&A now has a first-class Fiqh navigation view. Each topic carries a review date, supporting references and four distinct school positions. Each Hanafi, Maliki, Shafi‘i and Hanbali position points to that school’s approved classical source rather than being presented as an unattributed universal ruling.

`src/domain/islamicKnowledgeStage7.test.ts` is part of the permanent `knowledge:content:check` gate. It rejects missing Hadith metadata, invalid related-Hadith links, unapproved Hadith source linkage, missing Fiqh audit fields, incomplete four-school position sets or a school position whose source is not approved for that madhhab.
