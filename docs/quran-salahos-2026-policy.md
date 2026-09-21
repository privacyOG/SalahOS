# SalahOS 2026 Qur’an English Meaning Policy

This policy supplements `docs/quran-editorial-policy-v1.6.0.md` and operationalises the project-owner-supplied **The Ayahs of the Qur’an – Muhkam and Mutashabih** guide for **SalahOS 2026 (English meaning)**. The implementation applies the guide through an Ashʿarī/Māturīdī tanzīh framework; verse-specific glosses beyond the guide’s explicit examples remain subject to named qualified scholarly review.

## Translation identity

`SalahOS 2026` is a transparent derived English-meaning layer. M. M. Pickthall (1930) remains the pinned baseline/reference. Where the owner-supplied guide and the Ashʿarī/Māturīdī tanzīh policy require verse-specific wording, SalahOS 2026 overrides that baseline with an explicitly recorded English meaning and editorial note. Pickthall remains separately selectable and is never silently relabelled as original SalahOS wording.

The reader, search index, Knowledge excerpts and copy/share paths identify selected English content consistently as SalahOS 2026.

## Muhkam and Mutashabih rule

Qur’an 3:7 governs the method. Proposed meanings are checked against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide recognises two valid treatments:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm a meaning befitting Allah while denying bodily, sensuous, spatial and directional meanings, without assigning a created modality or “how”.
2. **Contextual taʾwīl** — use a specific Arabic/contextually possible meaning supported by traceable scholarly evidence. A verse-specific taʾwīl must never become a global lexical replacement rule.

## Comprehensive policy-trigger inventory

The original guide examples remain permanent regression fixtures, but they are no longer treated as the complete review set. `src/data/quran-mutashabih-policy-triggers.json` now maintains the pinned-corpus inventory of passages whose English wording can create bodily, spatial, directional, movement, composite, created or similar unbefitting implications if rendered literally of Allah.

The inventory currently covers 88 unique Mutashabih policy-trigger verses across istiwāʾ, wajh, yad, ʿayn, sāq, qabḍ/yamīn, nūr, rūḥ attribution, coming/movement, fawq/spatial language, maʿiyyah, ascent/direction, guide-context examples and reciprocal human-sounding verbs. Four governing foundations—3:7, 42:11, 112:4 and 19:65—are tracked separately. Every trigger has a dedicated SalahOS 2026 English meaning, Salaf/tanzīh treatment, contextual Khalaf taʾwīl note and a row in the review register.

This inventory is an editorial trigger inventory for divine-attribute and related language; it does not pretend that every scholarly use of the category _mutashābih_ is exhausted by these lexical groups.

## Uthmani Arabic contract

The packaged Arabic Qur’an remains **Uthmani · Medina Mushaf · Hafs**. Every Qur’anic Arabic surface declares `lang="ar"`, `dir="rtl"`, uses the explicit `quran-uthmani-script` class, remains right-aligned in list and page modes, and is bidi-isolated. Page mode must not replace right alignment with justification.

## Whole-corpus approval and release gate

A project-owner attestation was recorded on 2026-09-09 for the V1.6.0 corpus. On 2026-09-21 the project owner reported that Mutashabih English renderings still contained errors and required a comprehensive Ashʿarī/Māturīdī-aligned audit. That report supersedes the earlier attestation for current release approval. `src/data/quran-scholarly-signoff.json` is therefore reopened as pending.

The verse-level review register now records every maintained policy trigger with the pinned Arabic expression, original Pickthall wording, proposed SalahOS meaning, treatment and source trail. No row is marked `approved` and no reviewer identity is fabricated.

Release validation requires the complete packaged corpus, all maintained trigger treatments, consistent SalahOS 2026 identity, Uthmani/Hafs/Medina provenance and rendering checks, and renewed named qualified whole-corpus sign-off. Normal development validation may pass while the sign-off remains pending, but an actual `release/v*` branch or `v*` tag must remain fail-closed.

Automated tooling must never fabricate the reviewer, qualification, review date or whole-corpus approval.
