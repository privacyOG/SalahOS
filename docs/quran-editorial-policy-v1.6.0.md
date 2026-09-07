# SalahOS Qur’an Editorial Policy — V1.6.0 draft

This policy operationalises the project-owner-supplied guide **The Ayahs of the Qur’an – Muhkam and Mutashabih**. It is a review policy, not an automated tafsir engine and not a substitute for named scholarly approval.

## Foundations

The review must treat Qur’an 3:7 as the governing Muhkam/Mutashabih method and must continually test proposed readings against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide defines Muhkam ayat as verses whose meaning is clear or admits one meaning under the rules of Arabic, and Mutashabih ayat as verses that can admit multiple meanings under the rules of Arabic. A proposed meaning for a Mutashabih passage must therefore satisfy all of the following:

- it is linguistically possible in Arabic;
- it conforms to the Religion and does not contradict Muhkam ayat;
- it does not create a contradiction with another Qur’anic passage or an authentic hadith;
- it does not attribute bodily, spatial or created characteristics to Allah, including place, shape, limb, movement, sitting, colour, direction or comparable physical implications.

## Permitted treatments

SalahOS supports two reviewed treatments for Mutashabih wording, corresponding to the two methodologies recognised in the supplied guide:

1. **Tafwīd / general befitting affirmation** — affirm that the revealed wording has a meaning befitting Allah while rejecting sensuous, bodily and spatial meanings, without selecting a specific figurative gloss.
2. **Contextual ta’wīl** — record a specific meaning only where the reviewer supplies Arabic/contextual justification and a traceable scholarly source. A contextual ta’wīl is verse-specific evidence, never a global search-and-replace rule for the same Arabic word elsewhere.

The register value `unassigned` means editorial work is incomplete. It must never be rendered to users as an approved translation or commentary.

## Review register requirements

Every screened passage uses `src/data/quran-mutashabih-review-register.json` and records:

- verse key;
- relevant Arabic expression;
- textual/contextual note;
- original English wording being reviewed;
- proposed reviewed meaning, if any;
- treatment (`tafwid`, `contextual-tawil`, `muhkam-foundation`, or `unassigned`);
- source/edition/reference evidence;
- named reviewer;
- status;
- recognised disagreement notes.

An entry cannot become `approved` unless the relevant fields are complete and a named reviewer has signed off. Machine-generated text, automated scans and CI checks cannot populate the reviewer field.

## Required V1.6.0 seed review

The initial register must include 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128, plus the four governing foundation entries. These seeds are starting points only; they do not constitute full-corpus coverage.

The supplied guide itself includes examples such as 20:5 and 35:10 as Mutashabih passages, explains the Salaf and Khalaf methodologies as valid approaches, and explicitly rejects physical/spatial implications. Other examples in the guide include 28:88, 68:42, 66:12, 38:75 and 24:35. Each must be reviewed in context rather than receiving a universal lexical substitution.

## Full-corpus release gate

V1.6.0 Qur’an editorial acceptance requires a documented screening of all 114 surahs / 6,236 ayat, including passages not limited to divine-attribute terminology and passages whose intended meaning may be unknowable. The coverage report must identify every unresolved review item.

No release gate may claim the whole-corpus review complete until:

- the review register/coverage report accounts for all 6,236 ayat;
- all policy-triggered entries are resolved or explicitly dispositioned;
- the approved English content identity is consistent across reader, search, excerpts, saved reading, copy/share/export and offline/native paths;
- Uthmani Arabic source/reading/edition/licence/hash and font rendering checks pass; and
- a named qualified scholar gives the required sign-off.

Until those conditions are met, the V1.6.0 tracker must leave Q03 and Q10 open and the release must not be represented as religiously approved.
