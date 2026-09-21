# SalahOS 2026 Qur’an English Meaning Policy

This V1.6.0 policy supplements `docs/quran-editorial-policy-v1.6.0.md` and operationalises the project-owner-supplied **The Ayahs of the Qur’an – Muhkam and Mutashabih** guide for **SalahOS 2026 (English meaning)**.

## Translation identity

`SalahOS 2026` is a transparent derived English-meaning layer. M. M. Pickthall (1930) remains the pinned baseline/reference. Where the owner-supplied Muhkam/Mutashabih guide and the Ashʿarī–Māturīdī tanzīh framework require verse-specific wording, SalahOS 2026 overrides that baseline with an explicitly recorded English meaning and editorial note. Pickthall remains separately selectable and is never silently relabelled as original SalahOS wording.

The reader, search index, Knowledge excerpts and copy/share paths identify selected English content consistently as SalahOS 2026.

## Muhkam and Mutashabih rule

Qur’an 3:7 governs the method. Proposed meanings are checked against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide recognises two valid treatments:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm a meaning befitting Allah while denying bodily, sensuous, spatial and directional meanings, without assigning a created modality or “how”.
2. **Contextual taʾwīl** — use a specific Arabic/contextually possible meaning supported by traceable scholarly evidence. A verse-specific taʾwīl must never become a global lexical replacement rule.

## Required guide examples

The original owner-guide examples remain permanent regression fixtures: 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128.

## Expanded corpus audit

On 2026-09-21 the project owner identified remaining English renderings that could still suggest corporeality, spatiality, direction, movement, bodily parts or deficient attributes. SalahOS therefore expanded the review beyond the original seed passages.

`src/data/quran-mutashabih-full-audit.json` now records **85 screened translation-risk verses** in the relevant trigger families. Of those, **79 use explicit SalahOS 2026 overrides** and **6 retain the pinned Pickthall wording only because the baseline was manually dispositioned as already non-corporeal**. The trigger families include istiẉāʾ, yad/yamīn/qabḍah, wajh, ʿayn/aʿyun, sāq, nūr, coming/movement, maʿiyyah, fawqiyyah, ascent, heaven/place wording, possessive rūḥ, honored possessives, directional journey language, proximity, encompassing language and impossible deficiencies such as forgetfulness.

This audit is intentionally scoped to **translation-risk mutashabih wording affecting divine transcendence (tanzīh)**. It is not a claim that these are the only mutashabih passages in the Qurʾān; the supplied guide also notes matters whose exact realities or times are known only to Allah.

## Uthmani Arabic contract

The packaged Arabic Qur’an remains **Uthmani · Medina Mushaf · Hafs**. Every Qur’anic Arabic surface declares `lang="ar"`, `dir="rtl"`, uses the explicit `quran-uthmani-script` class, remains right-aligned in list and page modes, and is bidi-isolated. Page mode must not replace right alignment with justification.

## Whole-corpus approval and release gate

The 2026-09-09 record in `src/data/quran-scholarly-signoff.json` is an explicit **project-owner editorial/release attestation** over the 114-surah / 6,236-ayah corpus. It is **not** represented as independent qualified scholarly approval.

The owner reopened the Muhkam/Mutashabih review on 2026-09-21 after identifying remaining translation issues. Independent qualified scholarly sign-off therefore remains pending. The expanded audit and all override wording remain explicitly provisional until that review is obtained.

Automated tooling must never fabricate a scholar, qualification, review date or approval. Release validation may verify corpus completeness, the expanded audit registry, required override coverage, SalahOS 2026 identity, Uthmani/Hafs/Medina provenance and rendering safeguards, but those software checks are not a substitute for qualified scholarly review.
