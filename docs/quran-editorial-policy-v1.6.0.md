# SalahOS Qur’an Editorial Policy — expanded V1.6.x review

This policy operationalises the project-owner-supplied guide **The Ayahs of the Qur’an – Muhkam and Mutashabih**. It is a review policy, not an automated tafsir engine and not a substitute for named qualified scholarly approval.

## Foundations

Qur’an 3:7 governs the Muhkam/Mutashabih method. Proposed readings are continually tested against the clear tanzīh foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide defines Muhkam ayat as verses whose meaning is clear or admits one meaning under the rules of Arabic, and Mutashabih ayat as verses that can admit multiple meanings. A proposed meaning for a Mutashabih passage must therefore:

- be linguistically possible in Arabic;
- conform to the Religion and not contradict the Muhkam foundations;
- not create contradiction with another Qur’anic passage or authentic hadith;
- not attribute bodily, spatial, directional, created, sensuous, deficient or otherwise unbefitting characteristics to Allah, including place, shape, limb, movement, sitting, colour, physical enclosure or comparable created implications.

## Permitted treatments

SalahOS supports the two methodologies recognised in the supplied guide:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm that the revealed wording has a meaning befitting Allah while rejecting sensuous, bodily, spatial and directional meanings, without selecting a created modality or “how”.
2. **Contextual taʾwīl** — record a specific meaning only where Arabic/context and traceable evidence support it. A contextual taʾwīl is verse-specific; it is never a global search-and-replace rule for the same Arabic word elsewhere.

## Translation-risk registry

The permanent machine-readable trigger inventory is `src/data/quran-mutashabih-policy-triggers.json`. It currently contains **124 verses** whose English rendering requires explicit review under the supplied tanzīh method. `src/data/quran-mutashabih-full-audit.json`, `src/data/quran-salahos-2026-overrides.json` and `src/data/quran-mutashabih-review-register.json` must remain synchronized with that inventory.

Every trigger receives an explicit SalahOS 2026 meaning. The app must not silently fall back to Pickthall for a maintained trigger, even where the Pickthall wording appears acceptable, because an explicit override provides a stable regression boundary.

The original guide seeds—20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128—remain permanent regression fixtures. The broader registry adds related lexical/contextual risk families without treating any one taʾwīl as universally interchangeable.

The registry also includes the project’s required **ru’yah pair**: 6:103 is rendered as negating encompassing/comprehending Allah rather than negating seeing, while 75:22–23 affirms the believers’ vision of Allah in the Hereafter without direction or modality.

This registry is a translation-risk audit, not a claim that these 124 verses exhaust every theological category of mutashabih. The supplied guide separately notes matters whose exact realities or times are known only to Allah.

## Review register requirements

Every foundation and trigger row in `src/data/quran-mutashabih-review-register.json` records:

- verse key and Arabic expression;
- textual/contextual note and trigger family;
- pinned Pickthall wording being reviewed;
- proposed SalahOS 2026 meaning;
- treatment (`tafwid`, `contextual-tawil`, or `muhkam-foundation`);
- source/reference evidence;
- reviewer and status;
- recognised disagreement notes.

Automated work may populate proposed editorial data, but it must keep `reviewer: null` and `status: pending-scholar-review` until a real named qualified reviewer acts. Machine-generated text, automated scans and CI checks cannot create scholarly approval.

## Full-corpus release gate

Software validation still verifies all 114 surahs / 6,236 ayat, content identity, Arabic provenance and the 126-trigger parity contract. The prior project-owner whole-corpus attestation is retained as release/editorial provenance, not independent scholarly approval.

A release ref must fail closed until a named qualified scholar has approved the required whole-corpus scholarly review. Physical/software integrity checks and project-owner attestation cannot substitute for that approval.
