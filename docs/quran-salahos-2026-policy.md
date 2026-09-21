# SalahOS 2026 Qur’an English Meaning Policy

This policy supplements `docs/quran-editorial-policy-v1.6.0.md` and operationalises the project-owner-supplied **The Ayahs of the Qur’an – Muhkam and Mutashabih** guide for **SalahOS 2026 (English meaning)**.

## Translation identity

`SalahOS 2026` is a transparent derived English-meaning layer. M. M. Pickthall (1930) remains the pinned baseline/reference. Where the supplied Muhkam/Mutashabih guide and the Ashʿarī–Māturīdī tanzīh framework require verse-specific wording, SalahOS 2026 records an explicit English meaning and editorial note. Pickthall remains separately selectable and is never silently relabelled as original SalahOS wording.

The reader, search index, Knowledge excerpts and copy/share paths identify selected English content consistently as SalahOS 2026.

## Muhkam and Mutashabih rule

Qur’an 3:7 governs the method. Proposed meanings are checked against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide recognises two valid treatments:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm a meaning befitting Allah while denying bodily, sensuous, spatial and directional meanings, without assigning a created modality or “how”.
2. **Contextual taʾwīl** — use a specific Arabic/contextually possible meaning supported by traceable evidence. A verse-specific taʾwīl must never become a global lexical replacement rule.

The guide also states that some mutashabih concern matters whose exact reality or timing is known only to Allah. The translation-risk registry below is therefore not presented as an exhaustive theological catalogue of every possible kind of mutashabih.

## Required guide examples

The original owner-guide examples remain permanent regression fixtures: 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128.

Examples encoded directly from the supplied guide include: 20:5 istiwāʾ as al-istilāʾ (subjugation), with the same non-spatial contextual taʾwīl applied to all seven Qur'anic istiwāʾ-over-the-Throne passages; 28:88 wajh as Dominion; 68:42 sāq as hardship; 2:115 wajh as qiblah; 38:75 yadayn as care; 24:35 nūr as created guidance rather than physical light; 89:22 as an indication of Allah’s Power rather than movement; 57:4 maʿiyyah as knowledge; 41:54 encompassing as knowledge; 6:61 fawqiyyah as subjugation; and 16:128 maʿiyyah as support.

## Expanded corpus audit

On 2026-09-21 the project owner identified remaining English renderings that could still suggest corporeality, spatiality, direction, movement, bodily parts, physical enclosure, human-style defects or other unbefitting meanings. The audit was therefore reconciled against both the earlier 85-verse pass and the broader policy-trigger inventory.

`src/data/quran-mutashabih-policy-triggers.json` now maintains **110 translation-risk verses**. `src/data/quran-mutashabih-full-audit.json` and `src/data/quran-mutashabih-review-register.json` must contain the same set. **Every one of the 110 trigger verses has an explicit SalahOS 2026 English wording**; no trigger silently falls back to Pickthall.

The maintained families include istiwāʾ over the Throne and istiwāʾ ilā. For all seven istiwāʾ-over-the-Throne verses, the primary SalahOS English meaning uses **absolute dominion/subjugation** rather than leaving “mounted”, “established Himself”, or an untranslated bodily-sounding construction; yad/yamīn/qabḍah and power language, wajh, ʿayn/aʿyun, sāq, nūr, rūḥ attribution, coming/movement, maʿiyyah, fawqiyyah and heaven/place language, ascent/direction, qurb/nearness, encompassing language, honoured possessives, Kursi wording, preservation language that could be mistranslated as bodily grasping, and reciprocal human-sounding verbs such as mockery, deception, plotting and forgetfulness.

The 110-verse registry is a **translation-risk screen affecting tanzīh**, not a declaration that no other Qur’anic passage can be mutashabih in another sense.

## Uthmani Arabic contract

The packaged Arabic Qur’an remains **Uthmani · Medina Mushaf · Hafs**. Every Qur’anic Arabic surface declares `lang="ar"`, `dir="rtl"`, uses the explicit `quran-uthmani-script` class, remains right-aligned in list and page modes, and is bidi-isolated. Page mode must not replace right alignment with justification.

## Whole-corpus approval and release gate

The 2026-09-09 record in `src/data/quran-scholarly-signoff.json` is an explicit **project-owner editorial/release attestation** over the 114-surah / 6,236-ayah corpus. It is **not** independent qualified scholarly approval.

The owner reopened the Muhkam/Mutashabih review on 2026-09-21. All 110 trigger rows remain `pending-scholar-review` with no fabricated reviewer. Independent qualified whole-corpus scholarly sign-off therefore remains pending.

Automated tooling may verify corpus completeness, trigger/override/register parity, prohibited literal-risk regressions, SalahOS 2026 identity, Uthmani/Hafs/Medina provenance and rendering safeguards. It may not manufacture scholarly approval. Release refs are fail-closed until `qualifiedScholarReviewStatus` is explicitly approved.
