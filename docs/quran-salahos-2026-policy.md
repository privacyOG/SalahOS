# SalahOS 2026 Qur’an English Meaning Policy

This V1.6.0 policy supplements `docs/quran-editorial-policy-v1.6.0.md` and operationalises the project-owner-supplied **The Ayahs of the Qur’an – Muhkam and Mutashabih** guide for **SalahOS 2026 (English meaning)**, applying the shared Ashʿarī/Māturīdī tanzīh principle while keeping the supplied guide as the operative verse-level source.

## Translation identity

`SalahOS 2026` is a transparent derived English-meaning layer. M. M. Pickthall (1930) remains the pinned baseline/reference. Where the owner-supplied Ashʿarī guide requires verse-specific wording, SalahOS 2026 overrides that baseline with an explicitly recorded English meaning and editorial note. Pickthall remains separately selectable and is never silently relabelled as original SalahOS wording.

The reader, search index, Knowledge excerpts and copy/share paths identify selected English content consistently as SalahOS 2026.

## Muhkam and Mutashabih rule

Qur’an 3:7 governs the method. Proposed meanings are checked against the clear foundations represented by 42:11, 112:4 and 19:65. No SalahOS English wording may imply that Allah resembles creation.

The supplied guide recognises two valid treatments:

1. **Tafwīd / general befitting affirmation with tanzīh** — affirm a meaning befitting Allah while denying bodily, sensuous, spatial and directional meanings, without assigning a created modality or “how”.
2. **Contextual taʾwīl** — use a specific Arabic/contextually possible meaning supported by traceable scholarly evidence. A verse-specific taʾwīl must never become a global lexical replacement rule.

## Required guide examples and full-corpus attribute audit

V1.6.0 carries dedicated SalahOS 2026 wording and detailed Salaf/Khalaf notes for 20:5, 35:10, 28:88, 68:42, 2:115, 66:12, 38:75, 24:35, 89:22, 57:4, 41:54, 37:99, 2:125, 6:61 and 16:128. These remain permanent regression fixtures.

The project now also maintains `src/data/quran-mutashabih-attribute-coverage.json`, produced from a full 6,236-ayah lexical/contextual audit for the divine-attribute risk families named or governed by the supplied guide. It currently accounts for 88 unique ayat across istiwāʾ, wajh, yad, ʿayn, rūḥ, maʿiyyah, fawq/direction, `fī al-samāʾ`, coming/movement, ascent, nūr, honorific Bayt attribution, Kursī, proximity, location/interposition, iḥāṭah, journey-to-the-Lord wording and sāq. Every listed ayah must have an explicit SalahOS treatment.

Where the pinned Pickthall baseline is otherwise sound, SalahOS uses fail-closed phrase rewrites so only the creed-sensitive phrase is changed. CI verifies the exact source phrase against the pinned corpus; if upstream wording no longer matches, the build fails rather than silently falling back to an unsafe rendering.

## Uthmani Arabic contract

The packaged Arabic Qur’an remains **Uthmani · Medina Mushaf · Hafs**. Every Qur’anic Arabic surface declares `lang="ar"`, `dir="rtl"`, uses the explicit `quran-uthmani-script` class, remains right-aligned in list and page modes, and is bidi-isolated. Page mode must not replace right alignment with justification.

## Whole-corpus approval and release gate

On 2026-09-09 the project owner `privacyOG` explicitly signed off the complete 114-surah / 6,236-ayah SalahOS 2026 corpus for V1.6.0 release. That authoritative whole-corpus disposition is recorded in `src/data/quran-scholarly-signoff.json`.

The verse-level Muhkam/Mutashabih register and the full-corpus attribute-risk inventory remain supplemental provenance for individual editorial treatments. It is deliberately not auto-populated with 6,236 synthetic reviewer records merely to satisfy CI. Release validation instead requires the complete packaged corpus, the required Mutashabih seed treatments, consistent SalahOS 2026 identity, Uthmani/Hafs/Medina provenance and rendering checks, and the explicit whole-corpus sign-off record.

Automated tooling must never fabricate the reviewer, qualification, review date or whole-corpus approval.
