# SalahOS 2026 Qur’an English Meaning Policy

This V1.6.0 policy supplements `docs/quran-editorial-policy-v1.6.0.md` and operationalises the project-owner-supplied **The Ayahs of the Qur’an – Muhkam and Mutashabih** guide for **SalahOS 2026 (English meaning)**.

## Translation identity

`SalahOS 2026` is a transparent derived English-meaning layer. M. M. Pickthall (1930) remains a pinned baseline/reference. Where the owner-supplied Ashʿarī guide requires verse-specific wording, SalahOS 2026 overrides that baseline with an explicitly recorded English meaning and editorial note. Where no specific new wording has yet been reviewed, the baseline remains provisional until whole-corpus review dispositions that ayah.

The reader, search index, Knowledge excerpts and copy/share paths must identify selected English content consistently as SalahOS 2026. Pickthall remains separately selectable and must never be silently relabelled as original SalahOS wording. The SalahOS 2026 name does not imply completed whole-corpus scholarly approval; the UI must disclose that the edition remains provisional until all 6,236 ayat are reviewed/approved and a named qualified scholar signs off the whole corpus.

## Muhkam and Mutashabih rule

Qur’an 3:7 governs the method. Proposed meanings are checked against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide recognises two valid treatments:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm a meaning befitting Allah while denying bodily, sensuous, spatial and directional meanings, without assigning a created modality or “how”.
2. **Contextual taʾwīl** — use a specific Arabic/contextually possible meaning supported by traceable scholarly evidence. A verse-specific taʾwīl must never become a global lexical replacement rule.

## Required guide examples

V1.6.0 carries dedicated SalahOS 2026 wording and detailed Salaf/Khalaf notes for: 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128. These are regression fixtures, not the limit of whole-corpus review.

The implemented treatments include the guide’s specific examples: 28:88 `wajhahu` as His Dominion; 68:42 `saq` as hardship; 2:115 `wajh` as qiblah in context; 38:75 `yadayn` as care; 24:35 as Allah being the Creator of guidance rather than physical light; 89:22 as an indication of Allah’s Power coming rather than Allah moving; 57:4 `maʿiyyah` as knowledge; 41:54 encompassing as knowledge; 2:125 “My House” as honour rather than residence; 6:61 `fawqiyyah` as subjugation; and 16:128 `maʿiyyah` as support.

## Uthmani Arabic contract

The packaged Arabic Qur’an remains **Uthmani · Medina Mushaf · Hafs**. Every Qur’anic Arabic surface must declare `lang="ar"`, `dir="rtl"`, use the explicit `quran-uthmani-script` class, remain right-aligned in both list and page modes, and be bidi-isolated. Page mode must not replace right alignment with justification.

## Release gate

V1.6.0 publication remains fail-closed until:

- all 114 surahs / 6,236 ayat are represented in the editorial register;
- all 6,236 are approved with no unresolved entries;
- approved Mutashabih treatments that affect displayed English are linked to SalahOS 2026 wording;
- English identity is consistent across reader, search, excerpts, saved reading and copy/share/export paths;
- Uthmani source/reading/edition/hash/font/native packaging and explicit RTL/right-alignment checks pass; and
- a named qualified scholar records whole-corpus sign-off.

Automated tooling must never fabricate the reviewer, qualification, review date or whole-corpus approval.
